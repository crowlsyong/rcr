// islands/tools/arbitrage/ArbitrageExecutionButton.tsx
import { useEffect, useState } from "preact/hooks";
import { ArbitrageCalculation } from "../../../utils/arbitrage_calculator.ts";

interface ArbitrageExecutionButtonProps {
  calculation: ArbitrageCalculation;
  apiKey: string;
  budgetPercentage: number;
}

interface PlaceBetsApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  betDetails?: Array<{ market: string; status: string; amount?: number }>;
}

export default function ArbitrageExecutionButton(
  { calculation, apiKey, budgetPercentage }: ArbitrageExecutionButtonProps,
) {
  const [isPlacing, setIsPlacing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiResponseData, setApiResponseData] = useState<
    PlaceBetsApiResponse | null
  >(null);

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
    setApiResponseData(null);

    const scale = budgetPercentage / 100;

    const body = {
      apiKey,
      betA: {
        contractId: calculation.marketA.id,
        amount: calculation.betAmountA * scale,
        outcome: calculation.betOutcomeA,
      },
      betB: {
        contractId: calculation.marketB.id,
        amount: calculation.betAmountB * scale,
        outcome: calculation.betOutcomeB,
      },
    };

    try {
      const response = await fetch("/api/v0/arbitrage/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data: PlaceBetsApiResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "An unknown error occurred");
      }

      setApiResponseData(data);
      setMessage(data.message || "Arbitrage bets placed successfully!");
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

  const renderMessageContent = () => {
    if (error) {
      return <p class="mt-2 text-red-400 text-xs">Error: {error}</p>;
    }
    if (message) {
      const betDetails = apiResponseData?.betDetails;

      return (
        <div class="mt-2 text-green-400 text-xs">
          <p>{message}</p>
          {betDetails && (
            <ul class="list-disc list-inside text-gray-400 text-xxs mt-1">
              {betDetails.map((detail, index) => (
                <li key={index}>
                  {detail.market}: {detail.status}{" "}
                  {detail.amount !== undefined && detail.status === "placed"
                    ? `(M${detail.amount.toFixed(0)})`
                    : ""}
                </li>
              ))}
            </ul>
          )}
          {calculation.marketA.url && calculation.marketB.url && (
            <p class="mt-1">
              {"View on Manifold: "}
              <a
                href={calculation.marketA.url}
                target="_blank"
                rel="noopener noreferrer"
                class="underline text-blue-400 hover:text-blue-300"
              >
                Market A
              </a>{" "}
              &{" "}
              <a
                href={calculation.marketB.url}
                target="_blank"
                rel="noopener noreferrer"
                class="underline text-blue-400 hover:text-blue-300"
              >
                Market B
              </a>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div class="mt-3">
      <button
        type="button"
        onClick={handleConfirmationClick}
        disabled={isPlacing || !apiKey}
        class={`w-full flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed ${
          isConfirming
            ? "bg-yellow-700 hover:bg-yellow-800 focus:ring-yellow-400"
            : "bg-green-600 hover:bg-green-700 focus:ring-green-500"
        }`}
      >
        {isPlacing ? "Placing Bets..." : buttonText}
      </button>
      {renderMessageContent()}
    </div>
  );
}
