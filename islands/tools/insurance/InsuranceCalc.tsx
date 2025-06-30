// islands/insurance/InsuranceCalc.tsx
import { useSignal } from "@preact/signals";
import { useEffect, useState } from "preact/hooks";
import InputDetails from "./InputDetails.tsx";
import PaymentAction from "./PaymentAction.tsx";
import Institutions from "../../tools/insurance/Institutions.tsx";

const INSURANCE_MARKET_URL =
  "https://manifold.markets/crowlsyong/risk-payment-portal";

export default function InsuranceCalc() {
  const username = useSignal("");
  const lenderUsername = useSignal("");
  const loanAmount = useSignal(0);
  const selectedCoverage = useSignal<number | null>(null);
  const apiKey = useSignal("");
  const loanDueDate = useSignal("");
  const managramMessage = useSignal("");
  const lenderFeePercentage = useSignal<number | null>(null);

  const partnerCodeInput = useSignal("");
  const partnerCodeValid = useSignal(false);
  const partnerCodeMessage = useSignal("");
  const [isCodeChecking, setIsCodeChecking] = useState(false);
  const discountSource = useSignal<string | null>(null);

  const [insuranceFee, setInsuranceFee] = useState<number | null>(null);
  const [
    initialInsuranceFeeBeforeDiscount,
    setInitialInsuranceFeeBeforeDiscount,
  ] = useState<number | null>(null);
  const [riskBaseFee, setriskBaseFee] = useState(0);
  const [durationFee, setDurationFee] = useState<number>(0);

  const isLenderUsernameValid = useSignal(false);
  const isBorrowerUsernameValid = useSignal(false);
  const sameUserError = useSignal("");
  const loanDueDateError = useSignal<string>("");

  const isProcessingPayment = useSignal(false);
  const paymentMessage = useSignal<string>("");
  const paymentMessageType = useSignal<"success" | "error" | "">("");
  const paymentPortalLink = useSignal<string | null>(null);
  const isConfirming = useSignal(false);
  const cooldownActive = useSignal(false);
  const cooldownMessage = useSignal("");

  const useInstitution = useSignal(false);
  const institution = useSignal<"BANK" | "IMF" | "RISK" | "OFFSHORE" | null>(
    null,
  );

  useEffect(() => {
    let timeoutId: number;
    if (isConfirming.value) {
      timeoutId = setTimeout(() => isConfirming.value = false, 4000);
    }
    return () => clearTimeout(timeoutId);
  }, [isConfirming.value]);

  useEffect(() => {
    let cooldownTimeout: number;
    if (cooldownActive.value) {
      cooldownMessage.value =
        "Woah! You just did that. Wait a sec before trying again.";
      cooldownTimeout = setTimeout(() => {
        cooldownActive.value = false;
        cooldownMessage.value = "";
      }, 2000);
    }
    return () => clearTimeout(cooldownTimeout);
  }, [cooldownActive.value]);

  const getPolicyEndDate = (loanDueDateStr: string): string => {
    if (!loanDueDateStr) return "";
    const loanDate = new Date(loanDueDateStr + "T00:00:00");
    if (isNaN(loanDate.getTime())) return "";

    const policyEnd = new Date(loanDate);
    policyEnd.setDate(loanDate.getDate() + 7);

    return policyEnd.toISOString().split("T")[0];
  };

  const handleConfirmPayment = async () => {
    paymentMessage.value = "";
    paymentMessageType.value = "";
    paymentPortalLink.value = null;

    if (!apiKey.value) {
      paymentMessage.value = "Please enter your Manifold API Key.";
      paymentMessageType.value = "error";
      return;
    }

    if (
      !username.value || !lenderUsername.value || !loanAmount.value ||
      selectedCoverage.value === null ||
      insuranceFee === null || !loanDueDate.value ||
      !isBorrowerUsernameValid.value || !isLenderUsernameValid.value ||
      !!sameUserError.value || !!loanDueDateError.value
    ) {
      paymentMessage.value =
        "Please fill in all required fields and resolve all errors.";
      paymentMessageType.value = "error";
      return;
    }

    isProcessingPayment.value = true;
    isConfirming.value = false;

    try {
      const body = {
        apiKey: apiKey.value,
        borrowerUsername: username.value,
        lenderUsername: lenderUsername.value,
        loanAmount: loanAmount.value,
        coverage: selectedCoverage.value,
        dueDate: loanDueDate.value,
        partnerCode: partnerCodeInput.value,
        lenderFee: lenderFeePercentage.value,
        managramMessage: managramMessage.value,
      };

      const response = await fetch("/api/v0/insurance/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "An unknown error occurred.");
      }

      paymentMessage.value = result.message ||
        "Insurance policy successfully created!";
      paymentMessageType.value = "success";
      paymentPortalLink.value = result.marketUrl || INSURANCE_MARKET_URL;
      cooldownActive.value = true;
    } catch (e) {
      paymentMessage.value = `Payment failed: ${
        typeof e === "object" && e !== null && "message" in e
          ? (e as { message: string }).message
          : String(e)
      }`;
      paymentMessageType.value = "error";
      cooldownActive.value = true;
    } finally {
      isProcessingPayment.value = false;
      isConfirming.value = false;
    }
  };

  const handleConfirmStepClick = () => {
    if (cooldownActive.value) {
      return;
    }

    if (!isFormValid) {
      paymentMessage.value =
        "Please fill in all required fields and resolve errors.";
      paymentMessageType.value = "error";
      return;
    }

    if (!useInstitution.value) {
      if (isConfirming.value) {
        handleConfirmPayment();
      } else {
        isConfirming.value = true;
      }
    } else {
      paymentMessage.value =
        "To process with an institution, please use the 'Award Bounty & Pay RISK Fee' button in the Institutional Funding section.";
      paymentMessageType.value = "error";
    }
  };

  const isFormValid = !!username.value && !!lenderUsername.value &&
    loanAmount.value > 0 && selectedCoverage.value !== null &&
    insuranceFee !== null && !!loanDueDate.value && !loanDueDateError.value &&
    !!apiKey.value &&
    isLenderUsernameValid.value && isBorrowerUsernameValid.value &&
    !sameUserError.value;

  const currentInsuranceFee = insuranceFee !== null
    ? Math.round(insuranceFee)
    : 0;
  const currentLoanAmount = loanAmount.value || 0;
  const _currentLenderFee =
    (lenderFeePercentage.value !== null && currentLoanAmount > 0)
      ? Math.round(currentLoanAmount * (lenderFeePercentage.value / 100))
      : 0;

  return (
    <>
      <style>
        {`
        input[type="date"].custom-date-input::-webkit-calendar-picker-indicator {
          filter: invert(1);
        }
        .input-with-suffix {
          position: relative;
        }
        .input-with-suffix input {
          padding-right: 1.5rem;
        }
        .input-with-suffix::after {
          content: '%';
          position: absolute;
          right: 0.5rem;
          top: 50%;
          transform: translateY(-50%);
          color: #9CA3AF;
        }
        `}
      </style>
      <div class="w-full max-w-md mx-auto pb-6 px-0 sm:px-6 md:max-w-2xl lg:max-w-4xl">
        <InputDetails
          username={username}
          lenderUsername={lenderUsername}
          loanAmount={loanAmount}
          selectedCoverage={selectedCoverage}
          loanDueDate={loanDueDate}
          managramMessage={managramMessage}
          lenderFeePercentage={lenderFeePercentage}
          apiKey={apiKey}
          handleApiKeyInput={(
            e,
          ) => (apiKey.value = (e.target as HTMLInputElement).value)}
          partnerCodeInput={partnerCodeInput}
          partnerCodeValid={partnerCodeValid}
          partnerCodeMessage={partnerCodeMessage}
          isCodeChecking={isCodeChecking}
          setIsCodeChecking={setIsCodeChecking}
          discountSource={discountSource}
          insuranceFee={insuranceFee}
          setInsuranceFee={setInsuranceFee}
          initialInsuranceFeeBeforeDiscount={initialInsuranceFeeBeforeDiscount}
          setInitialInsuranceFeeBeforeDiscount={setInitialInsuranceFeeBeforeDiscount}
          riskBaseFee={riskBaseFee}
          setriskBaseFee={setriskBaseFee}
          getPolicyEndDate={getPolicyEndDate}
          isLenderUsernameValid={isLenderUsernameValid}
          isBorrowerUsernameValid={isBorrowerUsernameValid}
          sameUserError={sameUserError}
          loanDueDateError={loanDueDateError}
          setDurationFee={setDurationFee}
        />

        <Institutions
          apiKey={apiKey}
          loanAmount={loanAmount}
          username={username}
          lenderUsername={lenderUsername}
          managramMessage={managramMessage}
          insuranceFee={insuranceFee}
          getPolicyEndDate={getPolicyEndDate}
          loanDueDate={loanDueDate}
          selectedCoverage={selectedCoverage}
          riskBaseFee={riskBaseFee}
          partnerCodeValid={partnerCodeValid}
          durationFee={durationFee}
          isProcessingPayment={isProcessingPayment}
          paymentMessage={paymentMessage}
          paymentMessageType={paymentMessageType}
          institution={institution}
          cooldownActive={cooldownActive}
          cooldownMessage={cooldownMessage}
          useInstitution={useInstitution}
        />

        {!useInstitution.value && (
          <PaymentAction
            isFormValid={isFormValid}
            isProcessingPayment={isProcessingPayment.value}
            isConfirming={isConfirming}
            cooldownActive={cooldownActive}
            cooldownMessage={cooldownMessage}
            paymentMessage={paymentMessage}
            paymentMessageType={paymentMessageType}
            paymentPortalLink={paymentPortalLink}
            handleConfirmStepClick={handleConfirmStepClick}
            currentInsuranceFee={currentInsuranceFee}
            currentLoanAmount={currentLoanAmount}
            usernameValue={username.value}
          />
        )}
      </div>
    </>
  );
}
