/// <reference lib="deno.unstable" />
// routes/api/score.ts

import db from "../../database/db.ts";

// Your existing interfaces
interface ManaPaymentTransaction {
  id: string;
  amount: number;
  fromId: string;
  toId: string;
  fromType: "USER" | string;
  toType: "USER" | string;
  category: "MANA_PAYMENT" | string;
  createdTime: number;
  token?: string;
  description?: string;
  data?: {
    groupId?: string;
    message?: string;
    visibility?: string;
  };
}

interface UserPortfolio {
  loanTotal: number;
  investmentValue: number;
  cashInvestmentValue: number;
  balance: number;
  cashBalance: number;
  spiceBalance: number;
  totalDeposits: number;
  totalCashDeposits: number;
  dailyProfit: number;
  timestamp: number;
}

// New interface for the Manifold User object
interface ManifoldUser {
  id: string;
  username: string;
  avatarUrl?: string | null;
  createdTime?: number; // Assuming Unix timestamp
  userDeleted?: boolean;
  // Add other properties you use from the /v0/user/:username endpoint
  // name?: string;
  // bio?: string;
}

// Helper for fetch with retries
async function fetchWithRetries(
  url: string,
  options?: RequestInit,
  retries = 2,
  delayMs = 1000,
  // deno-lint-ignore no-explicit-any
): Promise<{ response: Response | null; error?: any; success: boolean }> {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return { response, success: true };
      }

      if (
        (response.status === 503 || response.status === 500 ||
          response.status === 502 || response.status === 504 ||
          response.status === 429) && i < retries
      ) {
        console.warn(
          `Fetch failed for ${url} with status ${response.status}. Retrying in ${
            delayMs * (i + 1)
          }ms... (Attempt ${i + 1} of ${retries + 1})`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
        continue;
      }
      return { response, success: false };
    } catch (error) {
      if (i < retries) {
        const errorMessage =
          typeof error === "object" && error !== null && "message" in error
            ? (error as { message: string }).message
            : String(error);
        console.warn(
          `Fetch error for ${url}: ${errorMessage}. Retrying in ${
            delayMs * (i + 1)
          }ms... (Attempt ${i + 1} of ${retries + 1})`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
      } else {
        const finalErrorMessage =
          typeof error === "object" && error !== null && "message" in error
            ? (error as { message: string }).message
            : String(error);
        console.error(
          `Fetch error for ${url} after ${
            retries + 1
          } attempts: ${finalErrorMessage}`,
        );
        return { response: null, error, success: false };
      }
    }
  }
  return {
    response: null,
    error: new Error("Exhausted retries unexpectedly"),
    success: false,
  };
}

// Fetch raw user data
async function fetchUserData(
  username: string,
): Promise<{
  userData: ManifoldUser | null;
  fetchSuccess: boolean;
  userDeleted: boolean;
}> {
  let userDeleted = false;

  const { response, success, error } = await fetchWithRetries(
    `https://api.manifold.markets/v0/user/${username}`,
  );

  if (!success || !response) {
    console.warn(
      `fetchUserData: Failed to fetch data for '${username}' after retries. Error: ${
        error ? error.message : (response ? response.statusText : "Unknown")
      }`,
    );
    return { userData: null, fetchSuccess: false, userDeleted };
  }

  if (response.status === 404) {
    console.info(`fetchUserData: User '${username}' not found (404).`);
    return { userData: null, fetchSuccess: false, userDeleted };
  }

  if (!response.ok) {
    console.warn(
      `fetchUserData: Received non-OK status ${response.status} for '${username}' after retries.`,
    );
    return { userData: null, fetchSuccess: false, userDeleted };
  }

  try {
    const userData: ManifoldUser = await response.json();
    userDeleted = userData.userDeleted === true;
    console.debug(
      `fetchUserData: Successfully fetched data for '${username}'.`,
    );
    return { userData, fetchSuccess: true, userDeleted };
  } catch (jsonError) {
    console.error(
      `fetchUserData: Error parsing JSON for '${username}': ${
        typeof jsonError === "object" && jsonError !== null &&
          "message" in jsonError
          ? (jsonError as { message: string }).message
          : String(jsonError)
      }`,
    );
    return { userData: null, fetchSuccess: false, userDeleted };
  }
}

