import { useEffect, useState } from "preact/hooks";
import { getMarketDataBySlug } from "../../../utils/api/manifold_api_service.ts";
import { MarketData } from "../../../utils/api/manifold_types.ts";
import {
  ArbitrageCalculation,
  calculateArbitrage,
} from "../../../utils/arbitrage_calculator.ts";
import ArbitrageResults from "./ArbitrageResults.tsx";
import MarketInput from "./MarketInput.tsx";

export default function ArbitrageCalculator() {
  const [marketAUrl, setMarketAUrl] = useState("");
  const [marketBUrl, setMarketBUrl] = useState("");

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
      const { result, error } = calculateArbitrage(marketA, marketB);
      setCalculation(result);
      setError(error);
    } else {
      setCalculation(null);
      setError(null);
    }
  }, [marketA, marketB]);

  return (
    <div class="p-4 mx-auto max-w-screen-md text-gray-100">
      <h1 class="text-2xl font-bold mb-2">Arbitrage Calculator</h1>
      <p class="mb-6 text-gray-300">
        Find risk-free profit by identifying discrepancies between two BINARY
        markets. Enter the market with the lower probability in Market A.
      </p>

      <div class="flex flex-col md:flex-row gap-6">
        <MarketInput
          marketUrl={marketAUrl}
          setMarketUrl={setMarketAUrl}
          marketData={marketA}
          sideLabel="Market A (Buy YES)"
          placeholder="URL for market with lower probability"
          isLoading={loadingA}
        />
        <MarketInput
          marketUrl={marketBUrl}
          setMarketUrl={setMarketBUrl}
          marketData={marketB}
          sideLabel="Market B (Buy NO)"
          placeholder="URL for market with higher probability"
          isLoading={loadingB}
        />
      </div>

      <ArbitrageResults
        calculation={calculation}
        error={error}
        isLoading={loadingA || loadingB}
      />
    </div>
  );
}
