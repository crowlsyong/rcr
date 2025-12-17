// islands/games/slots/SlotsUI.tsx
import { useEffect, useRef, useState } from "preact/hooks";
import Winner from "./Winner.tsx";

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

  apiKey: string;
  setApiKey: (v: string) => void;

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

function betTheme(bet: number, active: boolean) {
  const base =
    "relative overflow-hidden select-none rounded-2xl border font-extrabold tabular-nums tracking-wide transition " +
    "active:translate-y-[1px] " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ";

  const commonEnabled = "cursor-pointer hover:-translate-y-[1px]";

  const themes: Record<number, { on: string; off: string }> = {
    50: {
      on:
        "bg-white/80 text-black border-white shadow-[0_10px_30px_rgba(255,255,255,0.10)]",
      off:
        "bg-white/10 text-white border-white/15 hover:border-white/30 hover:bg-white/15",
    },
    100: {
      on:
        "bg-gradient-to-b from-amber-300 to-orange-500 text-black border-amber-200/60 shadow-[0_14px_38px_rgba(251,146,60,0.22)]",
      off:
        "bg-gradient-to-b from-amber-500/15 to-orange-500/10 text-white border-amber-400/20 hover:border-amber-300/35 hover:from-amber-500/20 hover:to-orange-500/15",
    },
    250: {
      on:
        "bg-gradient-to-b from-sky-300 to-blue-600 text-white border-sky-200/60 shadow-[0_14px_38px_rgba(59,130,246,0.25)]",
      off:
        "bg-gradient-to-b from-sky-500/15 to-blue-600/10 text-white border-sky-400/20 hover:border-sky-300/35 hover:from-sky-500/20 hover:to-blue-600/15",
    },
    1000: {
      on:
        "bg-gradient-to-b from-fuchsia-300 to-violet-700 text-white border-fuchsia-200/60 shadow-[0_14px_38px_rgba(139,92,246,0.28)]",
      off:
        "bg-gradient-to-b from-fuchsia-500/15 to-violet-700/10 text-white border-fuchsia-400/20 hover:border-fuchsia-300/35 hover:from-fuchsia-500/20 hover:to-violet-700/15",
    },
    10000: {
      on:
        "bg-gradient-to-b from-emerald-300 to-green-700 text-white border-emerald-200/60 shadow-[0_14px_38px_rgba(16,185,129,0.28)]",
      off:
        "bg-gradient-to-b from-emerald-500/15 to-green-700/10 text-white border-emerald-400/20 hover:border-emerald-300/35 hover:from-emerald-500/20 hover:to-green-700/15",
    },
  };

  const t = themes[bet] ?? themes[50];
  const size = "px-5 py-4 sm:px-6 sm:py-4 text-lg sm:text-xl";
  const face = active ? t.on : t.off;

  return base + " " + size + " " + face + " " + commonEnabled;
}

