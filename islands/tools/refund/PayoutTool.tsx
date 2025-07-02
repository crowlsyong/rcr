// islands/tools/refund/PayoutTool.tsx
import { useSignal } from "@preact/signals";
import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import { ComponentType, JSX } from "preact";

import { TbToggleLeftFilled, TbToggleRightFilled } from "@preact-icons/tb";

const ToggleOnIcon = TbToggleRightFilled as ComponentType<
  JSX.IntrinsicElements["svg"]
>;
const ToggleOffIcon = TbToggleLeftFilled as ComponentType<
  JSX.IntrinsicElements["svg"]
>;

interface UserPayout {
  userId: string;
  username: string;
  originalInvested: number;
  calculatedPayout: number;
}

interface SuccessfulPayoutLog {
  timestamp: string;
  status: "success";
  userId: string;
  username: string;
  originalInvested: number;
  calculatedPayout: number;
  manaSent: number;
  managramMessage: string;
  transactionId: string;
  marketUrl: string;
  apologyPercentage: number;
}

interface FailedPayoutLog {
  timestamp: string;
  status: "failed" | "skipped";
  userId: string;
  username: string;
  originalInvested: number;
  calculatedPayout: number;
  reason: string;
  managramMessage?: string;
  marketUrl: string;
  apologyPercentage: number;
}

type DetailedPayoutLog = SuccessfulPayoutLog | FailedPayoutLog;

interface CalculateResponse {
  success: boolean;
  marketSlug?: string;
  marketQuestion?: string;
  totalUsersToPay?: number;
  totalPayoutMana?: number;
  users?: UserPayout[];
  error?: string;
}

interface ExecuteResponse {
  success: boolean;
  message?: string;
  errors?: { userId: string; username: string; error: string }[];
  transactions?: { userId: string; username: string; transactionId: string }[];
  marketResolution?: { status: string; message: string };
  totalPaidMana?: number;
  totalErrors?: number;
  detailedLogs?: DetailedPayoutLog[];
}

