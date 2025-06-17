import { useState } from "preact/hooks";
import { ExpirationSettings } from "./LimitOrderPlacementOptions.tsx";
import { Order } from "./LimitOrderCalculator.tsx";

interface ManualExecutionProps {
  orders: Order[];
  apiKey: string;
  contractId: string;
  marketUrl: string;
  expirationSettings: ExpirationSettings;
}

interface BetPayload {
  amount: number;
  contractId: string;
  outcome: "YES" | "NO";
  limitProb: number;
  expiresMillisAfter?: number;
  expiresAt?: number;
}

export default function ManualExecution(props: ManualExecutionProps) {
  const [activeTab, setActiveTab] = useState<"bash" | "powershell">("bash");
  const [copied, setCopied] = useState(false);

  const getBetPayload = (
    amount: number,
    outcome: "YES" | "NO",
    limitProb: number,
  ): BetPayload => {
    const betData: BetPayload = {
      amount: parseFloat(amount.toFixed(2)),
      contractId: props.contractId,
      outcome: outcome,
      limitProb: parseFloat(limitProb.toFixed(2)),
    };

    if (
      props.expirationSettings.type === "duration" &&
      props.expirationSettings.value
    ) {
      betData.expiresMillisAfter = props.expirationSettings.value;
    } else if (
      props.expirationSettings.type === "date" &&
      props.expirationSettings.value
    ) {
      betData.expiresAt = props.expirationSettings.value;
    }
    return betData;
  };

  const generateBashCurlCommand = (): string => {
    const commands = props.orders.flatMap((order, i) => {
      const yesPayload = JSON.stringify(
        getBetPayload(order.yesAmount, "YES", order.yesProb),
      );
      const noPayload = JSON.stringify(
        getBetPayload(order.noAmount, "NO", order.noProb),
      );

      const yesCmd = `echo "Placing YES bet for pair ${
        i + 1
      }..." && curl -s -X POST https://api.manifold.markets/v0/bet -H 'Authorization: Key ${props.apiKey}' -H 'Content-Type: application/json' -d '${yesPayload}'`;
      const noCmd = `echo "Placing NO bet for pair ${
        i + 1
      }..." && curl -s -X POST https://api.manifold.markets/v0/bet -H 'Authorization: Key ${props.apiKey}' -H 'Content-Type: application/json' -d '${noPayload}'`;

      return [yesCmd, noCmd];
    }).join(" && \\\n");

    const errorMessage =
      `echo "\\n*** WARNING: One or more bets may have failed. ***" && \\
    echo "Your bets might be in an unbalanced state. Please verify on Manifold: ${props.marketUrl}"`;

    return `set -e\n${commands} && echo "\\nAll bets placed successfully!" || ( ${errorMessage} )`;
  };

  const generatePowerShellCurlCommand = (): string => {
    const allPayloads = props.orders.flatMap((order, i) => {
      const yesPayload = JSON.stringify(
        getBetPayload(order.yesAmount, "YES", order.yesProb),
      ).replace(/"/g, '\\"');
      const noPayload = JSON.stringify(
        getBetPayload(order.noAmount, "NO", order.noProb),
      ).replace(/"/g, '\\"');
      return [
        `Place-Bet "YES (Pair ${i + 1})" '${yesPayload}'`,
        `Place-Bet "NO (Pair ${i + 1})" '${noPayload}'`,
      ];
    }).join("\n    ");

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
    ${allPayloads}

    Write-Host "\`nAll bets placed successfully!" -ForegroundColor Green
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
  );
}
