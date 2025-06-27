// components/LoanInputSection.tsx
import { Signal } from "@preact/signals";
import { Ref } from "preact";
import { JSX } from "preact";
import ScoreResult from "../creditscore/ScoreResult.tsx"; // Adjust path as necessary

interface LoanInputSectionProps {
  username: Signal<string>;
  debouncedUsername: string;
  inputRef: Ref<HTMLInputElement>;
  handleUsernameInput: (e: Event) => void;
  error: Signal<string>;
  scoreData: Signal<
    {
      username: string;
      creditScore: number;
      riskMultiplier: number;
      avatarUrl: string | null;
    } | null
  >;
  riskMultiplier: number;
  lenderUsername: Signal<string>;
  handleLenderUsernameInput: (e: Event) => void;
  loanAmount: Signal<number>;
  handleLoanInput: (e: Event) => void;
}

export default function LoanInputSection(
  props: LoanInputSectionProps,
): JSX.Element {
  const {
    username,
    inputRef,
    handleUsernameInput,
    error,
    scoreData,
    riskMultiplier,
    lenderUsername,
    handleLenderUsernameInput,
    loanAmount,
    handleLoanInput,
  } = props;

  return (
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
  );
}
