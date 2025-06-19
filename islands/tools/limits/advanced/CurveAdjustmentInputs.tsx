// islands/tools/limits/advanced/CurveAdjustmentInputs.tsx
import { Signal } from "@preact/signals";
import { TbLockFilled, TbLockOpen } from "@preact-icons/tb"; // Import the icons
import type { ComponentType } from "preact";
import type { JSX } from "preact/jsx-runtime";

const LockFilledIcon = TbLockFilled as ComponentType<
  JSX.IntrinsicElements["svg"]
>;
const LockOpenIcon = TbLockOpen as ComponentType<
  JSX.IntrinsicElements["svg"]
>;

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
  const curveShiftTooltip = isShiftLockedToCurrentProb.value
    ? "Click the blue lock button to unlock"
    : "";

  return (
    <div class="p-2 space-y-4 text-xxs bg-gray-900 rounded-lg shadow-md">
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

      {/* Refactored Curve Shift section for consistent spacing */}
      <div>
        <div class="flex justify-between items-center">
          <label
            for="center-shift"
            class="block text-gray-300 font-medium"
          >
            Curve Shift: {centerShift.value}%
          </label>
          <div class="flex items-center space-x-2">
            <button
              type="button"
              id="lock-shift"
              onClick={() =>
                isShiftLockedToCurrentProb.value = !isShiftLockedToCurrentProb
                  .value}
              aria-pressed={isShiftLockedToCurrentProb.value}
              aria-label={isShiftLockedToCurrentProb.value
                ? "Unlock curve shift"
                : "Lock curve shift to current probability"}
              title="Locks to market probability slider"
              class="flex items-center justify-center rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {isShiftLockedToCurrentProb.value
                ? <LockFilledIcon class="h-4 w-4 text-blue-500" />
                : <LockOpenIcon class="h-4 w-4 text-gray-600" />}
            </button>
          </div>
        </div>
        <input
          id="center-shift"
          type="range"
          min="-50"
          max="50"
          value={centerShift.value}
          onInput={(e) =>
            centerShift.value = parseInt(e.currentTarget.value) || 0}
          disabled={isShiftLockedToCurrentProb.value}
          title={curveShiftTooltip}
          class={`w-full h-2 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1 ${
            // Added mt-1 here
            isShiftLockedToCurrentProb.value
              ? "bg-gray-700 disabled:cursor-not-allowed"
              : "bg-gray-600"}`}
        />
      </div>
    </div>
  );
}
