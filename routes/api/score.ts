// /api/score.ts

// Fetch raw user data
async function fetchUserData(username: string) {
  const res = await fetch(`https://api.manifold.markets/v0/user/${username}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${username}: ${res.statusText}`);
  }
  return await res.json();
}

// Fetch top-100 profit leaderboard
async function fetchLeaderboard() {
  const res = await fetch(
    `https://api.manifold.markets/v0/leaderboard?kind=profit&limit=100`,
  );
  if (!res.ok) throw new Error(`Leaderboard fetch failed: ${res.statusText}`);
  return (await res.json()) as { userId: string; score: number }[];
}

// Signed log-10 magnitude
function signedMagnitude(x: number): number {
  if (x > 0) return Math.log10(x);
  if (x < 0) return -Math.log10(Math.abs(x));
  return 0;
}

// Simple leaderboard bonus
function leaderboardBonus(idx: number): number {
  const MAX = 100, MULT = 0.1;
  return idx >= 0 && idx < MAX ? (1 - idx / MAX) * MULT : 0;
}

// Compute credit score
function computeCreditScore(user: any, lbIndex: number): number {
  const balance = user.balance ?? 0;
  const recentProfit = user.profitCached?.monthly ??
    user.profitCached?.weekly ??
    user.profitCached?.allTime ??
    user.resolvedProfitAdjustment ??
    0;
  const ageDays = (Date.now() - (user.createdTime ?? Date.now())) / 86_400_000;

  const balMag = signedMagnitude(balance);
  const profMag = signedMagnitude(recentProfit);
  const ageMag = signedMagnitude(ageDays);

  const raw = balMag * 0.3 +
    profMag * 0.4 +
    ageMag * 0.3 +
    leaderboardBonus(lbIndex);

  const normalized = Math.min(raw / 5, 1);
  return Math.round(normalized * 1000);
}

// Map credit score → risk multiplier
function calculateRiskMultiplier(score: number): number {
  if (score <= 600) {
    return 1.1 - (score / 600) * 0.3;
  } else if (score <= 800) {
    return 0.8 - ((score - 600) / 200) * 0.6;
  } else {
    return 0.2 - ((score - 800) / 200) * 0.15;
  }
}

// HTTP server for /api/score endpoint
export async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const username = url.searchParams.get("username");

  if (!username) {
    return new Response(
      JSON.stringify({ error: "Missing username parameter" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    const leaderboard = await fetchLeaderboard();
    const user = await fetchUserData(username);
    console.log("Fetched user:", user); // <-- add this

    const idx = leaderboard.findIndex((e) => e.userId === user.id);
    const score = computeCreditScore(user, idx);
    const risk = +calculateRiskMultiplier(score).toFixed(3);

    const output = {
      username,
      creditScore: score,
      riskMultiplier: risk,
    };

    return new Response(JSON.stringify(output, null, 2), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "❌ No result" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
