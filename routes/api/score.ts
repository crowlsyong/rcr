/// <reference lib="deno.unstable" />
// routes/api/score.ts

import db from "../../database/db.ts"; // Import the KV database instance

// Define an interface for the relevant parts of a transaction object
interface ManaPaymentTransaction {
  id: string;
  amount: number;
  fromId: string;
  toId: string;
  fromType: "USER" | string;
  toType: "USER" | string;
  category: "MANA_PAYMENT" | string;
  createdTime: number; // Unix timestamp in milliseconds
  token?: string;
  description?: string;
  data?: {
    groupId?: string;
    message?: string;
    visibility?: string;
  };
}

// Define a specific interface for the user portfolio data
interface UserPortfolio {
  loanTotal: number;
  investmentValue: number;
  cashInvestmentValue: number;
  balance: number; // User's current balance
  cashBalance: number;
  spiceBalance: number;
  totalDeposits: number;
  totalCashDeposits: number;
  dailyProfit: number;
  timestamp: number;
}

// Fetch raw user data
async function fetchUserData(username: string) {
  let fetchSuccess = false;
  let userData = null;
  let userDeleted = false; // Initialize userDeleted

  try {
    const res = await fetch(`https://api.manifold.markets/v0/user/${username}`);

    if (res.status === 404) {
      fetchSuccess = false;
      return { userData: null, fetchSuccess, userDeleted };
    }

    if (!res.ok) {
      throw new Error(`Failed to fetch ${username}: ${res.statusText}`);
    }

    userData = await res.json();
    fetchSuccess = true;
    userDeleted = userData.userDeleted === true; // Set userDeleted based on API response
  } catch (error) {
    fetchSuccess = false;
    console.error(`Error fetching user '${username}':`, error);
  }

  console.log(`fetchSuccess for '${username}':`, fetchSuccess);
  return { userData, fetchSuccess, userDeleted };
}

// High league rank improves the score.
async function fetchManaAndRecentRank(
  userId: string,
): Promise<{ total: number; latestRank: number | null }> {
  const res = await fetch(
    `https://api.manifold.markets/v0/leagues?userId=${userId}`,
  );

  if (!res.ok) {
    console.error(`Failed to fetch leagues: ${res.statusText}`);
    return { total: 0, latestRank: null };
  }

  const leaguesData = await res.json();
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

  return { total, latestRank };
}

