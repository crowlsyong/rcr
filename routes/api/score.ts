// routes/api/score.ts

// Define an interface for the relevant parts of a transaction object
interface ManaPaymentTransaction {
  id: string;
  amount: number;
  fromId: string;
  toId: string;
  fromType: "USER" | string; // Use "USER" specifically, allow other strings if needed
  toType: "USER" | string;   // Use "USER" specifically, allow other strings if needed
  category: "MANA_PAYMENT" | string; // Be specific about the category
  createdTime: number; // Unix timestamp in milliseconds
  token?: string; // Optional token (e.g., "M$")
  description?: string; // Optional description
  data?: { // Optional data object, define more specifically if needed
    groupId?: string;
    message?: string;
    visibility?: string;
    // Add other data properties if relevant to your logic
  };
}

// Fetch raw user data
async function fetchUserData(username: string) {
  let fetchSuccess = false;
  let userData = null;

  try {
    const res = await fetch(`https://api.manifold.markets/v0/user/${username}`);

    if (res.status === 404) {
      console.error(`User '${username}' not found (404).`);
      fetchSuccess = false;
      return { userData: null, fetchSuccess };
    }

    if (!res.ok) {
      throw new Error(`Failed to fetch ${username}: ${res.statusText}`);
    }

    // You could define a more specific interface for userData as well
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

  // You could define an interface for league season data as well
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

// Added function to fetch loan/repayment transactions
// Use the specific interface for the return type
async function fetchLoanTransactions(userId: string): Promise<ManaPaymentTransaction[]> {
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
    // Cast the JSON response to the defined interface
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
    // Cast the JSON response to the defined interface
    const sentTxns: ManaPaymentTransaction[] = await sentTxnsRes.json();

    // Combine and return all relevant transactions
    return [...receivedTxns, ...sentTxns];
  } catch (err) {
    console.error(`Error fetching loan transactions for '${userId}':`, err);
    return []; // Return an empty array of the specific type
  }
}

// Added function to calculate net loan balance (focusing only on outstanding debt)
// Use the specific interface for the transactions parameter
function calculateNetLoanBalance(
  userId: string,
  transactions: ManaPaymentTransaction[],
): number {
  const loanBalancesPerUser: { [otherUserId: string]: number } = {};

  console.log(`Calculating net loan balance for user ID: ${userId}`);
  console.log(`Processing ${transactions.length} loan transactions.`);

  for (const txn of transactions) {
    // The check for txn.category and fromType/toType is still good runtime validation
    if (txn.category === "MANA_PAYMENT" && txn.fromType === "USER" && txn.toType === "USER") {
      console.log("--- Processing User-to-User MANA_PAYMENT Transaction ---");
      console.log("Transaction ID:", txn.id);
      console.log("Amount:", txn.amount);
      console.log("From ID:", txn.fromId);
      console.log("To ID:", txn.toId);
      console.log("Created Time:", new Date(txn.createdTime).toISOString());
      console.log("Description:", txn.description);

      if (txn.toId === userId) {
        // User received mana - potential loan from txn.fromId
        const lenderId = txn.fromId;
        // Decrease the balance with the lender
        loanBalancesPerUser[lenderId] = (loanBalancesPerUser[lenderId] || 0) - txn.amount;
        console.log(`User received ${txn.amount} from ${lenderId}. Net balance with ${lenderId}: ${loanBalancesPerUser[lenderId]}`);
      } else if (txn.fromId === userId) {
        // User sent mana - potential repayment to txn.toId
        const recipientId = txn.toId;
        // Increase the balance with the recipient (who was the original lender)
        loanBalancesPerUser[recipientId] = (loanBalancesPerUser[recipientId] || 0) + txn.amount;
        console.log(`User sent ${txn.amount} to ${recipientId}. Net balance with ${recipientId}: ${loanBalancesPerUser[recipientId]}`);
      }
      console.log("Current loanBalancesPerUser:", loanBalancesPerUser);
    } else {
       // This case should theoretically not be hit if fetchLoanTransactions only
       // returns ManaPaymentTransaction, but it's good for robustness.
      console.log(
        `Skipping transaction ${txn.id} with category ${txn.category} (not a user-to-user MANA_PAYMENT)`,
      );
    }
  }

  console.log("Final individual loan balances per user:", loanBalancesPerUser);

  // Calculate the loan impact - sum up only the negative balances
  let loanImpact = 0;
  for (const otherUserId in loanBalancesPerUser) {
       if (loanBalancesPerUser[otherUserId] < 0) {
           loanImpact += loanBalancesPerUser[otherUserId]; // Adds the negative amount
       }
   }

   console.log("Calculated Loan Impact (sum of negative balances):", loanImpact);

  return loanImpact;
}

// Compute MMR score including transactions and loan modifier
function computeMMR(
  balance: number,
  totalMana: number,
  ageDays: number,
  rank: number,
  transactionCount: number,
  netLoanBalance: number, // Now specifically for outstanding debt impact
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

  // Incorporate the loan impact (based on outstanding debt)
  // You can apply a weight to how strongly the outstanding debt affects the MMR.
  const outstandingLoanImpactWeight = .25; // Adjust this weight as needed
  const loanMMR = netLoanBalance * outstandingLoanImpactWeight; // netLoanBalance is already negative or zero


  // The Credit Score Equation
  return ((balance * 0.15) + (ageDays * 0.1) + (totalMana * 0.5)) + rankMMR +
    transactionMMR + loanMMR; // Added loanMMR (now based on outstanding debt)
}

function mapToCreditScore(clampedMMRBalance: number): number {
  let score: number;

  if (clampedMMRBalance <= -100000) {
    score = 0;
  } else if (clampedMMRBalance <= 0) {
    score = (clampedMMRBalance + 100000) * (50 / 100000);
  } else if (clampedMMRBalance <= 5000) {
    score = 50 + (clampedMMRBalance / 5000) * (300 - 50);
  } else if (clampedMMRBalance <= 10000) {
    score = 300 + ((clampedMMRBalance - 5000) / 5000) * (600 - 300);
  } else if (clampedMMRBalance <= 100000) {
    score = 600 + ((clampedMMRBalance - 10000) / 90000) * (800 - 600);
  } else if (clampedMMRBalance <= 1000000) {
    score = 800 + ((clampedMMRBalance - 100000) / 900000) * (900 - 800);
  } else if (clampedMMRBalance <= 5000000) {
    score = 900 + ((clampedMMRBalance - 1000000) / 4000000) * (1000 - 900);
  } else {
    score = 1000;
  }

  return Math.max(0, Math.min(1000, Math.round(score)));
}

function calculateRiskMultiplier(score: number): number {
  const clampedScore = Math.max(0, Math.min(score, 1000));
  const minMultiplier = 0.05;
  const maxMultiplier = 2;
  const a = maxMultiplier - minMultiplier;
  const b = Math.log(a / 0.01) / 1000;
  const multiplier = a * Math.exp(-b * clampedScore) + minMultiplier;
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

    // Fetch user portfolio data
    const portfolioRes = await fetch(
      `https://api.manifold.markets/v0/get-user-portfolio?userId=${userData.id}`,
    );
    if (!portfolioRes.ok) {
      throw new Error(`Failed to fetch user portfolio: ${portfolioRes.statusText}`);
    }
    // Define a specific interface for the portfolio data
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
    const userPortfolio: UserPortfolio = await portfolioRes.json();

    // Calculate profit using the new formula
    const calculatedProfit = userPortfolio.investmentValue + userPortfolio.balance - userPortfolio.totalDeposits;

    const { latestRank } = await fetchManaAndRecentRank(userData.id);
    const transactionCount = await fetchTransactionCount(username);

    const loanTransactions = await fetchLoanTransactions(userData.id);
    const outstandingDebtImpact = calculateNetLoanBalance(
      userData.id,
      loanTransactions,
    );

    let mmr = computeMMR(
      calculatedProfit, // Use the calculated profit here
      0, // totalManaEarned is no longer used for this calculation
      ageDays,
      latestRank ?? 100,
      transactionCount,
      outstandingDebtImpact,
    );

    // *** START: Add this block to manually deduct from evan's score ***
    if (username.toLowerCase() === "evan") {
      const deductionAmount = 255000; // Adjust this value as needed
      mmr -= deductionAmount;
      console.log(
        `Manual deduction of ${deductionAmount} applied to evan's MMR.`,
      );
    }
    // *** END: Add this block ***

    const clampedMMR = Math.max(Math.min(mmr, 1000000), -1000000);
    // The clamping for the credit score calculation should still include the balance
    // as the mapping function `mapToCreditScore` uses `clampedMMRBalance`.
    const clampedMMRBalance = clampedMMR + userPortfolio.balance;
    const creditScore = mapToCreditScore(clampedMMRBalance);
    const risk = calculateRiskMultiplier(creditScore);

    const output = {
      username,
      creditScore,
      riskMultiplier: risk,
      avatarUrl: userData.avatarUrl || null,
      userExists: fetchSuccess,
      latestRank,
      outstandingDebtImpact: outstandingDebtImpact,
      // Include the new profit calculation in the output
      calculatedProfit: calculatedProfit,
    };
    console.log(`Stats for user: ${username}`);
    console.log(`  MMR: ${mmr}`);
    console.log(`  Clamped MMR: ${clampedMMR}`);
    console.log(`  Clamped MMR + Balance: ${clampedMMRBalance}`);
    console.log(`  Calculated Profit: ${calculatedProfit}`); // Log the new profit
    console.log(`  Balance: ${userPortfolio.balance}`); // Log the balance from the portfolio
    console.log(`  Investment Value: ${userPortfolio.investmentValue}`); // Log investment value
    console.log(`  Total Deposits: ${userPortfolio.totalDeposits}`); // Log total deposits
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

