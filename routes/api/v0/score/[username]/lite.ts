// /routes/api/v0/score/[username]/lite.ts
import {
  fetchLoanTransactions,
  fetchManaAndRecentRank,
  fetchTransactionCount,
  fetchUserData,
  fetchUserPortfolio,
} from "../../../../../utils/api/manifold_api_service.ts";
import {
  calculateNetLoanBalance,
  computeMMR,
  mapToCreditScore,
} from "../../../../../utils/api/score_calculation_logic.ts";
import {
  ManifoldUser,
  UserPortfolio,
} from "../../../../../utils/api/manifold_types.ts";

const MANIFOLD_USER_ID = "IPTOzEqrpkWmEzh6hwvAyY9PqFb2";

export async function handler(
  _req: Request,
  { params }: { params: { username: string } },
): Promise<Response> {
  const username = params.username;

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
    console.info(
      `Handler: User '${username}' not found or fetch failed from Manifold API service.`,
    );
    return new Response(
      JSON.stringify({
        username: username,
        creditScore: 0,
        userId: null,
        userDeleted: userDeleted,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const userId = userData.id;

  try {
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
        `Handler: Failed to fetch portfolio for '${userData.username}' (ID: ${userId}) for lite score.`,
      );
      return new Response(
        JSON.stringify({
          error: `Internal server error: Could not process user data`,
          username: userData.username,
          creditScore: 0,
          userId: userId,
          userDeleted: userDeleted,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
    const userPortfolio: UserPortfolio = portfolioFetch.portfolio;

    const calculatedProfit = userPortfolio.investmentValue +
      userPortfolio.balance - userPortfolio.totalDeposits;

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

    const output = {
      username: userData.username,
      creditScore,
      userId: userId,
      userDeleted: userDeleted,
    };

    console.info(
      `Handler: Successfully processed lite score for user '${userData.username}'.`,
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
      `Handler: Critical error processing lite score for '${username}': ${errorMessage}`,
      error,
    );
    return new Response(
      JSON.stringify({
        error: `Internal server error processing lite score for ${username}`,
        username: username,
        creditScore: 0,
        userId: userData?.id || null,
        userDeleted: userDeleted,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
