// islands/tools/limits/ProbabilityModeToggle.tsx
import { TbToggleLeftFilled, TbToggleRightFilled } from "@preact-icons/tb";
import { useEffect, useState } from "preact/hooks";
import type { ComponentType } from "preact";
import type { JSX } from "preact/jsx-runtime";
import ProbabilityInput from "./ProbabilityInput.tsx";
import { MarketData } from "../../../utils/api/manifold_types.ts";

const ToggleOnIcon = TbToggleRightFilled as ComponentType<
  JSX.IntrinsicElements["svg"]
>;
const ToggleOffIcon = TbToggleLeftFilled as ComponentType<
  JSX.IntrinsicElements["svg"]
>;

interface ProbabilityModeToggleProps {
  marketData: MarketData | null;
  selectedAnswerId: string | null;
  lowerProbability: number;
  setLowerProbability: (n: number) => void;
  upperProbability: number;
  setUpperProbability: (n: number) => void;
  // Removed isAdvancedMode prop as this component is now conditionally rendered
  // by the parent based on !isAdvancedMode.
}

export default function ProbabilityModeToggle(
  props: ProbabilityModeToggleProps,
) {
  const [isCustom, setIsCustom] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isCustom) {
      props.setLowerProbability(Math.round(props.lowerProbability));
      props.setUpperProbability(Math.round(props.upperProbability));
    }
  }, [isCustom]);

  return (
    <div class="pt-4 p-4 border border-gray-700 rounded-lg bg-gray-800/50">
      <div class="flex items-center justify-between">
        <p class="block text-xs sm:text-sm font-medium text-gray-300">
          {/* Added text-xs sm:text-sm */}
          Desired Probability Range:
        </p>
        <div class="flex items-center">
          <label class="text-xs sm:text-sm font-medium text-gray-300 mr-3">
            {/* Added text-xs sm:text-sm */}
            {isCustom ? "Custom Range" : "Relative to Market"}
          </label>
          <button
            type="button"
            onClick={() => setIsCustom(!isCustom)}
            class="flex items-center focus:outline-none"
            aria-pressed={isCustom}
          >
            {isClient
              ? (
                isCustom
                  ? <ToggleOnIcon class="w-10 h-10 text-blue-500" />
                  : <ToggleOffIcon class="w-10 h-10 text-gray-500" />
              )
              : (
                <div class="w-10 h-10 bg-gray-700 rounded-full animate-pulse">
                </div>
              )}
          </button>
        </div>
      </div>
      <ProbabilityInput {...props} isCustom={isCustom} />
    </div>
  );
}
