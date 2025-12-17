const JACKPOT_MULT = [250, 50, 10, 4, 2];
const PAIR_MULT = [10, 5, 3.5, 2.3, 1.6];

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
    <div class="w-full max-w-3xl mx-auto px-3 sm:px-4">
      <div class="rounded-3xl border border-white/10 bg-black/80 shadow-2xl overflow-hidden">
        <div class="px-4 sm:px-6 py-4 border-b border-white/10">
          <div class="text-2xl sm:text-3xl font-black text-white tracking-tight">
            odds
          </div>
          <div class="text-white/60 text-sm sm:text-base mt-1">
            multipliers shown as x
          </div>
        </div>

        <div class="p-4 sm:p-6">
          <div class="overflow-x-auto">
            <table class="min-w-[720px] w-full border-separate border-spacing-0">
              <thead>
                <tr class="text-left text-xs tracking-widest uppercase text-white/60">
                  <th class="py-3 px-3 border-b border-white/10">icon</th>
                  <th class="py-3 px-3 border-b border-white/10">
                    jackpot (1 in X)
                  </th>
                  <th class="py-3 px-3 border-b border-white/10">
                    jackpot returns
                  </th>
                  <th class="py-3 px-3 border-b border-white/10">
                    adjacent pair (1 in X)
                  </th>
                  <th class="py-3 px-3 border-b border-white/10">
                    adjacent pair returns
                  </th>
                </tr>
              </thead>

              <tbody>
                {ROWS.map((r, i) => (
                  <tr
                    key={r.icon}
                    class={"text-white/85 " +
                      (i % 2 === 0 ? "bg-white/0" : "bg-white/5")}
                  >
                    <td class="py-3 px-3 border-b border-white/10 font-extrabold">
                      {r.icon}
                    </td>
                    <td class="py-3 px-3 border-b border-white/10 tabular-nums">
                      {fmt(r.jackpot1in)}
                    </td>
                    <td class="py-3 px-3 border-b border-white/10 tabular-nums font-extrabold">
                      {fmt(JACKPOT_MULT[i])}x
                    </td>
                    <td class="py-3 px-3 border-b border-white/10 tabular-nums">
                      {fmt(r.pair1in)}
                    </td>
                    <td class="py-3 px-3 border-b border-white/10 tabular-nums font-extrabold">
                      {fmt(PAIR_MULT[i])}x
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div class="mt-4 text-white/55 text-sm">
            jackpots use JACKPOT_MULT; adjacent pairs use PAIR_MULT
          </div>
        </div>
      </div>
    </div>
  );
}
