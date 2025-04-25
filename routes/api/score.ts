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

// Fetch total mana earned from all league seasons
async function fetchTotalManaEarned(userId: string): Promise<number> {
  const res = await fetch(
    `https://api.manifold.markets/v0/leagues?userId=${userId}`,
  );
  if (!res.ok) {
    console.error(`Failed to fetch leagues: ${res.statusText}`);
    return 0;
  }
  const leaguesData = await res.json();
  return leaguesData.reduce(
    (total: number, season: { manaEarned: number }) =>
      total + season.manaEarned,
    0,
  );
}

// Compute MMR score based on Balance (50%), Age (10%), Total Mana Earned (40%)
function computeMMR(
  balance: number,
  totalMana: number,
  ageDays: number,
): number {
  return (balance * 0.5) + (ageDays * 0.1) + (totalMana * 0.4);
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
  let multiplier: number;

  if (score <= 600) {
    multiplier = 0.5 - (score / 600) * 0.15; // 0.5 → 0.35
  } else if (score <= 700) {
    multiplier = 0.35 - ((score - 600) / 100) * 0.17; // 0.35 → 0.18
  } else if (score <= 800) {
    multiplier = 0.18 - ((score - 700) / 100) * 0.09; // 0.18 → 0.09
  } else {
    multiplier = 0.09 - ((score - 800) / 200) * 0.05; // 0.09 → 0.04
  }

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

  if (!username || username.length < 3) {
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
    const totalManaEarned = await fetchTotalManaEarned(userData.id);
    const mmr = computeMMR(balance, totalManaEarned, ageDays);
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
    console.log("---");

    // Return response with the relevant data
    const output = {
      username,
      creditScore,
      riskMultiplier: risk,
      avatarUrl: userData.avatarUrl || null,
      userExists: fetchSuccess, // This tells whether the user was found or not
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
