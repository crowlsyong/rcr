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

function hasAdjacentPair(combo: readonly string[]) {
  return combo[0] === combo[1] || combo[1] === combo[2];
}

function isTriple(combo: readonly string[]) {
  return combo[0] === combo[1] && combo[1] === combo[2];
}

function makeLossCombo(icons: readonly string[]) {
  for (let i = 0; i < 50; i++) {
    const c = [pick(icons), pick(icons), pick(icons)] as [
      string,
      string,
      string,
    ];
    if (!hasAdjacentPair(c) && !isTriple(c)) return c;
  }
  const a = pick(icons);
  const b = pick(icons.filter((x) => x !== a));
  const c = pick(icons.filter((x) => x !== a && x !== b));
  return [a, b, c] as [string, string, string];
}

function makeTwoferCombo(icons: readonly string[]) {
  const a = pick(icons);
  const other = pick(icons.filter((x) => x !== a));
  if (Math.random() < 0.5) return [a, a, other] as [string, string, string];
  return [other, a, a] as [string, string, string];
}

function makeOutcomeForUser(
  userId: string,
  bet: number,
  icons: readonly string[],
) {
  const streak = streaks.get(userId) ?? 0;

  const JACKPOT_777_CHANCE = 1 / 10000;
  const TWOFER_CHANCE = 0.22;
  const THREEFER_CHANCE = 0.018;

  const TWOFER_MULT = 0.6;
  const THREEFER_MULT = 15;

  const roll = Math.random();

  // routes/api/v0/slots/slots-api.ts
  if (roll < JACKPOT_777_CHANCE) {
    streaks.set(userId, 0);
    return {
      win: true,
      payout: 5000,
      combo: ["slot-7", "slot-7", "slot-7"] as [string, string, string],
      reason: "777-jackpot",
      streak: 0,
    };
  }

  let winType: "twofer" | "threefer" | "loss" = "loss";

  if (streak >= 5) {
    winType = "twofer";
  } else {
    const r = Math.random();
    if (r < THREEFER_CHANCE) winType = "threefer";
    else if (r < THREEFER_CHANCE + TWOFER_CHANCE) winType = "twofer";
    else winType = "loss";
  }

  if (winType === "loss") {
    streaks.set(userId, streak + 1);
    return {
      win: false,
      payout: 0,
      combo: makeLossCombo(icons),
      reason: "loss",
      streak: streak + 1,
    };
  }

  streaks.set(userId, 0);

  if (winType === "twofer") {
    const combo = makeTwoferCombo(icons);
    const payout = Math.max(10, Math.floor(bet * TWOFER_MULT));
    return {
      win: true,
      payout,
      combo,
      reason: "twofer",
      streak: 0,
    };
  }

  const sym = Math.random() < 0.5 ? "🪙" : "⭐";
  const payout = Math.max(10, Math.floor(bet * THREEFER_MULT));
  return {
    win: true,
    payout,
    combo: [sym, sym, sym] as [string, string, string],
    reason: sym === "🪙" ? "coins" : "stars",
    streak: 0,
  };
}

async function mfFetch<T>(
  path: string,
  init: RequestInit,
): Promise<
  { ok: true; data: T } | { ok: false; status: number; text: string }
> {
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
  message: string,
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
        return json(500, {
          ok: false,
          error: "server missing RISKBOT_API_KEY",
        });
      }

      // routes/api/v0/slots/slots-api.ts
      const icons = [
        "slot-1",
        "slot-2",
        "slot-3",
        "slot-4",
        "slot-5",
        "slot-6",
        "slot-7",
        "slot-8",
        "slot-9",
        "slot-10",
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

      return json(200, { ok: true, outcome, payoutSent });
    } catch (err) {
      console.error("slots-api error:", err);
      return json(500, { ok: false, error: "server error" });
    }
  },
};