// High league rank improves the score.
async function fetchManaAndRecentRank(
  userId: string,
): Promise<{ total: number; latestRank: number | null; success: boolean }> {
  const { response, success, error } = await fetchWithRetries(
    `https://api.manifold.markets/v0/leagues?userId=${userId}`,
  );

  if (!success || !response) {
    console.warn(
      `fetchManaAndRecentRank: Failed for userId '${userId}' after retries. Error: ${
        error ? error.message : (response ? response.statusText : "Unknown")
      }`,
    );
    return { total: 0, latestRank: null, success: false };
  }

  try {
    const leaguesData = await response.json();
    let total = 0;
    let latestRank: number | null = null;

    for (const season of leaguesData) {
      total += season.manaEarned;
    }

    if (leaguesData.length > 0) {
      const mostRecent = leaguesData.reduce((
        a: { season?: number; rankSnapshot?: number },
        b: { season?: number; rankSnapshot?: number },
      ) => (a.season ?? 0) > (b.season ?? 0) ? a : b);
      latestRank = mostRecent.rankSnapshot ?? null;
    }
    return { total, latestRank, success: true };
  } catch (jsonError) {
    console.error(
      `fetchManaAndRecentRank: Error parsing JSON for userId '${userId}': ${
        typeof jsonError === "object" && jsonError !== null &&
          "message" in jsonError
          ? (jsonError as { message: string }).message
          : String(jsonError)
      }`,
    );
    return { total: 0, latestRank: null, success: false };
  }
}

async function fetchTransactionCount(
  username: string,
): Promise<{ count: number; success: boolean }> {
  const { response, success, error } = await fetchWithRetries(
    `https://api.manifold.markets/v0/bets?username=${username}`,
  );

  if (!success || !response) {
    console.warn(
      `fetchTransactionCount: Failed for '${username}' after retries. Error: ${
        error ? error.message : (response ? response.statusText : "Unknown")
      }`,
    );
    return { count: 0, success: false };
  }

  try {
    const data = await response.json();
    return { count: Array.isArray(data) ? data.length : 0, success: true };
  } catch (jsonError) {
    console.error(
      `fetchTransactionCount: Error parsing JSON for '${username}': ${
        typeof jsonError === "object" && jsonError !== null &&
          "message" in jsonError
          ? (jsonError as { message: string }).message
          : String(jsonError)
      }`,
    );
    return { count: 0, success: false };
  }
}

// Fetch loan/repayment transactions
async function fetchLoanTransactions(
  userId: string,
): Promise<{ transactions: ManaPaymentTransaction[]; success: boolean }> {
  const receivedResult = await fetchWithRetries(
    `https://api.manifold.markets/v0/txns?limit=100&category=MANA_PAYMENT&toId=${userId}`,
  );
  const sentResult = await fetchWithRetries(
    `https://api.manifold.markets/v0/txns?limit=100&category=MANA_PAYMENT&fromId=${userId}`,
  );

  if (
    !receivedResult.success || !receivedResult.response ||
    !sentResult.success || !sentResult.response
  ) {
    console.warn(
      `fetchLoanTransactions: Failed to fetch one or both transaction sets for userId '${userId}' after retries.`,
    );
    return { transactions: [], success: false };
  }

  try {
    const receivedTxns: ManaPaymentTransaction[] = await receivedResult.response
      .json();
    const sentTxns: ManaPaymentTransaction[] = await sentResult.response.json();
    return { transactions: [...receivedTxns, ...sentTxns], success: true };
  } catch (jsonError) {
    console.error(
      `fetchLoanTransactions: Error parsing JSON for userId '${userId}': ${
        typeof jsonError === "object" && jsonError !== null &&
          "message" in jsonError
          ? (jsonError as { message: string }).message
          : String(jsonError)
      }`,
    );
    return { transactions: [], success: false };
  }
}

// Calculate net loan balance (focusing only on outstanding debt)
function calculateNetLoanBalance(
  userId: string,
  transactions: ManaPaymentTransaction[],
  manifoldUserId: string,
): number {
  const loanBalancesPerUser: { [otherUserId: string]: number } = {};
  for (const txn of transactions) {
    if (txn.fromId === manifoldUserId || txn.toId === manifoldUserId) {
      continue;
    }
    if (
      txn.category === "MANA_PAYMENT" && txn.fromType === "USER" &&
      txn.toType === "USER"
    ) {
      if (txn.toId === userId) {
        const lenderId = txn.fromId;
        loanBalancesPerUser[lenderId] = (loanBalancesPerUser[lenderId] || 0) -
          txn.amount;
      } else if (txn.fromId === userId) {
        const recipientId = txn.toId;
        loanBalancesPerUser[recipientId] =
          (loanBalancesPerUser[recipientId] || 0) + txn.amount;
      }
    }
  }
  let loanImpact = 0;
  for (const otherUserId in loanBalancesPerUser) {
    if (loanBalancesPerUser[otherUserId] < 0) {
      loanImpact += loanBalancesPerUser[otherUserId];
    }
  }
  return loanImpact;
}

