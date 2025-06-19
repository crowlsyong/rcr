// islands/tools/limits/advanced/CurveAdjustmentInputs.tsx
import { Signal } from "@preact/signals";

interface CurveAdjustmentInputsProps {
  minDistributionPercentage: Signal<number>;
  maxDistributionPercentage: Signal<number>;
  centerShift: Signal<number>;
  isShiftLockedToCurrentProb: Signal<boolean>;
}

export default function CurveAdjustmentInputs(
  {
    minDistributionPercentage,
    maxDistributionPercentage,
    centerShift,
    isShiftLockedToCurrentProb,
  }: CurveAdjustmentInputsProps,
) {
  return (
    <div class="p-2 space-y-4 text-xs bg-gray-900 rounded-lg shadow-md">
      {/* Changed from bg-gray-700 */}
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

      <div>
        <label
          for="center-shift"
          class="block text-gray-300 font-medium mb-1"
        >
          Curve Shift: {centerShift.value}%
        </label>
        <input
          id="center-shift"
          type="range"
          min="-50"
          max="50"
          value={centerShift.value}
          onInput={(e) =>
            centerShift.value = parseInt(e.currentTarget.value) || 0}
          disabled={isShiftLockedToCurrentProb.value}
          class={`w-full h-2 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            isShiftLockedToCurrentProb.value ? "bg-gray-700" : "bg-gray-600"
          }`}
        />
      </div>

      <div class="flex items-center space-x-2 pt-2">
        <input
          id="lock-shift"
          type="checkbox"
          checked={isShiftLockedToCurrentProb.value}
          onInput={(e) =>
            isShiftLockedToCurrentProb.value =
              (e.currentTarget as HTMLInputElement)
                .checked}
          class="form-checkbox h-4 w-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500"
        />
        <label for="lock-shift" class="text-gray-300">
          Lock to Current Probability
        </label>
      </div>
    </div>
  );
}
