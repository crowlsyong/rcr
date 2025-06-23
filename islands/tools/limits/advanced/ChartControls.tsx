// islands/tools/limits/advanced/ChartControls.tsx
import { Signal } from "@preact/signals";
import { DistributionType } from "./ChartTypes.ts";
import BetInputs from "./BetInputs.tsx";
import CurrentProbabilityControl from "./CurrentProbabilityControl.tsx";
import DistributionTypeSelector from "./DistributionTypeSelector.tsx";
import PointsGranularityControl from "./PointsGranularityControl.tsx"; // Import the new component

interface ChartControlsProps {
  betAmount: Signal<number>;
  percentageInterval: Signal<number>;
  distributionType: Signal<DistributionType>;
  currentProbability: Signal<number>;
  minDistributionPercentage: Signal<number>;
  maxDistributionPercentage: Signal<number>;
  centerShift: Signal<number>;
  isShiftLockedToCurrentProb: Signal<boolean>;
  marketProbability?: number;
}

export default function ChartControls(
  {
    betAmount,
    percentageInterval,
    distributionType,
    currentProbability,
    minDistributionPercentage,
    maxDistributionPercentage,
    centerShift,
    isShiftLockedToCurrentProb,
    marketProbability,
  }: ChartControlsProps,
) {
  return (
    <div class="flex flex-col gap-4 w-full md:w-1/3 max-w-xs">
      <h2 class="text-2xl font-bold text-center mb-2">Chart Controls</h2>
      <BetInputs betAmount={betAmount} />
      <PointsGranularityControl
        percentageInterval={percentageInterval}
        minDistributionPercentage={minDistributionPercentage}
        maxDistributionPercentage={maxDistributionPercentage}
      />
      <CurrentProbabilityControl
        currentProbability={currentProbability}
        centerShift={centerShift}
        isShiftLockedToCurrentProb={isShiftLockedToCurrentProb}
        marketProbability={marketProbability}
      />
      <DistributionTypeSelector
        distributionType={distributionType}
      />
      <div class="p-2 space-y-4 text-xxs bg-gray-900 rounded-lg shadow-md">
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
                value={minDistributionPercentage.value}
                onInput={(e) => {
                  const numValue = parseInt(e.currentTarget.value, 10);
                  if (!isNaN(numValue) && numValue >= 1 && numValue <= 98) {
                    const validValue = Math.min(
                      numValue,
                      maxDistributionPercentage.value - 1,
                    );
                    minDistributionPercentage.value = validValue;
                  }
                }}
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
            }}
            class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

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
                value={maxDistributionPercentage.value}
                onInput={(e) => {
                  const numValue = parseInt(e.currentTarget.value, 10);
                  if (!isNaN(numValue) && numValue >= 2 && numValue <= 99) {
                    const validValue = Math.max(
                      numValue,
                      minDistributionPercentage.value + 1,
                    );
                    maxDistributionPercentage.value = validValue;
                  }
                }}
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
            }}
            class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
