// routes/api/v0/slots/slots-api.ts
import { Handlers } from "$fresh/server.ts";

const API_BASE = "https://api.manifold.markets";

type DisplayUser = {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
};

type MeResponse = {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
};

type ManagramResponse = {
  id: string;
  amount: number;
  fromId: string;
  toId: string;
  createdTime: number;
  message?: string;
};

const streaks = new Map<string, number>();
let cachedRiskbot: DisplayUser | null = null;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function pick<T>(arr: readonly T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeOutcomeForUser(userId: string, bet: number, icons: readonly string[]) {
  const streak = streaks.get(userId) ?? 0;

  const TWOFER_CHANCE = 0.20;
  const THREEFER_CHANCE = 0.05;

  const TWOFER_MULT = 0.6;
  const THREEFER_MULT = 15;

  let winType: "twofer" | "threefer" | "loss" = "loss";

  if (streak >= 5) {
    winType = "twofer";
  } else {
    const roll = Math.random();
    if (roll < THREEFER_CHANCE) winType = "threefer";
    else if (roll < THREEFER_CHANCE + TWOFER_CHANCE) winType = "twofer";
    else winType = "loss";
  }

  if (winType === "loss") {
    streaks.set(userId, streak + 1);
    return {
      win: false,
      payout: 0,
      combo: [pick(icons), pick(icons), pick(icons)] as [string, string, string],
      reason: "loss",
      streak: streak + 1,
    };
  }

  streaks.set(userId, 0);

  if (winType === "twofer") {
    const a = pick(icons);
    const b = a;
    const c = pick(icons.filter((x) => x !== a));
    const payout = Math.max(10, Math.floor(bet * TWOFER_MULT));
    return {
      win: true,
      payout,
      combo: [a, b, c] as [string, string, string],
      reason: "twofer",
      streak: 0,
    };
  }

  const sym = Math.random() < 0.5 ? "7️⃣" : "🪙";
  const payout = Math.max(10, Math.floor(bet * THREEFER_MULT));
  return {
    win: true,
    payout,
    combo: [sym, sym, sym] as [string, string, string],
    reason: sym === "7️⃣" ? "777" : "coins",
    streak: 0,
  };
}

async function mfFetch<T>(
  path: string,
  init: RequestInit,
): Promise<{ ok: true; data: T } | { ok: false; status: number; text: string }> {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return { ok: false, status: res.status, text };
  }
  const data = (await res.json().catch(() => null)) as T | null;
  if (!data) return { ok: false, status: 502, text: "bad json" };
  return { ok: true, data };
}

async function getRiskbotUser(): Promise<DisplayUser> {
  if (cachedRiskbot) return cachedRiskbot;

  const username = Deno.env.get("RISKBOT_USERNAME")?.trim() || "RISKBOT";
  const r = await mfFetch<DisplayUser>(
    `/v0/user/${encodeURIComponent(username)}/lite`,
    { method: "GET" },
  );

  if (!r.ok) throw new Error(`riskbot lookup failed: ${r.status} ${r.text}`);
  cachedRiskbot = r.data;
  return r.data;
}

async function getMe(userApiKey: string): Promise<MeResponse> {
  const r = await mfFetch<MeResponse>("/v0/me", {
    method: "GET",
    headers: { Authorization: `Key ${userApiKey}` },
  });
  if (!r.ok) throw new Error(`me failed: ${r.status} ${r.text}`);
  return r.data;
}

async function sendManagram(
  fromApiKey: string,
  toId: string,
  amount: number,
  message?: string,
) {
  const r = await mfFetch<ManagramResponse>("/v0/managram", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Key ${fromApiKey}`,
    },
    body: JSON.stringify({
      toIds: [toId],
      amount,
      message,
    }),
  });
  if (!r.ok) throw new Error(`managram failed: ${r.status} ${r.text}`);
  return r.data;
}

export const handler: Handlers = {
  async POST(req) {
    try {
      const body = (await req.json().catch(() => null)) as
        | null
        | { bet?: number; apiKey?: string };

      const bet = Number(body?.bet);
      const apiKey = (body?.apiKey || "").trim();

      if (!Number.isFinite(bet) || bet < 10) {
        return json(400, { ok: false, error: "bad bet" });
      }
      if (!apiKey) {
        return json(400, { ok: false, error: "missing api key" });
      }

      const riskbotKey = Deno.env.get("RISKBOT_API_KEY")?.trim();
      if (!riskbotKey) {
        return json(500, { ok: false, error: "server missing RISKBOT_API_KEY" });
      }

      const icons = [
        "7️⃣",
        "🪙",
        "🍒",
        "🍋",
        "🔔",
        "⭐",
        "💎",
        "🧲",
        "🦝",
        "🧠",
      ] as const;

      const riskbot = await getRiskbotUser();
      const me = await getMe(apiKey);

      const betMsg = `slots bet ${bet}`;
      await sendManagram(apiKey, riskbot.id, bet, betMsg);

      const outcome = makeOutcomeForUser(me.id, bet, icons);

      let payoutSent = false;
      if (outcome.win && outcome.payout > 0) {
        const winMsg = `slots payout ${outcome.payout} (${outcome.reason})`;
        await sendManagram(riskbotKey, me.id, outcome.payout, winMsg);
        payoutSent = true;
      }

      return json(200, {
        ok: true,
        bet,
        user: { id: me.id, username: me.username, name: me.name },
        riskbot: { id: riskbot.id, username: riskbot.username, name: riskbot.name },
        outcome,
        payoutSent,
      });
    } catch (err) {
      console.error("slots-api POST error:", err);
      return json(500, { ok: false, error: "server error" });
    }
  },
};
