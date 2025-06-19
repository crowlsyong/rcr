// islands/tools/limits/advanced/BetInputs.tsx
import { Signal } from "@preact/signals";
import { useEffect, useState } from "preact/hooks";

interface BetInputsProps {
  betAmount: Signal<number>;
  percentageInterval: Signal<number>;
}

export default function BetInputs(
  { betAmount, percentageInterval }: BetInputsProps,
) {
  // Local state for the input field to allow immediate typing feedback
  const [localBetAmount, setLocalBetAmount] = useState(String(betAmount.value));
  const [betAmountError, setBetAmountError] = useState<string | null>(null);

  // Sync local state when external betAmount signal changes (e.g., initial load)
  useEffect(() => {
    setLocalBetAmount(String(betAmount.value));
  }, [betAmount.value]);

  // Debounce effect for betAmount input
  useEffect(() => {
    const handler = setTimeout(() => {
      const parsedValue = parseInt(localBetAmount, 10);

      if (isNaN(parsedValue) || parsedValue <= 10) {
        setBetAmountError("Bet amount must be a number greater than 10");
        // Do not update the signal if the value is invalid
      } else {
        setBetAmountError(null);
        // Only update the signal if the parsed value is valid and different
        if (parsedValue !== betAmount.value) {
          betAmount.value = parsedValue;
        }
      }
    }, 1000); // 1-second debounce

    return () => {
      clearTimeout(handler);
    };
  }, [localBetAmount, betAmount]);

  return (
    <div class="p-2 space-y-2 text-xs bg-gray-700 rounded-lg shadow-md">
      <div>
        <label for="bet-amount" class="block text-gray-300 font-medium mb-1">
          Bet Amount:
        </label>
        <input
          id="bet-amount"
          type="number"
          value={localBetAmount}
          onInput={(e) => setLocalBetAmount(e.currentTarget.value)}
          min="0" // Keep min as 0 to allow typing, validation handled by useEffect
          class="w-full px-2 py-1 rounded bg-gray-800 text-gray-100 border border-gray-600 focus:outline-none focus:border-blue-500 text-left text-xs"
        />
        {betAmountError && (
          <p class="text-red-400 text-xs mt-1">{betAmountError}</p>
        )}
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
          type="range"
          value={percentageInterval.value}
          onInput={(e) =>
            percentageInterval.value = Math.max(
              2,
              parseInt(e.currentTarget.value),
            )}
          min="2"
          max="99"
          class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}
