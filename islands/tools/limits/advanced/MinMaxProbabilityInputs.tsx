// islands/charts/MinMaxProbabilityInputs.tsx
import { Signal } from "@preact/signals";

interface MinMaxProbabilityInputsProps {
  minDistributionPercentage: Signal<number>;
  maxDistributionPercentage: Signal<number>;
}

export default function MinMaxProbabilityInputs(
  { minDistributionPercentage, maxDistributionPercentage }:
    MinMaxProbabilityInputsProps,
) {
  return (
    <div class="p-2 space-y-4 text-xs bg-gray-700 rounded-lg shadow-md">
      <div>
        <label
          for="min-distribution-percent"
          class="block text-gray-300 font-medium mb-1"
        >
          Min Probability (%): {minDistributionPercentage.value}%
        </label>
        <input
          id="min-distribution-percent"
          type="range"
          min="1"
          max="98"
          value={minDistributionPercentage.value}
          onInput={(e) => {
            const newValue = parseInt(e.currentTarget.value) || 1;
            minDistributionPercentage.value = Math.min(
              newValue,
              maxDistributionPercentage.value - 1,
            );
          }}
          class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label
          for="max-distribution-percent"
          class="block text-gray-300 font-medium mb-1"
        >
          Max Probability (%): {maxDistributionPercentage.value}%
        </label>
        <input
          id="max-distribution-percent"
          type="range"
          min="2"
          max="99"
          value={maxDistributionPercentage.value}
          onInput={(e) => {
            const newValue = parseInt(e.currentTarget.value) || 99;
            maxDistributionPercentage.value = Math.max(
              newValue,
              minDistributionPercentage.value + 1,
            );
          }}
          class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}
