interface VolatilityGranularitySelectorProps {
  granularity: number;
  setGranularity: (value: number) => void;
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
        class="block w-full max-w-xs border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-800 text-gray-100"
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
