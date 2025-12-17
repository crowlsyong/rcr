// islands/games/slots/Slots.tsx
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import SlotsUI from "./SlotsUI.tsx";

type SymbolKey = number;

type SpinResult = {
  win: boolean;
  combo: [SymbolKey, SymbolKey, SymbolKey];
  payout: number;
  reason: string;
  payoutSent: boolean;
};

const ICON_COUNT = 5;
const ICON_WIDTH = 88;
const ICON_HEIGHT = 88;

const REPEAT_COUNT = 14;
const START_CYCLE = 2;

const BETS = [50, 100, 250, 1000, 10000] as const;

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function parseIconToIndex(sym: string) {
  const n = Number(sym.split("-")[1]);
  if (!Number.isFinite(n)) return 0;
  return clamp(n - 1, 0, ICON_COUNT - 1);
}

function iconNumToIndex(n: number) {
  if (!Number.isFinite(n)) return 0;
  return clamp(Math.floor(n) - 1, 0, ICON_COUNT - 1);
}

async function readJsonOrText(r: Response) {
  const text = await r.text().catch(() => "");
  try {
    const j = text ? JSON.parse(text) : null;
    return { ok: true, text, json: j };
  } catch (_e) {
    return { ok: false, text, json: null };
  }
}

export default function Slots() {
  const [spinState, setSpinState] = useState<"idle" | "spinning" | "done">(
    "idle",
  );
  const [status, setStatus] = useState("pull to spin");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SpinResult | null>(null);

  const [bet, setBet] = useState<number>(BETS[0]);
  const [apiKey, setApiKey] = useState("");

  const spinningRef = useRef(false);
  const currentIndexRef = useRef<[number, number, number]>([0, 0, 0]);

  const iconUrls = useMemo(
    () =>
      Array.from({ length: ICON_COUNT }).map(
        (_, i) => `/styles/slots/icon-${i + 1}.png`,
      ),
    [],
  );

  function setStripPosition(el: HTMLDivElement, cycle: number, idx: number) {
    const y = -((cycle * ICON_COUNT + idx) * ICON_HEIGHT);
    el.style.transition = "none";
    el.style.transform = `translate3d(0, ${y}px, 0)`;
  }

  function animateTo(
    reelIndex: number,
    targetIdx: number,
    durMs: number,
    extraCycles: number,
  ): Promise<void> {
    return new Promise((resolve) => {
      const el = document.getElementById(
        `slot-strip-${reelIndex}`,
      ) as HTMLDivElement | null;

      if (!el) {
        resolve();
        return;
      }

      const fromIdx = currentIndexRef.current[reelIndex];

      const startCycle = START_CYCLE;
      const endCycle = START_CYCLE + extraCycles;

      setStripPosition(el, startCycle, fromIdx);

      const endY = -((endCycle * ICON_COUNT + targetIdx) * ICON_HEIGHT);

      el.style.willChange = "transform";
      requestAnimationFrame(() => {
        el.style.transition =
          `transform ${durMs}ms cubic-bezier(.22,.61,.36,1)`;
        el.style.transform = `translate3d(0, ${endY}px, 0)`;
      });

      globalThis.setTimeout(() => {
        currentIndexRef.current[reelIndex] = targetIdx;
        el.style.willChange = "auto";
        resolve();
      }, durMs + 30);
    });
  }

  async function claimIfNeeded(apiKey: string, claimId: string) {
    try {
      const r = await fetch("/api/v0/slots/slots-api", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ apiKey, action: "claim", claimId }),
      });

      const parsed = await readJsonOrText(r);
      const j = parsed.json as any;

      if (!r.ok || !j?.ok) {
        console.error("claim failed", {
          status: r.status,
          text: parsed.text,
          j,
        });
        return { ok: false };
      }
      return { ok: true, payoutSent: !!j.payoutSent };
    } catch (e) {
      console.error(e);
      return { ok: false };
    }
  }

  async function spin() {
    if (spinningRef.current) return;

    try {
      spinningRef.current = true;
      setError(null);
      setResult(null);
      setSpinState("spinning");
      setStatus("calling api");

      const r = await fetch("/api/v0/slots/slots-api", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bet, apiKey, action: "spin" }),
      });

      const parsed = await readJsonOrText(r);
      const j = parsed.json as any;

      if (!r.ok || !j?.ok || !j?.outcome) {
        console.error("slots api bad response", {
          status: r.status,
          text: parsed.text,
          j,
        });
        setError(j?.detail || j?.error || `api error ${r.status}`);
        setSpinState("idle");
        spinningRef.current = false;
        return;
      }

      const outcome = j.outcome as {
        win: boolean;
        payout: number;
        reason: string;
        combo?: [string, string, string];
        icons?: [number, number, number];
      };

      let payoutSent = !!j.payoutSent;

      const claimId = typeof j.claimId === "string" ? j.claimId : null;
      if (outcome.win && !payoutSent && claimId && apiKey) {
        setStatus("payout retry");
        const cr = await claimIfNeeded(apiKey, claimId);
        payoutSent = !!cr.payoutSent;
        if (!payoutSent) setError("payout failed");
      }

      const finalIdx: [number, number, number] = outcome.icons
        ? [
          iconNumToIndex(outcome.icons[0]),
          iconNumToIndex(outcome.icons[1]),
          iconNumToIndex(outcome.icons[2]),
        ]
        : [
          parseIconToIndex(outcome.combo?.[0] ?? "icon-1"),
          parseIconToIndex(outcome.combo?.[1] ?? "icon-1"),
          parseIconToIndex(outcome.combo?.[2] ?? "icon-1"),
        ];

      setStatus("spinning");

      const base = 2200;
      const gap = 420;

      const p0 = animateTo(0, finalIdx[0], base, 4);
      const p1 = animateTo(1, finalIdx[1], base + gap, 5);
      const p2 = animateTo(2, finalIdx[2], base + 2 * gap, 6);
      await Promise.all([p0, p1, p2]);

      setResult({
        win: outcome.win,
        payout: outcome.payout,
        combo: finalIdx,
        reason: outcome.reason,
        payoutSent,
      });

      const paid = outcome.win ? (payoutSent ? "paid" : "unpaid") : "loss";
      setStatus(outcome.win ? `${outcome.reason} (${paid})` : "loss");
      setSpinState("done");
    } catch (e) {
      console.error(e);
      setError("spin error");
      setSpinState("idle");
    } finally {
      spinningRef.current = false;
    }
  }

  useEffect(() => {
    const init = () => {
      try {
        currentIndexRef.current = [
          Math.floor(Math.random() * ICON_COUNT),
          Math.floor(Math.random() * ICON_COUNT),
          Math.floor(Math.random() * ICON_COUNT),
        ];
        for (let i = 0; i < 3; i++) {
          const el = document.getElementById(`slot-strip-${i}`) as
            | HTMLDivElement
            | null;
          if (!el) continue;
          setStripPosition(el, START_CYCLE, currentIndexRef.current[i]);
        }
      } catch (e) {
        console.error(e);
      }
    };

    init();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === "Space" || e.code === "Enter") spin();
    };

    globalThis.addEventListener("keydown", onKeyDown);
    return () => globalThis.removeEventListener("keydown", onKeyDown);
  }, [bet, apiKey]);

  return (
    <SlotsUI
      icons={iconUrls}
      iconUrls={iconUrls}
      iconWidth={ICON_WIDTH}
      iconHeight={ICON_HEIGHT}
      repeatCount={REPEAT_COUNT}
      apiKey={apiKey}
      setApiKey={setApiKey}
      bet={bet}
      setBet={setBet}
      bets={BETS}
      canSpin={!spinningRef.current}
      spinState={spinState as any}
      status={status}
      error={error}
      result={result as any}
      onSpin={spin}
    />
  );
}
