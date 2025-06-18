// utils/arbitrage_calculator.ts

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
  betOutcomeA: "YES" | "NO";
  betOutcomeB: "NO" | "YES";
}

export type CalcMode =
  | "balanced"
  | "oneSided"
  | "average"
  | "horseRace";

function getYesBetInfo(k: number, pInitial: number, pFinal: number) {
  if (pFinal <= pInitial) return { cost: 0, shares: 0 };
  const yInitial = Math.sqrt(k * (1 - pInitial) / pInitial);
  const nInitial = Math.sqrt(k * pInitial / (1 - pInitial));
  const yFinal = Math.sqrt(k * (1 - pFinal) / pFinal);
  const nFinal = Math.sqrt(k * pFinal / (1 - pFinal));
  const cost = nFinal - nInitial;
  const shares = yInitial - yFinal;
  return { cost, shares };
}

function getNoBetInfo(k: number, pInitial: number, pFinal: number) {
  if (pFinal >= pInitial) return { cost: 0, shares: 0 };
  const yInitial = Math.sqrt(k * (1 - pInitial) / pInitial);
  const nInitial = Math.sqrt(k * pInitial / (1 - pInitial));
  const yFinal = Math.sqrt(k * (1 - pFinal) / pFinal);
  const nFinal = Math.sqrt(k * pFinal / (1 - pFinal));
  const cost = yFinal - yInitial;
  const shares = nInitial - nFinal;
  return { cost, shares };
}

export function calculateArbitrage(
  marketA: MarketData,
  marketB: MarketData,
  mode: CalcMode,
): { result: ArbitrageCalculation | null; error: string | null } {
  if (
    marketA.outcomeType !== "BINARY" || marketB.outcomeType !== "BINARY" ||
    !marketA.pool || !marketB.pool || marketA.probability === undefined ||
    marketB.probability === undefined
  ) {
    return { result: null, error: "Both markets must be BINARY" };
  }

  if (
    marketA.pool.YES <= 0 || marketA.pool.NO <= 0 ||
    marketB.pool.YES <= 0 || marketB.pool.NO <= 0
  ) {
    return {
      result: null,
      error:
        "Market pools must be positive for accurate calculations: Try markets with more liquidity",
    };
  }

  switch (mode) {
    case "balanced":
      return calculateBalanced(marketA, marketB);
    case "horseRace":
      return calculateHorseRace(marketA, marketB);
    case "oneSided":
      return calculateOneSided(marketA, marketB);
    case "average":
      return calculateAverage(marketA, marketB);
    default:
      // This default case handles any potential future CalcMode values that
      // are not explicitly handled by a case.
      return { result: null, error: `Invalid calculation mode: ${mode}` };
  }
}

function calculateBalanced(
  marketA: MarketData,
  marketB: MarketData,
): { result: ArbitrageCalculation | null; error: string | null } {
  const kA = marketA.pool!.YES * marketA.pool!.NO;
  const kB = marketB.pool!.YES * marketB.pool!.NO;
  const pA = marketA.probability!;
  const pB = marketB.probability!;

  if (pA >= pB) {
    return {
      result: {
        marketA,
        marketB,
        betAmountA: 0,
        betAmountB: 0,
        profit: 0,
        newProbability: (pA + pB) / 2,
        betOutcomeA: "YES",
        betOutcomeB: "NO",
      },
      error: `For 'balanced' mode, Market A probability (${
        (pA * 100).toFixed(1)
      }%) must be lower than Market B probability (${
        (pB * 100).toFixed(1)
      }%) for a meaningful calculation`,
    };
  }

  let low = pA, high = pB;

  const calcCurrentProfit = (p: number) => {
    const betA = getYesBetInfo(kA, pA, p);
    const betB = getNoBetInfo(kB, pB, p);
    const shares = Math.min(betA.shares, betB.shares);
    const profit = shares - (betA.cost + betB.cost);
    return { profit, betA, betB, shares };
  };

  for (let i = 0; i < 100; i++) {
    const pMid = (low + high) / 2;
    if (pMid <= low || pMid >= high) break;

    const { profit: currentIterationProfit } = calcCurrentProfit(pMid);

    const pTestHigher = (pMid + high) / 2;
    const { profit: testProfitHigher } = calcCurrentProfit(pTestHigher);

    if (testProfitHigher > currentIterationProfit) {
      low = pMid;
    } else {
      high = pMid;
    }
  }

  const finalPOptimal = (low + high) / 2;
  const {
    profit: finalProfit,
    betA: finalBetA,
    betB: finalBetB,
  } = calcCurrentProfit(finalPOptimal);

  let errorMessage: string | null = null;
  if (finalProfit <= 0.01) {
    errorMessage =
      `No profitable balanced arbitrage opportunity found: Profit M${
        finalProfit.toFixed(2)
      }`;
  }

  return {
    result: {
      marketA,
      marketB,
      betAmountA: finalBetA.cost,
      betAmountB: finalBetB.cost,
      profit: finalProfit,
      newProbability: finalPOptimal,
      betOutcomeA: "YES",
      betOutcomeB: "NO",
    },
    error: errorMessage,
  };
}

