// islands/tools/limits/LimitOrderCalculator.tsx
import { useState } from "preact/hooks";
import { getMarketDataBySlug, MarketData } from "../../../utils/limit_calc.ts";

import LimitOrderCalculatorForm from "./LimitOrderCalculatorForm.tsx";
import LimitOrderPlacementOptions from "./LimitOrderPlacementOptions.tsx";
import MarketInfoDisplay from "./MarketInfoDisplay.tsx";

interface CalculationResult {
  yesLimitOrderAmount: number | null;
  noLimitOrderAmount: number | null;
  sharesAcquired: number | null;
  error: string | null;
  contractId: string | null;
}

export default function LimitOrderCalculator() {
  const [marketUrlInput, setMarketUrlInput] = useState("");
  const [lowerProbabilityInput, setLowerProbabilityInput] = useState(0);
  const [upperProbabilityInput, setUpperProbabilityInput] = useState(0);
  const [totalBetAmountInput, setTotalBetAmountInput] = useState(0);
  const [apiKeyInput, setApiKeyInput] = useState("");

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

    // ... (validation and calculation logic remains exactly the same) ...
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
          yesLimitOrderAmount: null,
          noLimitOrderAmount: null,
          sharesAcquired: null,
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
          "Probabilities cannot be 0% or 100%. Please choose a range within (0%, 100%).",
        );
        setLoading(false);
        return;
      }

      const denominator = pLower + (1 - pUpper);
      if (denominator <= 0) {
        setFetchError(
          "Invalid probability range for calculation. Denominator for shares calculation is non-positive.",
        );
        setLoading(false);
        return;
      }

      const sharesAcquired: number = totalBetAmountInput / denominator;
      const calculatedYesAmount: number = sharesAcquired * pLower;
      const calculatedNoAmount: number = sharesAcquired * (1 - pUpper);

      setCalculationResult({
        yesLimitOrderAmount: calculatedYesAmount,
        noLimitOrderAmount: calculatedNoAmount,
        sharesAcquired: sharesAcquired,
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

  const hasValidAmounts = calculationResult &&
    !calculationResult.error &&
    calculationResult.yesLimitOrderAmount! > 0 &&
    calculationResult.noLimitOrderAmount! > 0;

  return (
    <div class="p-4 mx-auto max-w-screen-md text-gray-100">
      <h1 class="text-2xl font-bold mb-4">
        Limit Order App
      </h1>
      <p class="mb-6 text-gray-300">
        Enter the market URL, your{" "}
        <span class="font-bold text-white">total Mana budget</span>, and your
        desired probability range. This tool will calculate how to split your
        budget into two limit orders to acquire the same number of shares for
        both YES and NO outcomes within your chosen range. More info{" "}
        <a
          href="https://docs.manifold.markets/faq#example"
          target="_blank"
          rel="noopener noreferrer"
          class="text-blue-400 hover:underline"
        >
          here
        </a>.
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
      />

      {fetchError && <p class="text-red-400 mb-4">Error: {fetchError}</p>}

      {calculationResult && calculationResult.error && (
        <p class="text-red-400 mb-4">
          Calculation Error: {calculationResult.error}
        </p>
      )}

      {marketData && <MarketInfoDisplay marketData={marketData} />}

      {hasValidAmounts && (
        <div class="bg-gray-800 shadow overflow-hidden sm:rounded-lg p-6 mb-6 border border-gray-700">
          <h2 class="text-xl font-semibold mb-3 text-white">
            Calculated Limit Orders
          </h2>
          <p>
            With a total budget of M
            <span class="font-bold text-white">
              {totalBetAmountInput.toFixed(2)}
            </span>, you will acquire approximately{" "}
            <span class="font-bold text-white">
              {calculationResult.sharesAcquired!.toFixed(2)} shares
            </span>{" "}
            of each outcome (potential payout of M
            <span class="font-bold text-white">
              {calculationResult.sharesAcquired!.toFixed(2)}
            </span>):
          </p>
          <ul class="list-disc pl-5 mt-4 text-gray-200 text-lg">
            <li>
              Bet <span class="font-bold text-green-400">YES</span> at{" "}
              {lowerProbabilityInput}%:{" "}
              <span class="font-bold text-white">
                M
                {calculationResult.yesLimitOrderAmount!.toFixed(2)}
              </span>
            </li>
            <li>
              Bet <span class="font-bold text-red-400">NO</span> at{" "}
              {upperProbabilityInput}%:{" "}
              <span class="font-bold text-white">
                M
                {calculationResult.noLimitOrderAmount!.toFixed(2)}
              </span>
            </li>
          </ul>

          {apiKeyInput && calculationResult.contractId && marketData?.url && (
            <LimitOrderPlacementOptions
              yesLimitOrderAmount={calculationResult.yesLimitOrderAmount!}
              noLimitOrderAmount={calculationResult.noLimitOrderAmount!}
              lowerProbability={lowerProbabilityInput}
              upperProbability={upperProbabilityInput}
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
