// islands/games/slots/About.tsx
const JACKPOT_MULT = [100, 30, 8, 4, 2];
const PAIR_MULT = [5, 3.4, 2.3, 1.1, 0.6];

const ROWS = [
  { icon: 1, jackpot1in: 3375.0, pair1in: 120.54 },
  { icon: 2, jackpot1in: 843.75, pair1in: 41.16 },
  { icon: 3, jackpot1in: 187.5, pair1in: 23.44 },
  { icon: 4, jackpot1in: 52.73, pair1in: 9.59 },
  { icon: 5, jackpot1in: 18.75, pair1in: 5.36 },
];

function fmt(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function About() {
  return (
    <div class="w-full max-w-2xl mx-auto px-3 sm:px-4">
      <div class="rounded-2xl border border-white/10 bg-black/80 shadow-xl overflow-hidden">
        <div class="px-4 py-3 border-b border-white/10 flex items-baseline justify-between">
          <div class="text-xl font-black text-white tracking-tight">
            odds
          </div>
          <div class="text-xs text-white/50">
            multipliers shown as x
          </div>
        </div>

        <div class="p-3 sm:p-4">
          <table class="w-full table-fixed border-collapse text-sm">
            <thead>
              <tr class="text-left text-[11px] tracking-widest uppercase text-white/50">
                <th class="pb-2 pr-2 w-10">#</th>
                <th class="pb-2 pr-2">jackpot</th>
                <th class="pb-2 pr-2 w-14">x</th>
                <th class="pb-2 pr-2">pair</th>
                <th class="pb-2 w-14">x</th>
              </tr>
            </thead>

            <tbody>
              {ROWS.map((r, i) => (
                <tr
                  key={r.icon}
                  class={i % 2 ? "bg-white/5" : ""}
                >
                  <td class="py-1.5 pr-2 font-bold text-white/80">
                    {r.icon}
                  </td>
                  <td class="py-1.5 pr-2 tabular-nums text-white/70">
                    1 in {fmt(r.jackpot1in)}
                  </td>
                  <td class="py-1.5 pr-2 tabular-nums font-bold text-white">
                    {fmt(JACKPOT_MULT[i])}x
                  </td>
                  <td class="py-1.5 pr-2 tabular-nums text-white/70">
                    1 in {fmt(r.pair1in)}
                  </td>
                  <td class="py-1.5 tabular-nums font-bold text-white">
                    {fmt(PAIR_MULT[i])}x
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div class="mt-2 text-[12px] text-white/45">
            jackpot = three of a kind · pair = any adjacent match
          </div>
        </div>
      </div>
    </div>
  );
}
