// islands/tools/limits/VolatilityToggle.tsx
import VolatilityGranularitySelector from "./VolatilityGranularitySelector.tsx";

interface VolatilityToggleProps {
  granularity: number;
  setGranularity: (value: number) => void;
  isAdvancedMode: boolean;
  label?: string;
}

export default function VolatilityToggle({
  granularity,
  setGranularity,
  isAdvancedMode,
}: VolatilityToggleProps) {
  // isClient state and useEffect removed as they are no longer used here.

  return (
    <div class={isAdvancedMode ? "opacity-50 pointer-events-none" : ""}>
      <VolatilityGranularitySelector
        granularity={granularity}
        setGranularity={setGranularity}
        disabled={isAdvancedMode}
      />
    </div>
  );
}
