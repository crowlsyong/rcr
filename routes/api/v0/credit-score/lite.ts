// routes/api/v0/credit-score/lite.ts
import { Handlers, FreshContext } from "$fresh/server.ts";
import {
  fetchUserData,
  fetchUserDataLiteById,
} from "../../../../utils/api/manifold_api_service.ts";
import {
  calculateNetLoanBalance,
  computeMMR,
  mapToCreditScore,
} from "../../../../utils/api/score_calculation_logic.ts";
import { ManifoldUser, UserPortfolio } from "../../../../utils/api/manifold_types.ts";
import {
  fetchManaAndRecentRank,
  fetchTransactionCount,
  fetchUserPortfolio,
  fetchLoanTransactions,
} from "../../../../utils/api/manifold_api_service.ts";

const MANIFOLD_USER_ID = "IPTOzEqrpkWmEzh6hwvAyY9PqFb2";

function createErrorResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
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
      // Fetch full user data to check for userDeleted status reliably
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
  async GET(req: Request, _ctx: FreshContext) { // Changed 'ctx' to '_ctx' here
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
      return new Response(
        JSON.stringify({
          username: username || "N/A",
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
    const finalUsername = userData.username;

    try {
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
          "Internal server error: Could not process user data",
          500,
        );
      }
      const userPortfolio: UserPortfolio = portfolioFetch.portfolio;

      const calculatedProfit = userPortfolio.investmentValue +
        userPortfolio.balance - userPortfolio.totalDeposits;

      const outstandingDebtImpact = calculateNetLoanBalance(
        userId,
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
        username: finalUsername,
        creditScore,
        userId: userId,
        userDeleted: !!userDeleted,
      };

      return new Response(JSON.stringify(output), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    } catch (error) {
      const errorMessage = typeof error === "object" && error !== null &&
          "message" in error
        ? (error as { message: string }).message
        : String(error);
      return createErrorResponse(
        `Internal server error processing lite score: ${errorMessage}`,
        500,
      );
    }
  },
};

