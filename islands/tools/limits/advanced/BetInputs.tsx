// islands/tools/limits/advanced/BetInputs.tsx
import { Signal } from "@preact/signals";

interface BetInputsProps {
  betAmount: Signal<number>;
}

export default function BetInputs({ betAmount }: BetInputsProps) {
  const handleInput = (value: string) => {
    const parsedValue = parseInt(value, 10);
    if (!isNaN(parsedValue)) {
      betAmount.value = parsedValue;
    } else if (value === "") {
      betAmount.value = 0;
    }
  };

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
              value={betAmount.value}
              onInput={(e) => handleInput(e.currentTarget.value)}
              min="11"
              class="w-16 px-2 py-1 rounded bg-gray-800 text-gray-100 border border-gray-600 focus:outline-none focus:border-blue-500 text-xs text-right"
            />
            <span class="text-gray-300">Mana</span>
          </div>
        </div>
        <input
          type="range"
          value={betAmount.value}
          onInput={(e) => handleInput(e.currentTarget.value)}
          min="11"
          max="10000"
          step="1"
          class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}
