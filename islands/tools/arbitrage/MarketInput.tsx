// islands/tools/arbitrage/MarketInput.tsx

import { MarketData } from "../../../utils/api/manifold_types.ts";

interface MarketInputProps {
  marketUrl: string;
  setMarketUrl: (url: string) => void;
  marketData: MarketData | null;
  sideLabel: string;
  placeholder: string;
  isLoading: boolean;
}

export default function MarketInput(
  {
    marketUrl,
    setMarketUrl,
    marketData,
    sideLabel,
    placeholder,
    isLoading,
  }: MarketInputProps,
) {
  return (
    <div class="flex-1">
      <label class="block text-xs font-medium text-gray-300 mb-1">
        {sideLabel}
      </label>
      <input
        type="url"
        value={marketUrl}
        onInput={(e) => setMarketUrl(e.currentTarget.value)}
        placeholder={placeholder}
        class="block w-full border border-gray-600 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-800 text-gray-100"
      />
      {isLoading && <p class="text-xs text-gray-400 mt-2">Loading...</p>}
      {marketData && (
        <a
          href={marketData.url}
          target="_blank"
          rel="noopener noreferrer"
          class="block mt-2 text-xs bg-gray-900/50 p-2 rounded-md border border-gray-700 hover:border-blue-500 transition-colors duration-200"
        >
          <p class="truncate text-gray-200" title={marketData.question}>
            {marketData.question}
          </p>
          <p class="text-gray-400">
            Prob:{" "}
            <span class="font-semibold text-white">
              {(marketData.probability! * 100).toFixed(2)}%
            </span>
            <span class="mx-2">|</span>
            Volume:{" "}
            <span class="font-semibold text-white">
              M{Math.round(marketData.volume)}
            </span>
          </p>
        </a>
      )}
    </div>
  );
}
