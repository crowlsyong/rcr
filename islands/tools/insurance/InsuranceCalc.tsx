// islands/insurance/InsuranceCalc.tsx
import { useSignal } from "@preact/signals";
import { useEffect, useState } from "preact/hooks";
import {
  addBounty,
  fetchUserData,
  postComment,
  sendManagram,
} from "../../../utils/api/manifold_api_service.ts";
import { ManaPaymentTransaction } from "../../../utils/api/manifold_types.ts";
import InputDetails from "./InputDetails.tsx";
import PaymentAction from "./PaymentAction.tsx";

const INSURANCE_MARKET_ID = "QEytQ5ch0P";
const INSURANCE_MARKET_URL =
  "https://manifold.markets/crowlsyong/risk-payment-portal";
const CONTACT_USERNAME = "crowlsyong";

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
  const [riskMultiplier, setRiskMultiplier] = useState(0);

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const paymentMessage = useSignal<string>("");
  const paymentMessageType = useSignal<"success" | "error" | "">("");
  const paymentPortalLink = useSignal<string | null>(null);
  const isConfirming = useSignal(false);
  const cooldownActive = useSignal(false);
  const cooldownMessage = useSignal("");

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
      selectedCoverage.value === null || // Changed to strict null check
      insuranceFee === null || !loanDueDate.value
    ) {
      paymentMessage.value =
        "Please fill in all required fields (Borrower, Lender, Loan Amount, Coverage, Loan Due Date).";
      paymentMessageType.value = "error";
      return;
    }

    setIsProcessingPayment(true);
    isConfirming.value = false;

    try {
      const { userData: borrowerData, fetchSuccess: borrowerFetchSuccess } =
        await fetchUserData(username.value);

      if (!borrowerFetchSuccess || !borrowerData?.id) {
        throw new Error(
          `Could not find borrower: ${username.value}. Please check username.`,
        );
      }
      const borrowerId = borrowerData.id;

      const { userData: lenderData, fetchSuccess: lenderFetchSuccess } =
        await fetchUserData(lenderUsername.value);

      if (!lenderFetchSuccess || !lenderData?.id) {
        throw new Error(
          `Could not find lender: ${lenderUsername.value}. Please check username.`,
        );
      }

      const sendManaResult = await sendManagram(
        [borrowerId],
        loanAmount.value,
        managramMessage.value,
        apiKey.value,
      );

      if (!sendManaResult.success) {
        throw new Error(
          `Failed to send mana to borrower: ${
            sendManaResult.error || "Unknown error."
          }`,
        );
      }

      const addBountyResult = await addBounty(
        INSURANCE_MARKET_ID,
        Math.round(insuranceFee),
        apiKey.value,
      );

      if (!addBountyResult.success) {
        throw new Error(
          `Failed to add bounty to market: ${
            addBountyResult.error || "Unknown error."
          }`,
        );
      }

      const transactionId = (addBountyResult.data as ManaPaymentTransaction)
        .id;

      const policyStartDate = new Date().toISOString().split("T")[0];
      const policyEndDate = getPolicyEndDate(loanDueDate.value);

      const coveragePercentage = selectedCoverage.value;

      let discountLine = "";
      if (partnerCodeValid.value) {
        discountLine = "\nDiscount Code Applied: 25%";
      }

      const localCoverageFees: { [key: number]: number } = {
        25: 0.02,
        50: 0.05,
        75: 0.08,
        100: 0.12,
      };

      const receiptMessage = `# 🦝RISK Insurance Receipt

### Summary

Transaction ID: ${transactionId}

Coverage: C${coveragePercentage}

Lender: @${lenderUsername.value}

Borrower: @${username.value}

Loan Amount: Ṁ${loanAmount.value}

Date of Policy Start: ${policyStartDate}

Loan Due Date: ${loanDueDate.value}

Policy Ends: ${policyEndDate}

### Fees

Base Fee (risk multiplier): ${riskMultiplier * 100}%

Coverage Fee: ${localCoverageFees[selectedCoverage.value!] * 100}%
${discountLine}
Total Fee: Ṁ${Math.round(insuranceFee)}

### Terms

By using this service, you agree to The Fine Print at the very bottom of our dashboard. 60% refund may be available if borrower repays on time and in full. No refund if borrower defaults, but insurance will cover the policy amount.

---

Have questions or need to activate coverage? Message @${CONTACT_USERNAME} and we’ll walk you through it.


Risk Free 🦝RISK Fee Guarantee™️


🦝RISK: Recovery Loan Insurance Kiosk`;

      const postCommentResult = await postComment(
        INSURANCE_MARKET_ID,
        receiptMessage,
        apiKey.value,
      );

      if (!postCommentResult.success) {
        throw new Error(
          `Failed to post insurance receipt comment: ${
            postCommentResult.error || "Unknown error."
          }`,
        );
      }

      paymentMessage.value = "Insurance policy successfully created and paid!";
      paymentMessageType.value = "success";
      paymentPortalLink.value = INSURANCE_MARKET_URL;
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
      setIsProcessingPayment(false);
      isConfirming.value = false;
    }
  };

  const handleConfirmStepClick = () => {
    if (cooldownActive.value) {
      return;
    }

    // Fixed: Explicitly convert to boolean using !!
    if (!isFormValid) {
      return;
    }

    if (isConfirming.value) {
      handleConfirmPayment();
    } else {
      isConfirming.value = true;
    }
  };

  const isFormValid = !!username.value && !!lenderUsername.value &&
    loanAmount.value > 0 &&
    selectedCoverage.value !== null && insuranceFee !== null &&
    !!loanDueDate.value && !!apiKey.value && !isProcessingPayment;

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
          riskMultiplier={riskMultiplier}
          setRiskMultiplier={setRiskMultiplier}
          getPolicyEndDate={getPolicyEndDate}
        />

        <PaymentAction
          isFormValid={isFormValid}
          isProcessingPayment={isProcessingPayment}
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
      </div>
    </>
  );
}
