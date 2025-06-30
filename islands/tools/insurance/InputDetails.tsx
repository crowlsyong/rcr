// islands/tools/insurance/InputDetails.tsx
import { Signal, useSignal } from "@preact/signals";
import { useEffect, useRef, useState } from "preact/hooks";
import { JSX } from "preact";
import LoanInputSection from "./LoanInputSection.tsx";
import PolicyDetailsSection from "./PolicyDetailsSection.tsx";
import FinancialSummary from "./FinancialSummary.tsx";
import OptionalFeatures from "./OptionalFeatures.tsx";
import { fetchUserData } from "../../../utils/api/manifold_api_service.ts";

interface CreditScoreData {
  username: string;
  creditScore: number;
  riskBaseFee: number;
  avatarUrl: string | null;
  userId: string;
}

interface InputDetailsProps {
  username: Signal<string>;
  lenderUsername: Signal<string>;
  loanAmount: Signal<number>;
  selectedCoverage: Signal<number | null>;
  loanDueDate: Signal<string>;
  managramMessage: Signal<string>;
  lenderFeePercentage: Signal<number | null>;
  apiKey: Signal<string>;
  handleApiKeyInput: (e: Event) => void;
  partnerCodeInput: Signal<string>;
  partnerCodeValid: Signal<boolean>;
  partnerCodeMessage: Signal<string>;
  isCodeChecking: boolean;
  setIsCodeChecking: (value: boolean) => void;
  discountSource: Signal<string | null>;
  insuranceFee: number | null;
  setInsuranceFee: (value: number | null) => void;
  initialInsuranceFeeBeforeDiscount: number | null;
  setInitialInsuranceFeeBeforeDiscount: (value: number | null) => void;
  riskBaseFee: number;
  setriskBaseFee: (value: number) => void;
  getPolicyEndDate: (loanDueDateStr: string) => string;
  isLenderUsernameValid: Signal<boolean>;
  isBorrowerUsernameValid: Signal<boolean>;
  sameUserError: Signal<string>;
  loanDueDateError: Signal<string>;
  setDurationFee: (value: number) => void;
}

const COVERAGE_FEES: { [key: number]: number } = {
  25: 0.02,
  50: 0.05,
  75: 0.08,
  100: 0.12,
};

