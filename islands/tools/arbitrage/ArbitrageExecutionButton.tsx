// islands/tools/arbitrage/ArbitrageExecutionButton.tsx

import { useEffect, useState } from "preact/hooks";
import { ArbitrageCalculation } from "../../../utils/arbitrage_calculator.ts";

interface ArbitrageExecutionButtonProps {
  calculation: ArbitrageCalculation;
  apiKey: string;
  budgetPercentage: number;
}

// Define the expected structure of the success response from the API route.
// This interface reflects what the API is currently returning.
interface PlaceBetsApiResponse {
  message?: string; // For base success message
  error?: string; // For error messages
  betA?: { id: string; amount: number; shares: number };
  betB?: { id: string; amount: number; shares: number };
  // The API still returns these, even if we don't strictly use their 'slug' for linking
  marketAInfo?: { slug: string; question: string };
  marketBInfo?: { slug: string; question: string };
  betDetails?: Array<{ market: string; status: string; amount?: number }>;
}

export default function ArbitrageExecutionButton(
  { calculation, apiKey, budgetPercentage }: ArbitrageExecutionButtonProps,
) {
  const [isPlacing, setIsPlacing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null); // For success messages
  const [error, setError] = useState<string | null>(null); // For error messages
  // This state will store the API's full response data, but we'll use calculation.url for links
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
    setApiResponseData(null); // Clear previous response data

    const scale = budgetPercentage / 100;

    // Construct body exactly as the API expects it,
    // including marketInfo with slug (as API expects it)
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
      // Pass the market info that the API is set up to receive and return
      marketAInfo: {
        slug: calculation.marketA.slug,
        question: calculation.marketA.question,
      },
      marketBInfo: {
        slug: calculation.marketB.slug,
        question: calculation.marketB.question,
      },
    };

    try {
      const response = await fetch("/api/v0/place-arbitrage-bets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data: PlaceBetsApiResponse = await response.json(); // Type the response

      if (!response.ok) {
        // API returns error in 'error' property on failure, or 'message'
        throw new Error(
          data.error || data.message || "An unknown error occurred",
        );
      }

      setApiResponseData(data); // Store the full API response
      setMessage(data.message || "Arbitrage bets placed successfully!"); // Use API's message
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
      // Access betDetails from apiResponseData if available (assuming API provides it now)
      const betDetails = apiResponseData?.betDetails;

      return (
        <p class="mt-2 text-green-400 text-xs">
          {message}
          {betDetails && ( // Render bet details if provided by the API
            <ul>
              {betDetails.map((detail, index) => (
                <li key={index}>
                  {detail.market}: {detail.status} {detail.amount !== undefined
                    ? ` (M${detail.amount.toFixed(2)})`
                    : ""}
                </li>
              ))}
            </ul>
          )}
          {
            /* CRITICAL FIX: Use calculation.marketA.url and calculation.marketB.url
              These are available on the frontend and are the correct full URLs. */
          }
          {calculation.marketA.url && calculation.marketB.url && (
            <>
              {" View "}
              <a
                href={calculation.marketA.url}
                target="_blank"
                rel="noopener noreferrer"
                class="underline text-blue-400 hover:text-blue-300"
              >
                {calculation.marketA.question}
              </a>{" "}
              and{" "}
              <a
                href={calculation.marketB.url}
                target="_blank"
                rel="noopener noreferrer"
                class="underline text-blue-400 hover:text-blue-300"
              >
                {calculation.marketB.question}
              </a>
            </>
          )}
        </p>
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
