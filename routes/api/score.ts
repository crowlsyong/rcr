// routes/api/score.ts

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

// Compute MMR score including transactions modifier
function computeMMR(
  balance: number,
  totalMana: number,
  ageDays: number,
  rank: number,
  transactionCount: number,
  maxRank: number = 100,
): number {
  const rankWeight = Math.max(0, Math.min(1, 1 - (rank - 1) / (maxRank - 1)));
  const rankMMR = rankWeight * 1000;

  let transactionMMR = 0;

  if (transactionCount < 5) {
    transactionMMR = -1000000;
  } else if (transactionCount <= 20) {
    // From -100,000 to -10,000 linearly over 15 txns (5 to 20)
    const t = (transactionCount - 5) / 15;
    transactionMMR = -100000 + t * 90000;
  } else if (transactionCount <= 100) {
    // From -10,000 to 0 linearly over 80 txns (20 to 100)
    const t = (transactionCount - 20) / 80;
    transactionMMR = -10000 + t * 10000;
  } else if (transactionCount <= 1000) {
    // From 0 to 1000 linearly over 900 txns (100 to 1000)
    const t = (transactionCount - 100) / 900;
    transactionMMR = t * 1000;
  } else {
    transactionMMR = 1000;
  }

  // The Credit Score Equation
  return ((balance * 0.15) + (ageDays * 0.1) + (totalMana * 0.5)) + rankMMR +
    transactionMMR;
}

function mapToCreditScore(clampedMMRBalance: number): number {
  let score: number;

  if (clampedMMRBalance <= -100000) {
    // Anything below -100,000 gets the minimum score
    score = 0;
  } else if (clampedMMRBalance <= 0) {
    // Map -100,000 → 0 to score 0 → 50
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
    const balance = userData.balance ?? 0;
    const createdTime = userData.createdTime ?? Date.now();
    const ageDays = (Date.now() - createdTime) / 86_400_000;
    const { total: totalManaEarned, latestRank } = await fetchManaAndRecentRank(
      userData.id,
    );
    const transactionCount = await fetchTransactionCount(username);
    const transactionMMR =
      Math.max(0, Math.min(1, 1 - (transactionCount - 1) / (1000 - 1))) * 10000;

    // Change const to let here
    let mmr = computeMMR(
      balance,
      totalManaEarned,
      ageDays,
      latestRank ?? 100,
      transactionCount,
    );

    // *** START: Add this block to manually deduct from evan's score ***
    if (username.toLowerCase() === "evan") {
      const deductionAmount = 100000; // Adjust this value as needed
      mmr -= deductionAmount;
      console.log(
        `Manual deduction of ${deductionAmount} applied to evan's MMR.`,
      );
    }
    // *** END: Add this block ***

    const clampedMMR = Math.max(Math.min(mmr, 1000000), -1000000);
    const clampedMMRBalance = clampedMMR + balance;
    const creditScore = mapToCreditScore(clampedMMRBalance);
    const risk = calculateRiskMultiplier(creditScore);

    const output = {
      username,
      creditScore,
      riskMultiplier: risk,
      avatarUrl: userData.avatarUrl || null,
      userExists: fetchSuccess,
      latestRank,
    };
    console.log(`Stats for user: ${username}`);
    console.log(`  MMR: ${mmr}`);
    console.log(`  Clamped MMR: ${clampedMMR}`);
    console.log(`  Clamped MMR + Balance: ${clampedMMRBalance}`);
    console.log(`  Total Mana Earned: ${totalManaEarned}`);
    console.log(`  Balance: ${balance}`);
    console.log(`  Age (days): ${ageDays}`);
    console.log(`  Credit Score: ${creditScore}`);
    console.log(`  Risk Multiplier: ${risk}`);
    console.log(`  Transaction Count: ${transactionCount}`);
    console.log(`  Transaction MMR: ${transactionMMR}`);
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
