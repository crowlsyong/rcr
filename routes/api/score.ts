// routes/api/score.ts

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

  try {
    const res = await fetch(`https://api.manifold.markets/v0/user/${username}`);

    if (res.status === 404) {
      fetchSuccess = false;
      return { userData: null, fetchSuccess };
    }

    if (!res.ok) {
      throw new Error(`Failed to fetch ${username}: ${res.statusText}`);
    }

    userData = await res.json();
    fetchSuccess = true;
  } catch (error) {
    fetchSuccess = false;
    console.error(`Error fetching user '${username}':`, error);
  }

  console.log(`fetchSuccess for '${username}':`, fetchSuccess);
  return { userData, fetchSuccess };
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
): number {
  const loanBalancesPerUser: { [otherUserId: string]: number } = {};

  for (const txn of transactions) {
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
  const minMultiplier = 0.05;
  const maxMultiplier = 2;

  // Using a power function for a non-linear decrease in multiplier
  const normalizedScoreScaled = clampedScore / 1000;
  const exponent = 0.5; // Adjust this for the curve shape
  const multiplier = maxMultiplier +
    (minMultiplier - maxMultiplier) * Math.pow(normalizedScoreScaled, exponent);

  return Math.round(multiplier * 100) / 100;
}

export async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const username = url.searchParams.get("username");

  if (!username || username.length < 1) {
    return new Response("Username missing or too short", { status: 400 });
  }

  const { userData, fetchSuccess } = await fetchUserData(username);
  if (!fetchSuccess) {
    return new Response(`User ${username} not found`, { status: 404 });
  }

  try {
    const createdTime = userData.createdTime ?? Date.now();
    const ageDays = (Date.now() - createdTime) / 86_400_000;

    const portfolioRes = await fetch(
      `https://api.manifold.markets/v0/get-user-portfolio?userId=${userData.id}`,
    );
    if (!portfolioRes.ok) {
      throw new Error(
        `Failed to fetch user portfolio: ${portfolioRes.statusText}`,
      );
    }
    const userPortfolio: UserPortfolio = await portfolioRes.json();

    const calculatedProfit = userPortfolio.investmentValue +
      userPortfolio.balance - userPortfolio.totalDeposits;

    const { latestRank } = await fetchManaAndRecentRank(userData.id);
    const transactionCount = await fetchTransactionCount(username);

    const loanTransactions = await fetchLoanTransactions(userData.id);
    const outstandingDebtImpact = calculateNetLoanBalance(
      userData.id,
      loanTransactions,
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

    const output = {
      username,
      creditScore,
      riskMultiplier: risk,
      avatarUrl: userData.avatarUrl || null,
      userExists: fetchSuccess,
      latestRank,
      outstandingDebtImpact: outstandingDebtImpact,
      calculatedProfit: calculatedProfit,
      balance: userPortfolio.balance,
      rawMMR: rawMMR,
    };
    console.log(`Stats for user: ${username}`);
    console.log(`  Raw MMR: ${rawMMR}`);
    console.log(`  Calculated Profit: ${calculatedProfit}`);
    console.log(`  Balance: ${userPortfolio.balance}`);
    console.log(`  Investment Value: ${userPortfolio.investmentValue}`);
    console.log(`  Total Deposits: ${userPortfolio.totalDeposits}`);
    console.log(`  Age (days): ${ageDays}`);
    console.log(`  Credit Score: ${creditScore}`);
    console.log(`  Risk Multiplier: ${risk}`);
    console.log(`  Transaction Count: ${transactionCount}`);
    console.log(`  Outstanding Debt Impact: ${outstandingDebtImpact}`);
    console.log(`  fetchSuccess: ${fetchSuccess}`);
    console.log("---");
    return new Response(JSON.stringify(output), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`Error processing data for ${username}:`, error);
    return new Response(`Error processing data for ${username}`, {
      status: 500,
    });
  }
}
