// islands/tools/insurance/PaymentAction.tsx
import { Signal } from "@preact/signals";
import { JSX } from "preact";

interface PaymentActionProps {
  isFormValid: boolean;
  isProcessingPayment: boolean;
  isConfirming: Signal<boolean>;
  cooldownActive: Signal<boolean>;
  cooldownMessage: Signal<string>;
  paymentMessage: Signal<string>;
  paymentMessageType: Signal<"success" | "error" | "">;
  paymentPortalLink: Signal<string | null>;
  handleConfirmStepClick: () => void;
  currentInsuranceFee: number;
  currentLoanAmount: number;
  usernameValue: string;
}

export default function PaymentAction(
  props: PaymentActionProps,
): JSX.Element {
  const {
    isFormValid,
    isProcessingPayment,
    isConfirming,
    cooldownActive,
    paymentMessage,
    paymentMessageType,
    paymentPortalLink,
    handleConfirmStepClick,
    currentInsuranceFee,
    currentLoanAmount,
    usernameValue,
  } = props;

  let buttonText = `Send M${currentInsuranceFee} fee and loan @${
    usernameValue || "borrower"
  } M${currentLoanAmount} mana`;

  let buttonClass =
    `mt-6 w-full p-3 rounded-md text-lg font-semibold transition-colors duration-200 `;

  if (cooldownActive.value) {
    buttonText = "Please wait...";
    buttonClass += `bg-gray-700 text-gray-400 cursor-not-allowed`;
  } else if (isProcessingPayment) {
    buttonText = "Processing...";
    buttonClass += `bg-gray-700 text-gray-400 cursor-not-allowed`;
  } else if (isConfirming.value) {
    buttonText = "Are you sure? Click to Confirm";
    buttonClass += `bg-yellow-700 hover:bg-yellow-800 text-white`;
  } else if (!isFormValid) {
    buttonClass += `bg-gray-700 text-gray-400 cursor-not-allowed`;
  } else {
    buttonClass += `bg-blue-600 hover:bg-blue-700 text-white`;
  }

  return (
    <>
      <button
        type="button"
        onClick={handleConfirmStepClick}
        disabled={!isFormValid || isProcessingPayment || cooldownActive.value}
        class={buttonClass}
      >
        {buttonText}
      </button>

      {/* Removed the cooldown message display */}
      {
        /* {cooldownActive.value && cooldownMessage.value && (
        <p class="mt-2 text-center text-orange-400 text-sm">
          {cooldownMessage.value}
        </p>
      )} */
      }

      {paymentMessage.value && paymentMessageType.value && (
        <p
          class={`mt-4 text-center text-sm ${
            paymentMessageType.value === "error"
              ? "text-red-400"
              : "text-green-400"
          }`}
        >
          {paymentMessage.value}
        </p>
      )}

      {paymentPortalLink.value && paymentMessageType.value === "success" && (
        <p class="mt-2 text-center">
          <a
            href={paymentPortalLink.value}
            target="_blank"
            rel="noopener noreferrer"
            class="text-blue-400 hover:underline text-sm"
          >
            View Payment Portal
          </a>
        </p>
      )}
    </>
  );
}
