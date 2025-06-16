// islands/tools/limits/LimitOrderPlacementOptions.tsx
import { useState, useEffect } from "preact/hooks";
import DirectExecution from "./DirectExecution.tsx";
import ManualExecution from "./ManualExecution.tsx";

// Define and export the shared interface here
export interface ExpirationSettings {
  type: "never" | "duration";
  value: number | null;
}

interface PlacementOptionsProps {
  yesLimitOrderAmount: number;
  noLimitOrderAmount: number;
  lowerProbability: number;
  upperProbability: number;
  apiKey: string;
  contractId: string;
  marketUrl: string;
}

export default function LimitOrderPlacementOptions(
  props: PlacementOptionsProps,
) {
  // State for expiration settings now lives here
  const [expirationSettings, setExpirationSettings] = useState<ExpirationSettings>({
    type: "never", // Default to "never"
    value: null,
  });
  const [expirationMode, setExpirationMode] = useState<"never" | "duration">(
    "never",
  );
  const [durationValue, setDurationValue] = useState(24);
  const [durationUnit, setDurationUnit] = useState("hours");

  // Effect to update the main expirationSettings state when UI changes
  useEffect(() => {
    if (expirationMode === "never") {
      setExpirationSettings({ type: "never", value: null });
    } else {
      let multiplier = 1;
      if (durationUnit === "minutes") multiplier = 60 * 1000;
      if (durationUnit === "hours") multiplier = 60 * 60 * 1000;
      if (durationUnit === "days") multiplier = 24 * 60 * 60 * 1000;
      setExpirationSettings({
        type: "duration",
        value: durationValue * multiplier,
      });
    }
  }, [expirationMode, durationValue, durationUnit]);

  return (
    <div class="mt-8 border-t border-gray-700 pt-6">
      <h3 class="text-lg font-semibold mb-3 text-white">
        Place Limit Orders
      </h3>

      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-300">
          Order Expiration:
        </label>
        <div class="mt-2 space-y-2">
          <div class="flex items-center">
            <input
              id="expires-never"
              name="expiration-mode"
              type="radio"
              checked={expirationMode === "never"}
              onChange={() => setExpirationMode("never")}
              class="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
            />
            <label
              htmlFor="expires-never"
              class="ml-3 block text-sm font-medium text-gray-300"
            >
              Never expires
            </label>
          </div>
          <div class="flex items-center">
            <input
              id="expires-duration"
              name="expiration-mode"
              type="radio"
              checked={expirationMode === "duration"}
              onChange={() => setExpirationMode("duration")}
              class="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
            />
            <label
              htmlFor="expires-duration"
              class="ml-3 block text-sm font-medium text-gray-300"
            >
              Expires after a set duration
            </label>
          </div>
          {expirationMode === "duration" && (
            <div class="pl-7 flex items-center space-x-2">
              <input
                type="number"
                value={durationValue}
                onChange={(e) => setDurationValue(Number(e.currentTarget.value))}
                class="w-24 border border-gray-600 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-800 text-gray-100"
              />
              <select
                value={durationUnit}
                onChange={(e) => setDurationUnit(e.currentTarget.value)}
                class="border border-gray-600 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-800 text-gray-100"
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>
          )}
        </div>
      </div>

      <DirectExecution {...props} expirationSettings={expirationSettings} />
      <ManualExecution {...props} expirationSettings={expirationSettings} />
    </div>
  );
}