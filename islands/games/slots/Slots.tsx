// islands/games/slots/Slots.tsx
import { useEffect, useRef, useState } from "preact/hooks";
import SlotsUI from "./SlotsUI.tsx";

type SymbolKey = number;

type SpinResult = {
  win: boolean;
  combo: [SymbolKey, SymbolKey, SymbolKey];
  payout: number;
  reason: string;
  payoutSent: boolean;
};

const ICON_COUNT = 10;
const ICON_WIDTH = 88;
const ICON_HEIGHT = 88;

const REPEAT_COUNT = 22;
const SAFE_REPEAT_MARGIN = 8;

const BETS = [50, 100, 250, 500, 1000] as const;

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickSymbol(): SymbolKey {
  return Math.floor(Math.random() * ICON_COUNT);
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
  const spinIndexRef = useRef(0);
  const last777Ref = useRef(-10_000);

  const iconUrls = Array.from({ length: ICON_COUNT }).map(
    (_, i) => `/styles/slots/slot-${i + 1}.png`,
  );

  function evaluate(
    line: [SymbolKey, SymbolKey, SymbolKey],
    spinIndex: number,
  ): SpinResult {
    const [a, b, c] = line;

    const jackpotEligible =
      spinIndex - last777Ref.current >= 10_000 && Math.random() < 1 / 10_000;

    if (jackpotEligible) {
      last777Ref.current = spinIndex;
      return {
        win: true,
        combo: [7, 7, 7],
        payout: 5000,
        reason: "jackpot",
        payoutSent: false,
      };
    }

    if (a === b && b === c) {
      return {
        win: true,
        combo: [a, b, c],
        payout: 500,
        reason: "triple",
        payoutSent: false,
      };
    }

    if (a === b || b === c) {
      return {
        win: true,
        combo: [a, b, c],
        payout: 50,
        reason: "pair",
        payoutSent: false,
      };
    }

    return {
      win: false,
      combo: [a, b, c],
      payout: 0,
      reason: "lose",
      payoutSent: false,
    };
  }

  function animateReel(
    reelIndex: number,
    finalSymbol: number,
    delta: number,
  ): Promise<void> {
    return new Promise((resolve) => {
      const el = document.getElementById(
        `slot-strip-${reelIndex}`,
      ) as HTMLDivElement | null;

      if (!el) {
        resolve();
        return;
      }

      const timePerIcon = 220;

      const baseIcons = ICON_COUNT *
        Math.max(1, REPEAT_COUNT - SAFE_REPEAT_MARGIN);

      const maxIcons = ICON_COUNT * REPEAT_COUNT - 1;
      const desiredIcons = baseIcons + delta + finalSymbol;
      const offsetIcons = Math.min(desiredIcons, maxIcons);

      const translateY = -(offsetIcons * ICON_HEIGHT);

      const dur = (baseIcons + delta) * timePerIcon + reelIndex * 1400;

      el.style.willChange = "transform";
      el.style.transition = "none";
      el.style.transform = "translate3d(0, 0px, 0)";

      requestAnimationFrame(() => {
        el.style.transition = `transform ${dur}ms cubic-bezier(.22,.61,.36,1)`;
        el.style.transform = `translate3d(0, ${translateY}px, 0)`;
      });

      setTimeout(() => {
        const normalized = -(finalSymbol * ICON_HEIGHT);
        el.style.transition = "none";
        el.style.transform = `translate3d(0, ${normalized}px, 0)`;
        el.style.willChange = "auto";
        resolve();
      }, dur + 40);
    });
  }

  async function spin() {
    if (spinningRef.current) return;

    try {
      spinningRef.current = true;
      setSpinState("spinning");
      setStatus("spinning");
      setResult(null);
      setError(null);

      const spinIndex = ++spinIndexRef.current;

      const final: [number, number, number] = [
        pickSymbol(),
        pickSymbol(),
        pickSymbol(),
      ];

      const deltas = [randInt(8, 10), randInt(10, 12), randInt(12, 14)];

      await Promise.all([
        animateReel(0, final[0], deltas[0]),
        animateReel(1, final[1], deltas[1]),
        animateReel(2, final[2], deltas[2]),
      ]);

      const evaluated = evaluate(final, spinIndex);
      setResult(evaluated);
      setStatus(evaluated.win ? evaluated.reason : "no win");
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
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === "Space" || e.code === "Enter") spin();
    };
    globalThis.addEventListener("keydown", onKeyDown);
    return () => globalThis.removeEventListener("keydown", onKeyDown);
  }, []);

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
      spinState={spinState}
      status={status}
      error={error}
      result={result as any}
      onSpin={spin}
    />
  );
}
