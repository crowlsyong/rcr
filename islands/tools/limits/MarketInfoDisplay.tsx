// islands/tools/limits/MarketInfoDisplay.tsx
import { MarketData } from "../../../utils/api/manifold_types.ts";

interface MarketInfoDisplayProps {
  marketData: MarketData | null;
}

export default function MarketInfoDisplay(props: MarketInfoDisplayProps) {
  if (!props.marketData) {
    return null;
  }

  return (
    <a
      href={props.marketData.url}
      target="_blank"
      rel="noopener noreferrer"
      class="block mt-2 text-xs bg-gray-900/50 p-2 rounded-md border border-gray-700 hover:border-blue-500 transition-colors duration-200"
    >
      <p class="truncate text-gray-200" title={props.marketData.question}>
        {props.marketData.question}
      </p>
      <p class="text-gray-400">
        {typeof props.marketData.probability === "number" && (
          <>
            <span>
              Prob:{" "}
              <span class="font-semibold text-white">
                {(props.marketData.probability * 100).toFixed(2)}%
              </span>
            </span>
            <span class="mx-2">|</span>
          </>
        )}
        <span>
          Volume:{" "}
          <span class="font-semibold text-white">
            M{Math.round(props.marketData.volume)}
          </span>
        </span>
      </p>
    </a>
  );
}
