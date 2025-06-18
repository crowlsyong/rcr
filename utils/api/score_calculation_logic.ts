// utils/api/score_calculation_logic.ts

import { ManaPaymentTransaction } from "./manifold_types.ts";

// Calculate net loan balance (focusing only on outstanding debt)
export function calculateNetLoanBalance(
  userId: string,
  transactions: ManaPaymentTransaction[],
  manifoldUserId: string,
): number {
  const loanBalancesPerUser: { [otherUserId: string]: number } = {};

  for (const txn of transactions) {
    if (txn.fromId === manifoldUserId || txn.toId === manifoldUserId) {
      continue;
    }

    if (
      txn.category === "MANA_PAYMENT" && txn.fromType === "USER" &&
      txn.toType === "USER"
    ) {
      if (txn.toId === userId) {
        const lenderId = txn.fromId;
        loanBalancesPerUser[lenderId] = (loanBalancesPerUser[lenderId] || 0) -
          txn.amount;
      } else if (txn.fromId === userId) {
        const recipientId = txn.toId;
        loanBalancesPerUser[recipientId] =
          (loanBalancesPerUser[recipientId] || 0) + txn.amount;
      }
    }
  }

  let loanImpact = 0;
  for (const otherUserId in loanBalancesPerUser) {
    if (loanBalancesPerUser[otherUserId] < 0) {
      loanImpact += loanBalancesPerUser[otherUserId];
    }
  }

  return loanImpact;
}

// Compute raw MMR score based on weighted factors
export function computeMMR(
  balance: number,
  calculatedProfit: number,
  ageDays: number,
  rank: number,
  transactionCount: number,
  netLoanBalance: number,
  maxRank = 100,
): number {
  const rankWeight = Math.max(0, Math.min(1, 1 - (rank - 1) / (maxRank - 1)));
  const rankMMR = rankWeight * 1000;

  let transactionMMR = 0;

  if (transactionCount < 5) {
    transactionMMR = -1000000;
  } else if (transactionCount <= 20) {
    const t = (transactionCount - 5) / 15;
    transactionMMR = -100000 + t * 90000;
  } else if (transactionCount <= 100) {
    const t = (transactionCount - 20) / 80;
    transactionMMR = -10000 + t * 10000;
  } else if (transactionCount <= 1000) {
    const t = (transactionCount - 100) / 900;
    transactionMMR = t * 1000;
  } else {
    transactionMMR = 1000;
  }

  // Weights
  const balanceWeight = 0.1;
  const outstandingLoanImpactWeight = .15; // 2025-06-17 this was adjusted to from .25 to .15
  const calculatedProfitWeight = 0.5; // 2025-06-17 this was adjusted to from .4 to .4
  const ageDaysWeight = 0.05;
  const transactionMMRWeight = 0.1;
  const rankMMRWeight = 0.1;

  return ((balance * balanceWeight) +
    (netLoanBalance * outstandingLoanImpactWeight) +
    (calculatedProfit * calculatedProfitWeight) + (ageDays * ageDaysWeight)) +
    (rankMMR * rankMMRWeight) +
    (transactionMMR * transactionMMRWeight);
}

export function mapToCreditScore(mmrValue: number): number {
  const minMMR = -500000;
  const maxMMR = 2000000;

  const transform = (x: number) => {
    const sign = x < 0 ? -1 : 1;
    return sign * Math.log10(1 + Math.abs(x));
  };

  const transformedMin = transform(minMMR);
  const transformedMax = transform(maxMMR);
  const transformedValue = transform(mmrValue);

  const normalized = (transformedValue - transformedMin) /
    (transformedMax - transformedMin);
  const score = normalized * 1000;

  return Math.round(Math.max(0, Math.min(1000, score)));
}

export function calculateRiskMultiplier(score: number): number {
  const clampedScore = Math.max(0, Math.min(score, 1000));

  if (clampedScore >= 900) return 0.02;
  if (clampedScore >= 800) return 0.03;
  if (clampedScore >= 700) return 0.05;
  if (clampedScore >= 600) return 0.07;
  if (clampedScore >= 500) return 0.10;
  if (clampedScore >= 400) return 0.14;
  if (clampedScore >= 300) return 0.25;
  if (clampedScore >= 200) return 0.60;
  if (clampedScore >= 100) return 1.00;
  return 1.60;
}
