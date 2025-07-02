// islands/tools/limits/advanced/route/Container.tsx

import { useEffect, useState } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { MarketData } from "../../../../../utils/api/manifold_types.ts";
import { getMarketDataBySlug } from "../../../../../utils/api/manifold_api_service.ts";

// New input components
import MarketUrlInput from "./MarketUrlInput.tsx";
import ApiKeyInput from "./ApiKeyInput.tsx";

// Existing advanced components
import AdvancedDistributionChart from "../AdvancedDistributionChart.tsx";
import LimitOrderPlacementOptions from "../../LimitOrderPlacementOptions.tsx";
import AnswerSelector from "../../AnswerSelector.tsx";
import { Order } from "../../LimitOrderCalculator.tsx";
import { calculateOrderDistribution } from "../../LimitOrderCalculation.ts";
import { validateInputs } from "../../LimitOrderValidation.ts";
import { CalculatedPoint } from "../utils/calculate-bet-data.ts";

interface CalculationResult {
  orders: Order[];
  totalSharesAcquired: number | null;
  error: string | null;
  contractId: string | null;
  answerId: string | null;
}

export default function AdvancedLimitsContainer() {
  // Input states
  const [marketUrlInput, setMarketUrlInput] = useState("");
  const [apiKeyInput, setApiKeyInput] = useState("");

  // Market data states
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [loadingMarket, setLoadingMarket] = useState(false);
  const [marketFetchError, setMarketFetchError] = useState<string | null>(null);

  // Calculation states (fixed for advanced mode)
  const [totalBetAmountInput, setTotalBetAmountInput] = useState(1000); // Will be updated by AdvancedDistributionChart
  const [lowerProbabilityInput] = useState(1); // Fixed to 1 for advanced mode
  const [upperProbabilityInput] = useState(99); // Fixed to 99 for advanced mode
  const [isVolatilityBet] = useState(true); // Always true for advanced mode
  const [granularityInput] = useState(1); // Not directly used in advanced (chart handles points)
  const [isAdvancedMode] = useState(true); // Always true for this route

  const [advancedPoints, setAdvancedPoints] = useState<
    CalculatedPoint[] | null
  >(null); // From AdvancedDistributionChart

  const [calculationResult, setCalculationResult] = useState<
    CalculationResult | null
  >(null);
  const [calculationPrompt, setCalculationPrompt] = useState<string | null>(
    null,
  );
  const [calculationError, setCalculationError] = useState<string | null>(null);

  // Signal for current market probability marker (used in BasicChart and ChartControls)
  const currentProbability = useSignal(50); // Default, will update based on marketData

  // Helper to get the active market probability for the signal
  const getActiveMarketProbability = (): number | undefined => {
    if (!marketData) return undefined;
    if (
      marketData.outcomeType === "BINARY" &&
      typeof marketData.probability === "number"
    ) {
      return marketData.probability * 100;
    }
    if (marketData.outcomeType === "MULTIPLE_CHOICE" && selectedAnswerId) {
      const answer = marketData.answers?.find((a) => a.id === selectedAnswerId);
      return answer ? answer.probability * 100 : undefined;
    }
    return undefined;
  };

  // Effect to update currentProbability signal when market data or selected answer changes
  useEffect(() => {
    const activeProb = getActiveMarketProbability();
    if (typeof activeProb === "number") {
      currentProbability.value = Math.round(activeProb);
    }
  }, [marketData, selectedAnswerId]);

  // Effect to fetch market data when URL changes (with debounce)
  useEffect(() => {
    const handler = setTimeout(async () => {
      const slug = marketUrlInput.split("/").pop()?.trim();
      if (!slug) {
        setMarketData(null);
        setMarketFetchError(null);
        setSelectedAnswerId(null);
        setCalculationResult(null);
        setCalculationPrompt(null);
        setCalculationError(null);
        return;
      }

      setLoadingMarket(true);
      setMarketFetchError(null);

      try {
        const { data, error } = await getMarketDataBySlug(slug);

        if (error) {
          throw new Error(error);
        }

        if (marketData?.id !== data?.id) {
          setSelectedAnswerId(null);
        }
        setMarketData(data);
      } catch (e) {
        setMarketFetchError(
          `Failed to fetch market: ${
            typeof e === "object" && e !== null && "message" in e
              ? (e as { message: string }).message
              : String(e)
          }`,
        );
        setMarketData(null);
        setSelectedAnswerId(null);
      } finally {
        setLoadingMarket(false);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [marketUrlInput]);

  // Effect to perform order calculation when dependencies change
  useEffect(() => {
    setCalculationPrompt(null);
    setCalculationError(null);
    setCalculationResult(null); // Reset result on input changes

    // Set prompts if essential data is missing for any calculation
    if (!apiKeyInput) {
      setCalculationPrompt("Enter your Manifold API Key to enable betting.");
      return;
    }
    if (!marketData) {
      setCalculationPrompt("Please enter a valid Manifold market URL.");
      return;
    }
    if (marketData.outcomeType === "MULTIPLE_CHOICE" && !selectedAnswerId) {
      setCalculationPrompt(
        "Please select an answer for this multiple choice market.",
      );
      return;
    }
    if (totalBetAmountInput <= 0) {
      setCalculationPrompt(
        "Please enter a total bet amount greater than zero.",
      );
      return;
    }

    // Now, perform validation that *can* lead to an error that prevents calculation
    const validationError = validateInputs({
      marketUrlInput,
      lowerProbabilityInput,
      upperProbabilityInput,
      totalBetAmountInput,
      isVolatilityBet,
      granularityInput,
    });

    if (validationError) {
      setCalculationError(`Validation Error: ${validationError}`);
      return;
    }

    // Only attempt calculation if advancedPoints are available for advanced mode
    if (isAdvancedMode && (!advancedPoints || advancedPoints.length === 0)) {
      setCalculationPrompt(
        "Adjust chart controls to generate bet distribution points.",
      );
      return;
    }

    // Perform calculation
    const { orders, totalShares } = calculateOrderDistribution({
      lowerProbability: lowerProbabilityInput / 100,
      upperProbability: upperProbabilityInput / 100,
      totalBetAmount: totalBetAmountInput,
      isVolatilityBet: isVolatilityBet,
      granularity: granularityInput,
      advancedPoints: advancedPoints,
      currentProbabilityForAdvanced: currentProbability.value,
    });

    if (!orders || orders.length === 0) {
      setCalculationError(
        "Could not calculate any valid orders for the given parameters. Adjust bet amount or distribution on the chart.",
      );
      return;
    }

    setCalculationResult({
      orders,
      totalSharesAcquired: totalShares,
      error: null,
      contractId: marketData.id,
      answerId: selectedAnswerId,
    });
  }, [
    marketUrlInput,
    apiKeyInput,
    marketData,
    selectedAnswerId,
    totalBetAmountInput,
    advancedPoints,
    currentProbability.value,
  ]);

  const hasValidCalculationResults = calculationResult &&
    !calculationResult.error &&
    calculationResult.orders &&
    calculationResult.orders.length > 0;

  const formatMana = (amount: number): string => {
    return Number.isInteger(amount) ? amount.toString() : amount.toFixed(2);
  };

  return (
    <div class="p-4 mx-auto w-full sm:max-w-screen-lg text-gray-100">
      <h1 class="text-2xl font-bold mb-4">
        🦝 Advanced Limits App
      </h1>
      <p class="mb-6 text-gray-300">
        Visualize and fine-tune your limit order distributions across a market's
        probability range. Design custom bet strategies with granular control.
      </p>

      <div class="bg-black shadow sm:rounded-lg p-6 mb-6 border border-gray-700 space-y-6">
        <div class="flex flex-col sm:flex-row sm:space-x-4 space-y-6 sm:space-y-0">
          <div class="sm:flex-1">
            <MarketUrlInput
              marketUrlInput={marketUrlInput}
              setMarketUrlInput={setMarketUrlInput}
              loading={loadingMarket}
              fetchError={marketFetchError}
              marketData={marketData}
            />
          </div>
          <div class="sm:flex-1">
            <ApiKeyInput apiKey={apiKeyInput} setApiKey={setApiKeyInput} />
          </div>
        </div>
      </div>
      {calculationError && (
        <p class="text-red-400 mb-4">Error: {calculationError}</p>
      )}

      {/* Answer Selector (conditional based on market type) */}
      {marketData && marketData.outcomeType === "MULTIPLE_CHOICE" &&
        marketData.answers && (
        <AnswerSelector
          answers={marketData.answers}
          selectedAnswerId={selectedAnswerId}
          onAnswerSelect={setSelectedAnswerId}
        />
      )}

      {/* Advanced Distribution Chart - ALWAYS RENDERED */}
      <div class="mb-6 bg-black">
        <AdvancedDistributionChart
          totalBetAmount={totalBetAmountInput}
          lowerProbability={lowerProbabilityInput}
          upperProbability={upperProbabilityInput}
          onDistributionChange={setAdvancedPoints}
          onBetAmountChange={setTotalBetAmountInput}
          marketProbability={getActiveMarketProbability()}
          currentProbability={currentProbability}
          marketData={marketData} // Pass marketData even if null
          selectedAnswerId={selectedAnswerId}
        />
      </div>
      {calculationPrompt && (
        <p class="text-gray-400 mb-4 text-center">{calculationPrompt}</p>
      )}
      {/* Calculated Orders and Placement Options - CONDITIONAL */}
      {marketData && apiKeyInput && hasValidCalculationResults
        ? (
          <div class="bg-gray-900 shadow sm:rounded-lg p-6 mb-6 border border-gray-700 mt-6">
            <h2 class="text-xl font-semibold mb-3 text-white">
              Calculated Limit Orders (Advanced)
            </h2>
            <p class="mb-6">
              With a total budget of M
              <span class="font-bold text-white">
                {formatMana(totalBetAmountInput)}
              </span>, you will acquire a total of approximately{" "}
              <span class="font-bold text-white">
                {formatMana(calculationResult!.totalSharesAcquired!)} shares
              </span>{" "}
              across all orders.
            </p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-xxs">
              <div class="space-y-2">
                <h3 class="font-semibold text-green-400 mb-2">YES Bets</h3>
                <ul class="space-y-2">
                  {calculationResult!.orders.filter((o) => o.yesAmount > 0)
                    .map((order, index) => (
                      <li
                        key={`yes-${index}`}
                        class="p-2 bg-gray-900 rounded-md border border-gray-700"
                      >
                        <div class="font-semibold text-gray-300 mb-1">
                          Order (Acquires ~{formatMana(order.shares)} shares)
                        </div>
                        <span>
                          Bet <span class="font-bold text-green-400">YES</span>
                          {" "}
                          at {Math.round(order.yesProb * 100)}%:{" "}
                          <span class="font-bold text-white">
                            M{formatMana(order.yesAmount)}
                          </span>
                        </span>
                      </li>
                    ))}
                  {calculationResult!.orders.filter((o) => o.yesAmount > 0)
                        .length === 0 &&
                    <p class="text-gray-500">No YES bets calculated.</p>}
                </ul>
              </div>
              <div class="space-y-2">
                <h3 class="font-semibold text-red-400 mb-2">NO Bets</h3>
                <ul class="space-y-2">
                  {calculationResult!.orders
                    .filter((o) => o.noAmount > 0)
                    .sort((a, b) => b.noProb - a.noProb)
                    .map((order, index) => (
                      <li
                        key={`no-${index}`}
                        class="p-2 bg-gray-900 rounded-md border border-gray-700"
                      >
                        <div class="font-semibold text-gray-300 mb-1">
                          Order (Acquires ~{formatMana(order.shares)} shares)
                        </div>
                        <span>
                          Bet <span class="font-bold text-red-400">NO</span> at
                          {" "}
                          {Math.round(order.noProb * 100)}%:{" "}
                          <span class="font-bold text-white">
                            M{formatMana(order.noAmount)}
                          </span>
                        </span>
                      </li>
                    ))}
                  {calculationResult!.orders.filter((o) => o.noAmount > 0)
                        .length === 0 &&
                    <p class="text-gray-500">No NO bets calculated.</p>}
                </ul>
              </div>
            </div>

            <LimitOrderPlacementOptions
              orders={calculationResult!.orders}
              apiKey={apiKeyInput}
              contractId={calculationResult!.contractId!}
              answerId={calculationResult!.answerId}
              marketUrl={marketData.url}
            />
          </div>
        )
        : null}
    </div>
  );
}
