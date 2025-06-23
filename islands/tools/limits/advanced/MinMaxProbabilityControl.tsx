// islands/tools/limits/advanced/MinMaxProbabilityControl.tsx
import { Signal, useSignal } from "@preact/signals";
import { useState, useEffect } from "preact/hooks"; // Ensure useEffect is imported
import { TbToggleLeftFilled, TbToggleRightFilled } from "@preact-icons/tb";
import type { ComponentType } from "preact";
import type { JSX } from "preact/jsx-runtime";

const ToggleOnIcon = TbToggleRightFilled as ComponentType<
  JSX.IntrinsicElements["svg"]
>;
const ToggleOffIcon = TbToggleLeftFilled as ComponentType<
  JSX.IntrinsicElements["svg"]
>;

interface MinMaxProbabilityControlProps {
  minDistributionPercentage: Signal<number>;
  maxDistributionPercentage: Signal<number>;
  currentProbability: Signal<number>;
  centerShift: Signal<number>;
}

export default function MinMaxProbabilityControl(
  {
    minDistributionPercentage,
    maxDistributionPercentage,
    currentProbability,
    centerShift,
  }: MinMaxProbabilityControlProps,
) {
  const isRelativeMode = useSignal(false);
  const isRelativeToMarker = useSignal(true);
  const offsetPercent = useSignal(10);

  const [localMinPercentage, setLocalMinPercentage] = useState(
    String(minDistributionPercentage.value),
  );
  const [localMaxPercentage, setLocalMaxPercentage] = useState(
    String(maxDistributionPercentage.value),
  );
  const [localOffsetPercent, setLocalOffsetPercent] = useState(
    String(offsetPercent.value),
  );

  const centerPoint = isRelativeToMarker.value
    ? currentProbability.value
    : 50 + centerShift.value;

  // Replaced useSignalEffect with a standard useEffect and an explicit dependency array
  useEffect(() => {
    if (isRelativeMode.value) {
      const offset = offsetPercent.value;
      const newMin = Math.max(1, Math.round(centerPoint - offset));
      const newMax = Math.min(99, Math.round(centerPoint + offset));

      minDistributionPercentage.value = newMin;
      maxDistributionPercentage.value = newMax;
    }
  }, [
    isRelativeMode.value,
    centerPoint, // This will change when the toggle or sliders change
    offsetPercent.value,
  ]);

  // Sync local state with signals (no changes here)
  useEffect(() => {
    setLocalMinPercentage(String(minDistributionPercentage.value));
  }, [minDistributionPercentage.value]);

  useEffect(() => {
    setLocalMaxPercentage(String(maxDistributionPercentage.value));
  }, [maxDistributionPercentage.value]);

  useEffect(() => {
    setLocalOffsetPercent(String(offsetPercent.value));
  }, [offsetPercent.value]);

  // Input handlers (no changes here)
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

  const maxOffset = Math.floor(
    Math.min(centerPoint - 1, 99 - centerPoint),
  );

  return (
    <div class="p-2 space-y-4 text-xxs bg-gray-900 rounded-lg shadow-md">
      <div class="flex justify-between items-center">
        <p class="block text-gray-300 font-medium">
          Prob. Mode:
        </p>
        <div class="flex items-center">
          <label class="text-xxs font-medium text-gray-300 mr-3">
            {isRelativeMode.value ? "Relative" : "Custom"}
          </label>
          <button
            type="button"
            onClick={() => isRelativeMode.value = !isRelativeMode.value}
            class="flex items-center focus:outline-none"
            aria-pressed={isRelativeMode.value}
          >
            {isRelativeMode.value
              ? <ToggleOnIcon class="w-10 h-10 text-blue-500" />
              : <ToggleOffIcon class="w-10 h-10 text-gray-500" />}
          </button>
        </div>
      </div>

      {isRelativeMode.value
        ? (
          // Relative Mode UI
          <div>
            <div class="flex justify-between items-center mb-1">
              <div class="flex items-center space-x-2">
                <label
                  for="offset-percent-input"
                  class="block text-gray-300 font-medium"
                >
                  Range:
                </label>
                <button
                  type="button"
                  onClick={() =>
                    isRelativeToMarker.value = !isRelativeToMarker.value}
                  class="text-xxs bg-gray-700 px-2 py-0.5 rounded hover:bg-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  title="Toggle calculation anchor point"
                >
                  {isRelativeToMarker.value ? "Market" : "Shift"}
                </button>
              </div>
              <div class="flex items-center space-x-1">
                <span class="text-gray-300">+/-</span>
                <input
                  id="offset-percent-input"
                  type="number"
                  value={localOffsetPercent}
                  onInput={(e) => {
                    const numValue = parseInt(e.currentTarget.value, 10);
                    if (
                      !isNaN(numValue) && numValue >= 1 && numValue <= maxOffset
                    ) {
                      setLocalOffsetPercent(String(numValue));
                      offsetPercent.value = numValue;
                    } else if (e.currentTarget.value === "") {
                      setLocalOffsetPercent("");
                    }
                  }}
                  min="1"
                  max={maxOffset}
                  class="w-12 px-2 py-1 rounded bg-gray-800 text-gray-100 border border-gray-600 focus:outline-none focus:border-blue-500 text-xs text-right"
                />
                <span class="text-gray-300">%</span>
              </div>
            </div>
            <input
              id="offset-percent-slider"
              type="range"
              value={offsetPercent.value}
              onInput={(e) => {
                const val = parseInt(e.currentTarget.value);
                offsetPercent.value = val;
                setLocalOffsetPercent(String(val));
              }}
              min="1"
              max={maxOffset > 0 ? maxOffset : 1}
              step="1"
              class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p class="text-xs text-gray-500 mt-2 text-center">
              Calculated Range: {minDistributionPercentage.value}% to{" "}
              {maxDistributionPercentage.value}%
            </p>
          </div>
        )
        : (
          // Custom Range UI
          <>
            <div>
              <div class="flex justify-between items-center mb-1">
                <label
                  for="min-distribution-input"
                  class="block text-gray-300 font-medium"
                >
                  Min Probability (%):
                </label>
                <div class="flex items-center space-x-1">
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
            <div>
              <div class="flex justify-between items-center mb-1">
                <label
                  for="max-distribution-input"
                  class="block text-gray-300 font-medium"
                >
                  Max Probability (%):
                </label>
                <div class="flex items-center space-x-1">
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
          </>
        )}
    </div>
  );
}
