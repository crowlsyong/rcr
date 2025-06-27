// islands/insurance/OptionalFeatures.tsx
import { Signal } from "@preact/signals";
import { JSX } from "preact";

interface OptionalFeaturesProps {
  managramMessage: Signal<string>;
  handleManagramMessageInput: (e: Event) => void;
  partnerCodeInput: Signal<string>;
  handlePartnerCodeInput: (e: Event) => void;
  isCodeChecking: boolean;
  partnerCodeMessage: Signal<string>;
  partnerCodeValid: Signal<boolean>;
  lenderFeePercentage: Signal<number | null>;
  handleLenderFeePercentageInput: (e: Event) => void;
  loanAmount: Signal<number>;
}

export default function OptionalFeatures(
  props: OptionalFeaturesProps,
): JSX.Element {
  const {
    managramMessage,
    handleManagramMessageInput,
    partnerCodeInput,
    handlePartnerCodeInput,
    isCodeChecking,
    partnerCodeMessage,
    partnerCodeValid,
    lenderFeePercentage,
    loanAmount,
  } = props;

  const lenderManaFee =
    (loanAmount.value > 0 && lenderFeePercentage.value !== null)
      ? Math.round(loanAmount.value * (lenderFeePercentage.value / 100))
      : 0;

  const handleLenderPercentageInput = (e: Event) => {
    const inputValue = (e.target as HTMLInputElement).value;
    const validValue = inputValue.replace(/[^0-9.]/g, "");
    const percentage = validValue ? parseFloat(validValue) : null;
    lenderFeePercentage.value = percentage;
  };

  const handleLenderManaInput = (e: Event) => {
    const inputValue = (e.target as HTMLInputElement).value;
    const validValue = inputValue.replace(/[^0-9]/g, "");
    const manaAmount = validValue ? parseInt(validValue) : null;

    if (manaAmount !== null && loanAmount.value > 0) {
      const calculatedPercentage = (manaAmount / loanAmount.value) * 100;
      lenderFeePercentage.value = Math.round(calculatedPercentage);
    } else {
      lenderFeePercentage.value = null;
    }
  };

  return (
    <div class="mt-4 p-4 bg-gray-800 border border-gray-700 rounded-md shadow-sm">
      {/* Lender Fee Section - TOP ROW */}
      <div class="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Left Column for Label and Description */}
        <div class="col-span-1">
          <label
            htmlFor="lenderManaFee"
            class="block text-sm font-medium text-gray-300"
          >
            Lender Fee
          </label>
          <p class="text-xs text-gray-400">
            This is the fee paid to the lender. Enter either mana or percentage.
          </p>
        </div>

        {/* Right Column for M Input AKA % Input */}
        <div class="col-span-1 flex items-center justify-end space-x-2">
          <span class="text-gray-400">M</span>
          <input
            id="lenderManaFee"
            type="number"
            value={lenderManaFee !== 0 ? lenderManaFee.toString() : ""}
            onInput={handleLenderManaInput}
            placeholder="0"
            class="w-20 p-2 bg-gray-900 text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
          />
          <span class="text-gray-400">AKA</span>
          <input
            id="lenderPercentageFee"
            type="number"
            value={lenderFeePercentage.value !== null
              ? lenderFeePercentage.value.toString()
              : ""}
            onInput={handleLenderPercentageInput}
            placeholder="0"
            class="w-20 p-2 bg-gray-900 text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
          />
          <span class="text-gray-400">%</span>
        </div>
      </div>

      {/* Horizontal Line Separator */}
      <hr class="border-gray-700 my-4" /> {/* Added HR element here */}

      {/* Grid for Partner Code and Managram Message - NEXT ROWS */}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Partner Code (Discount) - Now on the left (col-span-1) */}
        <div class="col-span-1">
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

        {/* Managram Message - Now on the right (col-span-1) */}
        <div class="col-span-1">
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
            class="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-800 text-gray-100"
          >
          </textarea>
          <p class="mt-1 text-xs text-gray-400">
            This message will be sent with the loan mana.
          </p>
        </div>
      </div>
    </div>
  );
}
