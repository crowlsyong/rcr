// islands/tools/limits/DirectExecution.tsx
import { useEffect, useState } from "preact/hooks";
import { ExpirationSettings } from "./LimitOrderCalculatorForm.tsx";

interface DirectExecutionProps {
  yesLimitOrderAmount: number;
  noLimitOrderAmount: number;
  lowerProbability: number;
  upperProbability: number;
  apiKey: string;
  contractId: string;
  marketUrl: string;
  expirationSettings: ExpirationSettings;
}

interface BetPlacementBody {
  apiKey: string;
  contractId: string;
  yesAmount: number;
  noAmount: number;
  yesLimitProb: number;
  noLimitProb: number;
  expiresMillisAfter?: number; // This is now optional
}

export default function DirectExecution(props: DirectExecutionProps) {
  const [placingOrders, setPlacingOrders] = useState(false);
  const [placementMessage, setPlacementMessage] = useState<string | null>(null);
  const [placementError, setPlacementError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    let timeoutId: number;
    if (isConfirming) {
      timeoutId = setTimeout(() => setIsConfirming(false), 4000);
    }
    return () => clearTimeout(timeoutId);
  }, [isConfirming]);

  const handlePlaceOrders = async () => {
    setPlacingOrders(true);
    setPlacementMessage(null);
    setPlacementError(null);

    const body: BetPlacementBody = {
      apiKey: props.apiKey,
      contractId: props.contractId,
      yesAmount: props.yesLimitOrderAmount,
      noAmount: props.noLimitOrderAmount,
      yesLimitProb: props.lowerProbability / 100,
      noLimitProb: props.upperProbability / 100,
    };

    // --- THIS IS THE FIX ---
    // Conditionally add expiresMillisAfter only if the type is 'duration'
    if (
      props.expirationSettings.type === "duration" &&
      props.expirationSettings.value
    ) {
      body.expiresMillisAfter = props.expirationSettings.value;
    }

    try {
      const response = await fetch("/api/place-limit-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) {
        setPlacementError(data.error || "Failed to place orders.");
      } else {
        setPlacementMessage(data.message || "Orders placed successfully!");
      }
    } catch (e) {
      setPlacementError(
        `Network error: ${
          typeof e === "object" && e !== null && "message" in e
            ? (e as { message: string }).message
            : String(e)
        }`,
      );
    } finally {
      setPlacingOrders(false);
    }
  };

  const handleConfirmationClick = () => {
    if (isConfirming) {
      handlePlaceOrders();
      setIsConfirming(false);
    } else {
      setIsConfirming(true);
    }
  };

  return (
    <div class="mb-4">
      <h4 class="font-medium text-gray-300 mb-2">
        1. Direct Execution (Recommended)
      </h4>
      <p class="mb-2 text-gray-400 text-sm">
        Place both orders securely through our server. If one fails, the other
        will be automatically canceled.
      </p>
      <button
        type="button"
        onClick={handleConfirmationClick}
        disabled={placingOrders}
        class={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
          isConfirming
            ? "bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400"
            : "bg-green-600 hover:bg-green-700 focus:ring-green-500"
        }`}
      >
        {placingOrders
          ? "Placing Orders..."
          : isConfirming
          ? "Are you sure? Click to Confirm"
          : "Place Both Limit Orders"}
      </button>
      {placementMessage && (
        <div class="mt-2 text-sm flex items-center gap-2">
          <span class="text-green-400">{placementMessage}</span>
          <a
            href={props.marketUrl}
            target="_blank"
            rel="noopener noreferrer"
            class="text-blue-400 hover:underline"
          >
            (Go to Market)
          </a>
        </div>
      )}
      {placementError && (
        <p class="mt-2 text-red-400 text-sm">Error: {placementError}</p>
      )}
    </div>
  );
}
