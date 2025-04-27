// Fetch raw user data
async function fetchUserData(username: string) {
  let fetchSuccess = false;
  let userData = null;

  try {
    const res = await fetch(`https://api.manifold.markets/v0/user/${username}`);

    if (res.status === 404) {
      console.error(`User '${username}' not found (404).`);
      fetchSuccess = false;
      console.log(`fetchSuccess for '${username}':`, fetchSuccess); // 👈 move it here if needed
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

  // Log the entire leaguesData to inspect the structure
  // console.log('Leagues data:', leaguesData);

  let total = 0;
  let latestRank: number | null = null;

  // Calculate total mana earned
  for (const season of leaguesData) {
    total += season.manaEarned;
  }

  // Find the most recent season and log the rank
  if (leaguesData.length > 0) {
    const mostRecent = leaguesData.reduce((
      a: { season?: number; rankSnapshot?: number },
      b: { season?: number; rankSnapshot?: number },
    ) => (a.season ?? 0) > (b.season ?? 0) ? a : b);
    latestRank = mostRecent.rankSnapshot ?? null;
    console.log(
      `Most recent season: ${mostRecent.season}, Rank: ${latestRank}`,
    );
  }

  return { total, latestRank };
}

// Compute MMR score based on Balance (40%), Age (20%), Total Mana Earned (40%)
function computeMMR(
  balance: number,
  totalMana: number,
  ageDays: number,
  rank: number, // Add rank as a parameter
  maxRank: number = 100, // Maximum rank, for example, 100
): number {
  // Reverse the formula to make rank 1 = 100% and rank 100 = 0%
  const rankWeight = Math.max(0, Math.min(1, 1 - (rank - 1) / (maxRank - 1)));
  console.log(`Rank: ${rank}, Rank Weight: ${rankWeight}`);
  return ((balance * 0.4) + (ageDays * 0.1) + (totalMana * 0.3)) +
    (rankWeight * 10000);
}

// Piecewise linear mapping function for Credit Score
function mapToCreditScore(clampedMMRBalance: number): number {
  let score: number;

  if (clampedMMRBalance <= 0) {
    score = (clampedMMRBalance + 1000000) * (50 / 1000000);
  } else if (clampedMMRBalance <= 5000) {
    score = 50 + (clampedMMRBalance / 5000) * (300 - 50);
  } else if (clampedMMRBalance <= 10000) {
    score = 300 + ((clampedMMRBalance - 5000) / (10000 - 5000)) * (600 - 300);
  } else if (clampedMMRBalance <= 100000) {
    score = 600 +
      ((clampedMMRBalance - 10000) / (100000 - 10000)) * (800 - 600);
  } else if (clampedMMRBalance <= 1000000) {
    score = 800 +
      ((clampedMMRBalance - 100000) / (1000000 - 100000)) * (1000 - 800);
  } else {
    score = 1000;
  }

  score = Math.round(score); // <- Round to nearest integer

  return Math.max(0, Math.min(1000, score));
}

function calculateRiskMultiplier(score: number): number {
  const clampedScore = Math.max(0, Math.min(score, 1000));
  const minMultiplier = 0.05;
  const maxMultiplier = 2;

  const a = maxMultiplier - minMultiplier;
  const b = Math.log(a / 0.01) / 1000; // Tweak 0.01 to control how fast it decays

  const multiplier = a * Math.exp(-b * clampedScore) + minMultiplier;

  return Math.round(multiplier * 100) / 100;
}

//  const PROMOCODES: Record<string, number> = {
//    tumble: 0.5, // 50% off
//    earlyrisker: 0.7, // 30% off
//  };

// HTTP server for /api/score endpoint
// HTTP server for /api/score endpoint
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
    const mmr = computeMMR(
      balance,
      totalManaEarned,
      ageDays,
      latestRank ?? 100,
    ); // Use latestRank or default to 100 if it's null
    const clampedMMR = Math.max(Math.min(mmr, 1000000), -1000000);
    const clampedMMRBalance = clampedMMR + balance;
    const creditScore = mapToCreditScore(clampedMMRBalance);

    // Calculate risk multiplier
    const risk = calculateRiskMultiplier(creditScore);

    console.log(`Stats for user: ${username}`);
    console.log(`  MMR: ${mmr}`);
    console.log(`  Clamped MMR: ${clampedMMR}`);
    console.log(`  Clamped MMR + Balance: ${clampedMMRBalance}`);
    console.log(`  Total Mana Earned: ${totalManaEarned}`);
    console.log(`  Balance: ${balance}`);
    console.log(`  Age (days): ${ageDays}`);
    console.log(`  Credit Score: ${creditScore}`);
    console.log(`  fetchSuccess: ${fetchSuccess}`);
    console.log(`  Risk Multiplier: ${risk}`);
    console.log("---");

    // Return response with the relevant data
    const output = {
      username,
      creditScore,
      riskMultiplier: risk,
      avatarUrl: userData.avatarUrl || null,
      userExists: fetchSuccess, // This tells whether the user was found or not
      latestRank,
    };

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
