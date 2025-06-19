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
  const [localBetAmount, setLocalBetAmount] = useState(String(betAmount.value));
  const [betAmountError, setBetAmountError] = useState<string | null>(null);

  useEffect(() => {
    setLocalBetAmount(String(betAmount.value));
  }, [betAmount.value]);

  useEffect(() => {
    let handler: number;
    const parsedValue = parseInt(localBetAmount, 10);

    if (isNaN(parsedValue) || parsedValue <= 10) {
      setBetAmountError(null);
      handler = setTimeout(() => {
        setBetAmountError("Bet amount must be a number greater than 10");
      }, 1000);
    } else {
      setBetAmountError(null);
      if (parsedValue !== betAmount.value) {
        betAmount.value = parsedValue;
      }
    }

    return () => {
      clearTimeout(handler);
    };
  }, [localBetAmount, betAmount]);

  return (
    <div class="p-2 space-y-2 text-xs bg-gray-900 rounded-lg shadow-md">
      {/* Changed from bg-gray-700 */}
      <div>
        <label for="bet-amount" class="block text-gray-300 font-medium mb-1">
          Bet Amount:
        </label>
        <input
          id="bet-amount"
          type="number"
          value={localBetAmount}
          onInput={(e) => setLocalBetAmount(e.currentTarget.value)}
          min="0"
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
