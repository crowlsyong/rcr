// islands/tools/MarketInfoDisplay.tsx

import { MarketData } from "../../../utils/api/manifold_types.ts";

interface MarketInfoDisplayProps {
  marketData: MarketData | null;
}

export default function MarketInfoDisplay(props: MarketInfoDisplayProps) {
  if (!props.marketData) {
    return null; // Don't render anything if market data is not available
  }

  return (
    <div class="bg-gray-800 shadow overflow-hidden sm:rounded-lg p-6 mb-6 border border-gray-700">
      <h2 class="text-xl font-semibold mb-3 text-white">
        Market Information
      </h2>
      <p>
        <span class="font-medium text-gray-300">Question:</span>{" "}
        {props.marketData.question}
      </p>
      <p>
        <span class="font-medium text-gray-300">Current Probability:</span>{" "}
        {(props.marketData.probability * 100).toFixed(2)}%
      </p>
      <p>
        <span class="font-medium text-gray-300">Market URL:</span>{" "}
        <a
          href={props.marketData.url}
          target="_blank"
          rel="noopener noreferrer"
          class="text-blue-400 hover:underline"
        >
          {props.marketData.url}
        </a>
      </p>
    </div>
  );
}
