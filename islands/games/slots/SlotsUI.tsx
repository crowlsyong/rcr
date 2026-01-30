// islands/games/slots/SlotsUI.tsx
import { useEffect, useRef, useState } from "preact/hooks";
import Winner from "./Winner.tsx";
import PayoutTable from "./PayoutTable.tsx";

type SpinState = "idle" | "spinning" | "settling" | "done";

type SpinResult = {
  win: boolean;
  combo: [string, string, string];
  payout: number;
  reason: string;
  payoutSent: boolean;
};

type Props = {
  icons: readonly string[];
  iconUrls: readonly string[];
  iconWidth: number;
  iconHeight: number;
  repeatCount: number;

  apiKeyInput: string;
  setApiKeyInput: (value: string) => void;

  bet: number;
  setBet: (b: any) => void;
  bets: readonly number[];

  canSpin: boolean;
  spinState: SpinState;
  status: string;
  error: string | null;
  result: SpinResult | null;

  onSpin: () => void;
};

function maskKey(k: string) {
  if (!k) return "";
  if (k.length <= 6) return k;
  return `${k.slice(0, 3)}…${k.slice(-3)}`;
}

const betGroups: Record<string, number[]> = {
  amber: [50, 100],
  sky: [250],
  fuchsia: [1000],
  emerald: [10000],
};

const palettes: Record<string, { on: string; off: string }> = {
  amber: {
    on:
      "bg-gradient-to-b from-amber-200 to-orange-500 text-black border-amber-100/35 shadow-[0_20px_56px_rgba(251,146,60,0.34)]",
    off:
      "bg-gradient-to-b from-amber-500/20 to-orange-500/14 text-white border-amber-300/16 hover:border-amber-200/26 hover:from-amber-500/26 hover:to-orange-500/18",
  },
  sky: {
    on:
      "bg-gradient-to-b from-sky-200 to-blue-600 text-white border-sky-100/30 shadow-[0_20px_56px_rgba(59,130,246,0.36)]",
    off:
      "bg-gradient-to-b from-sky-500/18 to-blue-600/12 text-white border-sky-300/14 hover:border-sky-200/24 hover:from-sky-500/24 hover:to-blue-600/16",
  },
  fuchsia: {
    on:
      "bg-gradient-to-b from-fuchsia-200 to-violet-700 text-white border-fuchsia-100/28 shadow-[0_20px_56px_rgba(139,92,246,0.38)]",
    off:
      "bg-gradient-to-b from-fuchsia-500/18 to-violet-700/12 text-white border-fuchsia-300/14 hover:border-fuchsia-200/24 hover:from-fuchsia-500/24 hover:to-violet-700/16",
  },
  emerald: {
    on:
      "bg-gradient-to-b from-emerald-200 to-green-700 text-white border-emerald-100/28 shadow-[0_20px_56px_rgba(16,185,129,0.38)]",
    off:
      "bg-gradient-to-b from-emerald-500/18 to-green-700/12 text-white border-emerald-300/14 hover:border-emerald-200/24 hover:from-emerald-500/24 hover:to-green-700/16",
  },
};

function getPaletteForBet(bet: number): { on: string; off: string } {
  for (const [name, bets] of Object.entries(betGroups)) {
    if (bets.includes(bet)) {
      return palettes[name];
    }
  }
  return palettes.amber;
}

function betTheme(bet: number, active: boolean) {
  const base =
    "relative overflow-hidden select-none rounded-2xl border font-extrabold tabular-nums tracking-wide transition " +
    "active:translate-y-[1px] " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25 ";

  const commonEnabled = "cursor-pointer hover:-translate-y-[1px]";

  const size = "px-5 py-4 sm:px-6 sm:py-4 text-lg sm:text-xl";

  const palette = getPaletteForBet(bet);
  const face = active ? palette.on : palette.off;

  return base + " " + size + " " + face + " " + commonEnabled;
}

