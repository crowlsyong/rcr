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

const REEL0_COUNTS = [1, 2, 3, 4, 5] as const;
const REEL1_COUNTS = [1, 2, 2, 4, 6] as const;
const REEL2_COUNTS = [1, 1, 3, 4, 6] as const;

const REEL0 = buildReel(REEL0_COUNTS);
const REEL1 = buildReel(REEL1_COUNTS);
const REEL2 = buildReel(REEL2_COUNTS);

function stopRangesFromCounts(counts: readonly number[]) {
  const ranges: [number, number][] = [];
  let start = 0;
  for (let i = 0; i < counts.length; i++) {
    const end = start + counts[i] - 1;
    ranges.push([start, end]);
    start = end + 1;
  }
  return ranges;
}

function sumCounts(c: readonly number[]) {
  let s = 0;
  for (let i = 0; i < c.length; i++) s += c[i];
  return s;
}

const REEL0_TOTAL = sumCounts(REEL0_COUNTS);
const REEL1_TOTAL = sumCounts(REEL1_COUNTS);
const REEL2_TOTAL = sumCounts(REEL2_COUNTS);

if (REEL0_TOTAL !== 15 || REEL1_TOTAL !== 15 || REEL2_TOTAL !== 15) {
  console.error("bad reel totals", { REEL0_TOTAL, REEL1_TOTAL, REEL2_TOTAL });
}

const RANGES0 = stopRangesFromCounts(REEL0_COUNTS);
const RANGES1 = stopRangesFromCounts(REEL1_COUNTS);
const RANGES2 = stopRangesFromCounts(REEL2_COUNTS);

function stopRangesForIcon(reel: 1 | 2 | 3, icon: number): [number, number] {
  const i = Math.max(1, Math.min(5, icon)) - 1;
  if (reel === 1) return RANGES0[i];
  if (reel === 2) return RANGES1[i];
  return RANGES2[i];
}

function randomStopForIcon(reel: 1 | 2 | 3, icon: number) {
  const [a, b] = stopRangesForIcon(reel, icon);
  return a + pickIndex(b - a + 1);
}

function idxFromIcon(sym: string) {
  const n = Number(sym.split("-")[1]);
  if (!Number.isFinite(n) || n < 1 || n > 5) return 0;
  return n - 1;
}

function multFor(icon: number, table: number[]) {
  const i = Math.max(0, Math.min(4, icon - 1));
  return table[i];
}

const JACKPOT_MULT = [3374, 843, 187, 52, 18];
const PAIR_MULT = [120, 41, 23, 9, 5];

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

const FORCED_SCALE = 0.1;

function pForCounts(counts: readonly number[]) {
  const t = sumCounts(counts);
  return counts.map((c) => c / t);
}

const P0 = pForCounts(REEL0_COUNTS);
const P1 = pForCounts(REEL1_COUNTS);
const P2 = pForCounts(REEL2_COUNTS);

type ForcedEvent =
  | { kind: "jackpot"; icon: number; weight: number }
  | { kind: "pair-left"; icon: number; weight: number }
  | { kind: "pair-right"; icon: number; weight: number };

function buildForcedBag(): ForcedEvent[] {
  const bag: ForcedEvent[] = [];

  for (let i = 1; i <= 5; i++) {
    const pJackpot = P0[i - 1] * P1[i - 1] * P2[i - 1];
    if (i !== 1) bag.push({ kind: "jackpot", icon: i, weight: pJackpot });

    const pPairLeftOnly = P0[i - 1] * P1[i - 1] * (1 - P2[i - 1]);
    const pPairRightOnly = (1 - P0[i - 1]) * P1[i - 1] * P2[i - 1];

    bag.push({ kind: "pair-left", icon: i, weight: pPairLeftOnly });
    bag.push({ kind: "pair-right", icon: i, weight: pPairRightOnly });
  }

  const filtered = bag.filter((e) => Number.isFinite(e.weight) && e.weight > 0);
  const sumW = filtered.reduce((s, e) => s + e.weight, 0);
  if (sumW <= 0) return filtered;

  return filtered.map((e) => ({ ...e, weight: e.weight / sumW }));
}

const FORCED_BAG = buildForcedBag();

function pickWeighted<T extends { weight: number }>(items: readonly T[]): T {
  if (!items.length) throw new Error("forced bag empty");
  const r = Math.random();
  let acc = 0;
  for (let i = 0; i < items.length; i++) {
    acc += items[i].weight;
    if (r <= acc) return items[i];
  }
  return items[items.length - 1];
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
  forcedScale?: number;
  unscaledPayout?: number;
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
  const ev = pickWeighted(FORCED_BAG);

  let icons: [number, number, number];
  if (ev.kind === "jackpot") {
    icons = [ev.icon, ev.icon, ev.icon];
  } else if (ev.kind === "pair-left") {
    const right = pickDifferentIcon(ev.icon);
    icons = [ev.icon, ev.icon, right] as [number, number, number];
  } else {
    const left = pickDifferentIcon(ev.icon);
    icons = [left, ev.icon, ev.icon] as [number, number, number];
  }

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

  const base = computePayout(bet, icons[0], icons[1], icons[2]);
  const unscaledPayout = Math.max(0, Math.floor(base.payout));
  const payout = Math.max(0, Math.floor(unscaledPayout * FORCED_SCALE));

  return {
    win: payout > 0,
    payout,
    reason: `forced-${base.reason}`,
    combo,
    icons,
    stops,
    forced: true,
    forcedScale: FORCED_SCALE,
    unscaledPayout,
  };
}

