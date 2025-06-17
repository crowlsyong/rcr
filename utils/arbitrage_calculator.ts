import { MarketData } from "./api/manifold_types.ts";

export interface ArbitrageCalculation {
  marketA: MarketData;
  marketB: MarketData;
  betAmountA: number;
  betAmountB: number;
  profit: number;
  newProbability?: number;
  newProbabilityA?: number;
  newProbabilityB?: number;
}

const getYesBetInfo = (k: number, p_initial: number, p_final: number) => {
  const y_initial = Math.sqrt(k * (1 - p_initial) / p_initial);
  const n_initial = Math.sqrt(k * p_initial / (1 - p_initial));
  const y_final = Math.sqrt(k * (1 - p_final) / p_final);
  const n_final = Math.sqrt(k * p_final / (1 - p_final));
  const cost = n_final - n_initial;
  const shares = y_initial - y_final;
  return { cost, shares };
};

const getNoBetInfo = (k: number, p_initial: number, p_final: number) => {
  const y_initial = Math.sqrt(k * (1 - p_initial) / p_initial);
  const n_initial = Math.sqrt(k * p_initial / (1 - p_initial));
  const y_final = Math.sqrt(k * (1 - p_final) / p_final);
  const n_final = Math.sqrt(k * p_final / (1 - p_final));
  const cost = y_final - y_initial;
  const shares = n_initial - n_final;
  return { cost, shares };
};

export function calculateArbitrage(
  marketA: MarketData,
  marketB: MarketData,
  mode: "classic" | "equilibrium" | "average" | "horseRace",
): { result: ArbitrageCalculation | null; error: string | null } {
  if (
    marketA.outcomeType !== "BINARY" || marketB.outcomeType !== "BINARY" ||
    !marketA.pool || !marketB.pool || marketA.probability === undefined ||
    marketB.probability === undefined
  ) {
    return { result: null, error: "Both markets must be BINARY" };
  }

  const kA = marketA.pool.YES * marketA.pool.NO;
  const kB = marketB.pool.YES * marketB.pool.NO;
  const pA = marketA.probability;
  const pB = marketB.probability;

  if (mode === "horseRace") {
    if (pA + pB <= 1) {
      return {
        result: null,
        error: "Horse Race: Probabilities must sum to more than 100%",
      };
    }
    let low = 0, high = 1, p_target_A = 0.5;
    for (let i = 0; i < 100; i++) {
      p_target_A = (low + high) / 2;
      const p_target_B = 1 - p_target_A;
      if (p_target_A >= pA || p_target_B >= pB) {
        high = p_target_A;
        continue;
      }
      const { cost: costA, shares: sharesA } = getNoBetInfo(kA, pA, p_target_A);
      const { cost: costB, shares: sharesB } = getNoBetInfo(kB, pB, p_target_B);
      if (sharesB - costA > sharesA - costB) high = p_target_A;
      else low = p_target_A;
    }
    const p_target_B = 1 - p_target_A;
    const { cost: finalCostA } = getNoBetInfo(kA, pA, p_target_A);
    const { cost: finalCostB, shares: finalSharesB } = getNoBetInfo(
      kB,
      pB,
      p_target_B,
    );
    const profit = finalSharesB - finalCostA;
    return {
      result: {
        marketA,
        marketB,
        betAmountA: finalCostA,
        betAmountB: finalCostB,
        profit,
        newProbabilityA: p_target_A,
        newProbabilityB: p_target_B,
      },
      error: null,
    };
  }

  if (pA >= pB) {
    return {
      result: null,
      error: "Market A probability must be lower than Market B",
    };
  }

  let p_target: number;
  if (mode === "equilibrium") {
    let low = pA, high = pB;
    p_target = (low + high) / 2;
    for (let i = 0; i < 100; i++) {
      p_target = (low + high) / 2;
      if (p_target <= low || p_target >= high) break;
      const { cost: costA, shares: sharesA } = getYesBetInfo(kA, pA, p_target);
      const { cost: costB, shares: sharesB } = getNoBetInfo(kB, pB, p_target);
      if (sharesA - costB > sharesB - costA) low = p_target;
      else high = p_target;
    }
  } else {
    p_target = (pA + pB) / 2;
  }

  const { cost: finalBetA, shares: finalSharesA } = getYesBetInfo(
    kA,
    pA,
    p_target,
  );
  const { cost: finalBetB } = getNoBetInfo(kB, pB, p_target);
  const finalProfit = finalSharesA - finalBetB;

  if (
    (mode !== "classic" &&
      (finalBetA <= 0.01 || finalBetB <= 0.01 || finalProfit <= 0.01))
  ) {
    return { result: null, error: "No profitable arbitrage opportunity found" };
  }

  return {
    result: {
      marketA,
      marketB,
      betAmountA: finalBetA,
      betAmountB: finalBetB,
      profit: finalProfit,
      newProbability: p_target,
    },
    error: null,
  };
}
