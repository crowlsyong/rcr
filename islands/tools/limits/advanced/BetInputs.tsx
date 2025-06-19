// islands/charts/BetInputs.tsx
import { Signal } from "@preact/signals";

interface BetInputsProps {
  betAmount: Signal<number>;
  percentageInterval: Signal<number>;
}

export default function BetInputs(
  { betAmount, percentageInterval }: BetInputsProps,
) {
  return (
    <div class="p-2 space-y-2 text-xs bg-gray-700 rounded-lg shadow-md">
      <div>
        <label for="bet-amount" class="block text-gray-300 font-medium mb-1">
          Bet Amount:
        </label>
        <input
          id="bet-amount"
          type="number"
          value={betAmount.value}
          onInput={(e) =>
            betAmount.value = parseInt(e.currentTarget.value) || 0}
          min="0"
          class="w-full px-2 py-1 rounded bg-gray-800 text-gray-100 border border-gray-600 focus:outline-none focus:border-blue-500 text-left text-xs"
        />
      </div>
      <div>
        <label
          for="percentage-interval"
          class="block text-gray-300 font-medium mb-1"
        >
          Number of Points: {percentageInterval.value}
        </label>
        <input
          id="percentage-interval"
          type="range" // Changed to range
          value={percentageInterval.value}
          onInput={(e) =>
            percentageInterval.value = Math.max(
              2, // Min value for the slider itself
              parseInt(e.currentTarget.value),
            )}
          min="2"
          max="99"
          class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500" // Styled for range
        />
      </div>
    </div>
  );
}
