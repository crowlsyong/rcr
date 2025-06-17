import { MarketData } from "./api/manifold_types.ts";

export interface ArbitrageCalculation {
  marketA: MarketData;
  marketB: MarketData;
  betAmountA: number;
  betAmountB: number;
  profit: number;
  newProbability: number;
}

export function calculateArbitrage(
  marketA: MarketData,
  marketB: MarketData,
  mode: "equilibrium" | "average",
): { result: ArbitrageCalculation | null; error: string | null } {
  if (
    marketA.outcomeType !== "BINARY" || marketB.outcomeType !== "BINARY" ||
    !marketA.pool || !marketB.pool || marketA.probability === undefined ||
    marketB.probability === undefined
  ) {
    return { result: null, error: "Both markets must be BINARY" };
  }

  const pA = marketA.probability;
  const pB_inv = 1 - marketB.probability;

  if (pA >= pB_inv) {
    return {
      result: null,
      error: `No arbitrage opportunity: Market A's probability (${
        (pA * 100).toFixed(1)
      }%) must be less than the inverse of Market B's probability (${
        (pB_inv * 100).toFixed(1)
      }%)`,
    };
  }

  const kA = marketA.pool.YES * marketA.pool.NO;
  const kB = marketB.pool.YES * marketB.pool.NO;

  let p_target: number;

  if (mode === "equilibrium") {
    let low = pA;
    let high = pB_inv;
    p_target = (low + high) / 2;

    for (let i = 0; i < 100; i++) {
      p_target = (low + high) / 2;
      if (p_target <= low || p_target >= high) break;

      const costA = Math.sqrt(kA * p_target / (1 - p_target)) -
        marketA.pool.NO;
      const sharesA = marketA.pool.YES -
        Math.sqrt(kA * (1 - p_target) / p_target);
      const costB = Math.sqrt(kB * p_target / (1 - p_target)) -
        marketB.pool.YES;
      const sharesB = marketB.pool.NO -
        Math.sqrt(kB * (1 - p_target) / p_target);

      if (costA < 0 || costB < 0 || sharesA < 0 || sharesB < 0) {
        return {
          result: null,
          error: "Invalid intermediate calculation: Negative value detected",
        };
      }

      const profitIfYes = sharesA - costB;
      const profitIfNo = sharesB - costA;

      if (profitIfYes > profitIfNo) {
        low = p_target;
      } else {
        high = p_target;
      }
    }
  } else {
    p_target = (pA + pB_inv) / 2;
  }

  const finalCostA = Math.sqrt(kA * p_target / (1 - p_target)) -
    marketA.pool.NO;
  const finalSharesA = marketA.pool.YES -
    Math.sqrt(kA * (1 - p_target) / p_target);
  const finalCostB = Math.sqrt(kB * p_target / (1 - p_target)) -
    marketB.pool.YES;
  const finalProfit = finalSharesA - finalCostB;

  if (finalCostA <= 0.01 || finalCostB <= 0.01 || finalProfit <= 0.01) {
    return {
      result: null,
      error: "No profitable arbitrage opportunity found for this mode",
    };
  }

  return {
    result: {
      marketA,
      marketB,
      betAmountA: finalCostA,
      betAmountB: finalCostB,
      profit: finalProfit,
      newProbability: p_target,
    },
    error: null,
  };
}