export default function SlotsUI(props: Props) {
  const showWinner = !!props.result?.win;
  const isWin2 = props.result?.win &&
    props.result.combo[0] === props.result.combo[2];

  const REEL_SCALE = 3;

  const reelBoxW = props.iconWidth * REEL_SCALE + 16;
  const reelBoxH = props.iconHeight * REEL_SCALE;

  const [leverAnim, setLeverAnim] = useState<"idle" | "down" | "return">(
    "idle",
  );
  const leverTRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (leverTRef.current != null) globalThis.clearTimeout(leverTRef.current);
      leverTRef.current = null;
    };
  }, []);

  const leverTransform = leverAnim === "down"
    ? "translate3d(-50%, 132px, 0)"
    : leverAnim === "return"
    ? "translate3d(-50%, 0px, 0)"
    : "translate3d(-50%, 0px, 0)";

  const leverDur = leverAnim === "down"
    ? "140ms"
    : leverAnim === "return"
    ? "220ms"
    : "0ms";

  const slotFadeOverlay =
    "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 72%, rgba(0,0,0,1) 100%)";

  return (
    <div class="w-full grid place-items-center pt-10 px-3 sm:px-4 slots-body text-[1.2rem] leading-relaxed">
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes slotsWin1{0%{filter:saturate(1.25) brightness(1.12)}100%{filter:saturate(1) brightness(1)}}
@keyframes slotsWin2{0%{filter:contrast(1.18) brightness(1.18)}100%{filter:contrast(1) brightness(1)}}
.slotsWin1{animation:slotsWin1 200ms steps(2,end) infinite}
.slotsWin2{animation:slotsWin2 200ms steps(2,end) infinite}
@keyframes knobGlow{0%{filter:brightness(1)}50%{filter:brightness(1.14)}100%{filter:brightness(1)}}
`,
        }}
      />

      <div class="w-full max-w-6xl">
        <div class="w-full rounded-[30px] overflow-hidden border border-white/10 bg-gradient-to-b from-white/6 via-black/55 to-black shadow-2xl">
          <div class="pt-10 pb-4 sm:px-8 py-5 sm:py-6 border-b border-white/8 flex items-center justify-center bg-[radial-gradient(circle_at_50%_0%,rgba(255,214,120,0.22),transparent_60%),linear-gradient(to_bottom,rgba(255,255,255,0.06),transparent)]">
            <svg
              viewBox="0 -20 360 160"
              class="w-[320px] sm:w-[440px] h-[120px]"
            >
              <defs>
                <path id="arc" d="M 30 98 C 90 18, 270 18, 330 98" />
                <linearGradient id="gold" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stop-color="#fff1bd" />
                  <stop offset="0.45" stop-color="#ffd06a" />
                  <stop offset="1" stop-color="#a76a14" />
                </linearGradient>
                <linearGradient id="gold2" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0" stop-color="#fff7d6" />
                  <stop offset="0.55" stop-color="#ffd06a" />
                  <stop offset="1" stop-color="#b77718" />
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
                font-size="62"
                font-weight="900"
                letter-spacing="4"
              >
                <textPath href="#arc" startOffset="50%" text-anchor="middle">
                  SLOTS
                </textPath>
              </text>

              <g transform="translate(0,12)">
                <rect
                  x="84"
                  y="70"
                  rx="14"
                  ry="14"
                  width="192"
                  height="40"
                  fill="rgba(0,0,0,0.22)"
                  stroke="rgba(255,255,255,0.14)"
                />
                <text
                  x="180"
                  y="98"
                  text-anchor="middle"
                  fill="url(#gold2)"
                  stroke="rgba(0,0,0,0.55)"
                  stroke-width="2"
                  font-size="28"
                  font-weight="900"
                  letter-spacing="2"
                  filter="url(#shadow)"
                >
                  PAYTABLE
                </text>
              </g>
            </svg>
          </div>

          <div class="p-4 sm:p-8">
            <div class="rounded-[24px] bg-white/4 border border-white/8 shadow-[inset_0_1px_0_rgba(255,255,255,0.10)] overflow-hidden">
              <div class="p-4 sm:p-5 bg-black/90">
                <PayoutTable iconUrls={props.iconUrls} />

                <div class="mt-5 flex flex-col lg:flex-row items-stretch gap-5 lg:gap-7">
                  <div class="flex-1 min-w-0">
                    <div
                      class={"rounded-[26px] bg-gradient-to-b from-white/6 via-black/35 to-black/55 border border-white/10 p-4 sm:p-6 shadow-[0_18px_44px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.10)] " +
                        (props.spinState === "spinning"
                          ? "ring-1 ring-fuchsia-300/25"
                          : "") +
                        (props.result?.win
                          ? (isWin2 ? " slotsWin2" : " slotsWin1")
                          : "")}
                    >
                      <div class="rounded-[24px] bg-[radial-gradient(circle_at_50%_0%,rgba(120,220,255,0.10),transparent_55%),linear-gradient(to_bottom,rgba(255,255,255,0.06),rgba(0,0,0,0.35))] border border-white/8 shadow-[0_18px_46px_rgba(0,0,0,0.40),inset_0_1px_0_rgba(255,255,255,0.10)] p-3 sm:p-4">
                        <div class="rounded-[20px] bg-white/5 border border-white/8 p-3 sm:p-4">
                          <div class="flex items-center justify-center gap-5 sm:gap-7">
                            {[0, 1, 2].map((i) => (
                              <div
                                key={i}
                                class="relative rounded-[18px] bg-gradient-to-b from-white/8 via-black/35 to-black/55 border border-white/10 shadow-[0_14px_28px_rgba(0,0,0,0.40),inset_0_1px_0_rgba(255,255,255,0.12)] overflow-hidden"
                                style={{
                                  width: `${reelBoxW}px`,
                                  height: `${reelBoxH}px`,
                                }}
                                aria-label={`reel-${i + 1}`}
                              >
                                <div
                                  class="absolute inset-0 pointer-events-none"
                                  style={{
                                    background:
                                      "radial-gradient(circle_at_50%_18%, rgba(255,255,255,0.14), transparent 56%)",
                                  }}
                                />

                                <div
                                  class="absolute left-1/2 -translate-x-1/2 top-0"
                                  style={{
                                    width: `${props.iconWidth}px`,
                                    height: "100%",
                                  }}
                                >
                                  <div
                                    id={`slot-strip-${i}`}
                                    class="absolute left-0 top-0"
                                    style={{
                                      width: `${props.iconWidth}px`,
                                      transform: "translate3d(0, 0px, 0)",
                                      willChange: "transform",
                                    }}
                                  >
                                    {Array.from({ length: props.repeatCount })
                                      .map((_, rep) => (
                                        <div key={rep}>
                                          {props.iconUrls.map((src, idx) => (
                                            <div
                                              key={`${rep}-${idx}`}
                                              class="flex items-center justify-center"
                                              style={{
                                                width: `${props.iconWidth}px`,
                                                height: `${props.iconHeight}px`,
                                              }}
                                            >
                                              <img
                                                src={src}
                                                draggable={false}
                                                class="select-none pointer-events-none"
                                                style={{
                                                  width: `${
                                                    Math.floor(
                                                      props.iconWidth *
                                                        REEL_SCALE * 0.92,
                                                    )
                                                  }px`,
                                                  height: `${
                                                    Math.floor(
                                                      props.iconHeight *
                                                        REEL_SCALE * 0.92,
                                                    )
                                                  }px`,
                                                  objectFit: "contain",
                                                  transform:
                                                    "translate3d(0,0,0)",
                                                  filter:
                                                    "drop-shadow(0 18px 30px rgba(0,0,0,0.42))",
                                                }}
                                              />
                                            </div>
                                          ))}
                                        </div>
                                      ))}
                                  </div>
                                </div>

                                <div
                                  class="absolute inset-0 pointer-events-none"
                                  style={{
                                    background: slotFadeOverlay,
                                  }}
                                />

                                <div
                                  class="absolute inset-0 pointer-events-none rounded-[18px]"
                                  style={{
                                    boxShadow:
                                      "inset 0 0 0 1px rgba(255,255,255,0.08), inset 0 18px 30px rgba(0,0,0,0.55), inset 0 -18px 30px rgba(0,0,0,0.55)",
                                  }}
                                />

                                <div
                                  class="absolute left-0 right-0 top-1/2 -translate-y-1/2 pointer-events-none border-y border-white/20"
                                  style={{
                                    height: `${
                                      props.iconHeight * REEL_SCALE
                                    }px`,
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div class="mt-6">
                        <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          {props.bets.map((b) => {
                            const active = b === props.bet;
                            const disabled = !props.canSpin;
                            const cls = betTheme(b, active) +
                              (disabled
                                ? " opacity-55 cursor-not-allowed"
                                : "");
                            return (
                              <button
                                type="button"
                                disabled={disabled}
                                onClick={() => props.setBet(b)}
                                class={cls}
                              >
                                <span class="relative z-10">{b}</span>
                                {active && (
                                  <span class="absolute inset-0 opacity-25 pointer-events-none">
                                    <span class="absolute -top-10 -left-10 w-24 h-24 rounded-full bg-white blur-2xl" />
                                    <span class="absolute -bottom-10 -right-10 w-24 h-24 rounded-full bg-white blur-2xl" />
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div class="mt-6">
                        <input
                          type="password"
                          id="api-key"
                          name="apiKey"
                          value={props.apiKeyInput}
                          onInput={(e) =>
                            props.setApiKeyInput(e.currentTarget.value)}
                          placeholder="paste api key here"
                          class="w-full px-4 py-3 rounded-xl bg-black/20 text-white border border-white/10 outline-none focus:border-white/25 text-lg placeholder:text-white/40"
                          spellcheck={false}
                          autocomplete="off"
                        />
                        {props.apiKeyInput
                          ? (
                            <div class="mt-2 text-[12px] text-white/60 tabular-nums">
                              {maskKey(props.apiKeyInput)}
                            </div>
                          )
                          : null}
                      </div>
                    </div>
                  </div>

                  <div class="lg:w-44 flex flex-col items-center justify-center">
                    <div class="w-full rounded-[26px] bg-gradient-to-b from-white/6 via-black/35 to-black/55 border border-white/10 grid place-items-center p-4 shadow-[0_18px_44px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.10)]">
                      <div class="relative w-28 h-60 sm:h-80">
                        <div class="absolute left-1/2 -translate-x-1/2 top-5 w-3.5 h-44 sm:h-60 rounded-full bg-white/10" />
                        <div
                          id="slot-lever-knob"
                          class="absolute left-1/2 top-3 rounded-full bg-gradient-to-b from-rose-500 to-red-800 shadow-[0_18px_40px_rgba(0,0,0,0.45),inset_0_2px_0_rgba(255,255,255,0.16)]"
                          style={{
                            width: "88px",
                            height: "88px",
                            transform: leverTransform,
                            transitionProperty: "transform",
                            transitionDuration: leverDur,
                            transitionTimingFunction: leverAnim === "return"
                              ? "cubic-bezier(.2,.8,.2,1)"
                              : "cubic-bezier(.2,.7,.2,1)",
                            willChange: "transform",
                            animation:
                              props.canSpin && props.spinState !== "spinning"
                                ? "knobGlow 2.2s ease-in-out infinite"
                                : "none",
                          }}
                        />

                        <button
                          type="button"
                          class={"absolute left-0 top-0 w-28 h-60 sm:h-80 rounded-[22px] " +
                            (props.canSpin
                              ? "cursor-pointer"
                              : "cursor-not-allowed")}
                          disabled={!props.canSpin}
                          onClick={() => {
                            try {
                              if (!props.canSpin) return;

                              if (leverTRef.current != null) {
                                globalThis.clearTimeout(leverTRef.current);
                                leverTRef.current = null;
                              }

                              setLeverAnim("down");
                              leverTRef.current = globalThis.setTimeout(() => {
                                setLeverAnim("return");
                                leverTRef.current = globalThis.setTimeout(
                                  () => {
                                    setLeverAnim("idle");
                                    leverTRef.current = null;
                                  },
                                  240,
                                );
                              }, 150);

                              props.onSpin();
                            } catch (e) {
                              console.error(e);
                            }
                          }}
                          aria-label="spin"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div class="h-3 bg-gradient-to-b from-black/0 via-black/30 to-black/0 mt-6" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Winner show={showWinner} amount={props.result?.payout ?? 0} />
    </div>
  );
}
