// islands/tools/limits/advanced/BetInputs.tsx
import { Signal } from "@preact/signals";
import { useEffect, useState } from "preact/hooks";

interface BetInputsProps {
  betAmount: Signal<number>;
}

export default function BetInputs({ betAmount }: BetInputsProps) {
  const [localBetAmount, setLocalBetAmount] = useState(String(betAmount.value));
  const [betAmountError, setBetAmountError] = useState<string | null>(null);

  useEffect(() => {
    setLocalBetAmount(String(betAmount.value));
  }, [betAmount.value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      const parsedValue = parseInt(localBetAmount, 10);
      if (!isNaN(parsedValue) && parsedValue > 10) {
        if (parsedValue !== betAmount.value) {
          betAmount.value = parsedValue;
        }
        setBetAmountError(null);
      } else {
        setBetAmountError("Bet amount must be a number greater than 10");
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [localBetAmount]);

  return (
    <div class="p-2 space-y-4 text-xxs bg-gray-900 rounded-lg shadow-md">
      <div>
        <div class="flex justify-between items-baseline mb-1">
          <label for="bet-amount-input" class="block text-gray-300 font-medium">
            Bet Amount:
          </label>
          <div class="flex items-baseline space-x-1">
            <input
              id="bet-amount-input"
              type="number"
              value={localBetAmount}
              onInput={(e) => setLocalBetAmount(e.currentTarget.value)}
              min="11"
              class="w-16 px-2 py-1 rounded bg-gray-800 text-gray-100 border border-gray-600 focus:outline-none focus:border-blue-500 text-xs text-right"
            />
            <span class="text-gray-300">Mana</span>
          </div>
        </div>
        <input
          type="range"
          value={betAmount.value}
          onInput={(e) => {
            const val = parseInt(e.currentTarget.value);
            betAmount.value = val;
            setLocalBetAmount(String(val));
          }}
          min="11"
          max="10000"
          step="1"
          class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {betAmountError && (
          <p class="text-red-400 text-xs mt-1">{betAmountError}</p>
        )}
      </div>
    </div>
  );
}
