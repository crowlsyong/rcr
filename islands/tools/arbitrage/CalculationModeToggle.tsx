interface CalculationModeToggleProps {
  mode: "equilibrium" | "average";
  setMode: (mode: "equilibrium" | "average") => void;
}

export default function CalculationModeToggle(
  { mode, setMode }: CalculationModeToggleProps,
) {
  const baseButtonClass =
    "w-full py-1.5 px-3 text-xs font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900";
  const activeButtonClass = "bg-blue-600 text-white focus:ring-blue-500";
  const inactiveButtonClass =
    "bg-gray-700 text-gray-300 hover:bg-gray-600 focus:ring-gray-500";

  return (
    <div class="mt-6">
      <div class="flex gap-3">
        <div class="flex-1 text-center">
          <button
            type="button"
            onClick={() => setMode("equilibrium")}
            class={`${baseButtonClass} ${
              mode === "equilibrium" ? activeButtonClass : inactiveButtonClass
            }`}
          >
            Equilibrium
          </button>
          <p class="text-[11px] text-gray-500 mt-1 px-1">
            Maximizes profit
          </p>
        </div>
        <div class="flex-1 text-center">
          <button
            type="button"
            onClick={() => setMode("average")}
            class={`${baseButtonClass} ${
              mode === "average" ? activeButtonClass : inactiveButtonClass
            }`}
          >
            Average
          </button>
          <p class="text-[11px] text-gray-500 mt-1 px-1">
            The simple average (no volume weighting)
          </p>
        </div>
      </div>
    </div>
  );
}
