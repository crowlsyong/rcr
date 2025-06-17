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
      <label class="block text-sm font-medium text-gray-300 mb-1">
        {sideLabel}
      </label>
      <input
        type="url"
        value={marketUrl}
        onInput={(e) => setMarketUrl(e.currentTarget.value)}
        placeholder={placeholder}
        class="block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-800 text-gray-100"
      />
      {isLoading && <p class="text-sm text-gray-400 mt-2">Loading data...</p>}
      {marketData && (
        <div class="mt-3 text-sm bg-gray-900/50 p-3 rounded-md border border-gray-700">
          <p class="truncate text-gray-200" title={marketData.question}>
            {marketData.question}
          </p>
          <p class="text-gray-400">
            Current Prob:{" "}
            <span class="font-bold text-white">
              {(marketData.probability! * 100).toFixed(2)}%
            </span>
          </p>
          <p class="text-gray-400">
            Liquidity:{" "}
            <span class="font-bold text-white">
              M{Math.round(marketData.totalLiquidity)}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
