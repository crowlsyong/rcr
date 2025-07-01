// islands/tools/limits/advanced/AdvancedDistributionChart.tsx
import { Signal, signal } from "@preact/signals";
import { useEffect, useMemo } from "preact/hooks";
import BasicChart from "./BasicChart.tsx";
import ChartControls from "./ChartControls.tsx";
import { DistributionType } from "./ChartTypes.ts";
import { CalculatedPoint } from "./utils/calculate-bet-data.ts";
import AdvancedMarketInfoDisplay from "./AdvancedMarketInfoDisplay.tsx";
import { MarketData } from "../../../../utils/api/manifold_types.ts";

interface AdvancedDistributionChartProps {
  totalBetAmount: number;
  lowerProbability: number;
  upperProbability: number;
  onDistributionChange: (points: CalculatedPoint[]) => void;
  onBetAmountChange: (amount: number) => void;
  marketProbability?: number;
  currentProbability: Signal<number>;
  marketData?: MarketData | null;
  selectedAnswerId?: string | null;
}

export default function AdvancedDistributionChart({
  totalBetAmount,
  lowerProbability,
  upperProbability,
  onDistributionChange,
  onBetAmountChange,
  marketProbability,
  currentProbability,
  marketData, // Destructure marketData
  selectedAnswerId,
}: AdvancedDistributionChartProps) {
  const betAmount = useMemo(() => signal(totalBetAmount), []);
  const percentageInterval = useMemo(() => signal(20), []);
  const distributionType = useMemo(
    () => signal(DistributionType.BellCurve),
    [],
  );
  const minDistributionPercentage = useMemo(() => signal(lowerProbability), []);
  const maxDistributionPercentage = useMemo(() => signal(upperProbability), []);
  const centerShift = useMemo(() => signal(0), []);
  const isShiftLockedToCurrentProb = useMemo(() => signal(true), []);

  useEffect(() => {
    const handler = setTimeout(() => {
      onBetAmountChange(betAmount.value);
    }, 300);

    return () => clearTimeout(handler);
  }, [betAmount.value]);

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
          marketQuestion={marketData?.question || "Loading Market..."} // Pass the market question
        />
        <AdvancedMarketInfoDisplay
          marketData={marketData || null}
          selectedAnswerId={selectedAnswerId || null}
          currentProbability={currentProbability.value}
        />
      </div>
    </div>
  );
}
