// islands/tools/limits/advanced/CurrentProbabilityControl.tsx
import { Signal } from "@preact/signals";
import { useEffect, useState } from "preact/hooks";

interface CurrentProbabilityControlProps {
  currentProbability: Signal<number>;
  marketProbability?: number; // Added as a prop
}

export default function CurrentProbabilityControl(
  { currentProbability, marketProbability }: CurrentProbabilityControlProps,
) {
  // Initialize useCustom based on whether a marketProbability is present and different
  const [useCustom, setUseCustom] = useState(false);

  // Effect to set initial currentProbability based on marketProbability
  useEffect(() => {
    if (typeof marketProbability === "number" && !useCustom) {
      currentProbability.value = Math.round(marketProbability);
    } else if (!useCustom && typeof marketProbability !== "number") {
      // If no market probability and not using custom, default to 50
      currentProbability.value = 50;
    }
  }, [marketProbability, useCustom]);

  const handleToggle = (e: Event) => {
    const isChecked = (e.currentTarget as HTMLInputElement).checked;
    setUseCustom(isChecked);
    // When switching from custom to non-custom, try to sync to market prob
    if (!isChecked && typeof marketProbability === "number") {
      currentProbability.value = Math.round(marketProbability);
    }
  };

  return (
    <div class="p-2 space-y-2 text-xs bg-gray-700 rounded-lg shadow-md">
      <div class="flex justify-between items-center">
        <label
          for="current-probability-slider" // Renamed ID to avoid conflict with potential input
          class="block text-gray-300 font-medium"
        >
          Marker Probability: {currentProbability.value}%
        </label>
        <div class="flex items-center space-x-2">
          <label
            for="override-prob"
            class={`text-gray-400 ${
              typeof marketProbability !== "number" ? "opacity-50" : ""
            }`}
          >
            Override
          </label>
          <input
            id="override-prob"
            type="checkbox"
            checked={useCustom}
            onInput={handleToggle}
            // Disable override if no market probability is available
            disabled={typeof marketProbability !== "number"}
            class="form-checkbox h-4 w-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500 disabled:opacity-50"
          />
        </div>
      </div>
      <input
        id="current-probability-slider" // Renamed ID
        type="range"
        min="1"
        max="99"
        value={currentProbability.value}
        onInput={(e) =>
          currentProbability.value = parseInt(e.currentTarget.value) || 1}
        disabled={!useCustom} // Only allow input if custom override is checked
        class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
}
