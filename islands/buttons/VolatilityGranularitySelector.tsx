// islands/buttons/VolatilityGranularitySelector.tsx

interface VolatilityGranularitySelectorProps {
  granularity: number;
  setGranularity: (value: number) => void;
  disabled?: boolean; // Add the disabled prop
}

export default function VolatilityGranularitySelector(
  props: VolatilityGranularitySelectorProps,
) {
  // Granularity in percentage steps from 1% to 10%
  const options = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <div class="mt-4">
      <label
        htmlFor="bet-granularity"
        class="block text-sm font-medium text-gray-300 mb-2"
      >
        Bet Granularity (% steps):
      </label>
      <select
        id="bet-granularity"
        value={props.granularity}
        onChange={(e) => props.setGranularity(Number(e.currentTarget.value))}
        disabled={props.disabled} // Apply the disabled prop here
        class={`block w-full max-w-xs border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
          props.disabled
            ? "bg-gray-700 text-gray-400 cursor-not-allowed border-gray-600"
            : "bg-gray-800 text-gray-100 border-gray-600"
        }`}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}%
          </option>
        ))}
      </select>
      <p class="text-xs text-gray-500 mt-1">
        Defines the probability step between each pair of limit orders.
      </p>
    </div>
  );
}
