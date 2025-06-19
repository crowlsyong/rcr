// islands/charts/CurrentProbabilitySlider.tsx
import { Signal } from "@preact/signals";

interface CurrentProbabilitySliderProps {
  currentProbability: Signal<number>;
}

export default function CurrentProbabilitySlider(
  { currentProbability }: CurrentProbabilitySliderProps,
) {
  return (
    <div class="p-2 space-y-2 text-xxs bg-gray-700 rounded-lg shadow-md">
      <label
        for="current-probability"
        class="block text-gray-300 font-medium mb-1"
      >
        Current Probability: {currentProbability.value}%
      </label>
      <input
        id="current-probability"
        type="range"
        min="1"
        max="99"
        value={currentProbability.value}
        onInput={(e) =>
          currentProbability.value = parseInt(e.currentTarget.value) || 1}
        class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
