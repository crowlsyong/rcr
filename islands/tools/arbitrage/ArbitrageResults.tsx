import { ArbitrageCalculation } from "../../../utils/arbitrage_calculator.ts";

interface ArbitrageResultsProps {
  calculation: ArbitrageCalculation | null;
  error: string | null;
  isLoading: boolean;
  budgetPercentage: number;
}

export default function ArbitrageResults(
  { calculation, error, isLoading, budgetPercentage }: ArbitrageResultsProps,
) {
  const formatMana = (amount: number): string => {
    return Math.round(amount).toString();
  };

  const renderContent = () => {
    if (isLoading) {
      return <p class="text-center text-gray-400 text-sm">Calculating...</p>;
    }

    if (error) {
      return <p class="text-center text-yellow-400 text-sm">{error}</p>;
    }

    if (!calculation) {
      return (
        <p class="text-center text-gray-500 text-sm">
          Enter two market URLs to find arbitrage opportunities
        </p>
      );
    }

    const scale = budgetPercentage / 100;
    const displayProfit = calculation.profit * scale;
    const displayBetA = calculation.betAmountA * scale;
    const displayBetB = calculation.betAmountB * scale;

    return (
      <div class="w-full">
        <div class="text-center border-b border-gray-700 pb-2 mb-2">
          <p class="text-xs text-gray-300">Guaranteed Profit</p>
          <p class="text-xl font-bold text-green-400">
            M{formatMana(displayProfit)}
          </p>
          <p class="text-[11px] text-gray-500">
            Equilibrium: {(calculation.newProbability * 100).toFixed(2)}%
          </p>
        </div>

        <div class="flex justify-around text-center">
          <div class="px-2">
            <p class="text-xs text-gray-400">Bet YES on Market A</p>
            <p class="text-base font-semibold text-white">
              M{formatMana(displayBetA)}
            </p>
          </div>
          <div class="border-l border-gray-700"></div>
          <div class="px-2">
            <p class="text-xs text-gray-400">Bet NO on Market B</p>
            <p class="text-base font-semibold text-white">
              M{formatMana(displayBetB)}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div class="bg-gray-800 shadow-lg rounded-lg p-3 mt-6 border border-gray-700 min-h-[120px] flex items-center justify-center">
      {renderContent()}
    </div>
  );
}