export default function SlotsUI(props: Props) {
  const showWinner = !!props.result?.win;
  const isWin2 = props.result?.win &&
    props.result.combo[0] === props.result.combo[2];

  const reelBoxW = props.iconWidth + 8;
  const reelBoxH = props.iconHeight;

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
    ? "translate3d(-50%, 120px, 0)"
    : leverAnim === "return"
    ? "translate3d(-50%, 0px, 0)"
    : "translate3d(-50%, 0px, 0)";

  const leverDur = leverAnim === "down"
    ? "140ms"
    : leverAnim === "return"
    ? "220ms"
    : "0ms";

  const statusText = props.error ?? props.status ?? "";
  const payoutText = props.result?.win
    ? `+${props.result.payout}`
    : props.result
    ? "+0"
    : "";

  return (
    <div class="w-full grid place-items-center px-3 sm:px-4 slots-body text-[1.15rem] leading-relaxed">
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes slotsWin1{0%{filter:saturate(1.25) brightness(1.1)}100%{filter:saturate(1) brightness(1)}}
@keyframes slotsWin2{0%{filter:contrast(1.15) brightness(1.15)}100%{filter:contrast(1) brightness(1)}}
.slotsWin1{animation:slotsWin1 200ms steps(2,end) infinite}
.slotsWin2{animation:slotsWin2 200ms steps(2,end) infinite}
@keyframes knobGlow{0%{filter:brightness(1)}50%{filter:brightness(1.08)}100%{filter:brightness(1)}}
`,
        }}
      />

      <div class="w-5xl">
        <div class="w-5xl border border-white/10 bg-black/90 shadow-2xl overflow-hidden">
          <div class="px-4 sm:px-6 py-4 sm:py-5 border-b border-white/10 flex items-center justify-between gap-4">
            <div class="min-w-0">
              <div class="flex items-baseline gap-3">
                <div class="text-3xl sm:text-4xl tracking-tight slots-title text-white">
                  slots
                </div>
                <div class="hidden sm:block text-base text-white/60">
                  space / enter or lever
                </div>
              </div>
              <div class="sm:hidden text-sm text-white/60">
                tap lever or press space/enter
              </div>
            </div>

            <div class="shrink-0 text-lg">
              <span class="text-white/60">mana</span>{" "}
              <span class="font-semibold tabular-nums text-white">
                {props.result?.win
                  ? `+${props.result.payout}`
                  : props.result
                  ? "+0"
                  : ""}
              </span>
            </div>
          </div>

          <div class="p-4 sm:p-8">
            <div class="flex flex-col sm:flex-row items-stretch gap-4 sm:gap-6">
              <div class="flex-1 min-w-0">
                <div
                  class={"rounded-3xl bg-black/30 border border-white/10 p-4 sm:p-6 ring-1 ring-white/10 " +
                    (props.spinState === "spinning"
                      ? "ring-2 ring-white/20"
                      : "") +
                    (props.result?.win
                      ? (isWin2 ? " slotsWin2" : " slotsWin1")
                      : "")}
                >
                  <div class="flex items-center justify-end mb-4 gap-3">
                    <div class="text-lg sm:text-xl tabular-nums">
                      {payoutText
                        ? (
                          <span
                            class={props.result?.win
                              ? "font-black text-white"
                              : "text-white/65"}
                          >
                            {payoutText}
                          </span>
                        )
                        : null}
                    </div>
                  </div>

                  <div class="flex items-center justify-center gap-2 sm:gap-4">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        class="relative rounded-2xl bg-black/35 border border-white/10 shadow-lg overflow-hidden"
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
                              "linear-gradient(rgba(0,0,0,0.60) 0%, transparent 28%, transparent 72%, rgba(0,0,0,0.60) 100%)",
                          }}
                        />

                        <div
                          id={`slot-strip-${i}`}
                          class="absolute left-0 top-0"
                          style={{
                            width: `${props.iconWidth}px`,
                            transform: "translate3d(0, 0px, 0)",
                            willChange: "transform",
                          }}
                        >
                          {Array.from({ length: props.repeatCount }).map((
                            _,
                            rep,
                          ) => (
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
                                        Math.floor(props.iconWidth * 0.92)
                                      }px`,
                                      height: `${
                                        Math.floor(props.iconHeight * 0.92)
                                      }px`,
                                      objectFit: "contain",
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>

                        <div
                          class="absolute left-0 right-0 top-1/2 -translate-y-1/2 pointer-events-none border-y border-white/25"
                          style={{ height: `${props.iconHeight}px` }}
                        />
                      </div>
                    ))}
                  </div>

                  {statusText
                    ? (
                      <div class="mt-5 text-lg text-white/75 truncate">
                        {statusText}
                      </div>
                    )
                    : null}

                  <div class="mt-6">
                    <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {props.bets.map((b) => {
                        const active = b === props.bet;
                        const disabled = !props.canSpin;
                        const cls = betTheme(b, active) +
                          (disabled ? " opacity-55 cursor-not-allowed" : "");
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
                      value={props.apiKey}
                      onInput={(e) =>
                        props.setApiKey(
                          (e.currentTarget as HTMLInputElement).value,
                        )}
                      placeholder="paste api key here"
                      type="password"
                      class="w-full px-4 py-3 rounded-xl bg-black/20 text-white border border-white/10 outline-none focus:border-white/25 text-lg placeholder:text-white/40"
                      spellcheck={false}
                      autocomplete="off"
                    />
                  </div>
                </div>
              </div>

              <div class="sm:w-40 flex flex-col items-center justify-center">
                <div class="w-full rounded-3xl bg-black/30 border border-white/10 grid place-items-center p-3 sm:p-0">
                  <div class="relative w-24 h-56 sm:h-72">
                    <div class="absolute left-1/2 -translate-x-1/2 top-4 w-3 h-40 sm:h-56 rounded-full bg-white/10" />
                    <div
                      id="slot-lever-knob"
                      class="absolute left-1/2 top-2 w-20 h-20 rounded-full bg-red-800 shadow-xl"
                      style={{
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
                      class={"absolute left-0 top-0 w-24 h-56 sm:h-72 rounded-2xl " +
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
                            leverTRef.current = globalThis.setTimeout(() => {
                              setLeverAnim("idle");
                              leverTRef.current = null;
                            }, 240);
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
          </div>
        </div>
      </div>

      <Winner show={showWinner} amount={props.result?.payout ?? 0} />
    </div>
  );
}
