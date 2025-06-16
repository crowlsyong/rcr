// islands/tools/limits/LimitOrderCalculatorForm.tsx
import { useEffect, useState } from "preact/hooks";

export interface ExpirationSettings {
  type: "never" | "duration";
  value: number | null; // value in milliseconds
}

interface LimitOrderFormProps {
  marketUrlInput: string;
  setMarketUrlInput: (value: string) => void;
  lowerProbabilityInput: number;
  setLowerProbabilityInput: (value: number) => void;
  upperProbabilityInput: number;
  setUpperProbabilityInput: (value: number) => void;
  totalBetAmountInput: number;
  setTotalBetAmountInput: (value: number) => void;
  apiKeyInput: string;
  setApiKeyInput: (value: string) => void;
  loading: boolean;
  onSubmit: (e: Event) => void;
  onExpirationChange: (settings: ExpirationSettings) => void; // New callback prop
}

export default function LimitOrderCalculatorForm(props: LimitOrderFormProps) {
  // Local state for managing the expiration UI
  const [expirationMode, setExpirationMode] = useState<"never" | "duration">(
    "duration",
  );
  const [durationValue, setDurationValue] = useState(24);
  const [durationUnit, setDurationUnit] = useState("hours");

  // Effect to notify the parent component of changes
  useEffect(() => {
    if (expirationMode === "never") {
      props.onExpirationChange({ type: "never", value: null });
    } else {
      let multiplier = 1;
      if (durationUnit === "minutes") multiplier = 60 * 1000;
      if (durationUnit === "hours") multiplier = 60 * 60 * 1000;
      if (durationUnit === "days") multiplier = 24 * 60 * 60 * 1000;
      props.onExpirationChange({
        type: "duration",
        value: durationValue * multiplier,
      });
    }
  }, [expirationMode, durationValue, durationUnit]);

  return (
    <form onSubmit={props.onSubmit} class="space-y-4 mb-8">
      {/* --- Other form fields remain the same --- */}
      <div>
        <label
          htmlFor="market-url"
          class="block text-sm font-medium text-gray-300"
        >
          Manifold Market URL:
        </label>
        <input
          type="url"
          id="market-url"
          name="marketUrl"
          value={props.marketUrlInput}
          onChange={(e) => props.setMarketUrlInput(e.currentTarget.value)}
          placeholder="e.g. https://manifold.markets/Austin/will-carrick-flynn-win-the-general"
          class="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-800 text-gray-100"
          required
        />
      </div>

      <div>
        <label
          htmlFor="total-bet-amount"
          class="block text-sm font-medium text-gray-300"
        >
          Total Mana Budget (M):
        </label>
        <input
          type="number"
          id="total-bet-amount"
          name="totalBetAmount"
          value={props.totalBetAmountInput}
          onChange={(e) =>
            props.setTotalBetAmountInput(Number(e.currentTarget.value))}
          min="1"
          step="1"
          class="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-800 text-gray-100"
          required
        />
      </div>

      <div>
        <p class="block text-sm font-medium text-gray-300 mb-2">
          Desired Probability Range:
        </p>
        <div class="flex space-x-4">
          <div class="flex-1">
            <label htmlFor="lower-probability" class="sr-only">
              Lower Probability (0-100%) for YES bet:
            </label>
            <input
              type="number"
              id="lower-probability"
              name="lowerProbability"
              value={props.lowerProbabilityInput}
              onChange={(e) =>
                props.setLowerProbabilityInput(Number(e.currentTarget.value))}
              min="0"
              max="100"
              step="0.01"
              placeholder="Lower (%) for YES"
              class="block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-800 text-gray-100"
              required
            />
          </div>
          <div class="flex-1">
            <label htmlFor="upper-probability" class="sr-only">
              Upper Probability (0-100%) for NO bet:
            </label>
            <input
              type="number"
              id="upper-probability"
              name="upperProbability"
              value={props.upperProbabilityInput}
              onChange={(e) =>
                props.setUpperProbabilityInput(Number(e.currentTarget.value))}
              min="0"
              max="100"
              step="0.01"
              placeholder="Upper (%) for NO"
              class="block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-800 text-gray-100"
              required
            />
          </div>
        </div>
      </div>

      {/* --- NEW EXPIRATION OPTIONS SECTION --- */}
      <div>
        <label class="block text-sm font-medium text-gray-300">
          Order Expiration:
        </label>
        <div class="mt-2 space-y-2">
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
                onChange={(e) =>
                  setDurationValue(Number(e.currentTarget.value))}
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
        </div>
      </div>

      <div>
        <label
          htmlFor="api-key"
          class="block text-sm font-medium text-gray-300"
        >
          Manifold API Key (optional)
        </label>
        <p class="text-xs text-gray-500 mt-1">
          (Generates placement options. We do not save or store this key.)
        </p>
        <input
          type="password"
          id="api-key"
          name="apiKey"
          value={props.apiKeyInput}
          onChange={(e) => props.setApiKeyInput(e.currentTarget.value)}
          placeholder="xxxxxxx-xxxx-xxxx-xxxxxxxxxxx"
          class="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-800 text-gray-100"
        />
        <p class="mt-1 text-sm text-gray-400">
          Find your API key on your Manifold profile page by clicking the gear
          icon and selecting Account Settings.
        </p>
      </div>

      <button
        type="submit"
        disabled={props.loading}
        class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {props.loading ? "Calculating..." : "Calculate Limit Orders"}
      </button>
    </form>
  );
}
