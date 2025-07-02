// islands/tools/limits/LimitOrderCalculator.tsx
import { useEffect, useState } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { MarketData } from "../../../utils/api/manifold_types.ts";
import { TbToggleLeftFilled, TbToggleRightFilled } from "@preact-icons/tb";
import type { ComponentType } from "preact";
import type { JSX } from "preact/jsx-runtime";

import AnswerSelector from "./AnswerSelector.tsx";
import LimitOrderCalculatorForm from "./LimitOrderCalculatorForm.tsx";
import LimitOrderPlacementOptions from "./LimitOrderPlacementOptions.tsx";
import { validateInputs } from "./LimitOrderValidation.ts";
import { calculateOrderDistribution } from "./LimitOrderCalculation.ts";
import AdvancedDistributionChart from "./advanced/AdvancedDistributionChart.tsx";
import { CalculatedPoint } from "./advanced/utils/calculate-bet-data.ts";
import VolatilityToggle from "./VolatilityToggle.tsx";
import ProbabilityModeToggle from "./ProbabilityModeToggle.tsx";

const ToggleOnIcon = TbToggleRightFilled as ComponentType<
  JSX.IntrinsicElements["svg"]
>;
const ToggleOffIcon = TbToggleLeftFilled as ComponentType<
  JSX.IntrinsicElements["svg"]
>;

export interface Order {
  yesAmount: number;
  noAmount: number;
  yesProb: number;
  noProb: number;
  shares: number;
}

interface CalculationResult {
  orders: Order[];
  totalSharesAcquired: number | null;
  error: string | null;
  contractId: string | null;
  answerId: string | null;
}

