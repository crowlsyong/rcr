// InsuranceCalc.tsx
import { useSignal } from "@preact/signals";
import { useEffect, useRef, useState } from "preact/hooks";
import ScoreResult from "./ScoreResult.tsx";

interface CreditScoreData {
  username: string;
  creditScore: number;
  riskMultiplier: number;
  avatarUrl: string | null;
}

export default function InsuranceCalc() {
  const username = useSignal("");
  const loanAmount = useSignal(0);
  const selectedCoverage = useSignal<number | null>(null);
  const [debouncedUsername, setDebouncedUsername] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [insuranceFee, setInsuranceFee] = useState<number | null>(null);
  const [riskMultiplier, setRiskMultiplier] = useState(0);

  const scoreData = useSignal<CreditScoreData | null>(null);

  // Debounced username effect
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedUsername(username.value), 100);
    return () => clearTimeout(timer);
  }, [username.value]);

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
      } else {
        scoreData.value = data;
        setRiskMultiplier(data.riskMultiplier);
      }
    } catch {
      scoreData.value = null;
    }
  }

  function resetState() {
    scoreData.value = null;
  }

  // Calculate the insurance fee
  function calculateInsuranceFee() {
    if (
      loanAmount.value <= 0 ||
      !selectedCoverage.value ||
      riskMultiplier === 0
    ) return;

    let adjustedMultiplier = riskMultiplier;
    switch (selectedCoverage.value) {
      case 25:
        adjustedMultiplier = riskMultiplier * 1.05;
        break;
      case 50:
        adjustedMultiplier = riskMultiplier * 1.12;
        break;
      case 75:
        adjustedMultiplier = riskMultiplier * 1.24;
        break;
      case 100:
        adjustedMultiplier = riskMultiplier * 1.54;
        break;
      default:
        break;
    }

    const loanDurationMonths = 18; // example number of months
    let durationFee = 1;

    if (loanDurationMonths < 1) {
      durationFee = 1.02;
    } else if (loanDurationMonths < 3) {
      durationFee = 1.06;
    } else if (loanDurationMonths < 6) {
      durationFee = 1.10;
    } else if (loanDurationMonths < 12) {
      durationFee = 1.25;
    } else if (loanDurationMonths < 24) {
      durationFee = 1.35;
    } else if (loanDurationMonths < 48) {
      durationFee = 1.60;
    } else {
      durationFee = 1.80;
    }

    const coveragePercentage = selectedCoverage.value / 100;
    const fee = loanAmount.value * coveragePercentage * adjustedMultiplier;
    setInsuranceFee(fee);
  }

  // Handle the selection of coverage percentages
  const handleCoverageClick = (percentage: number | null) => {
    if (selectedCoverage.value === percentage) {
      selectedCoverage.value = null; // Deselect if already selected
    } else {
      selectedCoverage.value = percentage;
    }
    calculateInsuranceFee();
  };

  // Set the username when typed in
  const handleUsernameInput = (e: Event) => {
    username.value = (e.target as HTMLInputElement).value;
    selectedCoverage.value = null; // Deselect coverage on username input
    setInsuranceFee(null); // Optional: reset fee to avoid showing stale results
  };

  // Handle loan amount input
  const handleLoanInput = (e: Event) => {
    const value = parseFloat((e.target as HTMLInputElement).value);
    loanAmount.value = value > 0 ? value : 0;
    calculateInsuranceFee();
  };

  return (
    <div class="w-full max-w-md mx-auto pt-6 pb-6 px-0 sm:px-6">
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
          Enter your username
        </label>
        <div class="relative">
          <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
            @
          </span>
          <input
            id="username"
            ref={inputRef}
            type="text"
            placeholder="Enter a manifold username"
            value={username.value}
            onInput={handleUsernameInput}
            class="w-full pl-8 p-3 bg-gray-900 text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Loan Amount Input */}

      <div class="mt-4">
        <label htmlFor="loanAmount" class="text-gray-400 mb-1 block">
          Enter loan amount
        </label>
        <input
          id="loanAmount"
          type="number"
          value={loanAmount.value}
          placeholder="Loan amount"
          onInput={handleLoanInput}
          min="0"
          class="w-full p-3 bg-gray-900 text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <label htmlFor="loanAmount" class="text-gray-400 mb-1 pt-3 block">
        Select coverage
      </label>
      <label htmlFor="loanAmount" class="text-gray-400 text-xs mb-1 block">
        We'll cover this much of your loan if the borrower defaults
      </label>

      {/* Coverage Buttons */}
      <div class="mt-4 flex space-x-4">
        {["25%", "50%", "75%", "100%"].map((label) => (
          <button
            type="button"
            key={label}
            onClick={() => handleCoverageClick(parseInt(label))}
            class={`w-1/4 p-3 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              selectedCoverage.value === parseInt(label)
                ? "bg-blue-600"
                : "bg-gray-700 hover:bg-blue-500"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Insurance Fee */}

      <div class="mt-4 text-right space-y-2">
        <p class="text-gray-400 text-xs">
          {loanAmount.value ? `Loan Amount: M${loanAmount.value}` : ""}
        </p>

        {loanAmount.value > 0 && selectedCoverage.value && (
          <p class="text-blue-400 text-xs">
            Coverage: {selectedCoverage.value}% × M{loanAmount.value} ={" "}
            M{loanAmount.value > 0 && selectedCoverage.value
              ? parseInt(
                ((selectedCoverage.value / 100) * loanAmount.value).toString(),
              )
              : 0}
          </p>
        )}

        <p
          class={`${
            insuranceFee === null || !loanAmount.value ||
              !selectedCoverage.value
              ? "text-orange-400"
              : "text-green-400"
          }`}
        >
          {insuranceFee === null || !loanAmount.value || !selectedCoverage.value
            ? ""
            : "🦝 RISK Insurance Fee: "}
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
  );
}