export default function InputDetails(props: InputDetailsProps): JSX.Element {
  const {
    username,
    lenderUsername,
    loanAmount,
    selectedCoverage,
    loanDueDate,
    managramMessage,
    lenderFeePercentage,
    apiKey,
    handleApiKeyInput,
    partnerCodeInput,
    partnerCodeValid,
    partnerCodeMessage,
    isCodeChecking,
    setIsCodeChecking,
    discountSource,
    insuranceFee,
    setInsuranceFee,
    initialInsuranceFeeBeforeDiscount,
    setInitialInsuranceFeeBeforeDiscount,
    riskBaseFee,
    setriskBaseFee,
    getPolicyEndDate,
    isLenderUsernameValid,
    isBorrowerUsernameValid,
    sameUserError,
    loanDueDateError,
    setDurationFee,
  } = props;

  const [debouncedBorrowerUsername, setDebouncedBorrowerUsername] = useState(
    "",
  );
  const [debouncedLenderUsername, setDebouncedLenderUsername] = useState("");
  const scoreData = useSignal<CreditScoreData | null>(null);
  const borrowerUsernameError = useSignal<string>("");
  const lenderUsernameError = useSignal<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const durationFeePercentage = useSignal<number>(0);

  const calculateDurationFeePercentage = (days: number): number => {
    const a = 0.00001379;
    const b = 1.5;
    return parseFloat(Math.min(a * Math.pow(days, b), 0.50).toFixed(4));
  };

  const calculateDaysBetween = (startDate: Date, endDate: Date): number => {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedBorrowerUsername(username.value),
      500,
    );
    return () => clearTimeout(timer);
  }, [username.value]);

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedLenderUsername(lenderUsername.value),
      500,
    );
    return () => clearTimeout(timer);
  }, [lenderUsername.value]);

  useEffect(() => {
    if (
      username.value && lenderUsername.value &&
      username.value.toLowerCase() === lenderUsername.value.toLowerCase()
    ) {
      sameUserError.value = "Borrower and Lender cannot be the same user.";
    } else {
      sameUserError.value = "";
    }
  }, [username.value, lenderUsername.value]);

  async function validateAndFetchBorrowerData(user: string) {
    if (!user) {
      resetBorrowerDataState();
      return;
    }
    try {
      const res = await fetch(`/api/v0/credit-score?username=${user}`);
      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.userExists || data.userDeleted) {
        scoreData.value = null;
        borrowerUsernameError.value = data.userDeleted
          ? `User @${user} is deleted`
          : `User @${user} not found`;
        isBorrowerUsernameValid.value = false;
        setriskBaseFee(0);
        setInsuranceFee(null);
        setInitialInsuranceFeeBeforeDiscount(null);
        return;
      }

      scoreData.value = {
        username: data.username,
        creditScore: data.creditScore,
        riskBaseFee: data.riskBaseFee,
        avatarUrl: data.avatarUrl,
        userId: data.userId,
      };
      setriskBaseFee(data.riskBaseFee);
      borrowerUsernameError.value = "";
      isBorrowerUsernameValid.value = true;
    } catch (err) {
      borrowerUsernameError.value = `Network/fetch error: ${
        typeof err === "object" && err !== null && "message" in err
          ? (err as { message: string }).message
          : String(err)
      }`;
      scoreData.value = null;
      isBorrowerUsernameValid.value = false;
      setriskBaseFee(0);
      setInsuranceFee(null);
      setInitialInsuranceFeeBeforeDiscount(null);
    }
  }

  async function validateLenderUsername(user: string) {
    if (!user) {
      lenderUsernameError.value = "";
      isLenderUsernameValid.value = false;
      return;
    }
    try {
      const { userData, fetchSuccess, userDeleted } = await fetchUserData(user);
      if (fetchSuccess && userData && !userDeleted) {
        lenderUsernameError.value = "";
        isLenderUsernameValid.value = true;
      } else {
        lenderUsernameError.value = "Lender username not found or deleted.";
        isLenderUsernameValid.value = false;
      }
    } catch (err) {
      lenderUsernameError.value = `Error checking lender username: ${
        typeof err === "object" && err !== null && "message" in err
          ? (err as { message: string }).message
          : String(err)
      }`;
      isLenderUsernameValid.value = false;
    }
  }

  function resetBorrowerDataState() {
    scoreData.value = null;
    borrowerUsernameError.value = "";
    setriskBaseFee(0);
    setInsuranceFee(null);
    setInitialInsuranceFeeBeforeDiscount(null);
    isBorrowerUsernameValid.value = false;
  }

  useEffect(() => {
    validateAndFetchBorrowerData(debouncedBorrowerUsername);
  }, [debouncedBorrowerUsername]);

  useEffect(() => {
    validateLenderUsername(debouncedLenderUsername);
  }, [debouncedLenderUsername]);

  useEffect(() => {
    const code = partnerCodeInput.value.trim();
    if (code === "") {
      partnerCodeValid.value = false;
      partnerCodeMessage.value = "";
      discountSource.value = null;
      return;
    }

    setIsCodeChecking(true);
    partnerCodeMessage.value = "Checking code...";

    const debounceTimer = setTimeout(async () => {
      try {
        const response = await fetch("/api/v0/validate-partner-code", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.statusText}`);
        }

        const data = await response.json();
        partnerCodeValid.value = data.isValid;
        partnerCodeMessage.value = data.message;
        discountSource.value = data.discountType || null;
      } catch (err) {
        partnerCodeValid.value = false;
        partnerCodeMessage.value = `Error checking code: ${
          typeof err === "object" && err !== null && "message" in err
            ? (err as { message: string }).message
            : String(err)
        }`;
        discountSource.value = null;
      } finally {
        setIsCodeChecking(false);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [partnerCodeInput.value]);

  const calculateInsuranceFee = () => {
    if (
      loanAmount.value <= 0 || selectedCoverage.value === null ||
      riskBaseFee === 0 || !loanDueDate.value || !!loanDueDateError.value
    ) {
      setInsuranceFee(null);
      setInitialInsuranceFeeBeforeDiscount(null);
      durationFeePercentage.value = 0;
      setDurationFee(0);
      return;
    }

    const coverageFee = COVERAGE_FEES[selectedCoverage.value];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(loanDueDate.value + "T00:00:00");
    const days = calculateDaysBetween(today, dueDate);

    const calculatedDurationFeePercentage = calculateDurationFeePercentage(
      days,
    );
    durationFeePercentage.value = calculatedDurationFeePercentage;

    const calculatedDurationFee = Math.ceil(
      loanAmount.value * calculatedDurationFeePercentage,
    );
    setDurationFee(calculatedDurationFee);

    let currentFee = (riskBaseFee * loanAmount.value) +
      (loanAmount.value * coverageFee) + calculatedDurationFee;

    setInitialInsuranceFeeBeforeDiscount(currentFee);

    if (partnerCodeValid.value) {
      currentFee *= 0.75;
    }

    setInsuranceFee(currentFee);
  };

  useEffect(() => {
    calculateInsuranceFee();
  }, [
    loanAmount.value,
    selectedCoverage.value,
    riskBaseFee,
    partnerCodeValid.value,
    loanDueDate.value,
    loanDueDateError.value,
  ]);

  useEffect(() => {
    const currentLenderFee =
      (lenderFeePercentage.value !== null && loanAmount.value > 0)
        ? Math.round(loanAmount.value * (lenderFeePercentage.value / 100))
        : 0;
    const amountDueBack = loanAmount.value + currentLenderFee;

    let baseMessage =
      `Loan M${loanAmount.value}. M${amountDueBack} due back ${loanDueDate.value}.`;

    if (selectedCoverage.value !== null && selectedCoverage.value > 0) {
      baseMessage += ` | ${selectedCoverage.value}% INSURED BY RISK`;
    }

    if (baseMessage.length > 100) {
      managramMessage.value = baseMessage.substring(0, 100);
    } else {
      managramMessage.value = baseMessage;
    }
  }, [
    loanAmount.value,
    lenderFeePercentage.value,
    loanDueDate.value,
    selectedCoverage.value,
  ]);

  const handleCoverageClick = (percentage: number | null) => {
    if (selectedCoverage.value === percentage) {
      selectedCoverage.value = null;
    } else {
      selectedCoverage.value = percentage;
    }
  };

  const handleUsernameInput = (e: Event) => {
    username.value = (e.target as HTMLInputElement).value;
    setInsuranceFee(null);
  };

  const handleLenderUsernameInput = (e: Event) => {
    lenderUsername.value = (e.target as HTMLInputElement).value;
  };

  const handleLoanInput = (e: Event) => {
    const inputValue = (e.target as HTMLInputElement).value;
    const validValue = inputValue.replace(/[^0-9]/g, "");
    loanAmount.value = validValue ? parseInt(validValue) : 0;
  };

  const handleLoanDueDateInput = (e: Event) => {
    const inputValue = (e.target as HTMLInputElement).value;
    loanDueDate.value = inputValue;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedDate = new Date(inputValue + "T00:00:00");
    if (isNaN(selectedDate.getTime())) {
      loanDueDateError.value = "Please select a valid date.";
    } else if (selectedDate <= today) {
      loanDueDateError.value = "Loan due date must be at least tomorrow.";
    } else {
      loanDueDateError.value = "";
    }
  };

  const handlePartnerCodeInput = (e: Event) => {
    partnerCodeInput.value = (e.target as HTMLInputElement).value;
  };

  const handleManagramMessageInput = (e: Event) => {
    managramMessage.value = (e.target as HTMLTextAreaElement).value;
  };

  const handleLenderFeePercentageInput = (e: Event) => {
    const inputValue = (e.target as HTMLInputElement).value;
    const validValue = inputValue.replace(/[^0-9]/g, "");
    lenderFeePercentage.value = validValue ? parseInt(validValue) : null;
  };

  const currentLoanAmount = loanAmount.value || 0;
  const currentLenderFee =
    (lenderFeePercentage.value !== null && currentLoanAmount > 0)
      ? Math.round(currentLoanAmount * (lenderFeePercentage.value / 100))
      : 0;
  const currentInsuranceFee = insuranceFee !== null
    ? Math.round(insuranceFee)
    : 0;

  const displayDurationFee = loanAmount.value > 0 && insuranceFee !== null &&
      durationFeePercentage.value > 0
    ? Math.ceil(currentLoanAmount * durationFeePercentage.value)
    : 0;

  return (
    <>
      <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        <LoanInputSection
          username={username}
          debouncedUsername={debouncedBorrowerUsername}
          inputRef={inputRef}
          handleUsernameInput={handleUsernameInput}
          error={borrowerUsernameError}
          scoreData={scoreData}
          riskBaseFee={riskBaseFee}
          lenderUsername={lenderUsername}
          handleLenderUsernameInput={handleLenderUsernameInput}
          lenderUsernameError={lenderUsernameError}
          loanAmount={loanAmount}
          handleLoanInput={handleLoanInput}
          isBorrowerUsernameValid={isBorrowerUsernameValid}
          isLenderUsernameValid={isLenderUsernameValid}
          sameUserError={sameUserError}
        />

        <PolicyDetailsSection
          loanDueDate={loanDueDate}
          handleLoanDueDateInput={handleLoanDueDateInput}
          loanDueDateError={loanDueDateError}
          getPolicyEndDate={getPolicyEndDate}
          selectedCoverage={selectedCoverage}
          handleCoverageClick={handleCoverageClick}
          apiKey={apiKey}
          handleApiKeyInput={handleApiKeyInput}
        />
      </div>

      {apiKey.value.length >= 8 && (
        <OptionalFeatures
          managramMessage={managramMessage}
          handleManagramMessageInput={handleManagramMessageInput}
          partnerCodeInput={partnerCodeInput}
          handlePartnerCodeInput={handlePartnerCodeInput}
          isCodeChecking={isCodeChecking}
          partnerCodeMessage={partnerCodeMessage}
          partnerCodeValid={partnerCodeValid}
          lenderFeePercentage={lenderFeePercentage}
          handleLenderFeePercentageInput={handleLenderFeePercentageInput}
          loanAmount={loanAmount}
        />
      )}

      <FinancialSummary
        insuranceFee={insuranceFee}
        currentLoanAmount={currentLoanAmount}
        username={username}
        currentLenderFee={currentLenderFee}
        lenderFeePercentage={lenderFeePercentage}
        handleLenderFeePercentageInput={handleLenderFeePercentageInput}
        initialInsuranceFeeBeforeDiscount={initialInsuranceFeeBeforeDiscount}
        partnerCodeValid={partnerCodeValid}
        netLenderGain={currentLenderFee - currentInsuranceFee}
        apiKeyLength={apiKey.value.length}
        durationFee={displayDurationFee}
        selectedCoverage={selectedCoverage}
        riskBaseFee={riskBaseFee}
        loanDueDate={loanDueDate}
        borrowerCreditScore={scoreData.value?.creditScore || 0}
      />
    </>
  );
}
