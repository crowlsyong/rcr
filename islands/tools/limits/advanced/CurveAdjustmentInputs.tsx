// islands/tools/limits/advanced/CurveAdjustmentInputs.tsx
import { Signal } from "@preact/signals";
import { useEffect, useState } from "preact/hooks";
import { TbLockFilled, TbLockOpen } from "@preact-icons/tb";
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
  const [localMinPercentage, setLocalMinPercentage] = useState(
    String(minDistributionPercentage.value),
  );
  const [localMaxPercentage, setLocalMaxPercentage] = useState(
    String(maxDistributionPercentage.value),
  );
  const [localCenterShift, setLocalCenterShift] = useState(
    String(centerShift.value),
  );

  useEffect(() => {
    setLocalMinPercentage(String(minDistributionPercentage.value));
  }, [minDistributionPercentage.value]);

  useEffect(() => {
    setLocalMaxPercentage(String(maxDistributionPercentage.value));
  }, [maxDistributionPercentage.value]);

  useEffect(() => {
    setLocalCenterShift(String(centerShift.value));
  }, [centerShift.value]);

  const handleMinPercentageInputChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 98) {
      const validValue = Math.min(
        numValue,
        maxDistributionPercentage.value - 1,
      );
      setLocalMinPercentage(String(validValue));
      minDistributionPercentage.value = validValue;
    } else if (value === "") {
      setLocalMinPercentage("");
    }
  };

  const handleMaxPercentageInputChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 2 && numValue <= 99) {
      const validValue = Math.max(
        numValue,
        minDistributionPercentage.value + 1,
      );
      setLocalMaxPercentage(String(validValue));
      maxDistributionPercentage.value = validValue;
    } else if (value === "") {
      setLocalMaxPercentage("");
    }
  };

  const handleCenterShiftInputChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= -50 && numValue <= 50) {
      setLocalCenterShift(String(numValue));
      centerShift.value = numValue;
    } else if (value === "") {
      setLocalCenterShift("");
    }
  };

  const curveShiftTooltip = isShiftLockedToCurrentProb.value
    ? "Click the blue lock button to unlock"
    : "";

  return (
    <div class="p-2 space-y-4 text-xxs bg-gray-900 rounded-lg shadow-md">
      {/* Min Probability */}
      <div>
        <div class="flex justify-between items-baseline mb-1">
          <label
            for="min-distribution-input"
            class="block text-gray-300 font-medium"
          >
            Min Probability (%):
          </label>
          <div class="flex items-baseline space-x-1">
            <input
              id="min-distribution-input"
              type="number"
              value={localMinPercentage}
              onInput={(e) =>
                handleMinPercentageInputChange(e.currentTarget.value)}
              min="1"
              max="98"
              class="w-12 px-1 py-1 rounded bg-gray-800 text-gray-100 border border-gray-600 focus:outline-none focus:border-blue-500 text-xs text-center"
            />
            <span class="text-gray-300">%</span>
          </div>
        </div>
        <input
          id="min-distribution-percent"
          type="range"
          min="1"
          max="98"
          value={minDistributionPercentage.value}
          onInput={(e) => {
            const newValue = parseInt(e.currentTarget.value) || 1;
            const validValue = Math.min(
              newValue,
              maxDistributionPercentage.value - 1,
            );
            minDistributionPercentage.value = validValue;
            setLocalMinPercentage(String(validValue));
          }}
          class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Max Probability */}
      <div>
        <div class="flex justify-between items-baseline mb-1">
          <label
            for="max-distribution-input"
            class="block text-gray-300 font-medium"
          >
            Max Probability (%):
          </label>
          <div class="flex items-baseline space-x-1">
            <input
              id="max-distribution-input"
              type="number"
              value={localMaxPercentage}
              onInput={(e) =>
                handleMaxPercentageInputChange(e.currentTarget.value)}
              min="2"
              max="99"
              class="w-12 px-1 py-1 rounded bg-gray-800 text-gray-100 border border-gray-600 focus:outline-none focus:border-blue-500 text-xs text-center"
            />
            <span class="text-gray-300">%</span>
          </div>
        </div>
        <input
          id="max-distribution-percent"
          type="range"
          min="2"
          max="99"
          value={maxDistributionPercentage.value}
          onInput={(e) => {
            const newValue = parseInt(e.currentTarget.value) || 99;
            const validValue = Math.max(
              newValue,
              minDistributionPercentage.value + 1,
            );
            maxDistributionPercentage.value = validValue;
            setLocalMaxPercentage(String(validValue));
          }}
          class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Curve Shift */}
      <div>
        <div class="flex justify-between items-baseline mb-1">
          <label
            for="center-shift-input"
            class="block text-gray-300 font-medium"
          >
            Curve Shift:
          </label>
          <div class="flex items-center space-x-2">
            <input
              id="center-shift-input"
              type="number"
              value={localCenterShift}
              onInput={(e) =>
                handleCenterShiftInputChange(e.currentTarget.value)}
              disabled={isShiftLockedToCurrentProb.value}
              min="-50"
              max="50"
              class={`w-12 px-1 py-1 rounded text-xs border text-center ${
                isShiftLockedToCurrentProb.value
                  ? "bg-gray-700 text-gray-400 cursor-not-allowed border-gray-600"
                  : "bg-gray-800 text-gray-100 border-gray-600 focus:outline-none focus:border-blue-500"
              }`}
            />
            <span class="text-gray-300">%</span>
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
          onInput={(e) => {
            const val = parseInt(e.currentTarget.value) || 0;
            centerShift.value = val;
            setLocalCenterShift(String(val));
          }}
          disabled={isShiftLockedToCurrentProb.value}
          title={curveShiftTooltip}
          class={`w-full h-2 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1 ${
            isShiftLockedToCurrentProb.value
              ? "bg-gray-700 disabled:cursor-not-allowed"
              : "bg-gray-600"
          }`}
        />
      </div>
    </div>
  );
}
