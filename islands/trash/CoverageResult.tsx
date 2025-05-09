// Function to calculate the Insurance Fee
function calculateInsuranceFee(
  coverage: number,
  loanAmount: number,
  riskMultiplier: number,
): number {
  return coverage * loanAmount * riskMultiplier;
}

interface CoverageResultProps {
  loanAmount: number;
  riskMultiplier: number;
  coverageOption: number; // Percentage (e.g., 0.25 for 25%)
}

export default function CoverageResult({
  loanAmount,
  riskMultiplier,
  coverageOption,
}: CoverageResultProps) {
  // Calculate the insurance fee
  const insuranceFee = calculateInsuranceFee(
    coverageOption,
    loanAmount,
    riskMultiplier,
  );

  return (
    <div class="block p-6 rounded-lg bg-gray-800 text-white">
      <h2 class="text-xl font-semibold mb-4">Insurance Coverage Details</h2>

      {/* Coverage Option */}
      <p class="text-lg mb-2">
        Coverage Option: {coverageOption * 100}% of the loan amount
      </p>

      {/* Loan Amount */}
      <p class="text-lg mb-2">
        Loan Amount: ${loanAmount.toLocaleString()}
      </p>

      {/* Risk Multiplier */}
      <p class="text-lg mb-2">
        Risk Multiplier: {riskMultiplier}
      </p>

      {/* Insurance Fee */}
      <p class="text-2xl font-bold mt-4">
        Insurance Fee: ${insuranceFee.toFixed(2)}
      </p>
    </div>
  );
}
