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
  if (!k) return "empty";
  if (k.length <= 6) return k;
  return `${k.slice(0, 3)}…${k.slice(-3)}`;
}

export default function SlotsUI(props: Props) {
  const showWinner = !!props.result?.win;
  const isWin2 =
    props.result?.win && props.result.combo[0] === props.result.combo[2];

  const reelBoxW = props.iconWidth + 8;
  const reelBoxH = props.iconHeight;

  const [leverAnim, setLeverAnim] = useState<"idle" | "down" | "return">("idle");
  const leverTRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (leverTRef.current != null) globalThis.clearTimeout(leverTRef.current);
      leverTRef.current = null;
    };
  }, []);

  const leverTransform =
    leverAnim === "down"
      ? "translate3d(-50%, 140px, 0)"
      : leverAnim === "return"
      ? "translate3d(-50%, 0px, 0)"
      : "translate3d(-50%, 0px, 0)";

  const leverDur =
    leverAnim === "down" ? "140ms" : leverAnim === "return" ? "220ms" : "0ms";

  return (
    <div class="w-full min-h-[70svh] grid place-items-center px-4 slots-body text-[1.15rem] leading-relaxed">
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes slotsWin1{0%{filter:saturate(1.2) brightness(1.1)}100%{filter:saturate(1) brightness(1)}}
@keyframes slotsWin2{0%{filter:contrast(1.1) brightness(1.15)}100%{filter:contrast(1) brightness(1)}}
.slotsWin1{animation:slotsWin1 200ms steps(2,end) infinite}
.slotsWin2{animation:slotsWin2 200ms steps(2,end) infinite}
`,
        }}
      />

      <div class="w-full max-w-3xl">
        <div class="rounded-3xl border border-white/10 bg-black/90 shadow-2xl overflow-hidden">
          <div class="px-6 py-5 border-b border-white/10 flex items-center justify-between">
            <div class="flex items-baseline gap-3">
              <div class="text-3xl sm:text-4xl tracking-tight slots-title text-white">
                slots
              </div>
              <div class="text-base text-white/60">
                space / enter or lever
              </div>
            </div>

            <div class="text-lg">
              <span class="text-white/60">mana</span>{" "}
              <span class="font-semibold tabular-nums text-white">
                {props.result?.win ? `+${props.result.payout}` : "—"}
              </span>
            </div>
          </div>

          <div class="p-6 sm:p-8">
            <div class="flex items-stretch gap-5 sm:gap-6">
              <div class="flex-1 min-w-0">
                <div
                  class={
                    "rounded-3xl bg-black/30 border border-white/10 p-6 ring-1 ring-white/10 " +
                    (props.spinState === "spinning"
                      ? "ring-2 ring-white/20"
                      : "") +
                    (props.result?.win
                      ? isWin2
                        ? " slotsWin2"
                        : " slotsWin1"
                      : "")
                  }
                >
                  <div class="flex items-center justify-between mb-4">
                    <div class="text-lg text-white/75">
                      result
                    </div>
                    <div class="text-lg sm:text-xl tabular-nums">
                      {props.result == null ? (
                        <span class="text-white/50">—</span>
                      ) : props.result.win ? (
                        <span class="font-semibold text-white">
                          +{props.result.payout}
                        </span>
                      ) : (
                        <span class="text-white/50">+0</span>
                      )}
                    </div>
                  </div>

                  <div class="flex items-center justify-center gap-3 sm:gap-4">
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
                              "linear-gradient(rgba(0,0,0,0.55) 0%, transparent 28%, transparent 72%, rgba(0,0,0,0.55) 100%)",
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
                          {Array.from({ length: props.repeatCount }).map(
                            (_, rep) => (
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
                                        width: `${Math.floor(props.iconWidth * 0.92)}px`,
                                        height: `${Math.floor(props.iconHeight * 0.92)}px`,
                                        objectFit: "contain",
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                            ),
                          )}
                        </div>

                        <div
                          class="absolute left-0 right-0 top-1/2 -translate-y-1/2 pointer-events-none border-y border-white/25"
                          style={{ height: `${props.iconHeight}px` }}
                        />
                      </div>
                    ))}
                  </div>

                  <div class="mt-5 flex items-center justify-between gap-3">
                    <div class="text-lg text-white/75 truncate">
                      {props.error ?? props.status ?? "pull to spin"}
                    </div>

                    <div class="text-base text-white/65">
                      key{" "}
                      <span class="text-white/80">
                        {maskKey(props.apiKey)}
                      </span>
                    </div>
                  </div>

                  <div class="mt-6">
                    <div class="text-base tracking-widest text-white/70 mb-2 slots-title">
                      bet
                    </div>
                    <div class="flex flex-wrap gap-3">
                      {props.bets.map((b) => {
                        const active = b === props.bet;
                        const disabled = !props.canSpin;
                        return (
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => props.setBet(b)}
                            class={
                              "px-5 py-3 rounded-xl border text-lg font-semibold transition " +
                              (disabled
                                ? "opacity-50 cursor-not-allowed "
                                : "cursor-pointer hover:-translate-y-[1px] active:translate-y-0 ") +
                              (active
                                ? "bg-white/90 text-black border-white"
                                : "bg-black/20 text-white/85 border-white/10 hover:border-white/25")
                            }
                          >
                            {b}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div class="mt-6">
                    <div class="text-base tracking-widest text-white/70 mb-2 slots-title">
                      api key
                    </div>
                    <input
                      value={props.apiKey}
                      onInput={(e) =>
                        props.setApiKey(
                          (e.currentTarget as HTMLInputElement).value,
                        )}
                      placeholder="paste key"
                      type="password"
                      class="w-full px-4 py-3 rounded-xl bg-black/20 text-white border border-white/10 outline-none focus:border-white/25 text-lg"
                      spellcheck={false}
                      autocomplete="off"
                    />
                  </div>
                </div>
              </div>

              <div class="w-32 sm:w-40 flex flex-col items-center justify-center">
                <div class="w-full h-full rounded-3xl bg-black/30 border border-white/10 grid place-items-center">
                  <div class="relative w-24 h-72">
                    <div class="absolute left-1/2 -translate-x-1/2 top-4 w-3 h-56 rounded-full bg-white/10" />
                    <div
                      id="slot-lever-knob"
                      class="absolute left-1/2 top-2 w-20 h-20 rounded-full bg-gradient-to-b from-white to-white/70 shadow-xl"
                      style={{
                        transform: leverTransform,
                        transitionProperty: "transform",
                        transitionDuration: leverDur,
                        transitionTimingFunction:
                          leverAnim === "return"
                            ? "cubic-bezier(.2,.8,.2,1)"
                            : "cubic-bezier(.2,.7,.2,1)",
                        willChange: "transform",
                      }}
                    />
                    <button
                      type="button"
                      class={
                        "absolute left-0 top-0 w-24 h-72 rounded-2xl " +
                        (props.canSpin ? "cursor-pointer" : "cursor-not-allowed")
                      }
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
                    />
                  </div>
                </div>

                <div class="mt-3 text-base text-white/65 text-center">
                  lever
                </div>
              </div>
            </div>

            <div class="mt-6 grid grid-cols-3 gap-3 text-base leading-relaxed text-white/70">
              <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div class="text-white/80 mb-1">win rule</div>
                <div>any adjacent pair</div>
              </div>
              <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div class="text-white/80 mb-1">bonus</div>
                <div>3 of a kind pays more</div>
              </div>
              <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div class="text-white/80 mb-1">rare</div>
                <div>5000 mana jackpot</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Winner show={showWinner} amount={props.result?.payout ?? 0} />
    </div>
  );
}
