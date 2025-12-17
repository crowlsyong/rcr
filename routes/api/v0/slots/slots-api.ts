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

let cachedRiskbot: DisplayUser | null = null;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function pickIndex(n: number) {
  return Math.floor(Math.random() * n);
}

function pick<T>(arr: readonly T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
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

function buildReel(counts: readonly number[]) {
  const out: string[] = [];
  for (let i = 0; i < counts.length; i++) {
    for (let k = 0; k < counts[i]; k++) out.push(`icon-${i + 1}`);
  }
  return out;
}

const REEL0 = buildReel([1, 2, 3, 4, 5]);
const REEL1 = buildReel([1, 2, 2, 4, 6]);
const REEL2 = buildReel([1, 1, 3, 4, 6]);

const JACKPOT_MULT = [3000, 800, 150, 40, 15];
const PAIR_MULT = [100, 40, 20, 6, 4];

function idxFromIcon(sym: string) {
  const n = Number(sym.split("-")[1]);
  if (!Number.isFinite(n) || n < 1 || n > 5) return 0;
  return n - 1;
}

function multFor(icon: number, table: number[]) {
  const i = Math.max(0, Math.min(4, icon - 1));
  return table[i];
}

function computePayout(bet: number, a: number, b: number, c: number) {
  if (a === b && b === c) {
    const mult = multFor(a, JACKPOT_MULT);
    return { win: true, payout: Math.floor(bet * mult), reason: `jackpot-icon-${a}` };
  }

  if (a === b) {
    const mult = multFor(a, PAIR_MULT);
    return { win: true, payout: Math.floor(bet * mult), reason: `pair-left-icon-${a}` };
  }

  if (b === c) {
    const mult = multFor(b, PAIR_MULT);
    return { win: true, payout: Math.floor(bet * mult), reason: `pair-right-icon-${b}` };
  }

  return { win: false, payout: 0, reason: "loss" };
}

function stopRangesForIcon(reel: 1 | 2 | 3, icon: number): [number, number] {
  const i = Math.max(1, Math.min(5, icon));

  if (reel === 1) {
    if (i === 1) return [0, 0];
    if (i === 2) return [1, 2];
    if (i === 3) return [3, 5];
    if (i === 4) return [6, 9];
    return [10, 14];
  }

  if (reel === 2) {
    if (i === 1) return [0, 0];
    if (i === 2) return [1, 2];
    if (i === 3) return [3, 4];
    if (i === 4) return [5, 8];
    return [9, 14];
  }

  if (i === 1) return [0, 0];
  if (i === 2) return [1, 1];
  if (i === 3) return [2, 4];
  if (i === 4) return [5, 8];
  return [9, 14];
}

function randomStopForIcon(reel: 1 | 2 | 3, icon: number) {
  const [a, b] = stopRangesForIcon(reel, icon);
  return a + pickIndex(b - a + 1);
}

const FORCED_SCALE = 0.2;

const FORCED_ICON_POOL: number[] = [
  1, 1, 1,
  2, 2, 2, 2, 2,
  3, 3, 3, 3, 3, 3, 3, 3,
  4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
  5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
];

function pickForcedIcon() {
  return pick(FORCED_ICON_POOL);
}

function pickDifferentIcon(except: number) {
  const opts = [1, 2, 3, 4, 5].filter((x) => x !== except);
  return pick(opts);
}

type Outcome = {
  win: boolean;
  payout: number;
  reason: string;
  combo: [string, string, string];
  icons: [number, number, number];
  stops: [number, number, number];
  forced: boolean;
};

function randomOutcome(bet: number): Outcome {
  const combo = [pick(REEL0), pick(REEL1), pick(REEL2)] as [string, string, string];
  const [aS, bS, cS] = combo;

  const a = idxFromIcon(aS) + 1;
  const b = idxFromIcon(bS) + 1;
  const c = idxFromIcon(cS) + 1;

  const stops: [number, number, number] = [
    randomStopForIcon(1, a),
    randomStopForIcon(2, b),
    randomStopForIcon(3, c),
  ];

  const p = computePayout(bet, a, b, c);

  return {
    win: p.win,
    payout: p.payout,
    reason: p.reason,
    combo,
    icons: [a, b, c],
    stops,
    forced: false,
  };
}

function forcedWinOutcome(bet: number): Outcome {
  const icon = pickForcedIcon();

  const makeLeftPair = Math.random() < 0.5;
  const other = pickDifferentIcon(icon);

  const icons: [number, number, number] = makeLeftPair
    ? [icon, icon, other]
    : [other, icon, icon];

  const combo: [string, string, string] = [
    `icon-${icons[0]}`,
    `icon-${icons[1]}`,
    `icon-${icons[2]}`,
  ];

  const stops: [number, number, number] = [
    randomStopForIcon(1, icons[0]),
    randomStopForIcon(2, icons[1]),
    randomStopForIcon(3, icons[2]),
  ];

  const mult = multFor(icon, PAIR_MULT);
  const payout = Math.max(0, Math.floor(bet * mult * FORCED_SCALE));

  return {
    win: payout > 0,
    payout,
    reason: makeLeftPair ? `forced-pair-left-icon-${icon}` : `forced-pair-right-icon-${icon}`,
    combo,
    icons,
    stops,
    forced: true,
  };
}

const streakByUserId = new Map<string, number>();

function getLossStreak(userId: string) {
  return streakByUserId.get(userId) ?? 0;
}

function setLossStreak(userId: string, n: number) {
  streakByUserId.set(userId, n);
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

      const riskbot = await getRiskbotUser();
      const me = await getMe(apiKey);

      const betMsg = `slots bet ${bet}`;
      await sendManagram(apiKey, riskbot.id, bet, betMsg);

      const priorLossStreak = getLossStreak(me.id);

      let outcome: Outcome;
      if (priorLossStreak >= 3) {
        outcome = forcedWinOutcome(bet);
        setLossStreak(me.id, 0);
      } else {
        outcome = randomOutcome(bet);
        if (outcome.win) setLossStreak(me.id, 0);
        else setLossStreak(me.id, priorLossStreak + 1);
      }

      let payoutSent = false;
      if (outcome.win && outcome.payout > 0) {
        const winMsg = `slots payout ${outcome.payout} (${outcome.reason})`;
        await sendManagram(riskbotKey, me.id, outcome.payout, winMsg);
        payoutSent = true;
      }

      return json(200, {
        ok: true,
        outcome: {
          win: outcome.win,
          payout: outcome.payout,
          reason: outcome.reason,
          combo: outcome.combo,
          icons: outcome.icons,
          stops: outcome.stops,
          forced: outcome.forced,
          priorLossStreak,
        },
        payoutSent,
      });
    } catch (err) {
      console.error("slots-api error:", err);
      return json(500, { ok: false, error: "server error" });
    }
  },
};