// Compute raw MMR score based on weighted factors
function computeMMR(
  balance: number,
  calculatedProfit: number,
  ageDays: number,
  rank: number,
  transactionCount: number,
  netLoanBalance: number,
  maxRank = 100,
): number {
  const rankWeight = Math.max(0, Math.min(1, 1 - (rank - 1) / (maxRank - 1)));
  const rankMMR = rankWeight * 1000;
  let transactionMMR = 0;
  if (transactionCount < 5) {
    transactionMMR = -1000000;
  } else if (transactionCount <= 20) {
    const t = (transactionCount - 5) / 15;
    transactionMMR = -100000 + t * 90000;
  } else if (transactionCount <= 100) {
    const t = (transactionCount - 20) / 80;
    transactionMMR = -10000 + t * 10000;
  } else if (transactionCount <= 1000) {
    const t = (transactionCount - 100) / 900;
    transactionMMR = t * 1000;
  } else {
    transactionMMR = 1000;
  }

  // Weights
  const balanceWeight = 0.1;
  const outstandingLoanImpactWeight = .25;
  const calculatedProfitWeight = 0.4;
  const ageDaysWeight = 0.05;
  const transactionMMRWeight = 0.1;
  const rankMMRWeight = 0.1;

  // Credit Score Calculation
  return ((balance * balanceWeight) +
    (netLoanBalance * outstandingLoanImpactWeight) +
    (calculatedProfit * calculatedProfitWeight) + (ageDays * ageDaysWeight)) +
    (rankMMR * rankMMRWeight) +
    (transactionMMR * transactionMMRWeight);
}

function mapToCreditScore(mmrValue: number): number {
  const minMMR = -500000;
  const maxMMR = 2000000;
  const transform = (x: number) => {
    const sign = x < 0 ? -1 : 1;
    return sign * Math.log10(1 + Math.abs(x));
  };
  const transformedMin = transform(minMMR);
  const transformedMax = transform(maxMMR);
  const transformedValue = transform(mmrValue);
  const normalized = (transformedValue - transformedMin) /
    (transformedMax - transformedMin);
  const score = normalized * 1000;
  return Math.round(Math.max(0, Math.min(1000, score)));
}

function calculateRiskMultiplier(score: number): number {
  const clampedScore = Math.max(0, Math.min(score, 1000));
  if (clampedScore >= 900) return 0.02;
  if (clampedScore >= 800) return 0.03;
  if (clampedScore >= 700) return 0.05;
  if (clampedScore >= 600) return 0.07;
  if (clampedScore >= 500) return 0.10;
  if (clampedScore >= 400) return 0.14;
  if (clampedScore >= 300) return 0.25;
  if (clampedScore >= 200) return 0.60;
  if (clampedScore >= 100) return 1.00;
  return 1.60;
}

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

  const MANIFOLD_USER_ID = "IPTOzEqrpkWmEzh6hwvAyY9PqFb2";

  const {
    userData,
    fetchSuccess: manifoldUserFetchSuccess,
    userDeleted,
  } = await fetchUserData(username);

  if (!manifoldUserFetchSuccess || !userData) {
    const responsePayload = {
      username: username,
      creditScore: 0,
      riskMultiplier: 0,
      avatarUrl: null,
      userExists: false,
      fetchSuccess: true,
      historicalDataSaved: false,
      userDeleted: userDeleted,
    };
    console.info(
      `Handler: User '${username}' not found or fetch failed from Manifold API.`,
    );
    return new Response(JSON.stringify(responsePayload), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  }

  const userId = userData.id;

  if (userData.username === "Manifold") {
    console.info(
      `Handler: Processing @Manifold user, mana payments will be filtered.`,
    );
  }

  const currentTime = Date.now();
  const rateLimitDays = 1;
  const rateLimitMilliseconds = rateLimitDays * 24 * 60 * 60 * 1000;

  try {
    const lastUpdateKey = ["last_score_update", userId];
    const lastUpdateEntry = await db.get<number>(lastUpdateKey);
    const lastUpdateTime = lastUpdateEntry.value;

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

    const portfolioFetch = await fetchWithRetries(
      `https://api.manifold.markets/v0/get-user-portfolio?userId=${userData.id}`,
    );
    if (!portfolioFetch.success || !portfolioFetch.response) {
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
    const userPortfolio: UserPortfolio = await portfolioFetch.response.json();

    const calculatedProfit = userPortfolio.investmentValue +
      userPortfolio.balance - userPortfolio.totalDeposits;

    const rankData = await fetchManaAndRecentRank(userData.id);
    const transactionData = await fetchTransactionCount(userData.username);
    const loanData = await fetchLoanTransactions(userData.id);

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
    const risk = calculateRiskMultiplier(creditScore);

    if (shouldSaveHistoricalData && !userDeleted) {
      const historicalDataKey = ["credit_scores", userId, currentTime];
      const historicalDataValue = {
        userId,
        username: userData.username,
        creditScore,
        timestamp: currentTime,
      };
      await db.set(historicalDataKey, historicalDataValue);

      const atomic = db.atomic();
      atomic.set(lastUpdateKey, currentTime);
      await atomic.commit();
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
      riskMultiplier: risk,
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
