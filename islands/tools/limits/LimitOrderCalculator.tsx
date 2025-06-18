// islands/tools/limits/LimitOrderCalculator.tsx
import { useEffect, useState } from "preact/hooks";
import { getMarketDataBySlug } from "../../../utils/api/manifold_api_service.ts";
import { MarketData } from "../../../utils/api/manifold_types.ts";

import AnswerSelector from "./AnswerSelector.tsx";
import LimitOrderCalculatorForm from "./LimitOrderCalculatorForm.tsx";
import LimitOrderPlacementOptions from "./LimitOrderPlacementOptions.tsx";
import { validateInputs } from "./LimitOrderValidation.ts";
import { calculateOrderDistribution } from "./LimitOrderCalculation.ts";

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
  const [lowerProbabilityInput, setLowerProbabilityInput] = useState(0);
  const [upperProbabilityInput, setUpperProbabilityInput] = useState(0);
  const [totalBetAmountInput, setTotalBetAmountInput] = useState(0);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [isVolatilityBet, setIsVolatilityBet] = useState(false);
  const [granularityInput, setGranularityInput] = useState(1);

  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [calculationResult, setCalculationResult] = useState<
    CalculationResult | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [promptMessage, setPromptMessage] = useState<string | null>(null);

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
        const { data, error: apiError } = await getMarketDataBySlug(slug);

        if (apiError || !data) {
          setFetchError(apiError);
          setMarketData(null);
        } else {
          if (marketData?.id !== data.id) {
            setSelectedAnswerId(null);
          }
          setMarketData(data);
        }
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
    });

    if (orders.length === 0) {
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
  ]);

  const hasValidResults = calculationResult && !calculationResult.error &&
    calculationResult.orders && calculationResult.orders.length > 0;

  const formatMana = (amount: number): string => {
    return Number.isInteger(amount) ? amount.toString() : amount.toFixed(2);
  };

  return (
    <div class="p-4 mx-auto max-w-screen-md text-gray-100">
      <h1 class="text-2xl font-bold mb-4">
        🦝 Limit Order App
      </h1>
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
        lowerProbabilityInput={lowerProbabilityInput}
        setLowerProbabilityInput={setLowerProbabilityInput}
        upperProbabilityInput={upperProbabilityInput}
        setUpperProbabilityInput={setUpperProbabilityInput}
        totalBetAmountInput={totalBetAmountInput}
        setTotalBetAmountInput={setTotalBetAmountInput}
        apiKeyInput={apiKeyInput}
        setApiKeyInput={setApiKeyInput}
        loading={loading}
        onSubmit={(e) => e.preventDefault()}
        isVolatilityBet={isVolatilityBet}
        setIsVolatilityBet={setIsVolatilityBet}
        granularityInput={granularityInput}
        setGranularityInput={setGranularityInput}
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
          <p>
            With a total budget of M
            <span class="font-bold text-white">
              {formatMana(totalBetAmountInput)}
            </span>, you will acquire a total of approximately{" "}
            <span class="font-bold text-white">
              {formatMana(calculationResult.totalSharesAcquired!)} shares
            </span>{" "}
            across all orders.
          </p>

          <ul class="space-y-3 mt-4 text-gray-200 text-base">
            {calculationResult.orders!.map((order, index) => (
              <li
                key={index}
                class="p-3 bg-gray-900/50 rounded-md border border-gray-700"
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
                    Bet <span class="font-bold text-red-400">NO</span> at{" "}
                    {Math.round(order.noProb * 100)}%:{" "}
                    <span class="font-bold text-white">
                      M{formatMana(order.noAmount)}
                    </span>
                  </span>
                </div>
              </li>
            ))}
          </ul>

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
