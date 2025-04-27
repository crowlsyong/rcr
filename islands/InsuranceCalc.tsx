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

  // Coverage fees mapping
  const coverageFees: { [key: number]: number } = {
    25: 0.02,
    50: 0.05,
    75: 0.11,
    100: 0.21,
  };

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
      loanAmount.value <= 0 || !selectedCoverage.value || riskMultiplier === 0
    ) return;

    // Get the selected coverage fee
    const coverageFee = coverageFees[selectedCoverage.value];

    // Calculate the final fee I=(L×P)+(L×C)
    const totalFee = (riskMultiplier * loanAmount.value) +
      (loanAmount.value * coverageFee);
    setInsuranceFee(totalFee); // Calculate only the additional fee
    console.log("Coverage fee", coverageFee);
    console.log("riskMultiplier", riskMultiplier);
    console.log("Loan amount", loanAmount.value);
    console.log("Final fee", totalFee);
    console.log("Insurance fee", totalFee);
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
          Enter a username
        </label>
        <div class="relative">
          <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
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
