// islands/tools/limits/advanced/DistributionTypeSelector.tsx
import { Signal } from "@preact/signals";
import { DistributionType } from "./ChartTypes.ts";

interface DistributionTypeSelectorProps {
  distributionType: Signal<DistributionType>;
}

export default function DistributionTypeSelector(
  { distributionType }: DistributionTypeSelectorProps,
) {
  return (
    <div class="p-2 text-xxs bg-gray-900 rounded-lg shadow-md">
      {/* Changed from bg-gray-700 */}
      <label
        for="distribution-type"
        class="block text-gray-300 font-medium mb-1"
      >
        Distribution Type:
      </label>
      <select
        id="distribution-type"
        value={distributionType.value}
        onChange={(e) =>
          distributionType.value = e.currentTarget.value as DistributionType}
        class="w-full px-2 py-1 rounded bg-gray-800 text-gray-100 border border-gray-600 focus:outline-none focus:border-blue-500 text-xs"
      >
        {Object.values(DistributionType).map((type) => (
          <option key={type} value={type}>
            {type.replace(/-/g, " ")}
          </option>
        ))}
      </select>
    </div>
  );
}
