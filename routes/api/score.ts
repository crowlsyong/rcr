// Fetch raw user data
async function fetchUserData(username: string) {
  const res = await fetch(`https://api.manifold.markets/v0/user/${username}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${username}: ${res.statusText}`);
  }
  const userData = await res.json();
  return userData;
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
    (total: number, season: any) => total + season.manaEarned,
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
    multiplier = 1.2 - (score / 600) * 0.6; // 1.2 → 0.6 as score goes 0→600
  } else if (score <= 700) {
    multiplier = 0.6 - ((score - 600) / 100) * 0.2; // 0.6 → 0.4 as score goes 600→700
  } else if (score <= 800) {
    multiplier = 0.4 - ((score - 700) / 100) * 0.2; // 0.4 → 0.2 as score goes 700→800
  } else {
    multiplier = 0.2 - ((score - 800) / 200) * 0.15; // 0.2 → 0.05 as score goes 800→1000
  }

  return Math.round(multiplier * 100) / 100;
}


let lastErrorTime = 0;

// HTTP server for /api/score endpoint
export async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const username = url.searchParams.get("username");

  if (!username || username.length < 3) {
    return new Response("Username missing or too short", { status: 400 });
  }

  try {
    const user = await fetchUserData(username);
    const balance = user.balance ?? 0;
    const createdTime = user.createdTime ?? Date.now();
    const ageDays = (Date.now() - createdTime) / 86_400_000;
    const totalManaEarned = await fetchTotalManaEarned(user.id);

    const mmr = computeMMR(balance, totalManaEarned, ageDays);
    const clampedMMR = Math.max(Math.min(mmr, 1000000), -1000000);
    const clampedMMRBalance = clampedMMR + balance;
    const creditScore = mapToCreditScore(clampedMMRBalance);

    // Calculate risk multiplier
    const risk = calculateRiskMultiplier(creditScore);

    // Log the results
    console.log(`Stats for user: ${username}`);
    console.log(`  MMR: ${mmr}`);
    console.log(`  Clamped MMR: ${clampedMMR}`);
    console.log(`  Clamped MMR + Balance: ${clampedMMRBalance}`);
    console.log(`  Total Mana Earned: ${totalManaEarned}`);
    console.log(`  Balance: ${balance}`);
    console.log(`  Age (days): ${ageDays}`);
    console.log(`  Credit Score: ${creditScore}`);
    console.log("---");

    const output = {
      username,
      creditScore,
      riskMultiplier: risk,
      avatarUrl: user.avatarUrl || null,
    };

    return new Response(JSON.stringify(output), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const now = Date.now();
    if (now - lastErrorTime > 500) {
      console.error(`Error fetching user data:`, error);
      lastErrorTime = now;
    }
    return new Response(`Error fetching data for ${username}`, { status: 500 });
  }
}