async function fetchTransactionCount(username: string): Promise<number> {
  try {
    const res = await fetch(
      `https://api.manifold.markets/v0/bets?username=${username}`,
    );
    if (!res.ok) {
      throw new Error(`Failed to fetch transactions: ${res.statusText}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data.length : 0;
  } catch (err) {
    console.error(`Error fetching transaction count for '${username}':`, err);
    return 0;
  }
}

// Fetch loan/repayment transactions
async function fetchLoanTransactions(
  userId: string,
): Promise<ManaPaymentTransaction[]> {
  try {
    // Fetch transactions where the user is the recipient
    const receivedTxnsRes = await fetch(
      `https://api.manifold.markets/v0/txns?limit=100&category=MANA_PAYMENT&toId=${userId}`,
    );
    if (!receivedTxnsRes.ok) {
      throw new Error(
        `Failed to fetch received loan transactions: ${receivedTxnsRes.statusText}`,
      );
    }
    const receivedTxns: ManaPaymentTransaction[] = await receivedTxnsRes.json();

    // Fetch transactions where the user is the sender
    const sentTxnsRes = await fetch(
      `https://api.manifold.markets/v0/txns?limit=100&category=MANA_PAYMENT&fromId=${userId}`,
    );
    if (!sentTxnsRes.ok) {
      throw new Error(
        `Failed to fetch sent loan transactions: ${sentTxnsRes.statusText}`,
      );
    }
    const sentTxns: ManaPaymentTransaction[] = await sentTxnsRes.json();

    return [...receivedTxns, ...sentTxns];
  } catch (err) {
    console.error(`Error fetching loan transactions for '${userId}':`, err);
    return [];
  }
}

// Calculate net loan balance (focusing only on outstanding debt)
function calculateNetLoanBalance(
  userId: string,
  transactions: ManaPaymentTransaction[],
  manifoldUserId: string, // Pass the Manifold User ID here
): number {
  const loanBalancesPerUser: { [otherUserId: string]: number } = {};

  for (const txn of transactions) {
    // Skip transactions involving the Manifold user
    if (txn.fromId === manifoldUserId || txn.toId === manifoldUserId) {
      continue; // Skip this transaction
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
  maxRank: number = 100,
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

  return ((balance * balanceWeight) +
    (netLoanBalance * outstandingLoanImpactWeight) +
    (calculatedProfit * calculatedProfitWeight) + (ageDays * ageDaysWeight)) +
    (rankMMR * rankMMRWeight) +
    (transactionMMR * transactionMMRWeight);
}

function mapToCreditScore(mmrValue: number): number {
  // Define the min/max MMR for reference, can tune these
  const minMMR = -500000;
  const maxMMR = 2000000;

  // Logarithmic transform using symmetric scaling
  const transform = (x: number) => {
    const sign = x < 0 ? -1 : 1;
    return sign * Math.log10(1 + Math.abs(x));
  };

  const transformedMin = transform(minMMR);
  const transformedMax = transform(maxMMR);
  const transformedValue = transform(mmrValue);

  // Normalize
  const normalized = (transformedValue - transformedMin) /
    (transformedMax - transformedMin);
  const score = normalized * 1000;

  return Math.round(Math.max(0, Math.min(1000, score)));
}

function calculateRiskMultiplier(score: number): number {
  const clampedScore = Math.max(0, Math.min(score, 1000));

  if (clampedScore >= 900) {
    return 0.02; // 2% old
  } else if (clampedScore >= 800) {
    return 0.03; // 7% old
  } else if (clampedScore >= 700) {
    return 0.05; // 11% old
  } else if (clampedScore >= 600) {
    return 0.07; // 15% old
  } else if (clampedScore >= 500) {
    return 0.10; // 25% old
  } else if (clampedScore >= 400) {
    return 0.14; // 45% old
  } else if (clampedScore >= 300) {
    return 0.25; // 75% old
  } else if (clampedScore >= 200) {
    return 0.60; // 110% old
  } else if (clampedScore >= 100) {
    return 1.00; // 150% old
  } else {
    return 1.60; // 200% old
  }
}

export async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const username = url.searchParams.get("username");

  if (!username || username.length < 1) {
    return new Response("Username missing or too short", { status: 400 });
  }

  // Define the Manifold admin user ID
  const MANIFOLD_USER_ID = "IPTOzEqrpkWmEzh6hwvAyY9PqFb2"; // Manifold's user ID

  // Fetch user data from Manifold API
  const { userData, fetchSuccess: manifoldFetchSuccess, userDeleted } =
    await fetchUserData(
      username,
    ); // Include userDeleted in the destructured object

  // If fetchUserData was not successful (e.g., 404 from Manifold API)
  if (!manifoldFetchSuccess || !userData) {
    // Instead of returning 404 directly, return a 200 OK with userExists: false
    const responsePayload = {
      username: username, // Return the attempted username
      creditScore: 0, // Default score
      riskMultiplier: 0, // Default multiplier
      avatarUrl: null, // No avatar
      userExists: false, // Explicitly state user was NOT found
      fetchSuccess: true, // Indicate that the fetch *to your backend* for user data was attempted and responded successfully (even if the API returned 404)
      historicalDataSaved: false, // No historical data saved for non-existent users
      userDeleted: userDeleted, // Include the userDeleted status even for non-existent/404
    };
    console.log(`User ${username} not found via Manifold API.`);
    return new Response(JSON.stringify(responsePayload), {
      headers: { "Content-Type": "application/json" },
      status: 200, // Return 200 OK status
    });
  }

  // If the user was found (userData is available and manifoldFetchSuccess was true)
  const userId = userData.id;

  // Add a check here if the fetched user is the Manifold admin (case-sensitive check on username)
  if (userData.username === "Manifold") {
    // You can decide how to handle this - either proceed with calculation
    // (which will exclude their mana payments) or return a specific response.
    // For now, we'll let it proceed but ensure the mana payments are filtered.
    console.log(
      `Processing request for @Manifold user, filtering mana payments.`,
    );
  }

  const currentTime = Date.now();
  const rateLimitDays = 1;
  const rateLimitMilliseconds = rateLimitDays * 24 * 60 * 60 * 1000; // 1 day in milliseconds

  try {
    // Check for the last update timestamp in KV
    const lastUpdateKey = ["last_score_update", userId];
    const lastUpdateEntry = await db.get<number>(lastUpdateKey); // Use db instance
    const lastUpdateTime = lastUpdateEntry.value;

    let shouldSaveHistoricalData = true;
    if (
      lastUpdateTime !== null &&
      (currentTime - lastUpdateTime) < rateLimitMilliseconds
    ) {
      shouldSaveHistoricalData = false;
      console.log(
        `Rate limit active for user ${username}. Skipping historical data save.`,
      );
    }

    const createdTime = userData.createdTime ?? Date.now();
    const ageDays = (Date.now() - createdTime) / 86_400_000;

    const portfolioRes = await fetch(
      `https://api.manifold.markets/v0/get-user-portfolio?userId=${userData.id}`,
    );
    if (!portfolioRes.ok) {
      // Handle this API fetch failure - might want to return an error response here
      console.error(
        `Failed to fetch user portfolio: ${portfolioRes.statusText}`,
      );
      return new Response(`Error fetching portfolio for ${username}`, {
        status: 500,
      });
    }
    const userPortfolio: UserPortfolio = await portfolioRes.json();

    const calculatedProfit = userPortfolio.investmentValue +
      userPortfolio.balance - userPortfolio.totalDeposits;

    const { latestRank } = await fetchManaAndRecentRank(userData.id);
    const transactionCount = await fetchTransactionCount(username);

    // Call calculateNetLoanBalance with the hardcoded MANIFOLD_USER_ID
    const loanTransactions = await fetchLoanTransactions(userData.id);
    const outstandingDebtImpact = calculateNetLoanBalance(
      userData.id,
      loanTransactions,
      MANIFOLD_USER_ID, // Use the hardcoded ID
    );

    // Compute the raw MMR based on all weighted factors
    const rawMMR = computeMMR(
      userPortfolio.balance,
      calculatedProfit,
      ageDays,
      latestRank ?? 100,
      transactionCount,
      outstandingDebtImpact,
    );

    // Map the raw MMR directly to the 0-1000 credit score
    const creditScore = mapToCreditScore(rawMMR);

    // Calculate the risk multiplier based on the credit score
    const risk = calculateRiskMultiplier(creditScore);

    // Save historical data to KV if not rate-limited and user is not deleted
    if (shouldSaveHistoricalData && !userDeleted) {
      const historicalDataKey = ["credit_scores", userId, currentTime];
      const historicalDataValue = {
        userId,
        username,
        creditScore,
        timestamp: currentTime,
      };
      await db.set(historicalDataKey, historicalDataValue); // Use db instance

      // Update the last update timestamp in KV using a transaction
      const atomic = db.atomic();
      atomic.set(lastUpdateKey, currentTime);
      await atomic.commit();
      console.log(
        `Historical data saved and last update timestamp updated for user ${username}`,
      );
    } else if (userDeleted) {
      console.log(
        `User ${username} is deleted. Skipping historical data save.`,
      );
    }

    // Return the full success payload
    const output = {
      username: userData.username, // Use the username returned by the API (correct casing)
      creditScore,
      riskMultiplier: risk,
      avatarUrl: userData.avatarUrl || null,
      userExists: true, // Explicitly state user was found
      fetchSuccess: true, // Indicate backend fetch was successful for an existing user
      latestRank,
      outstandingDebtImpact: outstandingDebtImpact,
      calculatedProfit: calculatedProfit,
      balance: userPortfolio.balance,
      rawMMR: rawMMR,
      historicalDataSaved: shouldSaveHistoricalData && !userDeleted, // Reflect whether data was actually saved
      userId: userId,
      userDeleted: userDeleted, // Include the userDeleted status
      // manifoldUserId: MANIFOLD_USER_ID // Optional
    };

    console.log(`Successfully processed data for user: ${username}`);
    // ... (logging) ...
    return new Response(JSON.stringify(output), {
      headers: { "Content-Type": "application/json" },
      status: 200, // Return 200 OK status
    });
  } catch (error) {
    console.error(`Error processing data for ${username}:`, error);
    // Handle other internal errors
    return new Response(
      JSON.stringify({
        error: `Internal server error processing data for ${username}`,
        username: username, // Return the attempted username
        userExists: false, // Assume false on internal error
        fetchSuccess: false, // Indicate backend processing failed
        historicalDataSaved: false, // No historical data saved
        userDeleted: userDeleted, // Include the userDeleted status even on internal error
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500, // Return 500 Internal Server Error
      },
    );
  }
}
