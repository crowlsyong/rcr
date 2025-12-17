// islands/games/slots/JumboSlotMachine.tsx
import { JSX } from "preact";

type Props = JSX.HTMLAttributes<HTMLDivElement>;

function PayBox(
  { label, mult, accent }: { label: string; mult: string; accent: string },
) {
  return (
    <div class="rounded-lg border border-black/30 bg-gradient-to-b from-white/10 via-white/5 to-black/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
      <div class="px-2 py-1 flex items-center justify-between gap-2">
        <div class={`text-[10px] font-semibold tracking-wide ${accent}`}>
          {label}
        </div>
        <div class="text-[10px] font-black text-white/90">{mult}</div>
      </div>
      <div class="h-[1px] bg-black/25" />
      <div class="px-2 py-1 text-[9px] text-white/70 tracking-wide">
        3 in a row
      </div>
    </div>
  );
}

function ReelCell(
  { children, hot }: { children: JSX.Element | string; hot?: boolean },
) {
  return (
    <div
      class={`h-14 rounded-xl border border-black/35 bg-gradient-to-b from-zinc-100/15 via-white/5 to-black/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-12px_20px_rgba(0,0,0,0.45)] flex items-center justify-center ${
        hot ? "ring-1 ring-amber-300/50" : ""
      }`}
    >
      <div class="relative">
        <div
          class={`text-3xl font-black drop-shadow-[0_2px_0_rgba(0,0,0,0.55)] ${
            hot ? "text-amber-200" : "text-white"
          }`}
        >
          {children}
        </div>
        {hot
          ? (
            <div class="absolute -inset-2 rounded-full blur-lg bg-amber-400/20" />
          )
          : null}
      </div>
    </div>
  );
}

