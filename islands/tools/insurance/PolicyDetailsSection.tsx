// components/PolicyDetailsSection.tsx
import { Signal } from "@preact/signals";
import { JSX } from "preact";

interface PolicyDetailsSectionProps {
  loanDueDate: Signal<string>;
  handleLoanDueDateInput: (e: Event) => void;
  getPolicyEndDate: (loanDueDateStr: string) => string;
  selectedCoverage: Signal<number | null>;
  handleCoverageClick: (percentage: number | null) => void;
  managramMessage: Signal<string>;
  handleManagramMessageInput: (e: Event) => void;
  currentLoanAmount: number;
  currentLenderFee: number;
  apiKey: Signal<string>;
  handleApiKeyInput: (e: Event) => void;
  partnerCodeInput: Signal<string>;
  handlePartnerCodeInput: (e: Event) => void;
  isCodeChecking: boolean;
  partnerCodeMessage: Signal<string>;
  partnerCodeValid: Signal<boolean>;
  lenderFeePercentage: Signal<number | null>;
  handleLenderFeePercentageInput: (e: Event) => void;
}

export default function PolicyDetailsSection(
  props: PolicyDetailsSectionProps,
): JSX.Element {
  const {
    loanDueDate,
    handleLoanDueDateInput,
    getPolicyEndDate,
    selectedCoverage,
    handleCoverageClick,
    managramMessage,
    handleManagramMessageInput,
    apiKey,
    handleApiKeyInput,
    partnerCodeInput,
    handlePartnerCodeInput,
    isCodeChecking,
    partnerCodeMessage,
    partnerCodeValid,
    lenderFeePercentage,
    handleLenderFeePercentageInput,
  } = props;

  const coverageLabels = ["25%", "50%", "75%", "100%"];

  return (
    <div>
      <div class="mt-0">
        <label
          htmlFor="loanDueDate"
          class="block text-sm font-medium text-gray-300"
        >
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
            Policy ends: {getPolicyEndDate(loanDueDate.value)} (1 week after)
          </p>
        )}
      </div>

      <label
        htmlFor="coverage"
        class="block text-sm font-medium text-gray-300 pt-3"
      >
        Select coverage
      </label>
      <label
        htmlFor="coverage-description"
        class="text-gray-400 text-xs mb-1 block"
      >
        We'll cover this much of your loan if the borrower defaults
      </label>

      <div class="mt-4 flex space-x-2">
        {coverageLabels.map((label) => (
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
          onInput={handleApiKeyInput}
          placeholder="xxxxx-xxxx-xxxx-xxxxxxxxxxxxxxx"
          class="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-800 text-gray-100"
        />
        <p class="mt-1 text-xs text-gray-400">
          We don't store this key. Find your API key on your Manifold profile
          page by clicking the gear icon and selecting Account Settings.
        </p>
      </div>

      {apiKey.value.length >= 8 && (
        <div class="mt-4 p-3 bg-gray-800 border border-gray-700 rounded-md shadow-sm">
          <div class="flex items-center justify-between">
            <label
              htmlFor="lenderFeePercentage"
              class="block text-sm font-medium text-gray-300"
            >
              Lender Fee Percentage
            </label>
            <div class="relative group input-with-suffix w-24">
              <input
                id="lenderFeePercentage"
                type="number"
                value={lenderFeePercentage.value !== null
                  ? lenderFeePercentage.value.toString()
                  : ""}
                onInput={handleLenderFeePercentageInput}
                class="w-full p-2 bg-gray-900 text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8 text-right"
              />
            </div>
          </div>
          <p class="mt-1 text-xs text-gray-400">
            This percentage of the loan amount will be the lender's fee.
          </p>
        </div>
      )}

      {apiKey.value.length >= 8 && (
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
            rows={3}
            class="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-800 text-gray-100"
          >
          </textarea>
          <p class="mt-1 text-xs text-gray-400">
            This message will be sent with the loan mana.
          </p>
        </div>
      )}

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
                  partnerCodeValid.value ? "text-green-400" : "text-orange-400"
                }`}
              >
                {partnerCodeMessage.value}
              </p>
            )
          )}
      </div>
    </div>
  );
}
