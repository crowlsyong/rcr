// islands/tools/limits/advanced/CurrentProbabilityControl.tsx
import { Signal } from "@preact/signals";
import { useEffect, useState } from "preact/hooks";
import { TbLockFilled, TbLockOpen } from "@preact-icons/tb"; // Import lock icons
import type { ComponentType } from "preact";
import type { JSX } from "preact/jsx-runtime";

const LockFilledIcon = TbLockFilled as ComponentType<
  JSX.IntrinsicElements["svg"]
>;
const LockOpenIcon = TbLockOpen as ComponentType<
  JSX.IntrinsicElements["svg"]
>;

interface CurrentProbabilityControlProps {
  currentProbability: Signal<number>;
  marketProbability?: number;
}

export default function CurrentProbabilityControl(
  { currentProbability, marketProbability }: CurrentProbabilityControlProps,
) {
  const [useCustom, setUseCustom] = useState(false);

  useEffect(() => {
    // If not in custom mode and market probability exists, set currentProbability to marketProbability
    if (typeof marketProbability === "number" && !useCustom) {
      currentProbability.value = Math.round(marketProbability);
    } // If not in custom mode and no market probability, default to 50
    else if (!useCustom && typeof marketProbability !== "number") {
      currentProbability.value = 50;
    }
    // If in custom mode, currentProbability is managed by the slider
  }, [marketProbability, useCustom]);

  // Simplified toggle function for button click
  const handleToggle = () => {
    const newState = !useCustom;
    setUseCustom(newState);
    // If toggling OFF custom mode and market probability exists, reset currentProbability
    if (!newState && typeof marketProbability === "number") {
      currentProbability.value = Math.round(marketProbability);
    }
  };

  const isDisabledByMarket = typeof marketProbability !== "number";
  // The slider itself is disabled when NOT useCustom (i.e., when locked to market probability)
  const isSliderDisabled = !useCustom;

  // Determine the tooltip text for the slider
  const sliderTooltip = isSliderDisabled && !isDisabledByMarket
    ? "Click the blue lock button to unlock"
    : "";

  return (
    <div class="p-2 space-y-2 text-xxs bg-gray-900 rounded-lg shadow-md">
      <div class="flex justify-between items-center">
        <label
          for="current-probability-slider"
          class="block text-gray-300 font-medium"
        >
          Marker Probability: {currentProbability.value}%
        </label>
        <div class="flex items-center space-x-2">
          {/* Removed the 'Override' label */}
          <button
            type="button"
            id="override-toggle" // Added id for label association
            onClick={handleToggle}
            disabled={isDisabledByMarket} // Disable the button if no market probability is available
            aria-pressed={useCustom}
            aria-label={useCustom
              ? "Lock to market probability"
              : "Unlock for custom probability"}
            class={`flex items-center justify-center rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isDisabledByMarket ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {
              /* If not useCustom (locked to market), show filled lock (blue).
                If useCustom (unlocked for custom), show open lock (gray). */
            }
            {useCustom
              ? <LockOpenIcon class="w-4 h-4 text-gray-600" />
              : <LockFilledIcon class="w-4 h-4 text-blue-500" />}
          </button>
        </div>
      </div>
      <input
        id="current-probability-slider"
        type="range"
        min="1"
        max="99"
        value={currentProbability.value}
        onInput={(e) =>
          currentProbability.value = parseInt(e.currentTarget.value) || 1}
        disabled={isSliderDisabled} // Use isSliderDisabled for the slider
        title={sliderTooltip} // Applied dynamic tooltip here
        class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
}
