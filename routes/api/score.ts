import {
  fetchLoanTransactions,
  fetchManaAndRecentRank,
  fetchTransactionCount,
  fetchUserData,
  fetchUserPortfolio,
} from "../../utils/api/manifold_api_service.ts";
import {
  calculateNetLoanBalance,
  calculateriskBaseFee,
  computeMMR,
  mapToCreditScore,
} from "../../utils/api/score_calculation_logic.ts";
import {
  getLastScoreUpdateTime,
  saveHistoricalScore,
  updateLastScoreUpdateTime,
} from "../../utils/api/kv_store_service.ts";
import { ManifoldUser, UserPortfolio } from "../../utils/api/manifold_types.ts";
import db from "../../database/db.ts"; // Make sure db is imported

const MANIFOLD_USER_ID = "IPTOzEqrpkWmEzh6hwvAyY9PqFb2";

export async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const username = url.searchParams.get("username");

  if (!username || username.length < 1) {
    return new Response(
      JSON.stringify({ error: "Username missing or too short" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const {
    userData: rawUserData,
    fetchSuccess: manifoldUserFetchSuccess,
    userDeleted,
  } = await fetchUserData(username);

  const userData: ManifoldUser | null = rawUserData;

  if (!manifoldUserFetchSuccess || !userData) {
    const responsePayload = {
      username: username,
      creditScore: 0,
      riskBaseFee: 0,
      avatarUrl: null,
      userExists: false,
      fetchSuccess: true,
      historicalDataSaved: false,
      userDeleted: userDeleted,
    };
    console.info(
      `Handler: User '${username}' not found or fetch failed from Manifold API service.`,
    );
    return new Response(JSON.stringify(responsePayload), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  }

  const userId = userData.id;

  // --- THIS IS THE NEWLY ADDED BLOCK ---
  // This ensures the user's profile is always up-to-date in our fast-lookup index.
  await db.set(["users", userId], { id: userId, username: userData.username });
  // ------------------------------------

  if (userData.username === "Manifold") {
    console.info(
      `Handler: Processing @Manifold user, mana payments will be filtered.`,
    );
  }

  const currentTime = Date.now();
  const rateLimitDays = 1;
  const rateLimitMilliseconds = rateLimitDays * 24 * 60 * 60 * 1000;

  try {
    const lastUpdateTime = await getLastScoreUpdateTime(userId);

    let shouldSaveHistoricalData = true;
    if (
      lastUpdateTime !== null &&
      (currentTime - lastUpdateTime) < rateLimitMilliseconds
    ) {
      shouldSaveHistoricalData = false;
      console.debug(
        `Handler: Rate limit active for user '${userData.username}'. Skipping historical data save.`,
      );
    }

    const createdTime = userData.createdTime ?? Date.now();
    const ageDays = (Date.now() - createdTime) / 86_400_000;

    const [
      portfolioFetch,
      rankData,
      transactionData,
      loanData,
    ] = await Promise.all([
      fetchUserPortfolio(userData.id),
      fetchManaAndRecentRank(userData.id),
      fetchTransactionCount(userData.username),
      fetchLoanTransactions(userData.id),
    ]);

    if (!portfolioFetch.success || !portfolioFetch.portfolio) {
      console.error(
        `Handler: Failed to fetch portfolio for '${userData.username}' (ID: ${userId}) after retries.`,
      );
      return new Response(
        JSON.stringify({
          error: `Failed to fetch user portfolio data`,
          username: userData.username,
          userExists: true,
          fetchSuccess: false,
          historicalDataSaved: false,
          userDeleted: userDeleted,
        }),
        { status: 503, headers: { "Content-Type": "application/json" } },
      );
    }
    const userPortfolio: UserPortfolio = portfolioFetch.portfolio;

    const calculatedProfit = userPortfolio.investmentValue +
      userPortfolio.balance - userPortfolio.totalDeposits;

    if (!rankData.success || !transactionData.success || !loanData.success) {
      console.warn(
        `Handler: One or more auxiliary data fetches failed for '${userData.username}' (ID: ${userId}). Proceeding with available data or defaults.`,
      );
    }

    const outstandingDebtImpact = calculateNetLoanBalance(
      userData.id,
      loanData.transactions,
      MANIFOLD_USER_ID,
    );

    const rawMMR = computeMMR(
      userPortfolio.balance,
      calculatedProfit,
      ageDays,
      rankData.latestRank ?? 100,
      transactionData.count,
      outstandingDebtImpact,
    );

    const creditScore = mapToCreditScore(rawMMR);
    const risk = calculateriskBaseFee(creditScore);

    if (shouldSaveHistoricalData && !userDeleted) {
      await saveHistoricalScore(
        userId,
        userData.username,
        creditScore,
        currentTime,
      );
      await updateLastScoreUpdateTime(userId, currentTime);
      console.info(
        `Handler: Historical data saved for user '${userData.username}'.`,
      );
    } else if (userDeleted) {
      console.info(
        `Handler: User '${userData.username}' is deleted. Skipping historical data save.`,
      );
    }

    const output = {
      username: userData.username,
      creditScore,
      riskBaseFee: risk,
      avatarUrl: userData.avatarUrl || null,
      userExists: true,
      fetchSuccess: true,
      latestRank: rankData.latestRank,
      outstandingDebtImpact: outstandingDebtImpact,
      calculatedProfit: calculatedProfit,
      balance: userPortfolio.balance,
      rawMMR: rawMMR,
      historicalDataSaved: shouldSaveHistoricalData && !userDeleted,
      userId: userId,
      userDeleted: userDeleted,
    };

    console.info(
      `Handler: Successfully processed data for user '${userData.username}'.`,
    );
    return new Response(JSON.stringify(output), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage =
      typeof error === "object" && error !== null && "message" in error
        ? (error as { message: string }).message
        : String(error);
    console.error(
      `Handler: Critical error processing data for '${username}': ${errorMessage}`,
      error,
    );
    return new Response(
      JSON.stringify({
        error: `Internal server error processing data for ${username}`,
        username: username,
        userExists: manifoldUserFetchSuccess && !!userData,
        fetchSuccess: false,
        historicalDataSaved: false,
        userDeleted: userDeleted,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
