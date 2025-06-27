// islands/tools/arbitrage/Placement.tsx

import { useEffect, useState } from "preact/hooks";
import { ArbitrageCalculation } from "../../../utils/arbitrage_calculator.ts";

interface ArbitragePlacementProps {
  calculation: ArbitrageCalculation;
  apiKey: string;
  budgetPercentage: number;
}

export default function ArbitragePlacement(
  { calculation, apiKey, budgetPercentage }: ArbitragePlacementProps,
) {
  const [isPlacing, setIsPlacing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timeoutId: number;
    if (isConfirming) {
      timeoutId = setTimeout(() => setIsConfirming(false), 4000);
    }
    return () => clearTimeout(timeoutId);
  }, [isConfirming]);

  const handlePlaceBets = async () => {
    setIsPlacing(true);
    setMessage(null);
    setError(null);

    const scale = budgetPercentage / 100;

    const body = {
      apiKey,
      betA: {
        contractId: calculation.marketA.id,
        amount: calculation.betAmountA * scale,
        outcome: "YES",
      },
      betB: {
        contractId: calculation.marketB.id,
        amount: calculation.betAmountB * scale,
        outcome: "NO",
      },
    };

    try {
      const response = await fetch("/api/v0/place-arbitrage-bets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "An unknown error occurred");
      }
      setMessage(data.message);
    } catch (e) {
      setError(
        typeof e === "object" && e !== null && "message" in e
          ? (e as { message: string }).message
          : String(e),
      );
    } finally {
      setIsPlacing(false);
    }
  };

  const handleConfirmationClick = () => {
    if (isConfirming) {
      handlePlaceBets();
      setIsConfirming(false);
    } else {
      setIsConfirming(true);
    }
  };

  const buttonText = isConfirming
    ? "Are you sure? Click to Confirm"
    : "Place Arbitrage Bets";

  const scale = budgetPercentage / 100;
  const totalBetAmount = (calculation.betAmountA + calculation.betAmountB) *
    scale;

  return (
    <div class="mt-6 border-t border-gray-700 pt-6">
      <h3 class="text-lg font-semibold text-white">
        Execute Arbitrage
      </h3>
      <p class="text-sm text-gray-400 mb-3">
        Total Bet Amount:{" "}
        <span class="font-bold text-white">
          M{Math.round(totalBetAmount)}
        </span>
      </p>
      <button
        type="button"
        onClick={handleConfirmationClick}
        disabled={isPlacing}
        class={`w-full flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed ${
          isConfirming
            ? "bg-yellow-700 hover:bg-yellow-800 focus:ring-yellow-400"
            : "bg-green-600 hover:bg-green-700 focus:ring-green-500"
        }`}
      >
        {isPlacing ? "Placing Bets..." : buttonText}
      </button>
      {message && <p class="mt-2 text-green-400 text-sm">{message}</p>}
      {error && <p class="mt-2 text-red-400 text-sm">Error: {error}</p>}
    </div>
  );
}
