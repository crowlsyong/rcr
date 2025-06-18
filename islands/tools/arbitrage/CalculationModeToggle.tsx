// islands/tools/arbitrage/CalculationModeToggle.tsx

type Mode = "classic" | "equilibrium" | "average" | "horseRace";

interface CalculationModeToggleProps {
  mode: Mode;
  setMode: (mode: Mode) => void;
}

export default function CalculationModeToggle(
  { mode, setMode }: CalculationModeToggleProps,
) {
  const modes: { id: Mode; label: string; description: string }[] = [
    {
      id: "equilibrium",
      label: "Equilibrium",
      description: "Maximizes profit",
    },
    {
      id: "average",
      label: "Average",
      description: "Profitable version of Classic",
    },
    {
      id: "horseRace",
      label: "Horse Race",
      description: "For mutually exclusive markets (bet NO on both)",
    },
    {
      id: "classic",
      label: "Classic",
      description: "Cost to meet at the average, ignores profit",
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
        {modes.map((m) => (
          <div key={m.id} class="text-center">
            <button
              type="button"
              onClick={() => setMode(m.id)}
              class={`${baseButtonClass} ${
                mode === m.id ? activeButtonClass : inactiveButtonClass
              }`}
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