export default function JumboSlotMachine(props: Props) {
  return (
    <div
      {...props}
      class={`w-full max-w-[520px] mx-auto ${props.class || ""}`}
    >
      <div class="relative rounded-[28px] p-4 sm:p-5 bg-gradient-to-b from-zinc-200 via-zinc-300 to-zinc-700 shadow-[0_28px_60px_rgba(0,0,0,0.55)] border border-black/40">
        <div class="absolute inset-0 rounded-[28px] bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.45),transparent_35%),radial-gradient(circle_at_85%_20%,rgba(255,255,255,0.25),transparent_40%),linear-gradient(to_bottom,rgba(255,255,255,0.12),rgba(0,0,0,0.2))] pointer-events-none" />

        <div class="relative rounded-[22px] border border-black/45 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] overflow-hidden">
          <div class="px-3 pt-3 pb-2">
            <div class="relative rounded-[18px] border border-black/50 bg-gradient-to-b from-amber-900 via-amber-950 to-black shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] overflow-hidden">
              <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,215,128,0.35),transparent_55%),linear-gradient(to_bottom,rgba(255,255,255,0.06),rgba(0,0,0,0.25))]" />
              <div class="relative px-3 pt-3 pb-2">
                <div class="flex items-center justify-center">
                  <svg
                    viewBox="0 0 360 120"
                    class="w-full max-w-[360px] h-[88px]"
                  >
                    <defs>
                      <path
                        id="arc"
                        d="M 30 98 C 90 18, 270 18, 330 98"
                      />
                      <linearGradient id="gold" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0" stop-color="#ffe8a3" />
                        <stop offset="0.45" stop-color="#f7c85d" />
                        <stop offset="1" stop-color="#8a5b12" />
                      </linearGradient>
                      <linearGradient id="gold2" x1="0" x2="1" y1="0" y2="1">
                        <stop offset="0" stop-color="#fff2c7" />
                        <stop offset="0.55" stop-color="#f4c24d" />
                        <stop offset="1" stop-color="#a86b14" />
                      </linearGradient>
                      <filter
                        id="shadow"
                        x="-30%"
                        y="-30%"
                        width="160%"
                        height="160%"
                      >
                        <feDropShadow
                          dx="0"
                          dy="3"
                          stdDeviation="2"
                          flood-color="rgba(0,0,0,0.6)"
                        />
                      </filter>
                    </defs>

                    <text
                      filter="url(#shadow)"
                      fill="url(#gold)"
                      stroke="rgba(0,0,0,0.7)"
                      stroke-width="3"
                      font-size="54"
                      font-weight="900"
                      letter-spacing="3"
                    >
                      <textPath
                        href="#arc"
                        startOffset="50%"
                        text-anchor="middle"
                      >
                        JUMBO
                      </textPath>
                    </text>

                    <g transform="translate(0,12)">
                      <rect
                        x="112"
                        y="70"
                        rx="14"
                        ry="14"
                        width="136"
                        height="38"
                        fill="rgba(0,0,0,0.35)"
                        stroke="rgba(255,255,255,0.15)"
                      />
                      <text
                        x="180"
                        y="97"
                        text-anchor="middle"
                        fill="url(#gold2)"
                        stroke="rgba(0,0,0,0.55)"
                        stroke-width="2"
                        font-size="30"
                        font-weight="900"
                        letter-spacing="2"
                        filter="url(#shadow)"
                      >
                        SLOT
                      </text>
                    </g>
                  </svg>
                </div>

                <div class="mt-1 rounded-2xl border border-black/55 bg-gradient-to-b from-zinc-950 via-black to-black px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <PayBox
                      label="💎 7 7 7"
                      mult="250×"
                      accent="text-amber-200"
                    />
                    <PayBox
                      label="⭐ ⭐ ⭐"
                      mult="50×"
                      accent="text-yellow-200"
                    />
                    <PayBox
                      label="🔔 🔔 🔔"
                      mult="10×"
                      accent="text-orange-200"
                    />
                    <PayBox label="🍒 🍒 🍒" mult="4×" accent="text-red-200" />
                    <PayBox
                      label="BAR BAR"
                      mult="10×"
                      accent="text-slate-200"
                    />
                    <PayBox label="7 7" mult="5×" accent="text-amber-100" />
                    <PayBox
                      label="🔔 🔔"
                      mult="3.5×"
                      accent="text-orange-100"
                    />
                    <PayBox label="🍒 🍒" mult="2.3×" accent="text-rose-100" />
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-3 rounded-[22px] border border-black/55 bg-gradient-to-b from-zinc-800 via-zinc-900 to-black shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] p-3">
              <div class="rounded-[18px] border border-black/65 bg-gradient-to-b from-zinc-950 via-black to-black p-3">
                <div class="grid grid-cols-3 gap-2">
                  <ReelCell hot>7</ReelCell>
                  <ReelCell>🍒</ReelCell>
                  <ReelCell>BAR</ReelCell>
                </div>

                <div class="mt-3 rounded-xl border border-black/60 bg-gradient-to-b from-zinc-900 to-black p-2 flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <div class="w-2.5 h-2.5 rounded-full bg-red-400 shadow-[0_0_18px_rgba(248,113,113,0.65)]" />
                    <div class="text-[11px] font-semibold tracking-wide text-white/80">
                      INSERT COIN
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="text-[11px] font-semibold tracking-wide text-white/70">
                      PLAY
                    </div>
                    <div class="w-16 h-2 rounded-full bg-zinc-700/60 border border-black/60 overflow-hidden">
                      <div class="w-9 h-full bg-gradient-to-r from-emerald-300/70 to-emerald-500/70" />
                    </div>
                  </div>
                </div>
              </div>

              <div class="mt-3 flex items-stretch justify-between gap-3">
                <div class="flex-1 rounded-2xl border border-black/55 bg-gradient-to-b from-zinc-950 via-black to-black p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <div class="rounded-xl border border-black/60 bg-gradient-to-b from-amber-950 via-black to-black px-3 py-2">
                    <div class="text-center text-sm font-black tracking-wide text-amber-200 drop-shadow-[0_2px_0_rgba(0,0,0,0.75)]">
                      Bars &amp; 7s Wins!
                    </div>
                  </div>

                  <div class="mt-2 rounded-xl border border-black/60 bg-gradient-to-b from-zinc-900 to-black px-3 py-3">
                    <div class="text-center text-4xl font-black tracking-[0.22em] text-red-200 drop-shadow-[0_3px_0_rgba(0,0,0,0.7)]">
                      777
                    </div>
                    <div class="mt-1 text-center text-[10px] tracking-wide text-white/55">
                      PAYOUT PANEL
                    </div>
                  </div>
                </div>

                <div class="w-[94px] sm:w-[110px] flex items-center justify-center">
                  <div class="relative h-[190px] w-full flex items-center justify-center">
                    <div class="absolute top-1 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-red-500 border border-black/50 shadow-[0_10px_18px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.2)]" />
                    <div class="absolute top-7 left-1/2 -translate-x-1/2 w-3 h-[120px] rounded-full bg-gradient-to-b from-zinc-100 via-zinc-300 to-zinc-700 border border-black/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_10px_18px_rgba(0,0,0,0.5)] rotate-[8deg]" />
                    <div class="absolute bottom-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-red-500 border border-black/55 shadow-[0_14px_22px_rgba(0,0,0,0.6),inset_0_2px_0_rgba(255,255,255,0.18)]" />
                    <div class="absolute bottom-1 left-1/2 -translate-x-1/2 w-16 h-7 rounded-full bg-gradient-to-b from-zinc-300 via-zinc-500 to-zinc-800 border border-black/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]" />
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-3 rounded-[18px] border border-black/55 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                  <div class="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.6)]" />
                  <div class="text-[11px] font-semibold tracking-wide text-white/75">
                    JACKPOT READY
                  </div>
                </div>
                <div class="text-[11px] font-semibold tracking-wide text-white/65">
                  25¢ PLAY
                </div>
              </div>
            </div>
          </div>

          <div class="h-3 bg-gradient-to-b from-black/0 via-black/25 to-black/0" />
        </div>

        <div class="relative mt-3 flex items-center justify-center">
          <div class="w-[92%] h-6 rounded-full border border-black/50 bg-gradient-to-b from-zinc-100 via-zinc-400 to-zinc-800 shadow-[0_14px_22px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.2)]" />
        </div>
      </div>
    </div>
  );
}
