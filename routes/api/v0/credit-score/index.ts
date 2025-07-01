// routes/api/v0/credit-score/index.ts
import { Handlers } from "$fresh/server.ts";
import {
  fetchLoanTransactions,
  fetchManaAndRecentRank,
  fetchTransactionCount,
  fetchUserData,
  fetchUserDataLiteById,
  fetchUserPortfolio,
} from "../../../../utils/api/manifold_api_service.ts";
import {
  calculateNetLoanBalance,
  calculateriskBaseFee,
  computeMMR,
  mapToCreditScore,
} from "../../../../utils/api/score_calculation_logic.ts";
import {
  getLastScoreUpdateTime,
  saveHistoricalScore,
  updateLastScoreUpdateTime,
} from "../../../../utils/api/kv_store_service.ts";
import {
  ManifoldUser,
  UserPortfolio,
} from "../../../../utils/api/manifold_types.ts";
import db from "../../../../database/db.ts";

const MANIFOLD_USER_ID = "IPTOzEqrpkWmEzh6hwvAyY9PqFb2";

export interface OverrideEvent {
  username: string;
  modifier: number;
  url: string;
  timestamp: number;
  dateOfInfraction: number;
  description: string;
}

const getErrorMessage = (e: unknown): string => {
  return typeof e === "object" && e !== null && "message" in e
    ? (e as { message: string }).message
    : String(e);
};

function createErrorResponse(
  message: string,
  status: number,
  details?: Record<string, unknown>,
): Response {
  return new Response(JSON.stringify({ error: message, ...details }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function resolveUser(
  username?: string | null,
  userId?: string | null,
): Promise<{
  userData: ManifoldUser | null;
  fetchSuccess: boolean;
  userDeleted: boolean;
}> {
  if (userId) {
    const liteResult = await fetchUserDataLiteById(userId);
    if (liteResult.fetchSuccess && liteResult.userData?.username) {
      return await fetchUserData(liteResult.userData.username);
    }
    return { userData: null, fetchSuccess: false, userDeleted: false };
  }
  if (username) {
    return await fetchUserData(username);
  }
  return { userData: null, fetchSuccess: false, userDeleted: false };
}

export const handler: Handlers = {
  async GET(req) {
    const url = new URL(req.url);
    const username = url.searchParams.get("username");
    const userIdParam = url.searchParams.get("userId");

    if (!username && !userIdParam) {
      return createErrorResponse(
        "Username or userId parameter is required",
        400,
      );
    }

    const {
      userData,
      fetchSuccess: manifoldUserFetchSuccess,
      userDeleted,
    } = await resolveUser(username, userIdParam);

    if (!manifoldUserFetchSuccess || !userData) {
      const responsePayload = {
        username: username || "N/A",
        creditScore: 0,
        riskBaseFee: 0,
        avatarUrl: null,
        userExists: false,
        fetchSuccess: true,
        historicalDataSaved: false,
        userDeleted: userDeleted,
        overrideEvents: [],
      };
      return new Response(JSON.stringify(responsePayload), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    const userId = userData.id;
    const finalUsername = userData.username;

    await db.set(["users", userId], { id: userId, username: finalUsername });

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
      }

      // Fetch override events from Deno KV
      const overrideEventsForUser: OverrideEvent[] = [];
      const overridePrefix = ["score_overrides", userId];
      for await (
        const entry of db.list<OverrideEvent>({ prefix: overridePrefix })
      ) {
        overrideEventsForUser.push(entry.value);
      }
      // Sort them by timestamp for consistent display, newest first
      overrideEventsForUser.sort((a, b) => b.timestamp - a.timestamp);

      const createdTime = userData.createdTime ?? Date.now();
      const ageDays = (Date.now() - createdTime) / 86_400_000;

      const [
        portfolioFetch,
        rankData,
        transactionData,
        loanData,
      ] = await Promise.all([
        fetchUserPortfolio(userId),
        fetchManaAndRecentRank(userId),
        fetchTransactionCount(finalUsername),
        fetchLoanTransactions(userId),
      ]);

      if (!portfolioFetch.success || !portfolioFetch.portfolio) {
        return createErrorResponse(
          "Failed to fetch user portfolio data",
          503,
          {
            username: finalUsername,
            userExists: true,
            fetchSuccess: false,
            userDeleted,
            overrideEvents: [],
          },
        );
      }
      const userPortfolio: UserPortfolio = portfolioFetch.portfolio;

      const calculatedProfit = userPortfolio.investmentValue +
        userPortfolio.balance - userPortfolio.totalDeposits;

      if (!rankData.success || !transactionData.success || !loanData.success) {
        console.warn(
          `Credit Score API: One or more auxiliary data fetches failed for '${finalUsername}'.`,
        );
      }

      const outstandingDebtImpact = calculateNetLoanBalance(
        userId,
        loanData.transactions,
        MANIFOLD_USER_ID,
      );

      const rawMMR = computeMMR( // Raw MMR (Manifold Score)
        userPortfolio.balance,
        calculatedProfit,
        ageDays,
        rankData.latestRank ?? 100,
        transactionData.count,
        outstandingDebtImpact,
      );

      const baseCreditScore = mapToCreditScore(rawMMR); // THIS IS THE BASE SCORE (e.g., 827 from MMR)

      // Calculate total modifier to apply to the *display* score
      let totalModifierForDisplay = 0;
      if (overrideEventsForUser.length > 0) {
        for (const event of overrideEventsForUser) {
          totalModifierForDisplay += event.modifier;
        }
      }

      // Calculate the final score for current display
      const finalDisplayCreditScore = Math.max(
        0,
        Math.min(1000, baseCreditScore + totalModifierForDisplay),
      );

      // **** CRITICAL CHANGE FOR HISTORICAL SAVING ****
      // Save the BASE score (before modifiers are applied) to history.
      // This ensures that history.ts can always apply the modifiers dynamically.
      if (shouldSaveHistoricalData && !userDeleted) {
        await saveHistoricalScore(
          userId,
          finalUsername,
          baseCreditScore, // <--- SAVE THE BASE SCORE HERE
          currentTime,
        );
        await updateLastScoreUpdateTime(userId, currentTime);
      }
      // ************************************************

      const risk = calculateriskBaseFee(finalDisplayCreditScore); // Calculate risk based on the final display score

      const output = {
        username: finalUsername,
        userId: userId,
        creditScore: finalDisplayCreditScore, // Output the final display score
        riskBaseFee: risk,
        avatarUrl: userData.avatarUrl || null,
        userExists: true,
        fetchSuccess: true,
        userDeleted: !!userDeleted,
        details: {
          latestRank: rankData.latestRank,
          outstandingDebtImpact: outstandingDebtImpact,
          calculatedProfit: calculatedProfit,
          balance: userPortfolio.balance,
          rawMMR: rawMMR, // Still output raw MMR for debugging/details
        },
        historicalDataSaved: shouldSaveHistoricalData && !userDeleted,
        overrideEvents: overrideEventsForUser,
      };

      console.log(
        `Backend API: Sending overrideEvents for ${finalUsername}:`,
        output.overrideEvents,
      );

      return new Response(JSON.stringify(output), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    } catch (error) {
      return createErrorResponse(
        `Internal server error: ${getErrorMessage(error)}`,
        500,
        {
          username: finalUsername,
          userExists: true,
          fetchSuccess: false,
          userDeleted,
          overrideEvents: [],
        },
      );
    }
  },
};