const streakByUserId = new Map<string, number>();

function getLossStreak(userId: string) {
  return streakByUserId.get(userId) ?? 0;
}

function setLossStreak(userId: string, n: number) {
  streakByUserId.set(userId, n);
}

type Claim = {
  id: string;
  userId: string;
  payout: number;
  reason: string;
  created: number;
};

const CLAIM_TTL_MS = 2 * 60 * 1000;
const claimsById = new Map<string, Claim>();

function nowMs() {
  return Date.now();
}

function pruneClaims() {
  const t = nowMs();
  for (const [id, c] of claimsById.entries()) {
    if (t - c.created > CLAIM_TTL_MS) claimsById.delete(id);
  }
}

function makeClaimId() {
  const b = new Uint8Array(18);
  crypto.getRandomValues(b);
  let s = "";
  for (let i = 0; i < b.length; i++) s += b[i].toString(16).padStart(2, "0");
  return s;
}

export const handler: Handlers = {
  async POST(req) {
    try {
      pruneClaims();

      const body = (await req.json().catch(() => null)) as
        | null
        | {
          bet?: number;
          apiKey?: string;
          action?: "spin" | "claim";
          claimId?: string;
        };

      const action = (body?.action || "spin") as "spin" | "claim";
      const apiKey = (body?.apiKey || "").trim();

      if (!apiKey) return json(400, { ok: false, error: "missing api key" });

      const riskbotKey = Deno.env.get("RISKBOT_API_KEY")?.trim();
      if (!riskbotKey) return json(500, { ok: false, error: "server missing RISKBOT_API_KEY" });

      const riskbot = await getRiskbotUser();
      const me = await getMe(apiKey);

      if (action === "claim") {
        const claimId = (body?.claimId || "").trim();
        if (!claimId) return json(400, { ok: false, error: "missing claim id" });

        const claim = claimsById.get(claimId);
        if (!claim) return json(404, { ok: false, error: "claim not found" });
        if (claim.userId !== me.id) return json(403, { ok: false, error: "claim mismatch" });

        claimsById.delete(claimId);

        let payoutSent = false;
        if (claim.payout > 0) {
          const winMsg = `slots payout ${claim.payout} (${claim.reason})`;
          await sendManagram(riskbotKey, me.id, claim.payout, winMsg);
          payoutSent = true;
        }

        return json(200, { ok: true, payoutSent });
      }

      const bet = Number(body?.bet);
      if (!Number.isFinite(bet) || bet < 10) return json(400, { ok: false, error: "bad bet" });

      await sendManagram(apiKey, riskbot.id, bet, `slots bet ${bet}`);

      const priorLossStreak = getLossStreak(me.id);

      const THRESHOLD = 5;
      let outcome: Outcome;

      if (priorLossStreak >= THRESHOLD - 1) {
        outcome = forcedWinOutcome(bet);
        setLossStreak(me.id, 0);
      } else {
        outcome = randomOutcome(bet);
        if (outcome.win) setLossStreak(me.id, 0);
        else setLossStreak(me.id, priorLossStreak + 1);
      }

      const lossStreakAfter = getLossStreak(me.id);

      let payoutSent = false;
      let claimId: string | null = null;

      if (outcome.win && outcome.payout > 0) {
        try {
          await sendManagram(
            riskbotKey,
            me.id,
            outcome.payout,
            `slots payout ${outcome.payout} (${outcome.reason})`,
          );
          payoutSent = true;
        } catch (e) {
          console.error("payout send failed; storing claim", e);
          claimId = makeClaimId();
          claimsById.set(claimId, {
            id: claimId,
            userId: me.id,
            payout: outcome.payout,
            reason: outcome.reason,
            created: nowMs(),
          });
        }
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
          forcedScale: outcome.forcedScale,
          unscaledPayout: outcome.unscaledPayout,
        },
        meta: {
          priorLossStreak,
          lossStreakAfter,
          threshold: THRESHOLD,
        },
        claimId,
        payoutSent,
      });
    } catch (err) {
      console.error("slots-api error:", err);
      const detail =
        err instanceof Error
          ? `${err.name}: ${err.message}`
          : typeof err === "string"
          ? err
          : "unknown";
      return json(500, { ok: false, error: "server error", detail });
    }
  },
};
