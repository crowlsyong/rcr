// islands/games/slots/Slots.tsx
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";
import SlotsUI from "./SlotsUI.tsx";

type SpinState = "idle" | "spinning" | "settling" | "done";

const BETS = [50, 100, 150, 500, 1000] as const;

function pick<T>(arr: readonly T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function Slots() {
  const icons = useMemo(
    () =>
      [
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
      ] as const,
    [],
  );

  const [apiKey, setApiKey] = useState("");
  const [bet, setBet] = useState<(typeof BETS)[number]>(100);
  const [spinState, setSpinState] = useState<SpinState>("idle");
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [reels, setReels] = useState<[string, string, string]>([
    pick(icons),
    pick(icons),
    pick(icons),
  ]);

  const [result, setResult] = useState<
    | null
    | {
      win: boolean;
      combo: [string, string, string];
      payout: number;
      reason: string;
      payoutSent: boolean;
    }
  >(null);

  const [leverPulled, setLeverPulled] = useState(false);

  const timersRef = useRef<number[]>([]);
  const spinningRef = useRef(false);

  function clearTimers() {
    for (const id of timersRef.current) {
      globalThis.clearInterval(id);
      globalThis.clearTimeout(id);
    }
    timersRef.current = [];
  }

  useEffect(() => {
    return () => clearTimers();
  }, []);

  async function spinServer(spinBet: number, key: string) {
    try {
      const res = await fetch("/api/v0/slots/slots-api", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bet: spinBet, apiKey: key }),
      });

      const data = await res.json().catch(() => null) as any;

      if (!res.ok || !data?.ok) {
        console.error("slots-api response:", res.status, data);
        return { ok: false as const, error: String(data?.error || "spin failed") };
      }

      const combo = data?.outcome?.combo as [string, string, string];
      const win = !!data?.outcome?.win;
      const payout = Number(data?.outcome?.payout || 0);
      const reason = String(data?.outcome?.reason || "");
      const payoutSent = !!data?.payoutSent;

      if (!combo || combo.length !== 3) return { ok: false as const, error: "bad combo" };

      return { ok: true as const, combo, win, payout, reason, payoutSent };
    } catch (err) {
      console.error("slots-api fetch error:", err);
      return { ok: false as const, error: "network error" };
    }
  }

  function beginSpin() {
    setError(null);
    setResult(null);
    setStatus("");
    setLeverPulled(true);
    globalThis.setTimeout(() => setLeverPulled(false), 450);

    if (!IS_BROWSER) {
      setError("Browser only");
      return;
    }

    const trimmed = apiKey.trim();
    if (!trimmed) {
      setError("API key required");
      return;
    }

    if (spinningRef.current) return;

    spinningRef.current = true;
    setSpinState("spinning");
    setStatus("Sending bet…");

    clearTimers();

    spinServer(bet, trimmed).then((r) => {
      if (!r.ok) {
        setError(r.error);
        setStatus("");
        setSpinState("done");
        spinningRef.current = false;
        return;
      }

      const final = r.combo;

      const r0 = globalThis.setInterval(() => {
        setReels((prev) => [pick(icons), prev[1], prev[2]]);
      }, 50);

      const r1 = globalThis.setInterval(() => {
        setReels((prev) => [prev[0], pick(icons), prev[2]]);
      }, 70);

      const r2 = globalThis.setInterval(() => {
        setReels((prev) => [prev[0], prev[1], pick(icons)]);
      }, 90);

      timersRef.current.push(r0, r1, r2);

      const stop1 = globalThis.setTimeout(() => {
        globalThis.clearInterval(r0);
        setReels((prev) => [final[0], prev[1], prev[2]]);
      }, 900);

      const stop2 = globalThis.setTimeout(() => {
        globalThis.clearInterval(r1);
        setReels((prev) => [prev[0], final[1], prev[2]]);
      }, 1450);

      const stop3 = globalThis.setTimeout(() => {
        globalThis.clearInterval(r2);
        setReels((prev) => [prev[0], prev[1], final[2]]);
        setSpinState("settling");

        const settle = globalThis.setTimeout(() => {
          setResult({
            win: r.win,
            combo: final,
            payout: r.payout,
            reason: r.reason,
            payoutSent: r.payoutSent,
          });

          setStatus(r.win ? `Win: ${r.payout} mana` : "Loss");
          setSpinState("done");
          spinningRef.current = false;
        }, 320);

        timersRef.current.push(settle);
      }, 2050);

      timersRef.current.push(stop1, stop2, stop3);
    });
  }

  const canSpin = spinState === "idle" || spinState === "done";

  return (
    <SlotsUI
      icons={icons}
      apiKey={apiKey}
      setApiKey={(v) => {
        setApiKey(v);
        setError(null);
      }}
      bet={bet}
      setBet={(b) => {
        if (!canSpin) return;
        setBet(b);
      }}
      bets={BETS}
      reels={reels}
      spinState={spinState}
      canSpin={canSpin}
      leverPulled={leverPulled}
      status={status}
      error={error}
      result={result}
      onSpin={beginSpin}
    />
  );
}
