import { CalcMode } from "../../../utils/arbitrage_calculator.ts";

interface CalculationModeToggleProps {
  mode: CalcMode;
  setMode: (mode: CalcMode) => void;
}

export default function CalculationModeToggle(
  { mode, setMode }: CalculationModeToggleProps,
) {
  const modes: {
    id: CalcMode;
    label: string;
    description: string;
    tooltip: string;
  }[] = [
    {
      id: "average",
      label: "Average",
      description: "Show cost to average", // Changed description for clarity
      tooltip:
        "For correlated markets (bet YES on A, NO on B). Bets to meet at the simple average of the two probabilities. Shows result even if not profitable.", // Updated tooltip
    },
    {
      id: "balanced",
      label: "Balanced",
      description: "Optimal meet-in-the-middle",
      tooltip:
        "For correlated markets (bet YES on A, NO on B). Finds the optimal meeting point that maximizes profit from a fully hedged position. This is the recommended mode.",
    },
    {
      id: "oneSided",
      label: "One-Sided",
      description: "Maximizes profit (one-sided)",
      tooltip:
        "For correlated markets (bet YES on A, NO on B). Finds the maximum number of shares you can extract, which often involves only betting on the cheaper market.",
    },
    {
      id: "horseRace",
      label: "Horse Race",
      description: "For over-round books",
      tooltip:
        "For mutually exclusive markets where the combined YES probability is > 100%. Calculates the profit from betting NO on both markets.",
    },
  ];

  const baseButtonClass =
    "w-full py-1.5 px-2 text-xs font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900";
  const activeButtonClass = "bg-blue-600 text-white focus:ring-blue-500";
  const inactiveButtonClass =
    "bg-gray-700 text-gray-300 hover:bg-gray-600 focus:ring-gray-500";

  return (
    <div class="mt-6">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Adjusted grid-cols to 4 */}
        {modes.map((m) => (
          <div key={m.id} class="text-center">
            <button
              type="button"
              onClick={() => setMode(m.id)}
              class={`${baseButtonClass} ${
                mode === m.id ? activeButtonClass : inactiveButtonClass
              }`}
              title={m.tooltip}
            >
              {m.label}
            </button>
            <p class="text-[11px] text-gray-500 mt-1 px-1">
              {m.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
