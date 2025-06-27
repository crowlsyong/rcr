// islands/tools/insurance/LoanInputSection.tsx
import { Signal } from "@preact/signals";
import { Ref } from "preact";
import { JSX } from "preact";
import ScoreResult from "../creditscore/ScoreResult.tsx";

interface LoanInputSectionProps {
  username: Signal<string>;
  debouncedUsername: string;
  inputRef: Ref<HTMLInputElement>;
  handleUsernameInput: (e: Event) => void;
  error: Signal<string>; // Borrower username error
  scoreData: Signal<
    {
      username: string;
      creditScore: number;
      riskBaseFee: number;
      avatarUrl: string | null;
    } | null
  >;
  riskBaseFee: number;
  lenderUsername: Signal<string>;
  handleLenderUsernameInput: (e: Event) => void;
  lenderUsernameError: Signal<string>; // Lender username error
  loanAmount: Signal<number>;
  handleLoanInput: (e: Event) => void;
  isBorrowerUsernameValid: Signal<boolean>;
  isLenderUsernameValid: Signal<boolean>;
  // New prop for same user error
  sameUserError: Signal<string>;
}

export default function LoanInputSection(
  props: LoanInputSectionProps,
): JSX.Element {
  const {
    username,
    inputRef,
    handleUsernameInput,
    error, // Borrower error
    scoreData,
    riskBaseFee,
    lenderUsername,
    handleLenderUsernameInput,
    lenderUsernameError, // Lender error
    loanAmount,
    handleLoanInput,
    isBorrowerUsernameValid,
    isLenderUsernameValid,
    sameUserError, // Destructure new prop
  } = props;

  // Helper function to determine @ symbol color class
  const getAtSymbolColorClass = (
    isValid: Signal<boolean>,
    hasError: Signal<string>,
    isSameUserError: Signal<string>,
  ) => {
    if (isValid.value && !hasError.value && !isSameUserError.value) {
      return "text-green-400"; // Valid and no error
    } else if (hasError.value || isSameUserError.value) {
      return "text-red-400"; // Has a specific error
    }
    return "text-gray-400 group-focus-within:text-blue-400"; // Default or typing
  };

  return (
    <div>
      <ScoreResult
        username={scoreData.value?.username || "N/A"}
        creditScore={scoreData.value?.creditScore || 0}
        riskBaseFee={riskBaseFee || 0}
        avatarUrl={scoreData.value?.avatarUrl || null}
        isWaiting={!scoreData.value}
      />
      <div class="mt-2">
        <label htmlFor="username" class="text-gray-400 mt-2 mb-1 block">
          Enter borrower's username
        </label>
        <div class="relative group">
          <span
            class={`absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none transition-colors duration-200 ${
              getAtSymbolColorClass(
                isBorrowerUsernameValid,
                error,
                sameUserError,
              )
            }`}
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
          <p class="text-red-400 text-sm text-center mt-2">
            {error.value}
          </p>
        )}
      </div>

      <div class="mt-4">
        <label htmlFor="lenderUsername" class="text-gray-400 mb-1 block">
          Enter your username
        </label>
        <div class="relative group">
          <span
            class={`absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none transition-colors duration-200 ${
              getAtSymbolColorClass(
                isLenderUsernameValid,
                lenderUsernameError,
                sameUserError,
              )
            }`}
          >
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
        {lenderUsernameError.value && (
          <p class="text-red-400 text-sm text-center mt-2">
            {lenderUsernameError.value}
          </p>
        )}
        {sameUserError.value && (
          <p class="text-red-400 text-sm text-center mt-2">
            {sameUserError.value}
          </p>
        )}
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
  );
}