function calculateHorseRace(
  marketA: MarketData,
  marketB: MarketData,
): { result: ArbitrageCalculation | null; error: string | null } {
  const kA = marketA.pool!.YES * marketA.pool!.NO;
  const kB = marketB.pool!.YES * marketB.pool!.NO;
  const pA = marketA.probability!;
  const pB = marketB.probability!;

  if (pA + pB <= 1) {
    return {
      result: null,
      error: "Horse Race mode requires combined YES probability > 100%",
    };
  }

  let low = 0, high = 1, pTargetA = 0.5;
  for (let i = 0; i < 100; i++) {
    pTargetA = (low + high) / 2;
    const pTargetB = 1 - pTargetA;
    if (pTargetA >= pA || pTargetB >= pB) {
      high = pTargetA;
      continue;
    }
    const { cost: costA, shares: sharesA } = getNoBetInfo(kA, pA, pTargetA);
    const { cost: costB, shares: sharesB } = getNoBetInfo(kB, pB, pTargetB);
    if (sharesB - costA > sharesA - costB) high = pTargetA;
    else low = pTargetA;
  }
  const pTargetB = 1 - pTargetA;
  const { cost: finalCostA } = getNoBetInfo(kA, pA, pTargetA);
  const { cost: finalCostB, shares: finalSharesB } = getNoBetInfo(
    kB,
    pB,
    pTargetB,
  );
  const profit = finalSharesB - finalCostA;

  if (profit <= 0.01) {
    return { result: null, error: "No profitable arbitrage opportunity found" };
  }

  return {
    result: {
      marketA,
      marketB,
      betAmountA: finalCostA,
      betAmountB: finalCostB,
      profit,
      newProbabilityA: pTargetA,
      newProbabilityB: pTargetB,
      betOutcomeA: "NO",
      betOutcomeB: "NO",
    },
    error: null,
  };
}

function calculateOneSided(
  marketA: MarketData,
  marketB: MarketData,
): { result: ArbitrageCalculation | null; error: string | null } {
  const kA = marketA.pool!.YES * marketA.pool!.NO;
  const kB = marketB.pool!.YES * marketB.pool!.NO;
  const pA = marketA.probability!;
  const pB = marketB.probability!;

  if (pA >= pB) {
    return {
      result: {
        marketA,
        marketB,
        betAmountA: 0,
        betAmountB: 0,
        profit: 0,
        newProbability: (pA + pB) / 2,
        betOutcomeA: "YES",
        betOutcomeB: "NO",
      },
      error: `For 'oneSided' mode, Market A probability (${
        (pA * 100).toFixed(1)
      }%) must be lower than Market B probability (${
        (pB * 100).toFixed(1)
      }%) for a meaningful calculation`,
    };
  }

  let low = pA, high = pB;
  let pTarget = (low + high) / 2;
  let bestProfit = -Infinity;
  let bestBetA = 0;
  let bestBetB = 0;

  for (let i = 0; i < 100; i++) {
    pTarget = (low + high) / 2;
    if (pTarget <= low || pTarget >= high) break;

    const { cost: costAYes, shares: sharesAYes } = getYesBetInfo(
      kA,
      pA,
      pTarget,
    );
    const { cost: costBNo } = getNoBetInfo(kB, pB, pTarget);
    const currentProfit = sharesAYes - costBNo;

    if (currentProfit > bestProfit) {
      bestProfit = currentProfit;
      bestBetA = costAYes;
      bestBetB = costBNo;
    }

    const pTestHigher = (pTarget + high) / 2;
    const { shares: testSharesAYes } = getYesBetInfo(kA, pA, pTestHigher);
    const { cost: testCostBNo } = getNoBetInfo(kB, pB, pTestHigher);
    const testProfit = testSharesAYes - testCostBNo;

    if (testProfit > currentProfit) {
      low = pTarget;
    } else {
      high = pTarget;
    }
  }

  let errorMessage: string | null = null;
  if (bestProfit <= 0.01) {
    errorMessage =
      `No profitable oneSided arbitrage opportunity found: Profit M${
        bestProfit.toFixed(2)
      }`;
  }

  return {
    result: {
      marketA,
      marketB,
      betAmountA: bestBetA,
      betAmountB: bestBetB,
      profit: bestProfit,
      newProbability: pTarget,
      betOutcomeA: "YES",
      betOutcomeB: "NO",
    },
    error: errorMessage,
  };
}

function calculateAverage(
  marketA: MarketData,
  marketB: MarketData,
): { result: ArbitrageCalculation | null; error: string | null } {
  const kA = marketA.pool!.YES * marketA.pool!.NO;
  const kB = marketB.pool!.YES * marketB.pool!.NO;
  const pA = marketA.probability!;
  const pB = marketB.probability!;

  if (pA >= pB) {
    return {
      result: {
        marketA,
        marketB,
        betAmountA: 0,
        betAmountB: 0,
        profit: 0,
        newProbability: (pA + pB) / 2,
        betOutcomeA: "YES",
        betOutcomeB: "NO",
      },
      error: `For 'average' mode, Market A probability (${
        (pA * 100).toFixed(1)
      }%) must be lower than Market B probability (${
        (pB * 100).toFixed(1)
      }%) for a meaningful calculation`,
    };
  }

  const pTarget = (pA + pB) / 2;
  const { cost: finalBetA, shares: finalSharesA } = getYesBetInfo(
    kA,
    pA,
    pTarget,
  );
  const { cost: finalBetB, shares: finalSharesB } = getNoBetInfo(
    kB,
    pB,
    pTarget,
  );
  const shares = Math.min(finalSharesA, finalSharesB);
  const profit = shares - (finalBetA + finalBetB);

  let errorMessage: string | null = null;
  if (profit <= 0.01) {
    errorMessage =
      `No profitable average arbitrage opportunity found: Profit M${
        profit.toFixed(2)
      }`;
  }

  return {
    result: {
      marketA,
      marketB,
      betAmountA: finalBetA,
      betAmountB: finalBetB,
      profit,
      newProbability: pTarget,
      betOutcomeA: "YES",
      betOutcomeB: "NO",
    },
    error: errorMessage,
  };
}
