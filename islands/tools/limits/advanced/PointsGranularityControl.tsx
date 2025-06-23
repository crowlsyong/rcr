// islands/tools/limits/advanced/PointsGranularityControl.tsx
import { Signal, useSignal, useSignalEffect } from "@preact/signals";
import { useState } from "preact/hooks";
import { useEffect } from "preact/hooks";
import { TbToggleLeftFilled, TbToggleRightFilled } from "@preact-icons/tb";
import type { ComponentType } from "preact";
import type { JSX } from "preact/jsx-runtime";

const ToggleOnIcon = TbToggleRightFilled as ComponentType<
  JSX.IntrinsicElements["svg"]
>;
const ToggleOffIcon = TbToggleLeftFilled as ComponentType<
  JSX.IntrinsicElements["svg"]
>;

interface PointsGranularityControlProps {
  percentageInterval: Signal<number>;
  minDistributionPercentage: Signal<number>;
  maxDistributionPercentage: Signal<number>;
}

export default function PointsGranularityControl(
  {
    percentageInterval,
    minDistributionPercentage,
    maxDistributionPercentage,
  }: PointsGranularityControlProps,
) {
  const isAutoMode = useSignal(false);
  const granularityStep = useSignal(5); // Default 5% step
  const [localPercentageInterval, setLocalPercentageInterval] = useState(
    String(percentageInterval.value),
  );
  const [localGranularityStep, setLocalGranularityStep] = useState(
    String(granularityStep.value),
  );

  // Effect to auto-calculate points when in auto mode
  useSignalEffect(() => {
    if (isAutoMode.value) {
      const range = maxDistributionPercentage.value -
        minDistributionPercentage.value;
      if (range > 0 && granularityStep.value > 0) {
        const points = Math.floor(range / granularityStep.value);
        // Ensure it's an even number and at least 2
        const evenPoints = Math.max(2, points % 2 === 0 ? points : points - 1);
        percentageInterval.value = evenPoints;
      }
    }
  });

  // Sync local state when signals change
  useEffect(() => {
    setLocalPercentageInterval(String(percentageInterval.value));
  }, [percentageInterval.value]);

  useEffect(() => {
    setLocalGranularityStep(String(granularityStep.value));
  }, [granularityStep.value]);

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

  const handleGranularityStepInputChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 15) {
      setLocalGranularityStep(String(numValue));
      granularityStep.value = numValue;
    } else if (value === "") {
      setLocalGranularityStep("");
    }
  };

  return (
    <div class="p-2 space-y-4 text-xxs bg-gray-900 rounded-lg shadow-md">
      <div class="flex justify-between items-center">
        <p class="block text-gray-300 font-medium">
          Points Mode:
        </p>
        <div class="flex items-center">
          <label class="text-xxs font-medium text-gray-300 mr-1">
            {isAutoMode.value ? "Auto Granularity" : "Manual Points"}
          </label>
          <button
            type="button"
            onClick={() => isAutoMode.value = !isAutoMode.value}
            class="flex items-center focus:outline-none"
            aria-pressed={isAutoMode.value}
          >
            {isAutoMode.value
              ? <ToggleOnIcon class="w-10 h-10 text-blue-500" />
              : <ToggleOffIcon class="w-10 h-10 text-gray-500" />}
          </button>
        </div>
      </div>

      {isAutoMode.value
        ? (
          // Auto Granularity Mode
          <div>
            <div class="flex justify-between items-baseline mb-1">
              <label
                for="granularity-step-input"
                class="block text-gray-300 font-medium"
              >
                Granularity (% steps):
              </label>
              <div class="flex items-baseline space-x-1">
                <input
                  id="granularity-step-input"
                  type="number"
                  value={localGranularityStep}
                  onInput={(e) =>
                    handleGranularityStepInputChange(e.currentTarget.value)}
                  min="1"
                  max="15"
                  class="w-12 px-2 py-1 rounded bg-gray-800 text-gray-100 border border-gray-600 focus:outline-none focus:border-blue-500 text-xs text-right"
                />
                <span class="text-gray-300">%</span>
              </div>
            </div>
            <input
              id="granularity-step-slider"
              type="range"
              value={granularityStep.value}
              onInput={(e) => {
                const val = parseInt(e.currentTarget.value);
                granularityStep.value = val;
                setLocalGranularityStep(String(val));
              }}
              min="1"
              max="15"
              step="1"
              class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p class="text-xs text-gray-500 mt-2">
              Calculated Points: {percentageInterval.value}
            </p>
          </div>
        )
        : (
          // Manual Points Mode
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
        )}
    </div>
  );
}
