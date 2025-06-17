import { useState } from "preact/hooks";
import { getMarketDataBySlug, MarketData } from "../../../utils/limit_calc.ts";

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

  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [calculationResult, setCalculationResult] = useState<
    CalculationResult | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const calculateLimitOrders = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    setFetchError(null);
    setMarketData(null);
    setCalculationResult(null);

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

      if (isVolatilityBet) {
        const numPairs = 5;
        const pMid = (pLower + pUpper) / 2;
        const halfWidth = (pUpper - pLower) / 2;

        if (halfWidth <= 0) {
          setFetchError(
            "Probability range must have a width greater than zero for volatility bet",
          );
          setLoading(false);
          return;
        }

        const weights = Array.from(
          { length: numPairs },
          (_, i) => numPairs - i,
        );
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);

        for (let i = 0; i < numPairs; i++) {
          const budgetPortion = (totalBetAmountInput * weights[i]) /
            totalWeight;
          const stepFactor = (i + 1) / numPairs;
          const currentHalfWidth = halfWidth * stepFactor;
          const currentPLower = pMid - currentHalfWidth;
          const currentPUpper = pMid + currentHalfWidth;
          const denominator = currentPLower + (1 - currentPUpper);

          if (denominator <= 0) continue;

          const shares = budgetPortion / denominator;
          const yesAmount = shares * currentPLower;
          const noAmount = shares * (1 - currentPUpper);

          if (yesAmount > 0.5 && noAmount > 0.5) {
            calculatedOrders.push({
              yesAmount: Math.round(yesAmount),
              noAmount: Math.round(noAmount),
              yesProb: currentPLower,
              noProb: currentPUpper,
              shares: Math.round(shares),
            });
            totalShares += shares;
          }
        }
        // Round totalShares at the end as well
        totalShares = Math.round(totalShares);
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
        calculatedOrders.push({
          yesAmount: Math.round(sharesAcquired * pLower),
          noAmount: Math.round(sharesAcquired * (1 - pUpper)),
          yesProb: pLower,
          noProb: pUpper,
          shares: Math.round(sharesAcquired),
        });
        totalShares = Math.round(sharesAcquired); // Also round here
      }

      if (calculatedOrders.length === 0) {
        setFetchError(
          "Could not calculate any valid orders for the given range and budget",
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

  const hasValidResults = calculationResult && !calculationResult.error &&
    calculationResult.orders && calculationResult.orders.length > 0;

  // Helper to format numbers: removes .00 if it's a whole number, otherwise keeps two decimals
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
                    {(order.yesProb * 100).toFixed(1)}%:{" "}
                    <span class="font-bold text-white">
                      M{formatMana(order.yesAmount)}
                    </span>
                  </span>
                  <span>
                    Bet <span class="font-bold text-red-400">NO</span> at{" "}
                    {(order.noProb * 100).toFixed(1)}%:{" "}
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
