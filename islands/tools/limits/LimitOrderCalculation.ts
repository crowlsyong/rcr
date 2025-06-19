// islands/tools/limits/LimitOrderCalculation.ts

interface AdvancedPoint {
  percentage: number;
  amount: number;
}

interface OrderCalculationParams {
  lowerProbability: number;
  upperProbability: number;
  totalBetAmount: number;
  isVolatilityBet: boolean;
  granularity: number;
  advancedPoints?: AdvancedPoint[] | null;
}

interface CalculatedOrder {
  yesAmount: number;
  noAmount: number;
  yesProb: number;
  noProb: number;
  shares: number;
}

interface CalculationOutput {
  orders: CalculatedOrder[];
  totalShares: number;
}

export function calculateOrderDistribution(
  params: OrderCalculationParams,
): CalculationOutput {
  const {
    lowerProbability,
    upperProbability,
    totalBetAmount,
    isVolatilityBet,
    granularity,
    advancedPoints,
  } = params;

  const calculatedOrders: CalculatedOrder[] = [];
  let totalShares = 0;

  if (isVolatilityBet) {
    if (advancedPoints && advancedPoints.length > 0) {
      for (const point of advancedPoints) {
        if (point.amount <= 0) continue;

        const budgetForPair = point.amount;
        const yesProb = point.percentage / 100;
        const noProb = 1 - yesProb;

        const denominator = yesProb + (1 - noProb);
        if (denominator <= 0) continue;

        const shares = budgetForPair / denominator;
        const yesAmount = shares * yesProb;
        const noAmount = shares * (1 - noProb);

        if (Math.round(yesAmount) >= 1 && Math.round(noAmount) >= 1) {
          calculatedOrders.push({
            yesAmount: Math.round(yesAmount),
            noAmount: Math.round(noAmount),
            yesProb: yesProb,
            noProb: noProb,
            shares: Math.round(shares),
          });
          totalShares += Math.round(shares);
        }
      }
      calculatedOrders.sort((a, b) => (a.yesProb < b.yesProb ? 1 : -1));
    } else {
      const step = granularity / 100;
      const orderPairsData = [];

      for (
        let currentPLower = lowerProbability, currentPUpper = upperProbability;
        currentPLower < currentPUpper;
        currentPLower += step, currentPUpper -= step
      ) {
        const denominator = currentPLower + (1 - currentPUpper);
        if (denominator <= 0) continue;

        const sharesPerMana = 1 / denominator;
        orderPairsData.push({
          yesProb: currentPLower,
          noProb: currentPUpper,
          sharesPerMana: sharesPerMana,
        });
      }

      if (orderPairsData.length === 0) {
        return { orders: [], totalShares: 0 };
      }

      orderPairsData.reverse();

      const numPairs = orderPairsData.length;
      const weights = Array.from({ length: numPairs }, (_, i) => numPairs - i);
      const totalWeight = weights.reduce((sum, w) => sum + w, 0);

      for (let i = 0; i < numPairs; i++) {
        const budgetPortion = (totalBetAmount * weights[i]) / totalWeight;
        const { yesProb, noProb, sharesPerMana } = orderPairsData[i];

        const shares = budgetPortion * sharesPerMana;
        const yesAmount = shares * yesProb;
        const noAmount = shares * (1 - noProb);

        if (Math.round(yesAmount) >= 1 && Math.round(noAmount) >= 1) {
          calculatedOrders.push({
            yesAmount: Math.round(yesAmount),
            noAmount: Math.round(noAmount),
            yesProb: yesProb,
            noProb: noProb,
            shares: Math.round(shares),
          });
          totalShares += Math.round(shares);
        }
      }
      calculatedOrders.sort((a, b) => (a.yesProb < b.yesProb ? 1 : -1));
    }
  } else {
    const denominator = lowerProbability + (1 - upperProbability);
    if (denominator <= 0) {
      return { orders: [], totalShares: 0 };
    }
    const sharesAcquired = totalBetAmount / denominator;
    const yesAmount = sharesAcquired * lowerProbability;
    const noAmount = sharesAcquired * (1 - upperProbability);

    if (Math.round(yesAmount) >= 1 && Math.round(noAmount) >= 1) {
      calculatedOrders.push({
        yesAmount: Math.round(yesAmount),
        noAmount: Math.round(noAmount),
        yesProb: lowerProbability,
        noProb: upperProbability,
        shares: Math.round(sharesAcquired),
      });
      totalShares = Math.round(sharesAcquired);
    }
  }

  return {
    orders: calculatedOrders,
    totalShares: totalShares,
  };
}
