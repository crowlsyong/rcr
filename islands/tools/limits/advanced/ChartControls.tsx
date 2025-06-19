// islands/tools/limits/advanced/ChartControls.tsx
import { Signal } from "@preact/signals";
import { DistributionType } from "./ChartTypes.ts";
import BetInputs from "./BetInputs.tsx";
import CurrentProbabilityControl from "./CurrentProbabilityControl.tsx";
import DistributionTypeSelector from "./DistributionTypeSelector.tsx";
import CurveAdjustmentInputs from "./CurveAdjustmentInputs.tsx";

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
      <BetInputs
        betAmount={betAmount}
        percentageInterval={percentageInterval}
      />
      <CurrentProbabilityControl
        currentProbability={currentProbability}
        marketProbability={marketProbability}
      />
      <DistributionTypeSelector
        distributionType={distributionType}
      />
      <CurveAdjustmentInputs
        minDistributionPercentage={minDistributionPercentage}
        maxDistributionPercentage={maxDistributionPercentage}
        centerShift={centerShift}
        isShiftLockedToCurrentProb={isShiftLockedToCurrentProb}
      />
    </div>
  );
}
