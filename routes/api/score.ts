// Fetch raw user data
async function fetchUserData(username: string) {
    const res = await fetch(`https://api.manifold.markets/v0/user/${username}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch ${username}: ${res.statusText}`);
    }
    const userData = await res.json();
  
    // Fetch league standings for the user
    const leagueRes = await fetch(`https://api.manifold.markets/v0/leagues?userId=${userData.id}`);
    if (!leagueRes.ok) {
      console.error(`Failed to fetch leagues for ${username}: ${leagueRes.statusText}`);
    } else {
      const leaguesData = await leagueRes.json();
      console.log("Leagues Data:", leaguesData); // Log the leagues data
  
      // Calculate the total manaEarned from all seasons
      const totalManaEarned = leaguesData.reduce((total: number, season: any) => total + season.manaEarned, 0);
  
      // Log the total mana earned
      console.log("Total Mana Earned from all seasons:", totalManaEarned);
    }
  
    return userData;
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
  
  function computeCreditScore(user: any, lbIndex: number): number {
    const balance = user.balance ?? 0;
    const allTimeProfit = (user.rawProfitAll ?? 0) + balance - (user.totalDeposits ?? 0);
  
    // Log the individual components for debugging
    console.log("rawProfitAll:", user.rawProfitAll);
    console.log("balance:", balance);
    console.log("totalDeposits:", user.totalDeposits);
  
    console.log("All-Time Profit:", allTimeProfit);
    const ageDays = (Date.now() - (user.createdTime ?? Date.now())) / 86_400_000;
  
    const balMag = signedMagnitude(balance);
    const profMag = signedMagnitude(allTimeProfit);
    const ageMag = signedMagnitude(ageDays);
  
    const lbBonus = leaderboardBonus(lbIndex);
  
    // Debug log for diagnosing spiderduckpig or others
    console.log(`[DEBUG] Computation for ${user.username || "unknown user"}:`);
    console.log(`  Balance = ${balance} (mag=${balMag.toFixed(2)})`);
    console.log(`  All-Time Profit = ${allTimeProfit} (mag=${profMag.toFixed(2)})`);
    console.log(`  Age (days) = ${ageDays.toFixed(2)} (mag=${ageMag.toFixed(2)})`);
    console.log(`  Leaderboard Bonus = ${lbBonus.toFixed(4)}`);
  
    const raw = balMag * 0.3 + profMag * 0.4 + ageMag * 0.3 + lbBonus;
    const rawScore = raw * 1000;
    const normalizedScore = Math.min(Math.max((rawScore + 1000) / 2, 0), 1000);
  
    if (lbIndex >= 0 && lbIndex < 100) {
      if (lbIndex < 10) {
        return 1000;
      } else {
        const scaled = 999 - ((lbIndex - 10) * (29 / 89));
        return Math.round(scaled);
      }
    }
  
    return Math.round(normalizedScore);
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
  
      const idx = leaderboard.findIndex((e) => e.userId === user.id);
      const score = computeCreditScore(user, idx);
      const risk = +calculateRiskMultiplier(score).toFixed(3);
  
      const output = {
        username,
        creditScore: score,
        riskMultiplier: risk,
        avatarUrl: user.avatarUrl || null,
      };
  
      return new Response(JSON.stringify(output, null, 2), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("Failed to fetch")) {
        // Do not spam console for expected "not found" cases
        return new Response(JSON.stringify({ error: "❌ No result" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
  
      console.error("Unexpected error:", err);
      return new Response(JSON.stringify({ error: "❌ Server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
  