// islands/insurance/InputDetails.tsx
import { Signal, useSignal } from "@preact/signals";
import { useEffect, useRef, useState } from "preact/hooks";
import { JSX } from "preact";
import LoanInputSection from "./LoanInputSection.tsx";
import PolicyDetailsSection from "./PolicyDetailsSection.tsx";
import FinancialSummary from "./FinancialSummary.tsx";

interface CreditScoreData {
  username: string;
  creditScore: number;
  riskMultiplier: number;
  avatarUrl: string | null;
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
  partnerCodeInput: Signal<string>;
  partnerCodeValid: Signal<boolean>;
  partnerCodeMessage: Signal<string>;
  isCodeChecking: boolean;
  setIsCodeChecking: (value: boolean) => void;
  discountSource: Signal<string | null>; // Still a signal, direct .value assignment
  // Expose these for parent component to read calculated values
  insuranceFee: number | null;
  setInsuranceFee: (value: number | null) => void;
  initialInsuranceFeeBeforeDiscount: number | null;
  setInitialInsuranceFeeBeforeDiscount: (value: number | null) => void;
  riskMultiplier: number;
  setRiskMultiplier: (value: number) => void;
  getPolicyEndDate: (loanDueDateStr: string) => string; // Pass from parent
}

const coverageFees: { [key: number]: number } = {
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
    riskMultiplier,
    setRiskMultiplier,
    getPolicyEndDate,
  } = props;

  const [debouncedUsername, setDebouncedUsername] = useState("");
  const scoreData = useSignal<CreditScoreData | null>(null);
  const usernameError = useSignal<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedUsername(username.value), 100);
    return () => clearTimeout(timer);
  }, [username.value]);

  async function fetchScoreData(user: string) {
    try {
      const res = await fetch(`/api/score?username=${user}`);
      const data = await res.json();
      if (data.error) {
        scoreData.value = null;
        usernameError.value = data.error;
      } else {
        scoreData.value = data;
        setRiskMultiplier(data.riskMultiplier);
        usernameError.value = "";
      }
    } catch (err) {
      scoreData.value = null;
      usernameError.value = `Network/fetch error: ${
        typeof err === "object" && err !== null && "message" in err
          ? (err as { message: string }).message
          : String(err)
      }`;
    }
  }

  function resetScoreData() {
    scoreData.value = null;
    usernameError.value = "";
    setRiskMultiplier(0);
    setInsuranceFee(null); // Reset fee
    setInitialInsuranceFeeBeforeDiscount(null); // Reset initial fee
  }

  useEffect(() => {
    if (debouncedUsername) {
      fetchScoreData(debouncedUsername);
    } else {
      resetScoreData();
    }
  }, [debouncedUsername]);

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
        const response = await fetch("/api/validate-partner-code", {
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
      loanAmount.value <= 0 || !selectedCoverage.value || riskMultiplier === 0
    ) {
      setInsuranceFee(null);
      setInitialInsuranceFeeBeforeDiscount(null);
      return;
    }

    const coverageFee = coverageFees[selectedCoverage.value];

    let currentFee = (riskMultiplier * loanAmount.value) +
      (loanAmount.value * coverageFee);

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
    riskMultiplier,
    partnerCodeValid.value,
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
    selectedCoverage.value = null;
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
    loanDueDate.value = (e.target as HTMLInputElement).value;
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
    : 0; // Local copy for FinancialSummary

  return (
    <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
      <LoanInputSection
        username={username}
        debouncedUsername={debouncedUsername}
        inputRef={inputRef}
        handleUsernameInput={handleUsernameInput}
        error={usernameError}
        scoreData={scoreData}
        riskMultiplier={riskMultiplier}
        lenderUsername={lenderUsername}
        handleLenderUsernameInput={handleLenderUsernameInput}
        loanAmount={loanAmount}
        handleLoanInput={handleLoanInput}
      />

      <PolicyDetailsSection
        loanDueDate={loanDueDate}
        handleLoanDueDateInput={handleLoanDueDateInput}
        getPolicyEndDate={getPolicyEndDate}
        selectedCoverage={selectedCoverage}
        handleCoverageClick={handleCoverageClick}
        managramMessage={managramMessage}
        handleManagramMessageInput={handleManagramMessageInput}
        currentLoanAmount={currentLoanAmount}
        currentLenderFee={currentLenderFee}
        apiKey={apiKey}
        handleApiKeyInput={(
          e,
        ) => (apiKey.value = (e.target as HTMLInputElement).value)}
        partnerCodeInput={partnerCodeInput}
        handlePartnerCodeInput={handlePartnerCodeInput}
        isCodeChecking={isCodeChecking}
        partnerCodeMessage={partnerCodeMessage}
        partnerCodeValid={partnerCodeValid}
        lenderFeePercentage={lenderFeePercentage}
        handleLenderFeePercentageInput={handleLenderFeePercentageInput}
      />
      <div class="md:col-span-2">
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
        />
      </div>
    </div>
  );
}
