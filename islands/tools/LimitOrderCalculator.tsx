// islands/LimitOrderCalculator.tsx
import { useState } from "preact/hooks";
import { getMarketDataBySlug, MarketData } from "../../utils/limit_calc.ts";

interface CalculationResult {
  yesLimitOrderAmount: number | null;
  noLimitOrderAmount: number | null;
  sharesAcquired: number | null; // This will now represent true shares
  error: string | null;
}

export default function LimitOrderCalculator() {
  const [marketUrlInput, setMarketUrlInput] = useState("");
  const [lowerProbabilityInput, setLowerProbabilityInput] = useState(0); // This is P_min (for YES)
  const [upperProbabilityInput, setUpperProbabilityInput] = useState(0); // This is P_max (for YES)
  const [totalBetAmountInput, setTotalBetAmountInput] = useState(0); // Renamed from initialBetAmountInput

  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [calculationResult, setCalculationResult] = useState<
    CalculationResult | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const calculateLimitOrders = async () => {
    setLoading(true);
    setFetchError(null);
    setMarketData(null);
    setCalculationResult(null);

    // Validate inputs
    if (!marketUrlInput) {
      setFetchError("Market URL is required");
      setLoading(false);
      return;
    }
    if (
      isNaN(lowerProbabilityInput) || isNaN(upperProbabilityInput) ||
      isNaN(totalBetAmountInput) // Changed to totalBetAmountInput
    ) {
      setFetchError("All numeric inputs must be valid numbers");
      setLoading(false);
      return;
    }
    if (totalBetAmountInput <= 0) { // Changed to totalBetAmountInput
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
        });
        setLoading(false);
        return;
      }

      const pLower = lowerProbabilityInput / 100; // P_min for YES
      const pUpper = upperProbabilityInput / 100; // P_max for YES

      // Ensure probabilities are not zero or one for division (cost of shares would be 0 or infinite)
      if (pLower <= 0 || pUpper >= 1) {
        setFetchError(
          "Probabilities cannot be 0% or 100%. Please choose a range within (0%, 100%).",
        );
        setLoading(false);
        return;
      }

      // --- NEW CALCULATION LOGIC FOR TOTAL BET AMOUNT ---
      // S = Total Bet Amount / (P_lower_YES + (1 - P_upper_YES))
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
      // --- END NEW CALCULATION LOGIC ---

      setCalculationResult({
        yesLimitOrderAmount: calculatedYesAmount,
        noLimitOrderAmount: calculatedNoAmount,
        sharesAcquired: sharesAcquired,
        error: null,
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

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    calculateLimitOrders();
  };

  return (
    <div class="p-4 mx-auto max-w-screen-md text-gray-100">
      <h1 class="text-2xl font-bold mb-4">
        Manifold Markets Limit Order Calculator
      </h1>
      <p class="mb-6 text-gray-300">
        Enter the market URL, your{" "}
        <span class="font-bold text-white">total Mana budget</span>, and your
        desired probability range. This tool will calculate how to split your
        budget into two limit orders to acquire the same number of shares for
        both YES and NO outcomes within your chosen range. More info{" "}
        <a
          href="https://docs.manifold.markets/faq#what-is-a-limit-order"
          target="_blank"
          rel="noopener noreferrer"
          class="text-blue-400 hover:underline"
        >
          here
        </a>.
      </p>

      <form onSubmit={handleSubmit} class="space-y-4 mb-8">
        {/* Market URL */}
        <div>
          <label
            htmlFor="market-url"
            class="block text-sm font-medium text-gray-300"
          >
            Manifold Market URL:
          </label>
          <input
            type="url"
            id="market-url"
            name="marketUrl"
            value={marketUrlInput}
            onChange={(e) => setMarketUrlInput(e.currentTarget.value)}
            placeholder="e.g. https://manifold.markets/Austin/will-carrick-flynn-win-the-general"
            class="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-800 text-gray-100"
            required
          />
        </div>

        {/* Total Bet Amount */}
        <div>
          <label
            htmlFor="total-bet-amount"
            class="block text-sm font-medium text-gray-300"
          >
            Total Mana Budget (M):
          </label>
          <input
            type="number"
            id="total-bet-amount"
            name="totalBetAmount" // Changed name
            value={totalBetAmountInput} // Changed value state
            onChange={(e) =>
              setTotalBetAmountInput(Number(e.currentTarget.value))} // Changed handler
            min="1"
            step="1"
            class="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-800 text-gray-100"
            required
          />
        </div>

        {/* Probability Range (Side-by-Side) */}
        <div>
          <p class="block text-sm font-medium text-gray-300 mb-2">
            Desired Probability Range:
          </p>
          <div class="flex space-x-4">
            <div class="flex-1">
              <label htmlFor="lower-probability" class="sr-only">
                Lower Probability (0-100%) for YES bet:
              </label>
              <input
                type="number"
                id="lower-probability"
                name="lowerProbability"
                value={lowerProbabilityInput}
                onChange={(e) =>
                  setLowerProbabilityInput(Number(e.currentTarget.value))}
                min="0"
                max="100"
                step="0.01"
                placeholder="Lower (%) for YES"
                class="block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-800 text-gray-100"
                required
              />
            </div>
            <div class="flex-1">
              <label htmlFor="upper-probability" class="sr-only">
                Upper Probability (0-100%) for NO bet:
              </label>
              <input
                type="number"
                id="upper-probability"
                name="upperProbability"
                value={upperProbabilityInput}
                onChange={(e) =>
                  setUpperProbabilityInput(Number(e.currentTarget.value))}
                min="0"
                max="100"
                step="0.01"
                placeholder="Upper (%) for NO"
                class="block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-800 text-gray-100"
                required
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Calculating..." : "Calculate Limit Orders"}
        </button>
      </form>

      {fetchError && <p class="text-red-400 mb-4">Error: {fetchError}</p>}

      {calculationResult && calculationResult.error && (
        <p class="text-red-400 mb-4">
          Calculation Error: {calculationResult.error}
        </p>
      )}

      {calculationResult && !calculationResult.error &&
        calculationResult.sharesAcquired !== null && (
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
              {calculationResult.sharesAcquired.toFixed(2)} shares
            </span>{" "}
            of each outcome (potential payout of M
            <span class="font-bold text-white">
              {calculationResult.sharesAcquired.toFixed(2)}
            </span>):
          </p>
          <ul class="list-disc pl-5 mt-4 text-gray-200 text-lg">
            <li>
              Bet <span class="font-bold text-green-400">YES</span> at{" "}
              {lowerProbabilityInput}%:{" "}
              <span class="font-bold text-white">
                M
                {calculationResult.yesLimitOrderAmount?.toFixed(2)}
              </span>
            </li>
            <li>
              Bet <span class="font-bold text-red-400">NO</span> at{" "}
              {upperProbabilityInput}%:{" "}
              <span class="font-bold text-white">
                M
                {calculationResult.noLimitOrderAmount?.toFixed(2)}
              </span>
            </li>
          </ul>
          <p class="mt-4 text-gray-400 text-sm">
            This strategy ensures your total specified budget is used, while
            yielding the same potential profit in Mana regardless of the
            outcome, assuming both limit orders are fully filled.
          </p>
        </div>
      )}

      {marketData && (
        <div class="bg-gray-800 shadow overflow-hidden sm:rounded-lg p-6 mb-6 border border-gray-700">
          <h2 class="text-xl font-semibold mb-3 text-white">
            Market Information
          </h2>
          <p>
            <span class="font-medium text-gray-300">Question:</span>{" "}
            {marketData.question}
          </p>
          <p>
            <span class="font-medium text-gray-300">Current Probability:</span>
            {" "}
            {(marketData.probability * 100).toFixed(2)}%
          </p>
          <p>
            <span class="font-medium text-gray-300">Market URL:</span>{" "}
            <a
              href={marketData.url}
              target="_blank"
              rel="noopener noreferrer"
              class="text-blue-400 hover:underline"
            >
              {marketData.url}
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
