// islands/InsuranceCalc.tsx

import { useSignal } from "@preact/signals";
import { useEffect, useRef, useState } from "preact/hooks";
import { ComponentType } from "preact";
import type { JSX } from "preact/jsx-runtime";
import { TbToggleLeftFilled, TbToggleRightFilled } from "@preact-icons/tb";
import ScoreResult from "./creditscore/ScoreResult.tsx";

interface CreditScoreData {
  username: string;
  creditScore: number;
  riskMultiplier: number;
  avatarUrl: string | null;
}

const ToggleOnIcon = TbToggleRightFilled as ComponentType<
  JSX.IntrinsicElements["svg"]
>;
const ToggleOffIcon = TbToggleLeftFilled as ComponentType<
  JSX.IntrinsicElements["svg"]
>;

export default function InsuranceCalc() {
  const username = useSignal("");
  const loanAmount = useSignal(0);
  const selectedCoverage = useSignal<number | null>(null);
  const [debouncedUsername, setDebouncedUsername] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [insuranceFee, setInsuranceFee] = useState<number | null>(null);
  const [riskMultiplier, setRiskMultiplier] = useState(0);
  const scoreData = useSignal<CreditScoreData | null>(null);
  const error = useSignal<string>("");
  const partnerDiscount = useSignal(false);
  const [isClient, setIsClient] = useState(false);

  // Coverage fees mapping
  const coverageFees: { [key: number]: number } = {
    25: 0.02, // 2% old
    50: 0.05, // 5% old
    75: 0.08, // 11% old
    100: 0.12, // 21% old
  };

  // Debounced username effect
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedUsername(username.value), 100);
    return () => clearTimeout(timer);
  }, [username.value]);

  // Set isClient to true once the component mounts on the client
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (debouncedUsername) fetchScoreData(debouncedUsername);
    else resetState();
  }, [debouncedUsername]);

  // Fetch the score data based on username
  async function fetchScoreData(user: string) {
    try {
      const res = await fetch(`/api/score?username=${user}`);
      const data = await res.json();
      if (data.error) {
        scoreData.value = null;
        error.value = data.error; // e.g., "User not found"
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
      setInsuranceFee(null); // Reset fee if conditions are not met
      return;
    }

    const coverageFee = coverageFees[selectedCoverage.value];

    // Calculate the final fee I=(L×P)+(L×C)
    let totalFee = (riskMultiplier * loanAmount.value) +
      (loanAmount.value * coverageFee);

    // Apply partner discount if active (25% discount)
    if (partnerDiscount.value) {
      totalFee *= 0.75;
    }

    setInsuranceFee(totalFee);
  }

  // Effect to recalculate insurance fee when loanAmount, selectedCoverage,
  // riskMultiplier, or partnerDiscount changes
  useEffect(() => {
    calculateInsuranceFee();
  }, [
    loanAmount.value,
    selectedCoverage.value,
    riskMultiplier,
    partnerDiscount.value,
  ]);

  // Handle the selection of coverage percentages
  const handleCoverageClick = (percentage: number | null) => {
    if (selectedCoverage.value === percentage) {
      selectedCoverage.value = null; // Deselect if already selected
    } else {
      selectedCoverage.value = percentage;
    }
  };

  // Set the username when typed in
  const handleUsernameInput = (e: Event) => {
    username.value = (e.target as HTMLInputElement).value;
    selectedCoverage.value = null; // Deselect coverage on username input
    setInsuranceFee(null); // Optional: reset fee to avoid showing stale results
  };

  // Handle loan amount input (text field with integer validation)
  const handleLoanInput = (e: Event) => {
    const inputValue = (e.target as HTMLInputElement).value;

    // Regex to allow only numbers (integer) and prevent any non-integer input
    const validValue = inputValue.replace(/[^0-9]/g, "");

    // Update loanAmount with the valid value (convert to number, or 0 if empty)
    loanAmount.value = validValue ? parseInt(validValue) : 0;
  };

  return (
    <div class="w-full max-w-md mx-auto pb-6 px-0 sm:px-6">
      <ScoreResult
        username={scoreData.value?.username || "N/A"}
        creditScore={scoreData.value?.creditScore || 0}
        riskMultiplier={riskMultiplier || 0}
        avatarUrl={scoreData.value?.avatarUrl || null}
        isWaiting={!scoreData.value}
      />

      {/* Username Input */}
      <div class="mt-4">
        <label htmlFor="username" class="text-gray-400 mb-1 block">
          Enter a username
        </label>
        {/* Add "group" to the div that wraps the @ symbol and the input */}
        <div class="relative group">
          <span
            class="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-blue-400 transition-colors duration-200" // Apply group-focus-within to the span
          >
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
          <p class="text-red-400 text-sm text-center mt-2">{error.value}</p>
        )}
      </div>

      {/* Loan Amount Input */}
      <div class="mt-4">
        <label htmlFor="loanAmount" class="text-gray-400 mb-1 block">
          Enter loan amount
        </label>
        <input
          id="loanAmount"
          type="text"
          value={loanAmount.value.toString()} // Ensure value is a string
          placeholder="Loan amount"
          onInput={handleLoanInput}
          class="w-full p-3 bg-gray-900 text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <label htmlFor="loanAmount" class="text-gray-400 mb-1 pt-3 block">
        Select coverage
      </label>
      <label htmlFor="loanAmount" class="text-gray-400 text-xs mb-1 block">
        We'll cover this much of your loan if the borrower defaults
      </label>

      {/* Coverage Buttons - Smaller size with p-1 and text-sm */}
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

      {/* Insurance Fee & Partner Discount */}
      <div class="mt-4 flex justify-between items-start">
        {/* Partner Discount Toggle - Button then label on same row */}
        <div class="flex items-center space-x-2 pt-2">
          <button
            type="button"
            onClick={() => {
              partnerDiscount.value = !partnerDiscount.value;
            }}
            class="flex items-center focus:outline-none"
            aria-pressed={partnerDiscount.value}
          >
            {isClient
              ? (
                partnerDiscount.value
                  ? <ToggleOnIcon class="w-10 h-10 text-blue-500" />
                  : <ToggleOffIcon class="w-10 h-10 text-gray-500" />
              )
              : (
                <div class="w-10 h-10 bg-gray-700 rounded-full animate-pulse">
                </div>
              )}
          </button>
          <label class="text-gray-400 text-xs">Partner Discount</label>
        </div>

        {/* Insurance Fee Details */}
        <div class="text-right space-y-2">
          <p class="text-gray-400 text-xs">
            {loanAmount.value ? `Loan Amount: M${loanAmount.value}` : ""}
          </p>

          <p
            class={`${
              insuranceFee === null || !loanAmount.value ||
                !selectedCoverage.value
                ? "text-orange-400"
                : "text-green-400"
            } text-lg`}
          >
            {insuranceFee === null || !loanAmount.value ||
                !selectedCoverage.value
              ? ""
              : "Insurance Fee: "}
            <span class="font-bold">
              {insuranceFee === null || !loanAmount.value ||
                  !selectedCoverage.value
                ? ""
                : "M"}
            </span>
            <span class="font-bold">
              {insuranceFee === null || !loanAmount.value ||
                  !selectedCoverage.value
                ? ""
                : Math.round(insuranceFee)}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
