// islands/tools/limits/LimitOrderValidation.ts
interface ValidationParams {
  marketUrlInput: string;
  lowerProbabilityInput: number;
  upperProbabilityInput: number;
  totalBetAmountInput: number;
  isVolatilityBet: boolean;
  granularityInput: number;
}

export function validateInputs(params: ValidationParams): string | null {
  const {
    marketUrlInput,
    lowerProbabilityInput,
    upperProbabilityInput,
    totalBetAmountInput,
    isVolatilityBet,
    granularityInput,
  } = params;

  if (!marketUrlInput) {
    return "Market URL is required";
  }
  if (
    isNaN(lowerProbabilityInput) || isNaN(upperProbabilityInput) ||
    isNaN(totalBetAmountInput)
  ) {
    return "All numeric inputs must be valid numbers";
  }
  if (totalBetAmountInput <= 0) {
    return "Total bet amount must be greater than zero";
  }
  if (
    lowerProbabilityInput < 0 || lowerProbabilityInput > 100 ||
    upperProbabilityInput < 0 || upperProbabilityInput > 100
  ) {
    return "Probabilities must be between 0 and 100";
  }
  if (lowerProbabilityInput >= upperProbabilityInput) {
    return "Lower probability must be less than upper probability";
  }
  if (isVolatilityBet && (granularityInput <= 0 || granularityInput > 10)) {
    return "Granularity must be between 1% and 10%";
  }

  const pLower = lowerProbabilityInput / 100;
  const pUpper = upperProbabilityInput / 100;

  if (pLower <= 0 || pUpper >= 1) {
    return "Probabilities cannot be 0% or 100%. Please choose a range within (0%, 100%)";
  }

  if (isVolatilityBet) {
    const step = granularityInput / 100;
    if (pUpper - pLower < 2 * step) {
      const rangeWidth = (upperProbabilityInput - lowerProbabilityInput)
        .toFixed(1);
      const requiredWidth = granularityInput * 2;
      return `The ${rangeWidth}% range (${lowerProbabilityInput}% to ${upperProbabilityInput}%) is too narrow for a ${granularityInput}% step size. The range must be at least ${requiredWidth}% wide.`;
    }
  }

  return null;
}
