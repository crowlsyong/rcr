// components/FinancialSummary.tsx
import { Signal } from "@preact/signals";
import { JSX } from "preact";

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
}

export default function FinancialSummary(
  props: FinancialSummaryProps,
): JSX.Element {
  const {
    insuranceFee,
    currentLoanAmount,
    username,
    currentLenderFee,
    initialInsuranceFeeBeforeDiscount,
    partnerCodeValid,
    netLenderGain,
    apiKeyLength,
  } = props;

  const currentInsuranceFee = insuranceFee !== null
    ? Math.round(insuranceFee)
    : 0;
  const totalOutOfPocket = currentLoanAmount + currentInsuranceFee;

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

      {/* Lender Fee value displayed here, input box removed */}
      {apiKeyLength >= 8 && (
        <p class="text-sm text-gray-400">
          Lender Fee: +M{currentLenderFee}
        </p>
      )}

      <p class="text-sm text-gray-400">
        {partnerCodeValid.value && initialInsuranceFeeBeforeDiscount !== null &&
          (
            <span class="line-through mr-1">
              (before discount) M{Math.round(initialInsuranceFeeBeforeDiscount)}
            </span>
          )}
        M{currentInsuranceFee} to RISK
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
