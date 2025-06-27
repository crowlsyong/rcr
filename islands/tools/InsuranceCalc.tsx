// islands/InsuranceCalc.tsx
import { useSignal } from "@preact/signals";
import { useEffect, useRef, useState } from "preact/hooks";
import ScoreResult from "./creditscore/ScoreResult.tsx";
import {
  addBounty,
  fetchUserData,
  postComment,
  sendManagram,
} from "../../utils/api/manifold_api_service.ts";
import { ManaPaymentTransaction } from "../../utils/api/manifold_types.ts";

interface CreditScoreData {
  username: string;
  creditScore: number;
  riskMultiplier: number;
  avatarUrl: string | null;
}

const INSURANCE_MARKET_ID = "QEytQ5ch0P";
const INSURANCE_MARKET_URL = "https://manifold.markets/crowlsyong/risk-payment-portal";
const CONTACT_USERNAME = "crowlsyong";

export default function InsuranceCalc() {
  const username = useSignal("");
  const lenderUsername = useSignal("");
  const loanAmount = useSignal(0);
  const selectedCoverage = useSignal<number | null>(null);
  const [debouncedUsername, setDebouncedUsername] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [insuranceFee, setInsuranceFee] = useState<number | null>(null);
  const [initialInsuranceFeeBeforeDiscount, setInitialInsuranceFeeBeforeDiscount] = useState<number | null>(null);
  const [riskMultiplier, setRiskMultiplier] = useState(0);
  const scoreData = useSignal<CreditScoreData | null>(null);
  const error = useSignal<string>("");

  const apiKey = useSignal("");
  const loanDueDate = useSignal("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const paymentMessage = useSignal<string>("");
  const paymentMessageType = useSignal<"success" | "error" | "">("");
  const paymentPortalLink = useSignal<string | null>(null);

  const partnerCodeInput = useSignal("");
  const partnerCodeValid = useSignal(false);
  const partnerCodeMessage = useSignal("");
  const [isCodeChecking, setIsCodeChecking] = useState(false);
  const discountSource = useSignal<string | null>(null);

  const isConfirming = useSignal(false);
  const cooldownActive = useSignal(false);
  const cooldownMessage = useSignal("");

  const managramMessage = useSignal("");
  const lenderFeePercentage = useSignal<number | null>(null);

  const coverageFees: { [key: number]: number } = {
    25: 0.02,
    50: 0.05,
    75: 0.08,
    100: 0.12,
  };

  useEffect(() => {
    let timeoutId: number;
    if (isConfirming.value) {
      timeoutId = setTimeout(() => isConfirming.value = false, 4000);
    }
    return () => clearTimeout(timeoutId);
  }, [isConfirming.value]);

  useEffect(() => {
    let cooldownTimeout: number;
    if (cooldownActive.value) {
      cooldownMessage.value = "Woah! You just did that. Wait a sec before trying again.";
      cooldownTimeout = setTimeout(() => {
        cooldownActive.value = false;
        cooldownMessage.value = "";
      }, 2000);
    }
    return () => clearTimeout(cooldownTimeout);
  }, [cooldownActive.value]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedUsername(username.value), 100);
    return () => clearTimeout(timer);
  }, [username.value]);

  useEffect(() => {
    const code = partnerCodeInput.value.trim();
    if (code === "") {
      partnerCodeValid.value = false;
      partnerCodeMessage.value = "";
      discountSource.value = null;
      calculateInsuranceFee();
      return;
    }

    setIsCodeChecking(true);
    partnerCodeMessage.value = "Checking code...";

    const debounceTimer = setTimeout(async () => {
      try {
        const response = await fetch("/api/validate-partner-code", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.statusText}`);
        }

        const data = await response.json();
        partnerCodeValid.value = data.isValid;
        partnerCodeMessage.value = data.message;
        discountSource.value = data.discountType || null;
      } catch (err) {
        partnerCodeValid.value = false;
        partnerCodeMessage.value = `Error checking code: ${
          typeof err === "object" && err !== null && "message" in err
            ? (err as { message: string }).message
            : String(err)
        }`;
        discountSource.value = null;
      } finally {
        setIsCodeChecking(false);
        calculateInsuranceFee();
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [partnerCodeInput.value]);

  useEffect(() => {
    if (debouncedUsername) fetchScoreData(debouncedUsername);
    else resetState();
  }, [debouncedUsername]);

  // Set default managram message
  useEffect(() => {
    const currentLenderFee = (lenderFeePercentage.value !== null && loanAmount.value > 0)
      ? Math.round(loanAmount.value * (lenderFeePercentage.value / 100))
      : 0;
    managramMessage.value =
      `Loan M${loanAmount.value}. M${currentLenderFee} due back ${loanDueDate.value}.`;
  }, [loanAmount.value, lenderFeePercentage.value, loanDueDate.value]);

  async function fetchScoreData(user: string) {
    try {
      const res = await fetch(`/api/score?username=${user}`);
      const data = await res.json();
      if (data.error) {
        scoreData.value = null;
        error.value = data.error;
      } else {
        scoreData.value = data;
        setRiskMultiplier(data.riskMultiplier);
        error.value = "";
      }
    } catch (err) {
      scoreData.value = null;
      error.value = `Network/fetch error: ${
        typeof err === "object" && err !== null && "message" in err
          ? (err as { message: string }).message
          : String(err)
      }`;
    }
  }

  function resetState() {
    scoreData.value = null;
  }

  function calculateInsuranceFee() {
    if (
      loanAmount.value <= 0 || !selectedCoverage.value || riskMultiplier === 0
    ) {
      setInsuranceFee(null);
      setInitialInsuranceFeeBeforeDiscount(null);
      return;
    }

    const coverageFee = coverageFees[selectedCoverage.value];

    let currentFee = (riskMultiplier * loanAmount.value) +
      (loanAmount.value * coverageFee);

    setInitialInsuranceFeeBeforeDiscount(currentFee);

    if (partnerCodeValid.value) {
      currentFee *= 0.75;
    }

    setInsuranceFee(currentFee);
  }

  useEffect(() => {
    calculateInsuranceFee();
  }, [
    loanAmount.value,
    selectedCoverage.value,
    riskMultiplier,
    partnerCodeValid.value,
  ]);

  const handleCoverageClick = (percentage: number | null) => {
    if (selectedCoverage.value === percentage) {
      selectedCoverage.value = null;
    } else {
      selectedCoverage.value = percentage;
    }
  };

  const handleUsernameInput = (e: Event) => {
    username.value = (e.target as HTMLInputElement).value;
    selectedCoverage.value = null;
    setInsuranceFee(null);
  };

  const handleLenderUsernameInput = (e: Event) => {
    lenderUsername.value = (e.target as HTMLInputElement).value;
  };

  const handleLoanInput = (e: Event) => {
    const inputValue = (e.target as HTMLInputElement).value;

    const validValue = inputValue.replace(/[^0-9]/g, "");

    loanAmount.value = validValue ? parseInt(validValue) : 0;
  };

  const handleLoanDueDateInput = (e: Event) => {
    loanDueDate.value = (e.target as HTMLInputElement).value;
  };

  const handlePartnerCodeInput = (e: Event) => {
    partnerCodeInput.value = (e.target as HTMLInputElement).value;
  };

  const handleManagramMessageInput = (e: Event) => {
    managramMessage.value = (e.target as HTMLTextAreaElement).value;
  };

  const handleLenderFeePercentageInput = (e: Event) => {
    const inputValue = (e.target as HTMLInputElement).value;
    const validValue = inputValue.replace(/[^0-9]/g, "");
    lenderFeePercentage.value = validValue ? parseInt(validValue) : null;
  };

  const getPolicyEndDate = (loanDueDateStr: string): string => {
    if (!loanDueDateStr) return "";
    const loanDate = new Date(loanDueDateStr + "T00:00:00");
    if (isNaN(loanDate.getTime())) return "";

    const policyEnd = new Date(loanDate);
    policyEnd.setDate(loanDate.getDate() + 7);

    return policyEnd.toISOString().split("T")[0];
  };

  const handleConfirmPayment = async () => {
    paymentMessage.value = "";
    paymentMessageType.value = "";
    paymentPortalLink.value = null;

    if (!apiKey.value) {
      paymentMessage.value = "Please enter your Manifold API Key.";
      paymentMessageType.value = "error";
      return;
    }

    if (
      !username.value || !lenderUsername.value || !loanAmount.value ||
      !selectedCoverage.value ||
      !insuranceFee || !loanDueDate.value
    ) {
      paymentMessage.value =
        "Please fill in all required fields (Borrower, Lender, Loan Amount, Coverage, Loan Due Date).";
      paymentMessageType.value = "error";
      return;
    }

    setIsProcessingPayment(true);
    isConfirming.value = false;

    try {
      const { userData: borrowerData, fetchSuccess: borrowerFetchSuccess } =
        await fetchUserData(username.value);

      if (!borrowerFetchSuccess || !borrowerData?.id) {
        throw new Error(
          `Could not find borrower: ${username.value}. Please check username.`,
        );
      }
      const borrowerId = borrowerData.id;

      const { userData: lenderData, fetchSuccess: lenderFetchSuccess } =
        await fetchUserData(lenderUsername.value);

      if (!lenderFetchSuccess || !lenderData?.id) {
        throw new Error(
          `Could not find lender: ${lenderUsername.value}. Please check username.`,
        );
      }

      const sendManaResult = await sendManagram(
        [borrowerId],
        loanAmount.value,
        managramMessage.value, // Use the actual message value
        apiKey.value,
      );

      if (!sendManaResult.success) {
        throw new Error(
          `Failed to send mana to borrower: ${sendManaResult.error || "Unknown error."}`,
        );
      }

      const addBountyResult = await addBounty(
        INSURANCE_MARKET_ID,
        Math.round(insuranceFee),
        apiKey.value,
      );

      if (!addBountyResult.success) {
        throw new Error(
          `Failed to add bounty to market: ${addBountyResult.error || "Unknown error."}`,
        );
      }

      const transactionId = (addBountyResult.data as ManaPaymentTransaction)
        .id;

      const policyStartDate = new Date().toISOString().split("T")[0];
      const policyEndDate = getPolicyEndDate(loanDueDate.value);

      const coveragePercentage = selectedCoverage.value;

      let discountLine = "";
      if (partnerCodeValid.value && discountSource.value) {
        discountLine = `\n${discountSource.value} Discount: 25%`;
      }

      const receiptMessage = `# 🦝RISK Insurance Receipt

### Summary

Transaction ID: ${transactionId}

Coverage: C${coveragePercentage}

Lender: @${lenderUsername.value}

Borrower: @${username.value}

Loan Amount: Ṁ${loanAmount.value}

Date of Policy Start: ${policyStartDate}

Loan Due Date: ${loanDueDate.value}

Policy Ends: ${policyEndDate}

### Fees

Base Fee (risk multiplier): ${riskMultiplier * 100}%

Coverage Fee: ${coverageFees[selectedCoverage.value] * 100}%
${discountLine}
Total Fee: Ṁ${Math.round(insuranceFee)}

### Terms

By using this service, you agree to The Fine Print at the very bottom of our dashboard. 60% refund may be available if borrower repays on time and in full. No refund if borrower defaults, but insurance will cover the policy amount.

---

Have questions or need to activate coverage? Message @${CONTACT_USERNAME} and we’ll walk you through it.


Risk Free 🦝RISK Fee Guarantee™️


🦝RISK: Recovery Loan Insurance Kiosk`;

      const postCommentResult = await postComment(
        INSURANCE_MARKET_ID,
        receiptMessage,
        apiKey.value,
      );

      if (!postCommentResult.success) {
        throw new Error(
          `Failed to post insurance receipt comment: ${postCommentResult.error || "Unknown error."}`,
        );
      }

      paymentMessage.value = "Insurance policy successfully created and paid!";
      paymentMessageType.value = "success";
      paymentPortalLink.value = INSURANCE_MARKET_URL;
      cooldownActive.value = true;
    } catch (e) {
      paymentMessage.value = `Payment failed: ${
        typeof e === "object" && e !== null && "message" in e
          ? (e as { message: string }).message
          : String(e)
      }`;
      paymentMessageType.value = "error";
      cooldownActive.value = true;
    } finally {
      setIsProcessingPayment(false);
      isConfirming.value = false;
    }
  };

  const handleConfirmStepClick = () => {
    if (cooldownActive.value) {
      return;
    }

    if (!isFormValid) {
      paymentMessage.value = "Please fill in all required fields before confirming.";
      paymentMessageType.value = "error";
      return;
    }

    paymentMessage.value = "";

    if (isConfirming.value) {
      handleConfirmPayment();
    } else {
      isConfirming.value = true;
    }
  };

  const isFormValid = username.value && lenderUsername.value &&
    loanAmount.value > 0 &&
    selectedCoverage.value && insuranceFee !== null && loanDueDate.value &&
    apiKey.value && !isProcessingPayment;

  // Calculate total payment - ensure these values are numbers before summing
  const currentLoanAmount = loanAmount.value || 0;
  const currentInsuranceFee = insuranceFee !== null ? Math.round(insuranceFee) : 0;
  const currentLenderFee = (lenderFeePercentage.value !== null && currentLoanAmount > 0)
    ? Math.round(currentLoanAmount * (lenderFeePercentage.value / 100))
    : 0;
  const _totalPaymentCalc = currentLoanAmount + currentInsuranceFee; // Renamed to _totalPaymentCalc to avoid linting warning

  const netLenderGain = currentLenderFee - currentInsuranceFee;

  // Determine button text based on states
  let buttonText =
    `Send M${currentInsuranceFee} fee and loan @${username.value || "borrower"} M${currentLoanAmount} mana`;

  let buttonClass = `mt-6 w-full p-3 rounded-md text-lg font-semibold transition-colors duration-200 `;

  if (cooldownActive.value) {
    buttonText = "Please wait...";
    buttonClass += `bg-gray-700 text-gray-400 cursor-not-allowed`;
  } else if (isProcessingPayment) {
    buttonText = "Processing...";
    buttonClass += `bg-gray-700 text-gray-400 cursor-not-allowed`;
  } else if (isConfirming.value) {
    buttonText = "Are you sure? Click to Confirm";
    buttonClass += `bg-yellow-700 hover:bg-yellow-800 text-white`;
  } else if (!isFormValid) {
    buttonClass += `bg-gray-700 text-gray-400 cursor-not-allowed`;
  } else {
    buttonClass += `bg-blue-600 hover:bg-blue-700 text-white`;
  }

  return (
    <>
      <style>
        {`
        /* Make the calendar icon white for date inputs */
        input[type="date"].custom-date-input::-webkit-calendar-picker-indicator {
          filter: invert(1);
        }
        /* Custom number input with '%' suffix */
        .input-with-suffix {
          position: relative;
        }
        .input-with-suffix input {
          padding-right: 1.5rem; /* Adjust as needed for suffix width */
        }
        .input-with-suffix::after {
          content: '%';
          position: absolute;
          right: 0.5rem;
          top: 50%;
          transform: translateY(-50%);
          color: #9CA3AF; /* gray-400 */
        }
        `}
      </style>
      <div class="w-full max-w-md mx-auto pb-6 px-0 sm:px-6 md:max-w-2xl lg:max-w-4xl">

        <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <ScoreResult
              username={scoreData.value?.username || "N/A"}
              creditScore={scoreData.value?.creditScore || 0}
              riskMultiplier={riskMultiplier || 0}
              avatarUrl={scoreData.value?.avatarUrl || null}
              isWaiting={!scoreData.value}
            />
            <div class="mt-2">
              <label htmlFor="username" class="text-gray-400 mt-2 mb-1 block">
                Enter borrower's username
              </label>
              <div class="relative group">
                <span class="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-blue-400 transition-colors duration-200">
                  @
                </span>
                <input
                  id="username"
                  ref={inputRef}
                  type="text"
                  placeholder="ex. Tumbles"
                  value={username.value}
                  onInput={handleUsernameInput}
                  class="w-full pl-8 p-3 bg-gray-900 text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {error.value && (
                <p class="text-red-400 text-sm text-center mt-2">
                  {error.value}
                </p>
              )}
            </div>

            <div class="mt-4">
              <label htmlFor="lenderUsername" class="text-gray-400 mb-1 block">
                Enter lender's username
              </label>
              <div class="relative group">
                <span class="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-blue-400 transition-colors duration-200">
                  @
                </span>
                <input
                  id="lenderUsername"
                  type="text"
                  placeholder="ex. Bob"
                  value={lenderUsername.value}
                  onInput={handleLenderUsernameInput}
                  class="w-full pl-8 p-3 bg-gray-900 text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div class="mt-2">
                <label htmlFor="loanAmount" class="text-gray-400 mb-1 block">
                  Enter loan amount
                </label>
                <input
                  id="loanAmount"
                  type="number"
                  value={loanAmount.value.toString()}
                  placeholder="Loan amount"
                  onInput={handleLoanInput}
                  class="w-full p-3 bg-gray-900 text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div>
            <div class="mt-0">
              <label htmlFor="loanDueDate" class="text-gray-400 mb-1 block">
                Loan Due Date
              </label>
              <input
                id="loanDueDate"
                type="date"
                value={loanDueDate.value}
                onInput={handleLoanDueDateInput}
                class="w-full p-3 bg-gray-900 text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 custom-date-input"
              />
              {loanDueDate.value && (
                <p class="text-gray-400 text-xs mt-1">
                  Policy ends: {getPolicyEndDate(loanDueDate.value)} (1 week
                  after)
                </p>
              )}
            </div>

            <label htmlFor="coverage" class="text-gray-400 mb-1 pt-3 block">
              Select coverage
            </label>
            <label
              htmlFor="coverage-description"
              class="text-gray-400 text-xs mb-1 block"
            >
              We'll cover this much of your loan if the borrower defaults
            </label>

            <div class="mt-4 flex space-x-2">
              {["25%", "50%", "75%", "100%"].map((label) => (
                <button
                  type="button"
                  key={label}
                  onClick={() => handleCoverageClick(parseInt(label))}
                  class={`w-1/4 p-1 text-sm text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    selectedCoverage.value === parseInt(label)
                      ? "bg-blue-600"
                      : "bg-gray-700 hover:bg-blue-500"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div class="mt-4">
              <label
                htmlFor="managramMessage"
                class="block text-sm font-medium text-gray-300"
              >
                Managram Message (100 char max)
              </label>
              <textarea
                id="managramMessage"
                name="managramMessage"
                value={managramMessage.value}
                onInput={handleManagramMessageInput}
                maxLength={100}
                rows={3} // Make it expandable
                class="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-800 text-gray-100"
              >
              </textarea>
              <p class="mt-1 text-xs text-gray-400">
                This message will be sent with the loan mana.
              </p>
            </div>

            <div class="mt-4">
              <label
                htmlFor="api-key"
                class="block text-sm font-medium text-gray-300"
              >
                Manifold API Key (optional)
              </label>
              <input
                type="password"
                id="api-key"
                name="apiKey"
                value={apiKey.value}
                onInput={(e) =>
                  (apiKey.value = (e.target as HTMLInputElement).value)}
                placeholder="xxxxx-xxxx-xxxx-xxxxxxxxxxxxxxx"
                class="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-800 text-gray-100"
              />
              <p class="mt-1 text-xs text-gray-400">
                We don't store this key. Find your API key on your Manifold
                profile page by clicking the gear icon and selecting Account
                Settings.
              </p>
            </div>

            <div class="mt-4">
              <label
                htmlFor="partner-code"
                class="block text-sm font-medium text-gray-300"
              >
                Partner Code (optional for discount)
              </label>
              <input
                type="text"
                id="partner-code"
                name="partnerCode"
                value={partnerCodeInput.value}
                onInput={handlePartnerCodeInput}
                placeholder="Enter code here"
                class="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-800 text-gray-100"
              />
              {isCodeChecking
                ? (
                  <p class="mt-1 text-xs text-gray-500 animate-pulse">
                    Checking code...
                  </p>
                )
                : (
                  partnerCodeMessage.value && (
                    <p
                      class={`mt-1 text-xs ${
                        partnerCodeValid.value
                          ? "text-green-400"
                          : "text-orange-400"
                      }`}
                    >
                      {partnerCodeMessage.value}
                    </p>
                  )
                )}
            </div>
          </div>
        </div>

        {/* Unified financial summary box */}
        <div class="mt-4 p-4 bg-gray-800 border border-gray-700 rounded-md shadow-sm text-right space-y-1">
          <p
            class={`${
              insuranceFee === null || !loanAmount.value ||
              !selectedCoverage.value
                ? "text-orange-400"
                : "text-green-400"
            } text-lg font-bold`}
          >
            Insurance Fee: M{currentInsuranceFee}
          </p>
          <hr class="border-gray-700" />
          <p class="text-sm text-gray-400">
            M{currentLoanAmount} to @{username.value || "borrower"}
          </p>

          <div class="flex justify-end items-center text-sm text-gray-400">
            <span>Lender Fee: +M{currentLenderFee} </span>
            <div class="relative ml-2 input-with-suffix">
              <input
                id="lenderFeePercentage"
                type="number"
                value={lenderFeePercentage.value !== null
                  ? lenderFeePercentage.value.toString()
                  : ""}
                onInput={handleLenderFeePercentageInput}
                class="w-20 p-1 bg-gray-900 text-white border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm text-right"
              />
            </div>
          </div>

          <p class="text-sm text-gray-400">
            {partnerCodeValid.value && initialInsuranceFeeBeforeDiscount !== null && (
              <span class="line-through mr-1">
                (before discount) M{Math.round(initialInsuranceFeeBeforeDiscount)}
              </span>
            )}
            M{currentInsuranceFee} to RISK
          </p>

          <p class="text-lg font-bold text-white mt-2">
            Total out of pocket: M
            {currentLoanAmount + currentInsuranceFee}
          </p>
          {currentLoanAmount > 0 && (
            <p class="text-sm text-gray-400">
              Net to lender if successful: M{netLenderGain}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleConfirmStepClick}
          disabled={!isFormValid || isProcessingPayment || cooldownActive.value}
          class={buttonClass}
        >
          {buttonText}
        </button>

        {cooldownActive.value && cooldownMessage.value && (
          <p class="mt-2 text-center text-orange-400 text-sm">
            {cooldownMessage.value}
          </p>
        )}

        {paymentMessage.value && (
          <p
            class={`mt-4 text-center text-sm ${
              paymentMessageType.value === "error"
                ? "text-red-400"
                : "text-green-400"
            }`}
          >
            {paymentMessage.value}
          </p>
        )}

        {paymentPortalLink.value && paymentMessageType.value === "success" && (
          <p class="mt-2 text-center">
            <a
              href={paymentPortalLink.value}
              target="_blank"
              rel="noopener noreferrer"
              class="text-blue-400 hover:underline text-sm"
            >
              View Payment Portal
            </a>
          </p>
        )}
      </div>
    </>
  );
}