export default function LimitOrderCalculator() {
  const [marketUrlInput, setMarketUrlInput] = useState("");
  const [lowerProbabilityInput, setLowerProbabilityInput] = useState(25);
  const [upperProbabilityInput, setUpperProbabilityInput] = useState(75);

  const [totalBetAmountInput, setTotalBetAmountInput] = useState(1000);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [isVolatilityBet, setIsVolatilityBet] = useState(false);
  const [granularityInput, setGranularityInput] = useState(1);
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [advancedPoints, setAdvancedPoints] = useState<
    CalculatedPoint[] | null
  >(
    null,
  );

  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [calculationResult, setCalculationResult] = useState<
    CalculationResult | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [promptMessage, setPromptMessage] = useState<string | null>(null);

  const [lastNonAdvancedLowerProb, setLastNonAdvancedLowerProb] = useState(25);
  const [lastNonAdvancedUpperProb, setLastNonAdvancedUpperProb] = useState(75);

  const currentProbability = useSignal(50);
  const [isClient, setIsClient] = useState(false); // New state for client-side check

  useEffect(() => {
    setIsClient(true); // Set to true once component mounts on the client
  }, []);

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

  useEffect(() => {
    const activeProb = getActiveMarketProbability();
    if (typeof activeProb === "number") {
      currentProbability.value = Math.round(activeProb);
    }
  }, [marketData, selectedAnswerId]);

  useEffect(() => {
    if (isAdvancedMode) {
      setLastNonAdvancedLowerProb(lowerProbabilityInput);
      setLastNonAdvancedUpperProb(upperProbabilityInput);
      setLowerProbabilityInput(1);
      setUpperProbabilityInput(99);
    } else {
      setLowerProbabilityInput(lastNonAdvancedLowerProb);
      setUpperProbabilityInput(lastNonAdvancedUpperProb);
    }
  }, [isAdvancedMode]);

  useEffect(() => {
    const handler = setTimeout(async () => {
      const slug = marketUrlInput.split("/").pop()?.trim();
      if (!slug) {
        setMarketData(null);
        setFetchError(null);
        setCalculationResult(null);
        return;
      }

      setLoading(true);
      setFetchError(null);

      try {
        const response = await fetch(`/api/v0/market/${slug}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch market data");
        }

        if (marketData?.id !== data.id) {
          setSelectedAnswerId(null);
        }
        setMarketData(data);
      } catch (e) {
        setFetchError(
          `An unexpected error occurred: ${
            typeof e === "object" && e !== null && "message" in e
              ? (e as { message: string }).message
              : String(e)
          }`,
        );
        setMarketData(null);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [marketUrlInput]);

  useEffect(() => {
    setPromptMessage(null);

    if (
      !marketData || totalBetAmountInput <= 0 ||
      (marketData.outcomeType === "MULTIPLE_CHOICE" && !selectedAnswerId)
    ) {
      setCalculationResult(null);
      return;
    }

    const validationError = validateInputs({
      marketUrlInput,
      lowerProbabilityInput,
      upperProbabilityInput,
      totalBetAmountInput,
      isVolatilityBet,
      granularityInput,
    });

    if (validationError) {
      if (
        validationError ===
          "Lower probability must be less than upper probability"
      ) {
        setPromptMessage(
          "Please enter a valid probability range to see calculations.",
        );
        setCalculationResult(null);
      } else {
        setCalculationResult({
          orders: [],
          totalSharesAcquired: null,
          error: validationError,
          contractId: null,
          answerId: null,
        });
      }
      return;
    }

    const { orders, totalShares } = calculateOrderDistribution({
      lowerProbability: lowerProbabilityInput / 100,
      upperProbability: upperProbabilityInput / 100,
      totalBetAmount: totalBetAmountInput,
      isVolatilityBet,
      granularity: granularityInput,
      advancedPoints: isAdvancedMode ? advancedPoints : null,
      currentProbabilityForAdvanced: isAdvancedMode
        ? currentProbability.value
        : undefined,
    });

    if (
      orders.length === 0 &&
      (isAdvancedMode ? (advancedPoints && advancedPoints.length > 0) : true)
    ) {
      setCalculationResult({
        orders: [],
        totalSharesAcquired: null,
        error:
          "Could not calculate any valid orders for the given range and budget",
        contractId: marketData.id,
        answerId: selectedAnswerId,
      });
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
    marketData,
    selectedAnswerId,
    lowerProbabilityInput,
    upperProbabilityInput,
    totalBetAmountInput,
    isVolatilityBet,
    granularityInput,
    isAdvancedMode,
    advancedPoints,
    lastNonAdvancedLowerProb,
    lastNonAdvancedUpperProb,
    currentProbability.value,
  ]);

  const hasValidResults = calculationResult && !calculationResult.error &&
    calculationResult.orders && calculationResult.orders.length > 0;

  const formatMana = (amount: number): string => {
    return Number.isInteger(amount) ? amount.toString() : amount.toFixed(2);
  };

  const mainContainerClasses = `p-4 mx-auto w-full text-gray-100 ${
    isAdvancedMode ? "sm:max-w-screen-lg" : "sm:max-w-screen-md"
  }`;

  return (
    <div class={mainContainerClasses}>
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-2xl font-bold">
          🦝 Limit Order App
        </h1>
        <a
          href="/limits/advanced"
          class="text-xs px-3 py-1 rounded-md border border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-200"
        >
          Advanced Version →
        </a>
      </div>
      <p class="mb-6 text-gray-300">
        This tool calculates how to split your budget into two limit orders to
        acquire the same number of shares for both YES and NO outcomes within
        your chosen range. Inspired by{" "}
        <a
          href="https://docs.manifold.markets/faq#example"
          target="_blank"
          rel="noopener noreferrer"
          class="text-blue-400 hover:underline"
        >
          this section{" "}
        </a>
        of the Manifold FAQ. Works for BINARY and MULTIPLE_CHOICE markets.
      </p>

      <LimitOrderCalculatorForm
        marketUrlInput={marketUrlInput}
        setMarketUrlInput={setMarketUrlInput}
        totalBetAmountInput={totalBetAmountInput}
        setTotalBetAmountInput={setTotalBetAmountInput}
        apiKeyInput={apiKeyInput}
        setApiKeyInput={setApiKeyInput}
        loading={loading}
        onSubmit={(e) => e.preventDefault()}
        isAdvancedMode={isAdvancedMode}
        marketData={marketData}
        selectedAnswerId={selectedAnswerId}
      />

      {fetchError && <p class="text-red-400 mb-4">Error: {fetchError}</p>}

      {promptMessage && (
        <p class="text-gray-400 mb-4 text-center">{promptMessage}</p>
      )}

      {calculationResult && calculationResult.error && (
        <p class="text-red-400 mb-4">
          Calculation Error: {calculationResult.error}
        </p>
      )}

      {marketData && marketData.outcomeType === "MULTIPLE_CHOICE" &&
        marketData.answers && (
        <AnswerSelector
          answers={marketData.answers}
          selectedAnswerId={selectedAnswerId}
          onAnswerSelect={setSelectedAnswerId}
        />
      )}

      {hasValidResults && (
        <div class="bg-gray-800 shadow overflow-hidden sm:rounded-lg p-6 mb-6 border border-gray-700">
          <h2 class="text-xl font-semibold mb-3 text-white">
            Calculated Limit Orders
          </h2>

          <p class="mb-6">
            With a total budget of M
            <span class="font-bold text-white">
              {formatMana(totalBetAmountInput)}
            </span>, you will acquire a total of approximately{" "}
            <span class="font-bold text-white">
              {formatMana(calculationResult.totalSharesAcquired!)} shares
            </span>{" "}
            across all orders.
          </p>

          {apiKeyInput.length > 7 && (
            <div class="mb-6 pt-4 p-4 border border-gray-700 rounded-lg bg-gray-800/50">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center">
                  <label class="block text-xs sm:text-sm font-medium text-gray-300 mr-4 sm:mr-2">
                    Volatility Bet
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsVolatilityBet(!isVolatilityBet);
                      if (isVolatilityBet) {
                        setIsAdvancedMode(false);
                      }
                    }}
                    class="flex items-center focus:outline-none"
                    aria-pressed={isVolatilityBet}
                  >
                    {isClient // Conditionally render icons
                      ? (isVolatilityBet
                        ? (
                          <ToggleOnIcon
                            size={40}
                            class="w-10 h-10 text-blue-500"
                          />
                        )
                        : (
                          <ToggleOffIcon
                            size={40}
                            class="w-10 h-10 text-gray-500"
                          />
                        ))
                      : ( // Placeholder for SSR
                        <div class="w-10 h-10 bg-gray-700 rounded-full animate-pulse">
                        </div>
                      )}
                  </button>
                </div>

                {isVolatilityBet && (
                  <div class="flex items-center">
                    <label class="text-xs sm:text-sm font-medium text-gray-300 mr-3">
                      Advanced Mode
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAdvancedMode(!isAdvancedMode)}
                      class="flex items-center focus:outline-none"
                      aria-pressed={isAdvancedMode}
                    >
                      {isClient // Conditionally render icons
                        ? (isAdvancedMode
                          ? (
                            <ToggleOnIcon
                              size={40}
                              class="w-10 h-10 text-blue-500"
                            />
                          )
                          : (
                            <ToggleOffIcon
                              size={40}
                              class="w-10 h-10 text-gray-500"
                            />
                          ))
                        : ( // Placeholder for SSR
                          <div class="w-10 h-10 bg-gray-700 rounded-full animate-pulse">
                          </div>
                        )}
                    </button>
                  </div>
                )}
              </div>

              <p class="text-xs text-gray-500 mt-1 mb-2">
                Distributes the budget across multiple orders within the range
                to profit from smaller price movements.
              </p>

              {isVolatilityBet && (
                <>
                  {!isAdvancedMode && (
                    <VolatilityToggle
                      granularity={granularityInput}
                      setGranularity={setGranularityInput}
                      isAdvancedMode={isAdvancedMode}
                    />
                  )}
                </>
              )}
            </div>
          )}

          {!isAdvancedMode && (
            <ProbabilityModeToggle
              marketData={marketData}
              selectedAnswerId={selectedAnswerId}
              lowerProbability={lowerProbabilityInput}
              setLowerProbability={setLowerProbabilityInput}
              upperProbability={upperProbabilityInput}
              setUpperProbability={setUpperProbabilityInput}
            />
          )}

          {isVolatilityBet && isAdvancedMode && (
            <AdvancedDistributionChart
              totalBetAmount={totalBetAmountInput}
              lowerProbability={1}
              upperProbability={99}
              onDistributionChange={setAdvancedPoints}
              onBetAmountChange={setTotalBetAmountInput}
              marketProbability={getActiveMarketProbability()}
              currentProbability={currentProbability}
              marketData={marketData}
              selectedAnswerId={selectedAnswerId}
            />
          )}

          {isAdvancedMode
            ? (
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-xxs">
                <div class="space-y-2">
                  <h3 class="font-semibold text-green-400 mb-2">YES Bets</h3>
                  <ul class="space-y-2">
                    {calculationResult.orders!.filter((o) => o.yesAmount > 0)
                      .map((order, index) => (
                        <li
                          key={`yes-${index}`}
                          class="p-2 bg-gray-900/50 rounded-md border border-gray-700"
                        >
                          <div class="font-semibold text-gray-300 mb-1">
                            Order (Acquires ~{formatMana(order.shares)} shares)
                          </div>
                          <span>
                            Bet{" "}
                            <span class="font-bold text-green-400">YES</span> at
                            {" "}
                            {Math.round(order.yesProb * 100)}%:{" "}
                            <span class="font-bold text-white">
                              M{formatMana(order.yesAmount)}
                            </span>
                          </span>
                        </li>
                      ))}
                    {calculationResult.orders!.filter((o) => o.yesAmount > 0)
                          .length === 0 &&
                      <p class="text-gray-500">No YES bets calculated.</p>}
                  </ul>
                </div>
                <div class="space-y-2">
                  <h3 class="font-semibold text-red-400 mb-2">NO Bets</h3>
                  <ul class="space-y-2">
                    {calculationResult.orders!
                      .filter((o) => o.noAmount > 0)
                      .sort((a, b) =>
                        b.noProb - a.noProb
                      )
                      .map((order, index) => (
                        <li
                          key={`no-${index}`}
                          class="p-2 bg-gray-900/50 rounded-md border border-gray-700"
                        >
                          <div class="font-semibold text-gray-300 mb-1">
                            Order (Acquires ~{formatMana(order.shares)} shares)
                          </div>
                          <span>
                            Bet <span class="font-bold text-red-400">NO</span>
                            {" "}
                            at {Math.round(order.noProb * 100)}%:{" "}
                            <span class="font-bold text-white">
                              M{formatMana(order.noAmount)}
                            </span>
                          </span>
                        </li>
                      ))}
                    {calculationResult.orders!.filter((o) => o.noAmount > 0)
                          .length === 0 &&
                      <p class="text-gray-500">No NO bets calculated.</p>}
                  </ul>
                </div>
              </div>
            )
            : (
              <ul class="space-y-3 mt-4 text-gray-200 text-xs">
                {calculationResult.orders!.map((order, index) => (
                  <li
                    key={index}
                    class="p-2 bg-gray-900/50 rounded-md border border-gray-700"
                  >
                    <div class="font-semibold text-gray-300 mb-1">
                      Order Pair #{index + 1} (Acquires ~
                      {formatMana(order.shares)} shares)
                    </div>
                    <div class="flex justify-between flex-wrap gap-2">
                      <span>
                        Bet <span class="font-bold text-green-400">YES</span> at
                        {" "}
                        {Math.round(order.yesProb * 100)}%:{" "}
                        <span class="font-bold text-white">
                          M{formatMana(order.yesAmount)}
                        </span>
                      </span>
                      <span>
                        Bet <span class="font-bold text-red-400">NO</span> at
                        {" "}
                        {Math.round(order.noProb * 100)}%:{" "}
                        <span class="font-bold text-white">
                          M{formatMana(order.noAmount)}
                        </span>
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}

          {apiKeyInput && calculationResult.contractId && marketData?.url && (
            <LimitOrderPlacementOptions
              orders={calculationResult.orders!}
              apiKey={apiKeyInput}
              contractId={calculationResult.contractId}
              answerId={calculationResult.answerId}
              marketUrl={marketData.url}
            />
          )}
        </div>
      )}
    </div>
  );
}
