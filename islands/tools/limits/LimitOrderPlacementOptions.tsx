// islands/tools/limits/LimitOrderPlacementOptions.tsx
import { useEffect, useState } from "preact/hooks";

interface PlacementOptionsProps {
  yesLimitOrderAmount: number;
  noLimitOrderAmount: number;
  lowerProbability: number;
  upperProbability: number;
  apiKey: string;
  contractId: string;
  marketUrl: string;
}

export default function LimitOrderPlacementOptions(
  props: PlacementOptionsProps,
) {
  const [activeTab, setActiveTab] = useState<"bash" | "powershell">("bash");
  const [placingOrders, setPlacingOrders] = useState(false);
  const [placementMessage, setPlacementMessage] = useState<string | null>(null);
  const [placementError, setPlacementError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false); // New state for confirmation

  // Effect to reset the confirmation state after a timeout
  useEffect(() => {
    let timeoutId: number;
    if (isConfirming) {
      timeoutId = setTimeout(() => {
        setIsConfirming(false);
      }, 4000); // Revert after 4 seconds
    }
    return () => {
      clearTimeout(timeoutId);
    };
  }, [isConfirming]);

  const handlePlaceOrders = async () => {
    setPlacingOrders(true);
    setPlacementMessage(null);
    setPlacementError(null);

    try {
      const response = await fetch("/api/place-limit-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: props.apiKey,
          contractId: props.contractId,
          yesAmount: props.yesLimitOrderAmount,
          noAmount: props.noLimitOrderAmount,
          yesLimitProb: props.lowerProbability / 100,
          noLimitProb: props.upperProbability / 100,
          expiresMillisAfter: 24 * 60 * 60 * 1000,
        }),
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

  // New handler for the two-step click process
  const handleConfirmationClick = () => {
    if (isConfirming) {
      // This is the second click, execute the order
      handlePlaceOrders();
      setIsConfirming(false); // Reset confirmation state
    } else {
      // This is the first click, start the confirmation process
      setIsConfirming(true);
    }
  };

  const getBetPayloadString = (outcome: "YES" | "NO"): string => {
    const amount = outcome === "YES"
      ? props.yesLimitOrderAmount
      : props.noLimitOrderAmount;
    const limitProb = outcome === "YES"
      ? props.lowerProbability / 100
      : props.upperProbability / 100;

    const roundedAmount = parseFloat(amount.toFixed(2));
    const roundedLimitProb = parseFloat(limitProb.toFixed(2));

    const betData = {
      amount: roundedAmount,
      contractId: props.contractId,
      outcome: outcome,
      limitProb: roundedLimitProb,
      expiresMillisAfter: 24 * 60 * 60 * 1000,
    };
    return JSON.stringify(betData);
  };

  const generateBashCurlCommand = (): string => {
    const yesCmd = `curl -s -X POST https://api.manifold.markets/v0/bet \\
    -H 'Authorization: Key ${props.apiKey}' \\
    -H 'Content-Type: application/json' \\
    -d '${getBetPayloadString("YES")}'`;
    const noCmd = `curl -s -X POST https://api.manifold.markets/v0/bet \\
    -H 'Authorization: Key ${props.apiKey}' \\
    -H 'Content-Type: application/json' \\
    -d '${getBetPayloadString("NO")}'`;
    const errorMessage =
      `echo "\\n*** WARNING: One or both bets failed. Please check the error above. ***" && \\
    echo "Your bets might be in an unbalanced state. Please verify on Manifold: ${props.marketUrl}"`;
    return `set -e ; (${yesCmd}) && (${noCmd}) || ( ${errorMessage} )`;
  };

  const generatePowerShellCurlCommand = (): string => {
    const psYesPayload = getBetPayloadString("YES").replace(/"/g, '\\"');
    const psNoPayload = getBetPayloadString("NO").replace(/"/g, '\\"');

    return `function Place-Bet($label, $json) {
    Write-Host "Attempting $label bet..."
    $response = curl.exe -s -X POST https://api.manifold.markets/v0/bet \`
        -H 'Authorization: Key ${props.apiKey}' \`
        -H 'Content-Type: application/json' \`
        -d $json

    try {
        $parsed = $response | ConvertFrom-Json
        if ($parsed.error) {
            throw "$label bet failed: $($parsed.error.message)"
        }
        Write-Host "$label bet succeeded."
    } catch {
        throw "$label bet failed. Raw response: $response"
    }
}

try {
    Place-Bet "YES" '${psYesPayload}'
    Place-Bet "NO"  '${psNoPayload}'

    Write-Host "\`nBoth bets placed successfully!"
} catch {
    Write-Host "\`n*** WARNING: A bet failed. ***" -ForegroundColor Yellow
    Write-Host $_
    Write-Host "Please verify your position on Manifold: ${props.marketUrl}"
}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch((err) => console.error("Failed to copy: ", err));
  };

  const commandToDisplay = activeTab === "bash"
    ? generateBashCurlCommand()
    : generatePowerShellCurlCommand();

  return (
    <div class="mt-8 border-t border-gray-700 pt-6">
      <h3 class="text-lg font-semibold mb-3 text-white">
        Place Limit Orders
      </h3>
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

      <div class="mt-6">
        <h4 class="font-medium text-gray-300 mb-2">
          2. Manual Execution (via `curl`)
        </h4>
        <div class="flex border-b border-gray-600">
          <button
            type="button"
            onClick={() => setActiveTab("bash")}
            class={`py-2 px-4 text-sm font-medium ${
              activeTab === "bash"
                ? "border-b-2 border-blue-400 text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            macOS / Linux
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("powershell")}
            class={`py-2 px-4 text-sm font-medium ${
              activeTab === "powershell"
                ? "border-b-2 border-blue-400 text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Windows (PowerShell)
          </button>
        </div>
        <div class="relative mt-2">
          <pre class="bg-gray-900 text-gray-300 p-3 rounded-md text-sm overflow-x-auto whitespace-pre-wrap break-all pr-12">
            <code>{commandToDisplay}</code>
          </pre>
          <button
            type="button"
            onClick={() => copyToClipboard(commandToDisplay)}
            class="absolute top-2 right-2 p-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white text-xs"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}