export default function EliezerPayoutTool(): JSX.Element {
  const marketUrl = useSignal(""); // Changed to empty string for placeholder
  const apiKey = useSignal("");
  const apologyPercentage = useSignal(20);
  const usersToPay = useSignal<UserPayout[]>([]);
  const marketQuestion = useSignal<string | null>(null);
  const marketSlug = useSignal<string | null>(null);
  const totalUsersToPay = useSignal<number | null>(null);
  const totalPayoutMana = useSignal<number | null>(null);

  const isCalculating = useSignal(false);
  const calculationError = useSignal<string | null>(null);
  const calculationSuccess = useSignal(false);

  const isConfirmingExecute = useSignal(false);
  const isExecuting = useSignal(false);
  const executionMessage = useSignal<string | null>(null);
  const executionErrors = useSignal<
    { userId: string; username: string; error: string }[] | null
  >(null);
  const executionTransactions = useSignal<
    { userId: string; username: string; transactionId: string }[] | null
  >(null);
  const executionTotalErrors = useSignal<number | null>(null);
  const marketResolutionMessage = useSignal<string | null>(null);
  const detailedExecutionLogs = useSignal<DetailedPayoutLog[] | null>(null);
  const executionTotalPaidMana = useSignal<number | null>(null);

  const useCustomManagram = useSignal(false);
  const customManagramMessage = useSignal("");
  const useStartingBetLogic = useSignal(true);

  const debouncedMarketUrl = useSignal(marketUrl.value);
  const debouncedApologyPercentage = useSignal(apologyPercentage.value);
  const debouncedUseStartingBetLogic = useSignal(useStartingBetLogic.value);

  // State for SSR protection of icons
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      debouncedMarketUrl.value = marketUrl.value;
    }, 500);
    return () => clearTimeout(handler);
  }, [marketUrl.value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      debouncedApologyPercentage.value = apologyPercentage.value;
    }, 500);
    return () => clearTimeout(handler);
  }, [apologyPercentage.value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      debouncedUseStartingBetLogic.value = useStartingBetLogic.value;
    }, 500);
    return () => clearTimeout(handler);
  }, [useStartingBetLogic.value]);

  const calculatePayouts = useCallback(async () => {
    if (
      !debouncedMarketUrl.value || debouncedApologyPercentage.value === null
    ) {
      calculationSuccess.value = false;
      usersToPay.value = [];
      marketQuestion.value = null;
      marketSlug.value = null;
      totalUsersToPay.value = null;
      totalPayoutMana.value = null;
      calculationError.value = null;
      return;
    }

    isCalculating.value = true;
    calculationError.value = null;
    calculationSuccess.value = false;
    usersToPay.value = [];
    marketQuestion.value = null;
    marketSlug.value = null;
    totalUsersToPay.value = null;
    totalPayoutMana.value = null;
    isConfirmingExecute.value = false;

    executionMessage.value = null;
    executionErrors.value = null;
    executionTransactions.value = null;
    executionTotalPaidMana.value = null;
    executionTotalErrors.value = null;
    marketResolutionMessage.value = null;
    detailedExecutionLogs.value = null;

    try {
      const response = await fetch("/api/v0/eliezer/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          marketUrl: debouncedMarketUrl.value,
          apologyPercentage: debouncedApologyPercentage.value,
          useStartingBetLogic: debouncedUseStartingBetLogic.value,
        }),
      });

      const data: CalculateResponse = await response.json();

      if (data.success) {
        usersToPay.value = data.users || [];
        marketQuestion.value = data.marketQuestion || null;
        marketSlug.value = data.marketSlug || null;
        totalUsersToPay.value = data.totalUsersToPay || 0;
        totalPayoutMana.value = data.totalPayoutMana || 0;
        calculationSuccess.value = true;
      } else {
        calculationError.value = data.error || "Unknown calculation error.";
      }
    } catch (e: unknown) {
      calculationError.value = `Network error: ${
        typeof e === "object" && e !== null && "message" in e
          ? (e as { message: string }).message
          : String(e)
      }`;
    } finally {
      isCalculating.value = false;
    }
  }, [
    debouncedMarketUrl.value,
    debouncedApologyPercentage.value,
    debouncedUseStartingBetLogic.value,
  ]);

  useEffect(() => {
    calculatePayouts();
  }, [calculatePayouts]);

  useEffect(() => {
    let timeoutId: number | undefined;
    if (isConfirmingExecute.value) {
      timeoutId = setTimeout(() => {
        isConfirmingExecute.value = false;
      }, 5000);
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isConfirmingExecute.value]);

  const handlePercentageInput = (e: Event) => {
    const value = (e.target as HTMLInputElement).value;
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      apologyPercentage.value = parsed;
    } else if (value === "") {
      apologyPercentage.value = 0;
    }
  };

  const handleExecutePayouts = async () => {
    isConfirmingExecute.value = false;
    isExecuting.value = true;
    executionMessage.value = null;
    executionErrors.value = null;
    executionTransactions.value = null;
    executionTotalPaidMana.value = null;
    executionTotalErrors.value = null;
    marketResolutionMessage.value = null;
    detailedExecutionLogs.value = null;

    if (!apiKey.value) {
      executionMessage.value = "API Key is required to execute payouts.";
      isExecuting.value = false;
      return;
    }

    if (!marketSlug.value) {
      executionMessage.value =
        "Market information is missing. Please calculate first.";
      isExecuting.value = false;
      return;
    }

    const marketSlugFullForBackend = marketSlug.value;
    const actualManifoldMarketId = marketSlugFullForBackend.split("/").pop();
    if (!actualManifoldMarketId) {
      executionMessage.value =
        "Could not derive actual Manifold market ID from slug for execution.";
      isExecuting.value = false;
      return;
    }

    try {
      const response = await fetch("/api/v0/eliezer/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey: apiKey.value,
          users: usersToPay.value,
          marketId: actualManifoldMarketId,
          marketSlugFull: marketSlugFullForBackend,
          apologyPercentage: apologyPercentage.value,
          customManagramMessage: useCustomManagram.value
            ? customManagramMessage.value
            : null,
          useStartingBetLogic: useStartingBetLogic.value,
        }),
      });

      const data: ExecuteResponse = await response.json();

      if (data.success) {
        executionMessage.value = data.message || "Payouts completed!";
        executionTransactions.value = data.transactions || [];
        executionErrors.value = data.errors || [];
        executionTotalErrors.value = data.totalErrors || 0;
        marketResolutionMessage.value = data.marketResolution?.message ||
          "Market resolution status unknown.";
        detailedExecutionLogs.value = data.detailedLogs || [];
      } else {
        executionMessage.value = data.message || "Payouts failed.";
        executionErrors.value = data.errors || [];
        executionTotalErrors.value = data.totalErrors || 0;
        marketResolutionMessage.value = data.marketResolution?.message ||
          "Market resolution status unknown.";
        detailedExecutionLogs.value = data.detailedLogs || [];
      }
      executionTotalPaidMana.value = data.totalPaidMana || 0;

      if (
        detailedExecutionLogs.value && detailedExecutionLogs.value.length > 0
      ) {
        downloadExecutionLogs();
      }
    } catch (e: unknown) {
      executionMessage.value = `Network error during execution: ${
        typeof e === "object" && e !== null && "message" in e
          ? (e as { message: string }).message
          : String(e)
      }`;
    } finally {
      isExecuting.value = false;
    }
  };

  const handleConfirmClick = () => {
    if (isConfirmingExecute.value) {
      handleExecutePayouts();
    } else {
      isConfirmingExecute.value = true;
    }
  };

  const downloadExecutionLogs = () => {
    if (detailedExecutionLogs.value) {
      const filename = `eliezer_payout_logs_${Date.now()}.json`;
      const jsonStr = JSON.stringify(detailedExecutionLogs.value, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const managramPreview = useMemo(() => {
    if (
      !calculationSuccess.value || usersToPay.value.length === 0 ||
      !marketSlug.value
    ) {
      return "Managram preview will appear here after calculation results are available.";
    }
    const exampleUser = usersToPay.value[0];
    const invested = Math.round(exampleUser.originalInvested);
    const payout = exampleUser.calculatedPayout;
    const marketLink = `https://manifold.markets/${marketSlug.value}`;
    const payoutBasisText = useStartingBetLogic.value
      ? "starting bet"
      : "total invested";

    return `${apologyPercentage.value}% Payment as an apology for locked funds in ${marketLink} | Based on ${payoutBasisText} M${invested} | Apology payment M${payout}`;
  }, [
    calculationSuccess.value,
    usersToPay.value,
    apologyPercentage.value,
    marketSlug.value,
    useStartingBetLogic.value,
  ]);

  return (
    <div class="w-full max-w-2xl mx-auto p-4 bg-gray-800 rounded-lg shadow-xl text-gray-100">
      {/* Header with Title and Toggle */}
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-2xl font-bold text-blue-400">
          Payout Tool
        </h2>
        {/* Toggle and its descriptive text */}
        <div class="flex items-center gap-2">
          {/* Added a div to group text and toggle */}
          <span class="text-sm text-gray-400">
            Viewing payout based on{"  "}
            <span class="font-semibold text-white">
              {useStartingBetLogic.value ? "Starting Bet" : "Total Invested"}
            </span>
          </span>
          <button
            type="button"
            onClick={() =>
              useStartingBetLogic.value = !useStartingBetLogic.value}
            title={useStartingBetLogic.value
              ? "Payout based on starting bet"
              : "Payout based on total invested"}
            class="flex items-center justify-center p-1 rounded-full focus:outline-none ring-0 focus:ring-0"
          >
            {isClient && (
              useStartingBetLogic.value
                ? <ToggleOnIcon class="w-10 h-10 text-blue-500" size={40} />
                : <ToggleOffIcon class="w-10 h-10 text-gray-500" size={40} />
            )}
          </button>
        </div>
      </div>

      <p class="text-sm text-gray-400 mb-4">
        This tool helps calculate and execute compensation for users who
        invested in a Manifold market. It will send back a % of their
        investment.
        <br />
      </p>

      {/* API Key and Apology Percentage on the same row */}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          {/* Container for API Key */}
          <label
            htmlFor="apiKey"
            class="block text-sm font-medium text-gray-300 mb-1"
          >
            Your Manifold API Key (required for execution)
          </label>
          <input
            type="password"
            id="apiKey"
            value={apiKey.value}
            onInput={(e) => apiKey.value = (e.target as HTMLInputElement).value}
            placeholder="xxxxxx-xxxxx-xxxxxxxxxxxxxxxxxxxx"
            class="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-border-500"
          />
          <p class="mt-1 text-xs text-gray-400">
            Find your API key on your Manifold profile page by clicking the gear
            icon and selecting Account Settings.
          </p>
          <p class="mt-1 text-xs text-gray-400">
            This key is NOT stored on our servers.
          </p>
        </div>

        <div>
          {/* Container for Apology Percentage */}
          <label
            htmlFor="apologyPercentage"
            class="block text-sm font-medium text-gray-300 mb-1"
          >
            Apology Payout Percentage
          </label>
          <div class="relative flex items-center">
            <input
              type="number"
              id="apologyPercentage"
              value={apologyPercentage.value}
              onInput={handlePercentageInput}
              placeholder="20"
              min="0"
              class="w-full p-2 pr-8 bg-gray-700 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <span class="absolute right-3 text-gray-400 text-lg">%</span>
          </div>
        </div>
      </div>

      <div class="mb-4">
        {/* Market URL remains a full-width input */}
        <label
          htmlFor="marketUrl"
          class="block text-sm font-medium text-gray-300 mb-1"
        >
          Manifold Market URL
        </label>
        <input
          type="text"
          id="marketUrl"
          value={marketUrl.value}
          onInput={(e) =>
            marketUrl.value = (e.target as HTMLInputElement).value}
          placeholder="https://manifold.markets/EliezerYudkowsky/what-book-will-i-enjoy-reading"
          class="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {isCalculating.value && (
        <p class="text-blue-300 text-center mt-4 mb-4">
          Calculating payouts...
        </p>
      )}

      {calculationError.value && (
        <p class="text-red-400 text-center mt-4">
          Error: {calculationError.value}
        </p>
      )}

      {calculationSuccess.value && !isCalculating.value && (
        <div class="mt-6 p-4 bg-gray-700 rounded-md shadow-inner">
          <h3 class="text-xl font-semibold mb-3 text-blue-300">
            Calculation Results
          </h3>
          <p class="text-gray-200">
            Market: <span class="font-medium">{marketQuestion.value}</span>
            {" "}
          </p>
          <p class="text-gray-200">
            Total Unique Investors:{" "}
            <span class="font-medium">{totalUsersToPay.value}</span>
          </p>
          <p class="text-gray-200">
            Total Mana to Payout ({apologyPercentage.value}% apology):{" "}
            <span class="font-medium">M{totalPayoutMana.value}</span>
          </p>

          <h4 class="text-lg font-semibold mt-4 mb-2 text-blue-300">
            Users to Compensate:
          </h4>
          <div class="max-h-60 overflow-y-auto border border-gray-600 rounded-md p-2 bg-gray-800">
            {usersToPay.value.length === 0
              ? <p class="text-gray-400">No users found with invested mana.</p>
              : (
                <ul class="space-y-1">
                  {usersToPay.value.map((user) => (
                    <li key={user.userId} class="flex items-center text-xs">
                      <span class="text-gray-300 mr-2">@{user.username}</span>
                      <span class="text-gray-400">
                        (Invested: M{user.originalInvested.toFixed(2)})
                      </span>
                      <span class="ml-auto font-bold text-green-300">
                        Payout: M{user.calculatedPayout}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
          </div>

          <div class="mt-4">
            <h4 class="text-lg font-semibold mb-2 text-blue-300">
              Managram Message Preview:
            </h4>
            <label class="inline-flex items-center mb-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useCustomManagram.value}
                onChange={() =>
                  useCustomManagram.value = !useCustomManagram.value}
                class="form-checkbox h-5 w-5 text-blue-600 rounded"
              />
              <span class="ml-2 text-gray-300">
                Use Custom Managram Message
              </span>
            </label>

            {useCustomManagram.value
              ? (
                <textarea
                  value={customManagramMessage.value}
                  onInput={(e) =>
                    customManagramMessage.value =
                      (e.target as HTMLTextAreaElement).value}
                  placeholder="Enter your custom message here..."
                  rows={4}
                  maxLength={100}
                  class="w-full p-2 bg-gray-800 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-100"
                >
                </textarea>
              )
              : (
                <div class="p-2 bg-gray-800 border border-gray-600 rounded-md text-gray-300 break-words whitespace-pre-wrap">
                  {managramPreview}
                </div>
              )}
            <p class="mt-1 text-xs text-gray-400">
              Example data, data will be unique to each user if you choose the
              automatic option. No dynamic options in custom managram mode.
            </p>
          </div>

          <button
            type="button"
            onClick={handleConfirmClick}
            disabled={isExecuting.value || usersToPay.value.length === 0 ||
              !apiKey.value}
            class={`mt-6 w-full py-3 px-4 rounded-md font-bold text-lg transition-colors duration-200
            ${
              isExecuting.value
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : isConfirmingExecute.value
                ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {isExecuting.value
              ? "Executing Payouts..."
              : isConfirmingExecute.value
              ? "Confirm Payouts (Click again to proceed)"
              : `Execute Payouts for ${totalUsersToPay.value} Users`}
          </button>
        </div>
      )}

      {executionMessage.value && (
        <div
          class={`mt-6 p-4 rounded-md ${
            executionErrors.value && executionErrors.value.length > 0
              ? "bg-red-800 border border-red-600"
              : "bg-green-800 border border-green-600"
          }`}
        >
          <p class="font-bold text-lg mb-2">{executionMessage.value}</p>
          {executionTotalPaidMana.value !== null && (
            <p>Total Mana Paid: M{executionTotalPaidMana.value}</p>
          )}
          {executionTotalErrors.value !== null && (
            <p>Payout Errors: {executionTotalErrors.value}</p>
          )}
          {executionTransactions.value &&
            executionTransactions.value.length > 0 && (
            <div class="mt-4">
              <h4 class="font-semibold mb-1">Successful Transactions:</h4>
              <ul class="text-sm max-h-40 overflow-y-auto">
                {executionTransactions.value.map((tx) => (
                  <li key={tx.transactionId} class="text-gray-200">
                    @{tx.username}: M{usersToPay.value.find((u) =>
                      u.userId === tx.userId
                    )?.calculatedPayout} (Tx ID: {tx.transactionId})
                  </li>
                ))}
              </ul>
            </div>
          )}
          {executionErrors.value && executionErrors.value.length > 0 && (
            <div class="mt-4">
              <h4 class="font-semibold text-red-300 mb-1">
                Failed Payouts:
              </h4>
              <ul class="text-sm max-h-40 overflow-y-auto">
                {executionErrors.value.map((err, index) => (
                  <li key={index} class="text-red-200">
                    @{err.username} ({err.userId}): {err.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {marketResolutionMessage.value && (
            <p class="mt-4 text-orange-300 font-semibold">
              {marketResolutionMessage.value}
            </p>
          )}

          {detailedExecutionLogs.value &&
            detailedExecutionLogs.value.length > 0 && (
            <>
              <p class="mt-4 text-sm text-gray-400 text-center">
                Log has been downloaded automatically, but feel free to click
                the button
              </p>
              <button
                type="button"
                onClick={downloadExecutionLogs}
                class="mt-2 w-full p-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-md transition-colors duration-200"
              >
                Download Detailed Execution Log (JSON)
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
