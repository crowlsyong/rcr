// islands/games/slots/Winner.tsx
import { useEffect, useMemo, useRef, useState } from "preact/hooks";

type Particle = {
  id: string;
  left: number;
  size: number;
  delay: number;
  dur: number;
  rot: number;
  sway: number;
  emoji: string;
};

type Props = {
  show: boolean;
  amount: number;
};

function r(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function rid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function Winner(props: Props) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [burst, setBurst] = useState<Particle[]>([]);
  const prevShow = useRef(false);

  const emojis = useMemo(
    () => ["🎉", "✨", "🪙", "💎", "⭐", "🎊", "🔥", "🌈"] as const,
    [],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (props.show && !prevShow.current) {
      setVisible(true);

      const n = 80;
      const next: Particle[] = [];
      for (let i = 0; i < n; i++) {
        next.push({
          id: rid(),
          left: r(0, 100),
          size: r(14, 26),
          delay: r(0, 0.6),
          dur: r(1.8, 3.3),
          rot: r(-180, 180),
          sway: r(10, 55),
          emoji: emojis[Math.floor(Math.random() * emojis.length)],
        });
      }
      setBurst(next);
      globalThis.setTimeout(() => setBurst([]), 3600);
    }

    prevShow.current = props.show;
  }, [props.show, mounted, emojis]);

  useEffect(() => {
    if (!visible) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setVisible(false);
    };

    globalThis.addEventListener("keydown", onKey);
    return () => globalThis.removeEventListener("keydown", onKey);
  }, [visible]);

  if (!props.show || !visible) return null;

  return (
    <div
      class="fixed inset-0 z-50"
      onClick={() => setVisible(false)}
      role="button"
      tabIndex={0}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes winner-pop {
  0% { transform: translateY(10px) scale(0.98); opacity: 0; }
  18% { transform: translateY(0px) scale(1); opacity: 1; }
  100% { transform: translateY(-2px) scale(1); opacity: 1; }
}
@keyframes confetti-fall {
  0% { transform: translate3d(var(--x0), -20px, 0) rotate(var(--r0)); opacity: 0; }
  10% { opacity: 1; }
  100% { transform: translate3d(var(--x1), 110vh, 0) rotate(calc(var(--r0) + 720deg)); opacity: 0; }
}
@keyframes glow-pulse {
  0% { opacity: 0.55; }
  50% { opacity: 0.9; }
  100% { opacity: 0.55; }
}
`,
        }}
      />

      <div
        class="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 25%, rgba(16,185,129,0.25), transparent 55%), radial-gradient(circle at 50% 75%, rgba(250,204,21,0.22), transparent 60%), rgba(0,0,0,0.55)",
          animation: "glow-pulse 1.2s ease-in-out infinite",
        }}
      />

      <div class="absolute inset-0 flex items-center justify-center px-4 pointer-events-none">
        <div
          class="max-w-md w-full rounded-3xl border border-emerald-400/30 bg-gradient-to-b from-gray-950 to-black shadow-2xl pointer-events-none"
          style={{ animation: "winner-pop 420ms ease-out both" }}
        >
          <div class="p-6">
            <div class="text-xs tracking-widest text-emerald-200/80 font-extrabold">
              JACKPOT
            </div>
            <div class="mt-2 text-3xl font-black text-gray-100 leading-tight">
              🎉 {props.amount} mana
            </div>
            <div class="mt-2 text-sm text-gray-300">
              click anywhere to close
            </div>
          </div>
        </div>
      </div>

      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        {burst.map((p) => (
          <div
            key={p.id}
            class="absolute top-0"
            style={{
              left: `${p.left}vw`,
              fontSize: `${p.size}px`,
              animation: `confetti-fall ${p.dur}s linear ${p.delay}s both`,
              ["--x0" as any]: `${r(-20, 20)}px`,
              ["--x1" as any]: `${r(-p.sway, p.sway)}px`,
              ["--r0" as any]: `${p.rot}deg`,
              filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.35))",
            }}
          >
            {p.emoji}
          </div>
        ))}
      </div>
    </div>
  );
}
