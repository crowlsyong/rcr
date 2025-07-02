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
      return answer ? answer.probability : undefined;
    }
    return undefined;
  };

  const marketProb = getActiveProbability();

  // Calculate maxOffset, ensuring it's at least 1 to avoid range slider issues
  // maxOffset is the largest symmetric offset possible while staying within (0%, 100%)
  const rawMaxOffset = marketProb
    ? Math.floor(Math.min(marketProb, 1 - marketProb) * 100 - 1)
    : 50;
  const clampedMaxOffset = Math.max(1, rawMaxOffset); // Ensure min slider value is 1

  console.log(
    "ProbabilityInput Render - marketProb:",
    marketProb,
    "rawMaxOffset:",
    rawMaxOffset,
    "clampedMaxOffset:",
    clampedMaxOffset,
  );
  console.log(
    "ProbabilityInput Render - isCustom:",
    isCustom,
    "offsetPercent:",
    offsetPercent,
  );

  useEffect(() => {
    console.log(
      "ProbabilityInput useEffect (isCustom, marketProb, offsetPercent) triggered.",
    );
    if (!isCustom && typeof marketProb === "number") {
      // Use the clampedMaxOffset to ensure currentOffset is valid
      const currentOffset = Math.min(offsetPercent, clampedMaxOffset);
      const lower = marketProb * 100 - currentOffset;
      const upper = marketProb * 100 + currentOffset;

      console.log(
        "ProbabilityInput useEffect - Calculating relative range:",
        {
          marketProbRaw: marketProb,
          marketProbPercent: marketProb * 100,
          currentOffset,
          calculatedLower: lower,
          calculatedUpper: upper,
        },
      );

      // Clamp values to ensure they stay strictly within (0,100) after rounding
      let finalLower = Math.max(1, Math.min(99, Math.round(lower)));
      let finalUpper = Math.max(1, Math.min(99, Math.round(upper)));

      // Additional safeguard: ensure finalLower is always strictly less than finalUpper
      // This is crucial for preventing "Lower probability must be less than upper probability"
      if (finalLower >= finalUpper) {
        console.warn(
          "ProbabilityInput useEffect - Collapsing/Inverting range detected (finalLower >= finalUpper). Attempting to fix.",
          { initialLower: lower, initialUpper: upper, finalLower, finalUpper },
        );
        if (finalLower < 99) {
          finalUpper = finalLower + 1; // Nudge upper up if possible
        } else if (finalUpper > 1) {
          finalLower = finalUpper - 1; // Nudge lower down if possible (e.g., both 99, make it 98-99)
        } else {
          // Extreme case: both are at 1. Fallback to a wider, known-good range.
          console.error(
            "ProbabilityInput useEffect - Extreme range collapse. Falling back to 25-75.",
          );
          finalLower = 25;
          finalUpper = 75;
        }
      }

      setLowerProbability(finalLower);
      setUpperProbability(finalUpper);

      console.log(
        "ProbabilityInput useEffect - Setting probabilities to:",
        { setLower: finalLower, setUpper: finalUpper },
      );
    }
  }, [isCustom, marketProb, offsetPercent, clampedMaxOffset]); // Dependency array for useEffect

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

  // Display message if market data is not available for relative slider mode
  if (typeof marketProb !== "number") {
    const message = marketData?.outcomeType === "MULTIPLE_CHOICE"
      ? "Please select a multiple choice option to use the slider, or switch to Custom Range."
      : "Market must be of type BINARY to use the relative slider. Please use Custom Range.";
    return <p class="text-xs sm:text-sm text-gray-400 mt-4">{message}</p>;
  }

  return (
    <div class="mt-4 space-y-3">
      <div>
        <label
          htmlFor="range-slider"
          class="flex justify-between text-xs sm:text-sm font-medium text-gray-300"
        >
          <span>Range around Market Probability</span>
          <span class="font-mono text-white">+/- {offsetPercent}%</span>
        </label>
        <input
          id="range-slider"
          type="range"
          min="1"
          max={clampedMaxOffset}
          value={offsetPercent}
          onInput={(e) => setOffsetPercent(Number(e.currentTarget.value))}
          class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer mt-2"
        />
      </div>
      <div class="text-center text-xs sm:text-sm text-gray-400 bg-gray-900/50 p-2 rounded-md">
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
