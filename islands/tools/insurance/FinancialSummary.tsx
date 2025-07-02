// islands/tools/insurance/FinancialSummary.tsx
import { Signal } from "@preact/signals";
import { JSX } from "preact";
import InfoHover from "../../shared/InfoHover.tsx";
import DurationFeeChart from "./charts/DurationFeeChart.tsx";
import CoverageFeeChart from "./charts/CoverageFeeChart.tsx";
import RiskFeeChart from "./charts/RiskFeeChart.tsx";
import InfoIcon from "../InfoIcon.tsx";

interface FinancialSummaryProps {
  insuranceFee: number | null;
  currentLoanAmount: number;
  username: Signal<string>;
  currentLenderFee: number;
  lenderFeePercentage: Signal<number | null>;
  handleLenderFeePercentageInput: (e: Event) => void;
  initialInsuranceFeeBeforeDiscount: number | null;
  partnerCodeValid: Signal<boolean>;
  netLenderGain: number;
  apiKeyLength: number;
  durationFee: number;
  selectedCoverage: Signal<number | null>;
  riskBaseFee: number;
  loanDueDate: Signal<string>;
  borrowerCreditScore: number;
}

const COVERAGE_FEES_STATIC: { [key: number]: number } = {
  25: 0.02,
  50: 0.05,
  75: 0.08,
  100: 0.12,
};

const calculateDaysBetweenForDisplay = (
  startDateStr: string,
  endDateStr: string,
): number => {
  if (!startDateStr || !endDateStr) return 0;
  const startDate = new Date(startDateStr + "T00:00:00");
  const endDate = new Date(endDateStr + "T00:00:00");
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 0;
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export default function FinancialSummary(
  props: FinancialSummaryProps,
): JSX.Element {
  const {
    insuranceFee,
    currentLoanAmount,
    username,
    currentLenderFee,
    lenderFeePercentage,
    initialInsuranceFeeBeforeDiscount,
    partnerCodeValid,
    netLenderGain,
    apiKeyLength,
    durationFee,
    selectedCoverage,
    riskBaseFee,
    loanDueDate,
    borrowerCreditScore,
  } = props;

  const currentInsuranceFee = insuranceFee !== null
    ? Math.round(insuranceFee)
    : 0;
  const totalOutOfPocket = currentLoanAmount + currentInsuranceFee;

  const lenderFeePercentageDisplay = lenderFeePercentage.value !== null
    ? `${lenderFeePercentage.value}%`
    : "N/A";
  const lenderFeeDisplay =
    `(${lenderFeePercentageDisplay} | M${currentLenderFee})`;

  const coveragePrefix = selectedCoverage.value !== null
    ? `C${selectedCoverage.value}`
    : "N/A";
  const coveragePercentage = selectedCoverage.value !== null
    ? (COVERAGE_FEES_STATIC[selectedCoverage.value] * 100).toFixed(0)
    : "N/A";
  const coverageManaAmount = selectedCoverage.value !== null &&
      currentLoanAmount > 0
    ? Math.round(
      COVERAGE_FEES_STATIC[selectedCoverage.value] * currentLoanAmount,
    )
    : 0;
  const coverageValueDisplay = coverageManaAmount > 0
    ? `(${coveragePercentage}% | M${coverageManaAmount})`
    : "(N/A)";

  const riskMultiplierDisplay = (riskBaseFee * 100).toFixed(0);
  const riskManaAmount = Math.round(riskBaseFee * currentLoanAmount);
  const riskFullDisplay = `(${riskMultiplierDisplay}% | M${riskManaAmount})`;

  const today = new Date().toISOString().split("T")[0];
  const daysOfLoan = calculateDaysBetweenForDisplay(today, loanDueDate.value);

  // Recalculate duration percentage for display using the CORRECT formula (same as InputDetails)
  const calculateDurationPercentageForDisplay = (days: number): number => {
    const a = 0.00001379; // FIXED: Changed 'a' constant for 50% cap at ~3 years
    const b = 1.5;
    return parseFloat(Math.min(a * Math.pow(days, b), 0.50).toFixed(4)); // FIXED: Changed cap to 0.50 (50%)
  };
  const durationFeePercentageForDisplay = daysOfLoan > 0
    ? (calculateDurationPercentageForDisplay(daysOfLoan) * 100).toFixed(2)
    : "0.00";

  const durationDaysInfo = daysOfLoan > 0 ? `(${daysOfLoan} days)` : "";
  const durationValueDisplay = durationFee > 0
    ? `(${durationFeePercentageForDisplay}% | M${durationFee})`
    : "(N/A)";

  return (
    <div class="mt-4 p-4 bg-gray-800 border border-gray-700 rounded-md shadow-sm text-right space-y-1">
      <p
        class={`${
          insuranceFee === null || !currentLoanAmount
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

      {/* Lender Fee */}
      {apiKeyLength >= 8 && (
        <p class="text-sm text-gray-400">
          Lender Fee: {lenderFeeDisplay}
        </p>
      )}

      {/* Coverage Fee Info Hover */}
      <p class="text-sm text-gray-400 flex items-center justify-end">
        Coverage: {coveragePrefix} {coverageValueDisplay}
        {selectedCoverage.value !== null && (
          <InfoHover
            content={
              <CoverageFeeChart highlightCoverage={selectedCoverage.value} />
            }
            width="w-96"
          >
            <InfoIcon />
          </InfoHover>
        )}
      </p>

      {/* Risk Fee Info Hover */}
      <p class="text-sm text-gray-400 flex items-center justify-end">
        Risk Multiplier: {riskFullDisplay}
        {riskBaseFee !== 0 && (
          <InfoHover
            content={<RiskFeeChart highlightScore={borrowerCreditScore} />}
            width="w-96"
          >
            <InfoIcon />
          </InfoHover>
        )}
      </p>

      {/* Duration Fee with InfoHover */}
      {currentLoanAmount > 0 && durationFee > 0 && (
        <p class="text-sm text-gray-400 flex items-center justify-end">
          Duration Fee: {durationDaysInfo} {durationValueDisplay}
          <InfoHover
            content={<DurationFeeChart highlightDays={daysOfLoan} />}
            width="w-96"
          >
            <InfoIcon />
          </InfoHover>
        </p>
      )}

      <p class="text-sm text-gray-400">
        {partnerCodeValid.value && initialInsuranceFeeBeforeDiscount !== null &&
          (
            <span class="line-through mr-1">
              (before discount) M{Math.round(initialInsuranceFeeBeforeDiscount)}
            </span>
          )}
        <span class="font-bold">M{currentInsuranceFee} TOTAL to RISK</span>
      </p>

      <p class="text-lg font-bold text-white mt-2">
        Total out of pocket: M
        {totalOutOfPocket}
      </p>
      {currentLoanAmount > 0 && (
        <p class="text-sm text-gray-400">
          Net to lender if successful: M{netLenderGain}
        </p>
      )}
    </div>
  );
}
