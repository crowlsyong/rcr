import { TbToggleLeftFilled, TbToggleRightFilled } from "@preact-icons/tb";
import { useEffect, useState } from "preact/hooks";
import type { ComponentType } from "preact";
import type { JSX } from "preact/jsx-runtime";
import VolatilityGranularitySelector from "../buttons/VolatilityGranularitySelector.tsx";

const ToggleOnIcon = TbToggleRightFilled as ComponentType<
  JSX.IntrinsicElements["svg"]
>;
const ToggleOffIcon = TbToggleLeftFilled as ComponentType<
  JSX.IntrinsicElements["svg"]
>;

interface VolatilityToggleProps {
  isVolatilityBet: boolean;
  setIsVolatilityBet: (value: boolean) => void;
  label: string;
  granularity: number;
  setGranularity: (value: number) => void;
}

export default function VolatilityToggle({
  isVolatilityBet,
  setIsVolatilityBet,
  label,
  granularity,
  setGranularity,
}: VolatilityToggleProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleToggle = () => {
    setIsVolatilityBet(!isVolatilityBet);
  };

  return (
    <div class="mb-6 pt-4 p-4 border border-gray-700 rounded-lg bg-gray-800/50">
      <div class="flex items-center">
        <label class="block text-sm font-medium text-gray-300 mr-4">
          {label}
        </label>
        <button
          type="button"
          onClick={handleToggle}
          class="flex items-center focus:outline-none"
          aria-pressed={isVolatilityBet}
        >
          {isClient
            ? (
              isVolatilityBet
                ? <ToggleOnIcon class="w-10 h-10 text-blue-500" />
                : <ToggleOffIcon class="w-10 h-10 text-gray-500" />
            )
            : (
              <div class="w-10 h-10 bg-gray-700 rounded-full animate-pulse">
              </div>
            )}
          <span class="ml-2 text-sm text-gray-300">
            {isVolatilityBet ? "Enabled" : "Disabled"}
          </span>
        </button>
      </div>

      <p class="text-xs text-gray-500 mt-1 mb-4">
        Distributes the budget across multiple orders within the range to profit
        from smaller price movements.
      </p>

      {isVolatilityBet && (
        <VolatilityGranularitySelector
          granularity={granularity}
          setGranularity={setGranularity}
        />
      )}
    </div>
  );
}
