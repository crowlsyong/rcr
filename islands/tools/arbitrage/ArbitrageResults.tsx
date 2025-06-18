// islands/tools/arbitrage/ArbitrageResults.tsx

import {
  ArbitrageCalculation,
  CalcMode,
} from "../../../utils/arbitrage_calculator.ts";

interface ArbitrageResultsProps {
  calculation: ArbitrageCalculation | null;
  error: string | null;
  isLoading: boolean;
  budgetPercentage: number;
  mode: CalcMode;
}

export default function ArbitrageResults(
  { calculation, error, isLoading, budgetPercentage, mode }:
    ArbitrageResultsProps,
) {
  const formatMana = (amount: number): string => {
    return Math.round(amount).toString();
  };

  const renderContent = () => {
    if (isLoading) {
      return <p class="text-center text-gray-400 text-sm">Calculating...</p>;
    }

    // --- NEW LOGIC ---
    // If there is no calculation object, it's either a true error or the initial state.
    if (!calculation) {
      if (error) {
        // This is a fatal error where no calculation was possible.
        return <p class="text-center text-yellow-400 text-sm">{error}</p>;
      }
      // This is the initial state before markets are entered.
      return (
        <p class="text-center text-gray-500 text-sm">
          Enter market URLs to find opportunities
        </p>
      );
    }

    // If we get here, we HAVE a calculation object. We will render it.
    // The 'error' prop is now treated as an optional informational message.
    const informationalMessage = error;

    const scale = budgetPercentage / 100;
    const displayProfit = calculation.profit * scale;
    const displayBetA = calculation.betAmountA * scale;
    const displayBetB = calculation.betAmountB * scale;

    const profitColor = displayProfit >= 0 ? "text-green-400" : "text-red-400";
    const profitLabel = displayProfit >= 0
      ? "Potential Profit"
      : "Potential Loss";

    const betALabel = `Bet ${calculation.betOutcomeA} on Market A`;
    const betBLabel = `Bet ${calculation.betOutcomeB} on Market B`;

    let secondaryDisplay = "";
    if (mode === "horseRace") {
      const originalInvestment = calculation.betAmountA +
        calculation.betAmountB;
      const totalPayout = originalInvestment + calculation.profit;
      secondaryDisplay = `From M${
        formatMana(originalInvestment)
      } investment to yield M${formatMana(totalPayout)}`;
    } else if (calculation.newProbability) {
      secondaryDisplay = `New Equilibrium: ${
        (calculation.newProbability * 100).toFixed(2)
      }%`;
    }

    return (
      <div class="w-full">
        <div class="text-center border-b border-gray-700 pb-2 mb-2">
          <p class="text-xs text-gray-300">{profitLabel}</p>
          <p class={`text-xl font-bold ${profitColor}`}>
            M{formatMana(displayProfit)}
          </p>
          <p class="text-[11px] text-gray-500">{secondaryDisplay}</p>
        </div>

        <div class="flex justify-around text-center">
          <div class="px-2">
            <p class="text-xs text-gray-400">{betALabel}</p>
            <p class="text-base font-semibold text-white">
              M{formatMana(displayBetA)}
            </p>
          </div>
          <div class="border-l border-gray-700"></div>
          <div class="px-2">
            <p class="text-xs text-gray-400">{betBLabel}</p>
            <p class="text-base font-semibold text-white">
              M{formatMana(displayBetB)}
            </p>
          </div>
        </div>

        {/* Display the informational message at the bottom if it exists */}
        {informationalMessage && (
          <p class="text-center text-yellow-400 text-xs pt-2 border-t border-gray-700 mt-2">
            {informationalMessage}
          </p>
        )}
      </div>
    );
  };

  return (
    <div class="bg-gray-800 shadow-lg rounded-lg p-3 mt-6 border border-gray-700 min-h-[120px] flex items-center justify-center">
      {renderContent()}
    </div>
  );
}
