// islands/tools/limits/advanced/route/MarketUrlInput.tsx

import { MarketData } from "../../../../../utils/api/manifold_types.ts";
import MarketInfoDisplay from "../../MarketInfoDisplay.tsx";

interface MarketUrlInputProps {
  marketUrlInput: string;
  setMarketUrlInput: (value: string) => void;
  loading: boolean;
  fetchError: string | null;
  marketData: MarketData | null;
}

export default function MarketUrlInput(
  {
    marketUrlInput,
    setMarketUrlInput,
    loading,
    fetchError,
    marketData,
  }: MarketUrlInputProps,
) {
  return (
    <div>
      <label
        htmlFor="advanced-market-url"
        class="block text-sm font-medium text-gray-300 mb-1"
      >
        Manifold Market URL:
      </label>
      <input
        type="url"
        id="advanced-market-url"
        name="marketUrl"
        value={marketUrlInput}
        onInput={(e) => setMarketUrlInput(e.currentTarget.value)}
        placeholder="e.g. https://manifold.markets/username/market-slug"
        class="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-800 text-gray-100"
        required
      />
      {loading && (
        <p class="text-xs text-gray-400 mt-2">Loading market data...</p>
      )}
      {fetchError && (
        <p class="text-xs text-red-400 mt-2">Error: {fetchError}</p>
      )}
      {marketData && (
        <MarketInfoDisplay
          marketData={marketData}
        />
      )}
    </div>
  );
}
