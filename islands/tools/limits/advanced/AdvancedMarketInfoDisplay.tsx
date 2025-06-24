// islands/tools/limits/advanced/AdvancedMarketInfoDisplay.tsx
import { MarketData } from "../../../../utils/api/manifold_types.ts";
import { useState } from "preact/hooks";
import { TbCopy } from "@preact-icons/tb";
import type { ComponentType } from "preact";
import type { JSX } from "preact/jsx-runtime";

const CopyIcon = TbCopy as ComponentType<JSX.IntrinsicElements["svg"]>;

interface AdvancedMarketInfoDisplayProps {
  marketData: MarketData | null;
  selectedAnswerId: string | null;
  currentProbability: number;
}

export default function AdvancedMarketInfoDisplay({
  marketData,
  selectedAnswerId,
  currentProbability,
}: AdvancedMarketInfoDisplayProps) {
  const [copied, setCopied] = useState(false);

  if (!marketData) {
    return null;
  }

  const selectedAnswer = marketData.outcomeType === "MULTIPLE_CHOICE" &&
      selectedAnswerId && marketData.answers
    ? marketData.answers.find((a) => a.id === selectedAnswerId)
    : null;

  const formatMana = (amount: number): string => {
    if (amount >= 1000000) {
      return `M${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `M${(amount / 1000).toFixed(1)}k`;
    }
    return `M${Math.round(amount)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch((err) => console.error("Failed to copy: ", err));
  };

  return (
    <div class="mt-2 bg-gray-800 border border-gray-800 rounded-lg p-4">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column - Basic Info */}
        <div class="space-y-4">
          <div>
            <h4 class="text-xs font-medium text-gray-300 mb-2">Question</h4>
            <a
              href={marketData.url}
              target="_blank"
              rel="noopener noreferrer"
              class="block text-xs text-blue-400 hover:text-blue-300 hover:underline transition-colors duration-200"
              title={marketData.question}
            >
              {marketData.question}
            </a>
          </div>

          <div>
            <h4 class="text-xs font-medium text-gray-300 mb-1">Market ID</h4>
            <div class="flex items-center space-x-2 bg-gray-900/50 p-2 rounded-md border border-gray-700">
              <span class="text-xs text-white font-mono break-all flex-grow">
                {marketData.id}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(marketData.id)}
                class="ml-2 p-1 rounded-md bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all duration-100 ease-in-out
                       min-w-[48px] h-6"
                title={copied ? "Copied!" : "Copy Market ID"}
              >
                {copied
                  ? (
                    <span class="text-green-400 text-xxs sm:text-xxs">
                      Copied!
                    </span>
                  )
                  : <CopyIcon class="w-4 h-4 text-gray-300" />}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Market Metrics */}
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <h4 class="text-xs font-medium text-gray-300 mb-1">
                Market Probability
              </h4>
              <p class="text-lg font-bold text-white">
                {marketData.outcomeType === "BINARY" &&
                    typeof marketData.probability === "number"
                  ? `${Math.round(marketData.probability * 100)}%`
                  : selectedAnswer
                  ? `${Math.round(selectedAnswer.probability * 100)}%`
                  : "N/A"}
              </p>
            </div>
            <div>
              <h4 class="text-xs font-medium text-gray-300 mb-1">
                Marker Probability
              </h4>
              <p class="text-lg font-bold text-white">
                {currentProbability}%
              </p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <h4 class="text-xs font-medium text-gray-300 mb-1">Volume</h4>
              <p class="text-lg font-bold text-green-400">
                {formatMana(marketData.volume)}
              </p>
            </div>
            <div>
              <h4 class="text-xs font-medium text-gray-300 mb-1">Liquidity</h4>
              <p class="text-lg font-bold text-blue-400">
                {formatMana(marketData.totalLiquidity)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
