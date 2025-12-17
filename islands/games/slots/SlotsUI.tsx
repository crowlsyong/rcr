// islands/games/slots/SlotsUI.tsx
import { useMemo } from "preact/hooks";
import Winner from "./Winner.tsx";

type SpinState = "idle" | "spinning" | "settling" | "done";

type Props = {
  icons: readonly string[];
  apiKey: string;
  setApiKey: (v: string) => void;
  bet: number;
  setBet: (b: any) => void;
  bets: readonly number[];
  reels: [string, string, string];
  spinState: SpinState;
  canSpin: boolean;
  leverPulled: boolean;
  status: string;
  error: string | null;
  result:
    | null
    | {
      win: boolean;
      combo: [string, string, string];
      payout: number;
      reason: string;
      payoutSent: boolean;
    };
  onSpin: () => void;
};

function maskKey(k: string) {
  if (!k) return "empty";
  if (k.length <= 6) return k;
  return `${k.slice(0, 3)}…${k.slice(-3)}`;
}

function betTier(b: number) {
  if (b >= 1000) return 4;
  if (b >= 500) return 3;
  if (b >= 150) return 2;
  if (b >= 100) return 1;
  return 0;
}

export default function SlotsUI(props: Props) {
  const showWinner = !!props.result?.win;
  const glow = props.spinState === "spinning" || showWinner;

  const headline = useMemo(() => {
    if (props.spinState === "spinning") return "SPINNING";
    if (props.spinState === "settling") return "SETTLING";
    if (props.result?.win) return "JACKPOT";
    if (props.result && !props.result.win) return "TRY AGAIN";
    return "READY";
  }, [props.spinState, props.result]);

  const machineWidth = "w-full max-w-md md:max-w-none";
  const canPull = props.canSpin;

  return (
    <div class="relative min-h-[100svh] overflow-hidden">
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes bulb {
  0%, 100% { opacity: 0.55; transform: translateY(0px); }
  50% { opacity: 1; transform: translateY(-1px); }
}
@keyframes chrome-sheen {
  0% { transform: translateX(-35%) skewX(-18deg); opacity: 0; }
  20% { opacity: 0.55; }
  60% { opacity: 0.35; }
  100% { transform: translateX(135%) skewX(-18deg); opacity: 0; }
}
@keyframes lever-idle {
  0%, 100% { transform: rotate(-6deg); }
  50% { transform: rotate(-2deg); }
}
@keyframes lever-pull {
  0% { transform: translateY(0px) rotate(-6deg); }
  35% { transform: translateY(18px) rotate(12deg); }
  100% { transform: translateY(0px) rotate(-6deg); }
}
@keyframes reel-wobble {
  0%, 100% { transform: translateY(0px) scale(1); }
  50% { transform: translateY(-2px) scale(1.01); }
}
@keyframes jackpot-glow {
  0%, 100% { opacity: 0.45; }
  50% { opacity: 0.95; }
}
`,
        }}
      />

      <div
        class={"pointer-events-none absolute inset-0 " + (glow ? "opacity-100" : "opacity-70")}
        style={{
          background:
            "radial-gradient(circle at 50% 15%, rgba(250,204,21,0.18), transparent 55%), radial-gradient(circle at 20% 70%, rgba(16,185,129,0.16), transparent 60%), radial-gradient(circle at 85% 70%, rgba(59,130,246,0.14), transparent 60%)",
          animation: glow ? "jackpot-glow 1.25s ease-in-out infinite" : "none",
        }}
      />

      <div class="relative px-4 py-8 md:px-8 md:py-10">
        <div class={"mx-auto " + machineWidth + " md:max-w-6xl"}>
          <div class="relative md:px-8">
            <div class="absolute inset-x-0 -top-10 h-24 pointer-events-none opacity-30 blur-2xl" style={{
              background:
                "linear-gradient(90deg, transparent, rgba(250,204,21,0.28), rgba(16,185,129,0.22), transparent)",
            }} />

            <div class="relative">
              <div class="relative rounded-[2.75rem] border border-gray-700/80 bg-gradient-to-b from-gray-900 via-gray-950 to-black shadow-[0_30px_120px_rgba(0,0,0,0.65)]">
                <div class="absolute inset-x-0 top-0 h-2 rounded-t-[2.75rem]" style={{
                  background:
                    "linear-gradient(90deg, rgba(250,204,21,0.0), rgba(250,204,21,0.85), rgba(16,185,129,0.7), rgba(59,130,246,0.55), rgba(250,204,21,0.0))",
                }} />

                <div class="absolute inset-0 rounded-[2.75rem] pointer-events-none" style={{
                  background:
                    "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.10), transparent 40%), radial-gradient(circle at 50% 110%, rgba(0,0,0,0.65), transparent 55%)",
                }} />

                <div
                  class="absolute -inset-x-10 top-14 h-16 pointer-events-none opacity-25"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.25), rgba(255,255,255,0))",
                    animation: "chrome-sheen 4.2s ease-in-out infinite",
                  }}
                />

                <div class="relative">
                  <div class="px-6 pt-7 pb-4 md:px-10 md:pt-8">
                    <div class="flex items-start justify-between gap-4">
                      <div>
                        <div class="text-[11px] tracking-[0.30em] text-gray-400 font-extrabold">
                          RISKBOT SLOTS
                        </div>
                        <div class="mt-1 text-3xl font-black text-gray-100 leading-tight">
                          {headline}
                        </div>
                        <div class="mt-2 text-xs text-gray-400">
                          {props.status || "Sends mana bet to RISKBOT, pays out on wins"}
                        </div>
                      </div>

                      <div class="shrink-0 flex flex-col items-end gap-2">
                        <div class="flex items-center gap-2">
                          <div
                            class={"h-2.5 w-2.5 rounded-full border border-black/30 " + (glow ? "bg-emerald-400 shadow-[0_0_14px_rgba(16,185,129,0.65)]" : "bg-gray-700")}
                            style={{ animation: glow ? "bulb 1.1s ease-in-out infinite" : "none" }}
                          />
                          <div
                            class={"h-2.5 w-2.5 rounded-full border border-black/30 " + (props.spinState === "spinning" ? "bg-amber-300 shadow-[0_0_14px_rgba(250,204,21,0.7)]" : "bg-gray-700")}
                            style={{ animation: props.spinState === "spinning" ? "bulb 0.85s ease-in-out infinite" : "none" }}
                          />
                          <div
                            class={"h-2.5 w-2.5 rounded-full border border-black/30 " + (showWinner ? "bg-sky-300 shadow-[0_0_14px_rgba(125,211,252,0.65)]" : "bg-gray-700")}
                            style={{ animation: showWinner ? "bulb 0.95s ease-in-out infinite" : "none" }}
                          />
                        </div>
                        <div class="text-[10px] tracking-widest text-gray-500 font-extrabold">
                          POWER • SPIN • WIN
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="px-6 md:px-10">
                    <div class="rounded-3xl border border-gray-700 bg-gradient-to-b from-gray-950 to-black shadow-inner p-4 md:p-5">
                      <div class="flex items-center justify-between">
                        <div class="text-xs font-extrabold tracking-widest text-gray-300">
                          REELS
                        </div>
                        <div class="text-xs text-gray-500 font-semibold">
                          {props.result?.win ? `+${props.result.payout}` : props.result ? `-${props.bet}` : ""}
                        </div>
                      </div>

                      <div class="mt-3 relative rounded-3xl border border-gray-700 bg-black/70 p-3 md:p-4 overflow-hidden">
                        <div class="absolute inset-0 pointer-events-none opacity-60" style={{
                          background:
                            "linear-gradient(to bottom, rgba(255,255,255,0.12), transparent 18%, transparent 82%, rgba(255,255,255,0.12))",
                        }} />

                        <div class="absolute inset-0 pointer-events-none opacity-30" style={{
                          background:
                            "radial-gradient(circle at 50% 50%, rgba(250,204,21,0.10), transparent 55%)",
                        }} />

                        <div class="grid grid-cols-3 gap-3 md:gap-4 relative">
                          {props.reels.map((v, idx) => (
                            <div
                              key={`${idx}-${v}`}
                              class={
                                "h-20 md:h-24 rounded-2xl border border-gray-700 bg-gradient-to-b from-gray-900 to-gray-950 " +
                                "flex items-center justify-center text-4xl md:text-5xl select-none shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] " +
                                (props.spinState === "spinning" ? "opacity-95" : "")
                              }
                              style={{
                                filter: props.spinState === "spinning" ? "blur(0.25px)" : "none",
                                animation: props.spinState === "spinning" ? "reel-wobble 0.22s ease-in-out infinite" : "none",
                              }}
                            >
                              {v}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div class="mt-3">
                        {props.error && (
                          <div class="text-xs text-red-400 font-semibold">{props.error}</div>
                        )}
                        {!props.error && (
                          <div class="text-xs text-gray-500">
                            Key:{" "}
                            <span class="text-gray-300 font-semibold">{maskKey(props.apiKey)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div class="px-6 mt-5 md:px-10 md:mt-6">
                    <div class="rounded-3xl border border-gray-700 bg-gradient-to-b from-gray-950/70 to-black/70 shadow-inner p-4 md:p-5">
                      <div class="text-xs font-extrabold tracking-widest text-gray-300 mb-3">
                        BET
                      </div>

                      <div class="flex flex-wrap gap-2 md:gap-3">
                        {props.bets.map((b) => {
                          const active = b === props.bet;
                          const disabled = !props.canSpin;
                          const tier = betTier(b);

                          const base =
                            "select-none border font-black tracking-wide transition-all duration-200 ease-out " +
                            (disabled ? "opacity-50 cursor-not-allowed " : "cursor-pointer hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.99] ") +
                            (active ? "ring-2 ring-amber-300/35 " : "ring-0 ");

                          const tier0 =
                            "px-3 py-2 rounded-xl text-sm bg-black/40 border-gray-700 text-gray-200 hover:border-gray-500";
                          const tier1 =
                            "px-4 py-2.5 rounded-xl text-sm bg-gradient-to-b from-gray-900 to-black border-gray-600 text-gray-100 shadow-[0_10px_22px_rgba(0,0,0,0.25)] hover:border-gray-400";
                          const tier2 =
                            "px-4 py-3 rounded-2xl text-[15px] bg-gradient-to-b from-emerald-500/15 to-black border-emerald-400/35 text-emerald-100 shadow-[0_14px_34px_rgba(16,185,129,0.12)] hover:border-emerald-300/60";
                          const tier3 =
                            "px-5 py-3.5 rounded-2xl text-[15px] bg-gradient-to-b from-amber-400/18 to-black border-amber-300/40 text-amber-100 shadow-[0_16px_40px_rgba(250,204,21,0.16)] hover:border-amber-200/70";
                          const tier4 =
                            "px-6 py-4 rounded-3xl text-base bg-gradient-to-b from-amber-300/25 via-emerald-500/12 to-black border-amber-200/55 text-gray-50 " +
                            "shadow-[0_20px_55px_rgba(250,204,21,0.18)] hover:shadow-[0_24px_65px_rgba(250,204,21,0.24)]";

                          const pick =
                            tier === 4 ? tier4 :
                            tier === 3 ? tier3 :
                            tier === 2 ? tier2 :
                            tier === 1 ? tier1 :
                            tier0;

                          return (
                            <button
                              type="button"
                              disabled={disabled}
                              onClick={() => props.setBet(b)}
                              class={base + pick}
                              style={{
                                transformOrigin: "center",
                              }}
                            >
                              {b}
                            </button>
                          );
                        })}
                      </div>

                      <div class="mt-5">
                        <div class="text-xs font-extrabold tracking-widest text-gray-300 mb-2">
                          API KEY
                        </div>
                        <input
                          value={props.apiKey}
                          onInput={(e) => props.setApiKey((e.currentTarget as HTMLInputElement).value)}
                          placeholder="paste key (never stored)"
                          type="password"
                          class="w-full px-4 py-3 rounded-2xl bg-black/50 text-gray-100 border border-gray-700 outline-none focus:border-gray-500 focus:ring-2 focus:ring-amber-300/20 transition"
                          spellcheck={false}
                          autocomplete="off"
                        />
                        <div class="mt-2 text-[11px] text-gray-500">
                          Stored only in memory for this tab
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="relative px-6 mt-5 pb-8 md:px-10 md:mt-6 md:pb-10">
                    <div class="rounded-3xl border border-gray-700 bg-gradient-to-b from-gray-900 to-gray-950 shadow-inner p-4 md:p-5">
                      <div class="text-xs font-extrabold tracking-widest text-gray-300 mb-2">
                        TRAY
                      </div>

                      <div class="flex items-center justify-between gap-3">
                        <div class="text-xs text-gray-300 font-semibold">
                          {props.result
                            ? (props.result.win
                              ? `WIN ${props.result.payout} mana`
                              : `LOSS ${props.bet} mana`)
                            : "—"}
                        </div>

                        <div class="text-xs text-gray-500">
                          {props.result?.win
                            ? (props.result.payoutSent ? "payout sent" : "payout failed")
                            : ""}
                        </div>
                      </div>

                      <div class="mt-4 flex gap-2 flex-wrap opacity-80">
                        {Array.from({ length: 12 }).map((_, i) => (
                          <div
                            key={i}
                            class={
                              "h-6 w-6 rounded-full border border-amber-300/25 bg-amber-400/10 " +
                              (showWinner ? "opacity-95" : "opacity-70")
                            }
                            style={{
                              animation: showWinner ? `bulb 0.9s ease-in-out ${i * 45}ms infinite` : "none",
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    <div class="absolute inset-x-0 -bottom-1 h-12 pointer-events-none opacity-70" style={{
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.85), transparent)",
                    }} />
                  </div>

                  <div class="absolute inset-x-0 bottom-0 h-10 pointer-events-none opacity-70" style={{
                    background: "linear-gradient(to top, rgba(0,0,0,0.9), transparent)",
                  }} />
                </div>
              </div>

              <div class="absolute -right-6 top-24 md:-right-2 md:top-28">
                <div class="relative h-64 w-20 md:h-72 md:w-24">
                  <div class="absolute right-7 top-10 h-44 w-4 rounded-full border border-gray-200/20 bg-gradient-to-b from-gray-200/70 via-gray-300/30 to-gray-600/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]" />

                  <button
                    type="button"
                    disabled={!canPull}
                    onClick={() => props.onSpin()}
                    class={
                      "absolute right-1 top-2 h-16 w-16 md:h-20 md:w-20 rounded-full border " +
                      "transition-all duration-200 ease-out select-none " +
                      (canPull
                        ? "cursor-pointer border-red-200/25 bg-gradient-to-b from-red-400 to-red-700 shadow-[0_0_26px_rgba(239,68,68,0.35)] hover:shadow-[0_0_34px_rgba(239,68,68,0.45)] active:scale-[0.98]"
                        : "cursor-not-allowed border-gray-700 bg-gradient-to-b from-gray-800 to-gray-900 opacity-70")
                    }
                    style={{
                      transformOrigin: "60% 80%",
                      animation: canPull
                        ? (props.leverPulled ? "lever-pull 320ms cubic-bezier(.2,.9,.2,1) both" : "lever-idle 1.8s ease-in-out infinite")
                        : "none",
                    }}
                    aria-label="Pull lever"
                  >
                    <div class="absolute inset-0 rounded-full pointer-events-none" style={{
                      background:
                        "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.35), transparent 55%)",
                    }} />
                    <div class="absolute inset-0 flex items-center justify-center">
                      <div
                        class={
                          "px-3 py-1.5 rounded-full text-[11px] md:text-xs font-black tracking-[0.25em] " +
                          (canPull ? "text-white/95 bg-black/25 border border-white/10" : "text-gray-300 bg-black/25 border border-white/5")
                        }
                      >
                        PULL
                      </div>
                    </div>
                  </button>

                  <div
                    class={"absolute right-2 top-20 h-3 w-16 rounded-full " + (props.leverPulled ? "opacity-60" : "opacity-30")}
                    style={{
                      background: "linear-gradient(90deg, rgba(148,163,184,0.15), rgba(148,163,184,0.45), rgba(148,163,184,0.15))",
                    }}
                  />

                  <div class="absolute right-7 top-[10.5rem] md:top-[11.5rem] h-28 w-4 rounded-full opacity-20 bg-black blur-sm" />
                </div>
              </div>
            </div>

            <div class="mt-5 text-center text-xs text-gray-500">
              House rules are server-side
            </div>
          </div>
        </div>
      </div>

      <Winner show={showWinner} amount={props.result?.payout ?? 0} />
    </div>
  );
}
