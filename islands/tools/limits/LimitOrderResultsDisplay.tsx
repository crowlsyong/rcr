// islands/tools/limits/LimitOrderCalculator.tsx

import { useEffect, useState } from "preact/hooks";
import { getMarketDataBySlug } from "../../../utils/api/manifold_api_service.ts";
import { MarketData } from "../../../utils/api/manifold_types.ts";

import LimitOrderCalculatorForm from "./LimitOrderCalculatorForm.tsx";
import LimitOrderPlacementOptions from "./LimitOrderPlacementOptions.tsx";
import MarketInfoDisplay from "./MarketInfoDisplay.tsx";

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
  const [calculationResult, setCalculationResult] = useState<
    CalculationResult | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const calculateLimitOrders = async (e?: Event) => {
    e?.preventDefault();
    setLoading(true);
    setFetchError(null);
    // setCalculationResult(null); // Keep old results to prevent page jump

    if (!marketUrlInput) {
      setFetchError("Market URL is required");
      setLoading(false);
      return;
    }
    if (
      isNaN(lowerProbabilityInput) || isNaN(upperProbabilityInput) ||
      isNaN(totalBetAmountInput)
    ) {
      setFetchError("All numeric inputs must be valid numbers");
      setLoading(false);
      return;
    }
    if (totalBetAmountInput <= 0) {
      setFetchError("Total bet amount must be greater than zero");
      setLoading(false);
      return;
    }
    if (
      lowerProbabilityInput < 0 || lowerProbabilityInput > 100 ||
      upperProbabilityInput < 0 || upperProbabilityInput > 100
    ) {
      setFetchError("Probabilities must be between 0 and 100");
      setLoading(false);
      return;
    }
    if (lowerProbabilityInput >= upperProbabilityInput) {
      setFetchError("Lower probability must be less than upper probability");
      setLoading(false);
      return;
    }
    if (isVolatilityBet && (granularityInput <= 0 || granularityInput > 10)) {
      setFetchError("Granularity must be between 1% and 10%");
      setLoading(false);
      return;
    }

    try {
      const slug = marketUrlInput.split("/").pop();
      if (!slug) {
        setFetchError("Invalid Manifold Market URL provided");
        setLoading(false);
        return;
      }

      const { data, error: apiError } = await getMarketDataBySlug(slug);

      if (apiError || !data) {
        setFetchError(apiError);
        setLoading(false);
        return;
      }

      setMarketData(data);

      if (data.outcomeType !== "BINARY") {
        setCalculationResult({
          orders: [],
          totalSharesAcquired: null,
          error: "Only BINARY markets are supported for this calculation",
          contractId: null,
        });
        setLoading(false);
        return;
      }

      const pLower = lowerProbabilityInput / 100;
      const pUpper = upperProbabilityInput / 100;

      if (pLower <= 0 || pUpper >= 1) {
        setFetchError(
          "Probabilities cannot be 0% or 100%. Please choose a range within (0%, 100%)",
        );
        setLoading(false);
        return;
      }

      const calculatedOrders: Order[] = [];
      let totalShares = 0;
      let totalBudgetUsed = 0;

      if (isVolatilityBet) {
        const step = granularityInput / 100;
        const middleProb = (pLower + pUpper) / 2;
        const maxOffset = (pUpper - pLower) / 2;

        if (maxOffset < step) {
          const rangeWidth = (upperProbabilityInput - lowerProbabilityInput)
            .toFixed(1);
          const requiredWidth = granularityInput * 2;
          setFetchError(
            `The ${rangeWidth}% range (${lowerProbabilityInput}% to ${upperProbabilityInput}%) is too narrow for a ${granularityInput}% step size. The range must be at least ${requiredWidth}% wide.`,
          );
          setLoading(false);
          return;
        }

        const orderPairsData = [];
        for (
          let currentOffset = step;
          currentOffset <= maxOffset + (step / 2);
          currentOffset += step
        ) {
          const currentPLower = Math.max(0.01, middleProb - currentOffset);
          const currentPUpper = Math.min(0.99, middleProb + currentOffset);

          if (
            currentPLower <= 0 || currentPUpper >= 1 ||
            currentPLower >= currentPUpper
          ) {
            continue;
          }

          const denominator = currentPLower + (1 - currentPUpper);
          if (denominator <= 0) continue;

          const sharesPerMana = 1 / denominator;
          orderPairsData.push({
            yesProb: currentPLower,
            noProb: currentPUpper,
            sharesPerMana: sharesPerMana,
          });
        }

        if (orderPairsData.length === 0) {
          setFetchError(
            "No valid order pairs could be generated for the given range and granularity. Try a wider range or smaller granularity.",
          );
          setLoading(false);
          return;
        }

        const numPairs = orderPairsData.length;
        const weights = Array.from({ length: numPairs }, (_, i) => i + 1);
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);

        for (let i = 0; i < numPairs; i++) {
          const budgetPortion = (totalBetAmountInput * weights[i]) /
            totalWeight;

          const { yesProb, noProb, sharesPerMana } = orderPairsData[
            numPairs - 1 - i
          ];

          const shares = budgetPortion * sharesPerMana;
          const yesAmount = shares * yesProb;
          const noAmount = shares * (1 - noProb);

          if (Math.round(yesAmount) >= 1 && Math.round(noAmount) >= 1) {
            calculatedOrders.push({
              yesAmount: Math.round(yesAmount),
              noAmount: Math.round(noAmount),
              yesProb: yesProb,
              noProb: noProb,
              shares: Math.round(shares),
            });
            totalShares += Math.round(shares);
            totalBudgetUsed += Math.round(yesAmount) + Math.round(noAmount);
          }
        }
        calculatedOrders.sort((a, b) => (a.yesProb < b.yesProb ? 1 : -1));
      } else {
        const denominator = pLower + (1 - pUpper);
        if (denominator <= 0) {
          setFetchError(
            "Invalid probability range. Denominator is non-positive",
          );
          setLoading(false);
          return;
        }
        const sharesAcquired = totalBetAmountInput / denominator;
        const yesAmount = sharesAcquired * pLower;
        const noAmount = sharesAcquired * (1 - pUpper);

        if (Math.round(yesAmount) >= 1 && Math.round(noAmount) >= 1) {
          calculatedOrders.push({
            yesAmount: Math.round(yesAmount),
            noAmount: Math.round(noAmount),
            yesProb: pLower,
            noProb: pUpper,
            shares: Math.round(sharesAcquired),
          });
          totalShares = Math.round(sharesAcquired);
          totalBudgetUsed = Math.round(yesAmount) + Math.round(noAmount);
        }
      }

      if (calculatedOrders.length === 0) {
        setFetchError(
          "Could not calculate any valid orders for the given range and budget. Ensure the range is wide enough and budget is sufficient for at least 1 Mana per bet.",
        );
        setLoading(false);
        return;
      }

      setCalculationResult({
        orders: calculatedOrders,
        totalSharesAcquired: totalShares,
        error: null,
        contractId: data.id,
      });
    } catch (e) {
      setFetchError(
        `An unexpected error occurred: ${
          typeof e === "object" && e !== null && "message" in e
            ? (e as { message: string }).message
            : String(e)
        }`,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const hasRequiredInputs = marketUrlInput && totalBetAmountInput > 0 &&
      lowerProbabilityInput >= 0 && upperProbabilityInput <= 100 &&
      lowerProbabilityInput < upperProbabilityInput;

    if (hasRequiredInputs) {
      calculateLimitOrders(undefined);
    } else {
      setCalculationResult(null);
      setFetchError(null);
    }
  }, [
    isVolatilityBet,
    granularityInput,
    marketUrlInput,
    totalBetAmountInput,
    lowerProbabilityInput,
    upperProbabilityInput,
  ]);

  const hasValidResults = calculationResult && !calculationResult.error &&
    calculationResult.orders && calculationResult.orders.length > 0;

  const formatMana = (amount: number): string => {
    return Number.isInteger(amount) ? amount.toString() : amount.toFixed(2);
  };

  return (
    <div class="p-4 mx-auto max-w-screen-md text-gray-100">
      <h1 class="text-2xl font-bold mb-4">
        Limit Order App
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
        of the Manifold FAQ. Only works for BINARY markets.
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
        onSubmit={calculateLimitOrders}
        isVolatilityBet={isVolatilityBet}
        setIsVolatilityBet={setIsVolatilityBet}
        granularityInput={granularityInput}
        setGranularityInput={setGranularityInput}
      />

      {fetchError && <p class="text-red-400 mb-4">Error: {fetchError}</p>}

      {calculationResult && calculationResult.error && (
        <p class="text-red-400 mb-4">
          Calculation Error: {calculationResult.error}
        </p>
      )}

      {marketData && <MarketInfoDisplay marketData={marketData} />}

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
              marketUrl={marketData.url}
            />
          )}
        </div>
      )}
    </div>
  );
}
