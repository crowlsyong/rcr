// islands/chart/TimeRangeSelector.tsx
interface TimeRangeSelectorProps {
  selectedRange: string;
  onRangeChange: (range: string) => void;
}

export default function TimeRangeSelector(
  { selectedRange, onRangeChange }: TimeRangeSelectorProps,
) {
  const ranges = [
    { key: "7D", label: "7 Days" },
    { key: "30D", label: "30 Days" },
    { key: "90D", label: "90 Days" },
    { key: "6M", label: "6 Months" },
    { key: "ALL", label: "All Time" },
  ];

  return (
    <div class="flex flex-wrap gap-2 mb-4 justify-center md:justify-start">
      {ranges.map((range) => (
        <button
          type="button"
          key={range.key}
          onClick={() => onRangeChange(range.key)}
          class={`px-3 py-1 text-sm rounded-md transition-colors duration-200 ${
            selectedRange === range.key
              ? "bg-blue-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}
