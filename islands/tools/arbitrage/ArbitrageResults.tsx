import { ArbitrageCalculation } from "../../../utils/arbitrage_calculator.ts";

interface ArbitrageResultsProps {
  calculation: ArbitrageCalculation | null;
  error: string | null;
  isLoading: boolean;
}

export default function ArbitrageResults(
  { calculation, error, isLoading }: ArbitrageResultsProps,
) {
  const formatMana = (amount: number): string => {
    return amount.toFixed(2);
  };

  const renderContent = () => {
    if (isLoading) {
      return <p class="text-center text-gray-400">Calculating...</p>;
    }

    if (error) {
      return <p class="text-center text-yellow-400">{error}</p>;
    }

    if (!calculation) {
      return (
        <p class="text-center text-gray-500">
          Enter two market URLs to find arbitrage opportunities
        </p>
      );
    }

    return (
      <div>
        <div class="text-center mb-6">
          <p class="text-lg text-gray-300">Guaranteed Profit</p>
          <p class="text-4xl font-bold text-green-400">
            M{formatMana(calculation.profit)}
          </p>
          <p class="text-sm text-gray-400 mt-1">
            New Equilibrium Probability:{" "}
            {(calculation.newProbability * 100).toFixed(2)}%
          </p>
        </div>

        <div class="space-y-4">
          <div class="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
            <p class="text-sm text-gray-400">Bet YES on Market A</p>
            <p class="text-lg font-semibold text-gray-100 truncate">
              {calculation.marketA.question}
            </p>
            <p class="text-xl font-bold text-white mt-1">
              M{formatMana(calculation.betAmountA)}
            </p>
          </div>
          <div class="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
            <p class="text-sm text-gray-400">Bet NO on Market B</p>
            <p class="text-lg font-semibold text-gray-100 truncate">
              {calculation.marketB.question}
            </p>
            <p class="text-xl font-bold text-white mt-1">
              M{formatMana(calculation.betAmountB)}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div class="bg-gray-800 shadow-lg rounded-lg p-6 mt-8 border border-gray-700 min-h-[280px] flex items-center justify-center">
      {renderContent()}
    </div>
  );
}
