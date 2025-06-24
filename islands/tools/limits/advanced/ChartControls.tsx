// islands/tools/limits/advanced/ChartControls.tsx
import { Signal } from "@preact/signals";
import { DistributionType } from "./ChartTypes.ts";
import BetInputs from "./BetInputs.tsx";
import CurrentProbabilityControl from "./CurrentProbabilityControl.tsx";
import DistributionTypeSelector from "./DistributionTypeSelector.tsx";
import PointsGranularityControl from "./PointsGranularityControl.tsx";
import MinMaxProbabilityControl from "./MinMaxProbabilityControl.tsx";

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
      <h2 class="text-md font-bold text-center mb-2">Chart Controls</h2>
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
      <MinMaxProbabilityControl
        minDistributionPercentage={minDistributionPercentage}
        maxDistributionPercentage={maxDistributionPercentage}
        currentProbability={currentProbability}
        centerShift={centerShift} // Pass the centerShift signal here
      />
    </div>
  );
}
