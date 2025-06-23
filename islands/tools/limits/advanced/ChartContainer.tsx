// islands/tools/limits/ChartContainer.tsx
import { signal } from "@preact/signals";
import { useEffect } from "preact/hooks"; // Import useEffect
import BasicChart from "./BasicChart.tsx";
import ChartControls from "./ChartControls.tsx";
import { DistributionType } from "./ChartTypes.ts";
import { CalculatedPoint } from "../advanced/utils/calculate-bet-data.ts"; // Import for onDistributionChange

const betAmount = signal<number>(1000);
const percentageInterval = signal<number>(10);
const distributionType = signal<DistributionType>(DistributionType.Linear);
const currentProbability = signal<number>(50);

const minDistributionPercentage = signal<number>(1);
const maxDistributionPercentage = signal<number>(99);
const centerShift = signal<number>(0);
const isShiftLockedToCurrentProb = signal<boolean>(false); // New signal for lock

export default function ChartContainer() {
  // Effect to lock curve shift to current probability
  useEffect(() => {
    if (isShiftLockedToCurrentProb.value) {
      // Calculate the shift needed to center the curve at currentProbability
      // Assuming a natural center/midpoint for many curves is 50%
      centerShift.value = currentProbability.value - 50;
    }
  }, [currentProbability.value, isShiftLockedToCurrentProb.value]);

  // Dummy function for onDistributionChange, for ChartContainer only
  const handleDistributionChange = (points: CalculatedPoint[]) => {
    // In a real application, you might update a signal here or perform other actions
    // For this demo, we'll just log them.
    console.log("Chart distribution points changed:", points);
  };

  return (
    <div class="p-4 flex flex-col md:flex-row gap-6 items-start md:items-center justify-center min-h-screen bg-gray-900 text-white">
      {/* Controls Column */}
      <ChartControls
        betAmount={betAmount}
        percentageInterval={percentageInterval}
        distributionType={distributionType}
        currentProbability={currentProbability}
        minDistributionPercentage={minDistributionPercentage}
        maxDistributionPercentage={maxDistributionPercentage}
        centerShift={centerShift}
        isShiftLockedToCurrentProb={isShiftLockedToCurrentProb} // Pass the new signal
      />

      {/* Chart Column */}
      <div class="flex-grow w-full md:w-2/3 max-w-2xl bg-gray-800 p-6 rounded-lg shadow-lg">
        <BasicChart
          betAmount={betAmount.value}
          percentageInterval={percentageInterval.value}
          distributionType={distributionType.value}
          currentProbability={currentProbability.value}
          minDistributionPercentage={minDistributionPercentage.value}
          maxDistributionPercentage={maxDistributionPercentage.value}
          centerShift={centerShift.value}
          onDistributionChange={handleDistributionChange} // <-- ADDED THIS PROP
        />
      </div>
    </div>
  );
}
