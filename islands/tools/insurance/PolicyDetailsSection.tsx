// islands/tools/insurance/PolicyDetailsSection.tsx
import { Signal } from "@preact/signals";
import { JSX } from "preact";

interface PolicyDetailsSectionProps {
  loanDueDate: Signal<string>;
  handleLoanDueDateInput: (e: Event) => void;
  getPolicyEndDate: (loanDueDateStr: string) => string;
  selectedCoverage: Signal<number | null>;
  handleCoverageClick: (percentage: number | null) => void;
  apiKey: Signal<string>; // Add back apiKey prop
  handleApiKeyInput: (e: Event) => void; // Add back apiKey handler prop
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
    apiKey, // Destructure apiKey
    handleApiKeyInput, // Destructure handler
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
    </div>
  );
}
