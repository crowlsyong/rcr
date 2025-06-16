// islands/tools/LimitOrderResultsDisplay.tsx
import { useState } from "preact/hooks";

interface LimitOrderResultsProps {
  yesLimitOrderAmount: number | null;
  noLimitOrderAmount: number | null;
  sharesAcquired: number | null;
  totalBetAmount: number; // Pass total budget for display
  lowerProbability: number;
  upperProbability: number;
  apiKey: string;
  contractId: string | null;
  marketUrl: string | null; // Pass the market URL for fallback message
}

export default function LimitOrderResultsDisplay(
  props: LimitOrderResultsProps,
) {
  const [copiedYes, setCopiedYes] = useState(false);
  const [copiedNo, setCopiedNo] = useState(false);
  const [copiedCombined, setCopiedCombined] = useState(false);

  // Function to generate a single bet curl command's full string
  const generateBetCurlCommand = (
    contractId: string,
    amount: number,
    outcome: "YES" | "NO",
    limitProb: number,
    apiKey: string,
  ): string => {
    const expiresMillisAfter = 24 * 60 * 60 * 1000;
    const formattedLimitProb = limitProb.toFixed(2);

    const betData = {
      amount: amount.toFixed(2),
      contractId: contractId,
      outcome: outcome,
      limitProb: formattedLimitProb,
      expiresMillisAfter: expiresMillisAfter,
    };
    const payloadString = JSON.stringify(betData);

    return `curl -s -X POST \\
  https://api.manifold.markets/v0/bet \\
  -H 'Authorization: Key ${apiKey}' \\
  -H 'Content-Type: application/json' \\
  -d '${payloadString}'`;
  };

  // Function to generate the combined curl command (YES && NO)
  const generateCombinedCurlCommand = (
    contractId: string,
    yesAmount: number,
    noAmount: number,
    yesLimitProb: number,
    noLimitProb: number,
    apiKey: string,
    marketUrl: string, // Needed for fallback instructions
  ): string => {
    const yesCmdPart = generateBetCurlCommand(
      contractId,
      yesAmount,
      "YES",
      yesLimitProb,
      apiKey,
    );
    const noCmdPart = generateBetCurlCommand(
      contractId,
      noAmount,
      "NO",
      noLimitProb,
      apiKey,
    );

    const errorMessage =
      `echo "\\n*** WARNING: One or both bets failed. Please check the error above. ***" && \\
echo "Your bets might be in an unbalanced state, or no bets were placed." && \\
echo "Please verify on Manifold Markets: ${marketUrl}" && \\
echo "You can try placing bets individually using the commands below."`;

    return `set -e ; (${yesCmdPart}) && (${noCmdPart}) || ( ${errorMessage} )`;
  };

  const copyToClipboard = (text: string, type: "yes" | "no" | "combined") => {
    navigator.clipboard.writeText(text).then(() => {
      if (type === "yes") {
        setCopiedYes(true);
        setTimeout(() => setCopiedYes(false), 2000);
      } else if (type === "no") {
        setCopiedNo(true);
        setTimeout(() => setCopiedNo(false), 2000);
      } else if (type === "combined") {
        setCopiedCombined(true);
        setTimeout(() => setCopiedCombined(false), 2000);
      }
    }).catch((err) => {
      console.error("Failed to copy: ", err);
    });
  };

  if (
    props.yesLimitOrderAmount === null || props.noLimitOrderAmount === null ||
    props.sharesAcquired === null
  ) {
    return null;
  }

  const hasValidAmounts = props.yesLimitOrderAmount > 0 &&
    props.noLimitOrderAmount > 0;

  return (
    <div class="bg-gray-800 shadow overflow-hidden sm:rounded-lg p-6 mb-6 border border-gray-700">
      <h2 class="text-xl font-semibold mb-3 text-white">
        Calculated Limit Orders
      </h2>
      <p>
        With a total budget of M
        <span class="font-bold text-white">
          {props.totalBetAmount.toFixed(2)}
        </span>, you will acquire approximately{" "}
        <span class="font-bold text-white">
          {props.sharesAcquired.toFixed(2)} shares
        </span>{" "}
        of each outcome (potential payout of M
        <span class="font-bold text-white">
          {props.sharesAcquired.toFixed(2)}
        </span>):
      </p>
      <ul class="list-disc pl-5 mt-4 text-gray-200 text-lg">
        <li>
          Bet <span class="font-bold text-green-400">YES</span> at{" "}
          {props.lowerProbability}%:{" "}
          <span class="font-bold text-white">
            M
            {props.yesLimitOrderAmount.toFixed(2)}
          </span>
        </li>
        <li>
          Bet <span class="font-bold text-red-400">NO</span> at{" "}
          {props.upperProbability}%:{" "}
          <span class="font-bold text-white">
            M
            {props.noLimitOrderAmount.toFixed(2)}
          </span>
        </li>
      </ul>

      {props.apiKey && props.contractId && hasValidAmounts && props.marketUrl &&
        (
          <div class="mt-8 border-t border-gray-700 pt-6">
            <h3 class="text-lg font-semibold mb-3 text-white">
              Generate `curl` Commands
            </h3>
            <p class="mb-4 text-gray-400 text-sm">
              Use the combined command for a single-line execution. If it fails,
              check your terminal for details and consider using the individual
              commands below. Remember to keep your API key secure. Orders will
              expire in 24 hours.
            </p>

            {/* Combined Command */}
            <div class="mb-6">
              <h4 class="font-medium text-gray-300 mb-2">
                1. Combined Bet Command:
              </h4>
              <p class="mb-2 text-gray-400 text-sm">
                This command attempts to place both YES and NO bets.
              </p>
              <div class="relative">
                <pre class="bg-gray-900 text-blue-300 p-3 rounded-md text-sm overflow-x-auto whitespace-pre-wrap break-all pr-12">
                <code>
                  {generateCombinedCurlCommand(
                    props.contractId,
                    props.yesLimitOrderAmount!,
                    props.noLimitOrderAmount!,
                    props.lowerProbability / 100,
                    props.upperProbability / 100,
                    props.apiKey,
                    props.marketUrl!,
                  )}
                </code>
                </pre>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      generateCombinedCurlCommand(
                        props.contractId!,
                        props.yesLimitOrderAmount!,
                        props.noLimitOrderAmount!,
                        props.lowerProbability / 100,
                        props.upperProbability / 100,
                        props.apiKey,
                        props.marketUrl!,
                      ),
                      "combined",
                    )}
                  class="absolute top-2 right-2 p-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white text-xs"
                >
                  {copiedCombined ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            {/* Individual YES Bet Command */}
            <div class="mb-6">
              <h4 class="font-medium text-gray-300 mb-2">
                2. Individual YES Bet Command:
              </h4>
              <p class="mb-2 text-gray-400 text-sm">
                Use this if the combined command fails, or for individual
                placement.
              </p>
              <div class="relative">
                <pre class="bg-gray-900 text-green-300 p-3 rounded-md text-sm overflow-x-auto whitespace-pre-wrap break-all pr-12">
                <code>
                  {generateBetCurlCommand(
                    props.contractId,
                    props.yesLimitOrderAmount!,
                    "YES",
                    props.lowerProbability / 100,
                    props.apiKey,
                  )}
                </code>
                </pre>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      generateBetCurlCommand(
                        props.contractId!,
                        props.yesLimitOrderAmount!,
                        "YES",
                        props.lowerProbability / 100,
                        props.apiKey,
                      ),
                      "yes",
                    )}
                  class="absolute top-2 right-2 p-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white text-xs"
                >
                  {copiedYes ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            {/* Individual NO Bet Command */}
            <div>
              <h4 class="font-medium text-gray-300 mb-2">
                3. Individual NO Bet Command:
              </h4>
              <p class="mb-2 text-gray-400 text-sm">
                Use this if the combined command fails, or for individual
                placement.
              </p>
              <div class="relative">
                <pre class="bg-gray-900 text-red-300 p-3 rounded-md text-sm overflow-x-auto whitespace-pre-wrap break-all pr-12">
                <code>
                  {generateBetCurlCommand(
                    props.contractId,
                    props.noLimitOrderAmount!,
                    "NO",
                    props.upperProbability / 100,
                    props.apiKey,
                  )}
                </code>
                </pre>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      generateBetCurlCommand(
                        props.contractId!,
                        props.noLimitOrderAmount!,
                        "NO",
                        props.upperProbability / 100,
                        props.apiKey,
                      ),
                      "no",
                    )}
                  class="absolute top-2 right-2 p-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white text-xs"
                >
                  {copiedNo ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        )}
      {!hasValidAmounts && props.apiKey && props.contractId && (
        <p class="mt-8 border-t border-gray-700 pt-6 text-red-400 text-sm">
          Cannot generate commands: One or both calculated bet amounts are zero
          or negative. Adjust your total budget or probability range.
        </p>
      )}

      <p class="mt-4 text-gray-400 text-sm">
        This strategy ensures your total specified budget is used, while
        yielding the same potential profit in Mana regardless of the outcome,
        assuming both limit orders are fully filled.
      </p>
    </div>
  );
}
