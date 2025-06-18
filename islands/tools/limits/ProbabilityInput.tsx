// islands/tools/limits/ProbabilityInput.tsx
import { useEffect, useState } from "preact/hooks";
import { MarketData } from "../../../utils/api/manifold_types.ts";

interface ProbabilityInputProps {
  isCustom: boolean;
  marketData: MarketData | null;
  selectedAnswerId: string | null;
  lowerProbability: number;
  setLowerProbability: (n: number) => void;
  upperProbability: number;
  setUpperProbability: (n: number) => void;
}

export default function ProbabilityInput(props: ProbabilityInputProps) {
  const {
    isCustom,
    marketData,
    selectedAnswerId,
    lowerProbability,
    setLowerProbability,
    upperProbability,
    setUpperProbability,
  } = props;

  const [offsetPercent, setOffsetPercent] = useState(5);

  const getActiveProbability = (): number | undefined => {
    if (!marketData) return undefined;
    if (marketData.outcomeType === "BINARY") {
      return marketData.probability;
    }
    if (marketData.outcomeType === "MULTIPLE_CHOICE" && selectedAnswerId) {
      const answer = marketData.answers?.find((a) => a.id === selectedAnswerId);
      return answer?.probability;
    }
    return undefined;
  };

  const marketProb = getActiveProbability();
  const maxOffset = marketProb
    ? Math.floor(Math.min(marketProb, 1 - marketProb) * 100 - 1)
    : 50;

  useEffect(() => {
    if (!isCustom && typeof marketProb === "number") {
      const currentOffset = Math.min(offsetPercent, maxOffset);
      const lower = marketProb * 100 - currentOffset;
      const upper = marketProb * 100 + currentOffset;
      setLowerProbability(lower);
      setUpperProbability(upper);
    }
  }, [isCustom, marketProb, offsetPercent, maxOffset]);

  if (isCustom) {
    return (
      <div class="flex space-x-4 mt-4">
        <div class="flex-1">
          <label htmlFor="lower-probability" class="sr-only">
            Lower Probability (0-100%) for YES bet:
          </label>
          <input
            type="number"
            id="lower-probability"
            name="lowerProbability"
            value={lowerProbability}
            onInput={(e) =>
              setLowerProbability(Math.round(Number(e.currentTarget.value)))}
            min="0"
            max="100"
            step="1"
            placeholder="Lower (%) for YES"
            class="block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-800 text-gray-100"
            required
          />
        </div>
        <div class="flex-1">
          <label htmlFor="upper-probability" class="sr-only">
            Upper Probability (0-100%) for NO bet:
          </label>
          <input
            type="number"
            id="upper-probability"
            name="upperProbability"
            value={upperProbability}
            onInput={(e) =>
              setUpperProbability(Math.round(Number(e.currentTarget.value)))}
            min="0"
            max="100"
            step="1"
            placeholder="Upper (%) for NO"
            class="block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-800 text-gray-100"
            required
          />
        </div>
      </div>
    );
  }

  if (typeof marketProb !== "number") {
    const message = marketData?.outcomeType === "MULTIPLE_CHOICE"
      ? "Please select a multiple choice option to use the slider, or switch to Custom Range."
      : "Enter a URL to view slider.";
    return <p class="text-sm text-gray-400 mt-4">{message}</p>;
  }

  return (
    <div class="mt-4 space-y-3">
      <div>
        <label
          htmlFor="range-slider"
          class="flex justify-between text-sm font-medium text-gray-300"
        >
          <span>Range around Market Probability</span>
          <span class="font-mono text-white">+/- {offsetPercent}%</span>
        </label>
        <input
          id="range-slider"
          type="range"
          min="1"
          max={maxOffset > 0 ? maxOffset : 1}
          value={offsetPercent}
          onInput={(e) => setOffsetPercent(Number(e.currentTarget.value))}
          class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer mt-2"
        />
      </div>
      <div class="text-center text-sm text-gray-400 bg-gray-900/50 p-2 rounded-md">
        Calculated Range:{" "}
        <span class="font-semibold text-white">
          {Math.round(lowerProbability)}%
        </span>{" "}
        to{" "}
        <span class="font-semibold text-white">
          {Math.round(upperProbability)}%
        </span>
      </div>
    </div>
  );
}
