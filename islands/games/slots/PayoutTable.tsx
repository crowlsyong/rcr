// islands/games/slots/PayoutTable.tsx
type Row = {
  iconUrl: string;
  jackpot1in: number;
  jackpotMult: number;
  pair1in: number;
  pairMult: number;
};

function fmt(n: number) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function PayoutTable(props: { iconUrls: readonly string[] }) {
  const JACKPOT_MULT = [100, 30, 8, 4, 2] as const;
  const PAIR_MULT = [5, 3.4, 2.3, 1.1, 0.6] as const;

  const JACKPOT_1IN = [3375.0, 843.75, 187.5, 52.73, 18.75] as const;
  const PAIR_1IN = [120.54, 41.16, 23.44, 9.59, 5.36] as const;

  const rows: Row[] = [0, 1, 2, 3, 4].map((i) => ({
    iconUrl: props.iconUrls[i],
    jackpot1in: JACKPOT_1IN[i],
    jackpotMult: JACKPOT_MULT[i],
    pair1in: PAIR_1IN[i],
    pairMult: PAIR_MULT[i],
  }));

  return (
    <details class="rounded-[18px] border border-amber-200/12 bg-gradient-to-b from-[#141018] via-[#0f0b12] to-black shadow-[0_18px_48px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.08)] overflow-hidden group">
      <summary class="list-none cursor-pointer select-none px-4 py-3 flex items-center justify-between gap-3 bg-[linear-gradient(to_right,rgba(255,196,88,0.18),rgba(255,255,255,0.04),rgba(82,255,214,0.10))] border-b border-white/8">
        <div class="flex items-center gap-3">
          <div class="text-[12px] tracking-[0.18em] font-black text-white/90">
            PAYOUTS
          </div>
          <div class="text-[11px] text-white/65 tracking-wide">
            (collapsed)
          </div>
        </div>

        <div class="text-[11px] text-white/70 tracking-wide flex items-center gap-2">
          <span class="hidden sm:inline">3× = jackpot · adjacent = pair</span>
          <span class="inline-block w-6 text-center text-white/80 transition-transform duration-200 group-open:rotate-180">
            ▼
          </span>
        </div>
      </summary>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[640px] border-separate border-spacing-0">
          <thead>
            <tr class="text-[11px] uppercase tracking-wide">
              <th class="text-left py-2 px-3 text-white/70 border-b border-white/8">
                icon
              </th>
              <th class="text-right py-2 px-3 text-white/70 border-b border-white/8">
                jackpot 1 in
              </th>
              <th class="text-right py-2 px-3 text-white/70 border-b border-white/8">
                jackpot
              </th>
              <th class="text-right py-2 px-3 text-white/70 border-b border-white/8">
                pair 1 in
              </th>
              <th class="text-right py-2 px-3 text-white/70 border-b border-white/8">
                pair
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r, idx) => (
              <tr
                key={idx}
                class={idx % 2 === 0 ? "bg-white/[0.02]" : "bg-white/[0.05]"}
              >
                <td class="py-2 px-3 border-b border-white/6">
                  <div class="w-9 h-9 rounded-xl bg-black/35 border border-white/8 grid place-items-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                    <img
                      src={r.iconUrl}
                      draggable={false}
                      class="select-none pointer-events-none"
                      style={{
                        width: "30px",
                        height: "30px",
                        objectFit: "contain",
                        filter: "drop-shadow(0 10px 16px rgba(0,0,0,0.28))",
                      }}
                    />
                  </div>
                </td>

                <td class="py-2 px-3 border-b border-white/6 text-right tabular-nums text-white">
                  {fmt(r.jackpot1in)}
                </td>

                <td class="py-2 px-3 border-b border-white/6 text-right tabular-nums font-black">
                  <span class="px-2 py-0.5 rounded-lg bg-white/10 text-white border border-white/10">
                    {r.jackpotMult}x
                  </span>
                </td>

                <td class="py-2 px-3 border-b border-white/6 text-right tabular-nums text-white">
                  {fmt(r.pair1in)}
                </td>

                <td class="py-2 px-3 border-b border-white/6 text-right tabular-nums font-black">
                  <span class="px-2 py-0.5 rounded-lg bg-white/10 text-white border border-white/10">
                    {r.pairMult}x
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
