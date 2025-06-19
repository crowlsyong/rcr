// islands/tools/limits/advanced/AdvancedDistributionChart.tsx
import { signal, useSignalEffect } from "@preact/signals";
import { useEffect, useMemo } from "preact/hooks";
import BasicChart from "./BasicChart.tsx";
import ChartControls from "./ChartControls.tsx";
import { DistributionType } from "./ChartTypes.ts";
import { CalculatedPoint } from "./utils/calculate-bet-data.ts";

interface AdvancedDistributionChartProps {
  totalBetAmount: number;
  lowerProbability: number;
  upperProbability: number;
  onDistributionChange: (points: CalculatedPoint[]) => void;
  onBetAmountChange: (amount: number) => void;
  marketProbability?: number;
}

export default function AdvancedDistributionChart(
  {
    totalBetAmount,
    lowerProbability,
    upperProbability,
    onDistributionChange,
    onBetAmountChange,
    marketProbability,
  }: AdvancedDistributionChartProps,
) {
  const betAmount = useMemo(() => signal(totalBetAmount), []);
  const percentageInterval = useMemo(() => signal(10), []);
  const distributionType = useMemo(
    () => signal(DistributionType.Linear),
    [],
  );
  const currentProbability = useMemo(() => signal(50), []);
  const minDistributionPercentage = useMemo(() => signal(lowerProbability), []);
  const maxDistributionPercentage = useMemo(() => signal(upperProbability), []);
  const centerShift = useMemo(() => signal(0), []);
  const isShiftLockedToCurrentProb = useMemo(() => signal(false), []);

  useSignalEffect(() => {
    onBetAmountChange(betAmount.value);
  });

  useEffect(() => {
    betAmount.value = totalBetAmount;
  }, [totalBetAmount]);

  useEffect(() => {
    minDistributionPercentage.value = lowerProbability;
  }, [lowerProbability]);

  useEffect(() => {
    maxDistributionPercentage.value = upperProbability;
  }, [upperProbability]);

  useEffect(() => {
    if (isShiftLockedToCurrentProb.value) {
      centerShift.value = currentProbability.value - 50;
    }
  }, [currentProbability.value, isShiftLockedToCurrentProb.value]);

  return (
    <div class="p-4 flex flex-col md:flex-row gap-6 items-start justify-center bg-gray-900/50 text-white border border-gray-700 rounded-lg mt-4">
      <ChartControls
        betAmount={betAmount}
        percentageInterval={percentageInterval}
        distributionType={distributionType}
        currentProbability={currentProbability}
        minDistributionPercentage={minDistributionPercentage}
        maxDistributionPercentage={maxDistributionPercentage}
        centerShift={centerShift}
        isShiftLockedToCurrentProb={isShiftLockedToCurrentProb}
        marketProbability={marketProbability}
      />
      <div class="flex-grow w-full md:w-2/3 max-w-4xl">
        <BasicChart
          betAmount={betAmount.value}
          percentageInterval={percentageInterval.value}
          distributionType={distributionType.value}
          currentProbability={currentProbability.value}
          minDistributionPercentage={minDistributionPercentage.value}
          maxDistributionPercentage={maxDistributionPercentage.value}
          centerShift={centerShift.value}
          onDistributionChange={onDistributionChange}
        />
      </div>
    </div>
  );
}
