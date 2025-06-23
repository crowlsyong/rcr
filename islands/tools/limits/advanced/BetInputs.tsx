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
  const [localPercentageInterval, setLocalPercentageInterval] = useState(
    String(percentageInterval.value),
  );
  const [betAmountError, setBetAmountError] = useState<string | null>(null);

  useEffect(() => {
    setLocalBetAmount(String(betAmount.value));
  }, [betAmount.value]);

  useEffect(() => {
    setLocalPercentageInterval(String(percentageInterval.value));
  }, [percentageInterval.value]);

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

  const handlePercentageIntervalInputChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 2 && numValue <= 50) {
      const evenValue = numValue % 2 === 0 ? numValue : numValue - 1;
      setLocalPercentageInterval(String(evenValue));
      percentageInterval.value = evenValue;
    } else if (value === "") {
      setLocalPercentageInterval("");
    }
  };

  return (
    <div class="p-2 space-y-4 text-xxs bg-gray-900 rounded-lg shadow-md">
      {/* Bet Amount */}
      <div>
        <div class="flex justify-between items-baseline mb-1">
          <label for="bet-amount-input" class="block text-gray-300 font-medium">
            Bet Amount (Mana):
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

      {/* Number of Points (bets) */}
      <div>
        <div class="flex justify-between items-baseline mb-1">
          <label
            for="percentage-interval-input"
            class="block text-gray-300 font-medium"
          >
            Number of Points (bets):
          </label>
          <div class="flex items-baseline space-x-1">
            <input
              id="percentage-interval-input"
              type="number"
              value={localPercentageInterval}
              onInput={(e) =>
                handlePercentageIntervalInputChange(e.currentTarget.value)}
              min="2"
              max="50"
              step="2"
              class="w-12 px-2 py-1 rounded bg-gray-800 text-gray-100 border border-gray-600 focus:outline-none focus:border-blue-500 text-xs text-right"
            />
          </div>
        </div>
        <input
          id="percentage-interval"
          type="range"
          value={percentageInterval.value}
          onInput={(e) => {
            let val = parseInt(e.currentTarget.value);
            if (val < 2) val = 2;
            if (val > 50) val = 50;
            const evenValue = val % 2 === 0 ? val : val - 1;
            percentageInterval.value = evenValue;
            setLocalPercentageInterval(String(evenValue));
          }}
          min="2"
          max="50"
          step="1"
          class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}
