import { useEffect, useState } from "preact/hooks";
import { getMarketDataBySlug } from "../../../utils/api/manifold_api_service.ts";
import { MarketData } from "../../../utils/api/manifold_types.ts";
import {
  ArbitrageCalculation,
  calculateArbitrage,
} from "../../../utils/arbitrage_calculator.ts";
import ArbitrageExecutionButton from "./ArbitrageExecutionButton.tsx";
import ArbitrageResults from "./ArbitrageResults.tsx";
import BudgetSlider from "./BudgetSlider.tsx";
import CalculationModeToggle from "./CalculationModeToggle.tsx";
import MarketInput from "./MarketInput.tsx";

export default function ArbitrageCalculator() {
  const [marketAUrl, setMarketAUrl] = useState("");
  const [marketBUrl, setMarketBUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [budgetPercentage, setBudgetPercentage] = useState(100);
  const [calculationMode, setCalculationMode] = useState<
    "equilibrium" | "average"
  >("equilibrium");

  const [marketA, setMarketA] = useState<MarketData | null>(null);
  const [marketB, setMarketB] = useState<MarketData | null>(null);

  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);

  const [calculation, setCalculation] = useState<ArbitrageCalculation | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (marketAUrl) {
        const slug = marketAUrl.split("/").pop();
        if (slug) {
          setLoadingA(true);
          getMarketDataBySlug(slug).then(({ data }) => {
            setMarketA(data);
            setLoadingA(false);
          });
        }
      } else {
        setMarketA(null);
      }
    }, 500);
    return () => clearTimeout(debounceTimeout);
  }, [marketAUrl]);

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (marketBUrl) {
        const slug = marketBUrl.split("/").pop();
        if (slug) {
          setLoadingB(true);
          getMarketDataBySlug(slug).then(({ data }) => {
            setMarketB(data);
            setLoadingB(false);
          });
        }
      } else {
        setMarketB(null);
      }
    }, 500);
    return () => clearTimeout(debounceTimeout);
  }, [marketBUrl]);

  useEffect(() => {
    if (marketA && marketB) {
      const { result, error } = calculateArbitrage(
        marketA,
        marketB,
        calculationMode,
      );
      setCalculation(result);
      setError(error);
    } else {
      setCalculation(null);
      setError(null);
    }
  }, [marketA, marketB, calculationMode]);

  useEffect(() => {
    setBudgetPercentage(100);
  }, [calculation]);

  const totalBetAmount = calculation
    ? (calculation.betAmountA + calculation.betAmountB) *
      (budgetPercentage / 100)
    : 0;

  return (
    <div class="p-4 mx-auto max-w-screen-md text-gray-100">
      <h1 class="text-xl font-bold mb-1">Arbitrage App</h1>
      <p class="mb-4 text-sm text-gray-400">
        Find RISK-free profit by identifying discrepancies between two BINARY
        markets. Enter the market with the lower probability in Market A.
      </p>

      <div class="flex flex-col md:flex-row gap-4">
        <MarketInput
          marketUrl={marketAUrl}
          setMarketUrl={setMarketAUrl}
          marketData={marketA}
          sideLabel="Market A (Buy YES)"
          placeholder="URL for lower probability market"
          isLoading={loadingA}
        />
        <MarketInput
          marketUrl={marketBUrl}
          setMarketUrl={setMarketBUrl}
          marketData={marketB}
          sideLabel="Market B (Buy NO)"
          placeholder="URL for higher probability market"
          isLoading={loadingB}
        />
      </div>

      <CalculationModeToggle
        mode={calculationMode}
        setMode={setCalculationMode}
      />

      <ArbitrageResults
        calculation={calculation}
        error={error}
        isLoading={loadingA || loadingB}
        budgetPercentage={budgetPercentage}
      />

      {calculation && (
        <>
          <BudgetSlider
            budgetPercentage={budgetPercentage}
            setBudgetPercentage={setBudgetPercentage}
          />

          <div class="mt-6 border-t border-gray-700 pt-4">
            <div class="flex justify-between items-center">
              <h3 class="text-base font-semibold text-white">
                Execute Arbitrage
              </h3>
              <p class="text-sm text-gray-400">
                Total Cost:{" "}
                <span class="font-bold text-white">
                  M{Math.round(totalBetAmount)}
                </span>
              </p>
            </div>

            <div class="mt-2">
              <label htmlFor="api-key" class="sr-only">
                Manifold API Key
              </label>
              <input
                type="password"
                id="api-key"
                name="apiKey"
                value={apiKey}
                onInput={(e) => setApiKey(e.currentTarget.value)}
                placeholder="Paste API key to enable betting"
                class="block w-full border border-gray-600 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-800 text-gray-100"
              />
            </div>

            <ArbitrageExecutionButton
              calculation={calculation}
              apiKey={apiKey}
              budgetPercentage={budgetPercentage}
            />
          </div>
        </>
      )}
    </div>
  );
}
