// utils/api/insurance_calculator_logic.ts
import {
  addBounty,
  fetchUserData,
  fetchUserPortfolio,
  fetchManaAndRecentRank,
  fetchTransactionCount,
  fetchLoanTransactions,
  postComment,
  sendManagram,
} from "./manifold_api_service.ts";
import {
  calculateNetLoanBalance,
  calculateriskBaseFee,
  computeMMR,
  mapToCreditScore,
} from "./score_calculation_logic.ts";
import { ManaPaymentTransaction } from "./manifold_types.ts";

const MANIFOLD_USER_ID = "IPTOzEqrpkWmEzh6hwvAyY9PqFb2";
const INSURANCE_MARKET_ID = "QEytQ5ch0P";
const CONTACT_USERNAME = "crowlsyong";
const INSTITUTION_MARKETS = {
  IMF: { id: "PdLcZARORc", name: "IMF" },
  BANK: { id: "tqQIAgd6EZ", name: "BANK" },
  RISK: { id: "QEytQ5ch0P", name: "RISK" },
};

// --- Interfaces for structured data ---

export interface InsuranceFeeDetails {
  riskFee: number;
  coverageFee: number;
  durationFee: number;
  totalInitialFee: number;
  discountApplied: boolean;
  discountAmount: number;
  finalFee: number;
}

export interface UserScoreProfile {
  username: string;
  userId: string;
  creditScore: number;
  riskBaseFee: number;
  avatarUrl: string | null;
  userExists: boolean;
  userDeleted: boolean;
}

export interface InsuranceCalculationResult {
  success: boolean;
  error?: string;
  borrowerProfile?: UserScoreProfile;
  lenderProfile?: Pick<
    UserScoreProfile,
    "username" | "userId" | "userExists" | "userDeleted"
  >;
  feeDetails?: InsuranceFeeDetails;
  lenderFeeMana?: number;
  loanAmount?: number;
  coverage?: number;
  dueDate?: string;
}

export interface TransactionExecutionResult {
  success: boolean;
  message?: string; // Made optional
  error?: string;
  loanTransactionId?: string;
  insuranceTransactionId?: string;
  receiptCommentId?: string;
  marketUrl?: string;
}

// --- Helper Functions ---

async function getUserScoreProfile(username: string): Promise<UserScoreProfile> {
  const { userData, fetchSuccess, userDeleted } = await fetchUserData(username);

  if (!fetchSuccess || !userData) {
    return {
      username,
      userId: "",
      creditScore: 0,
      riskBaseFee: 1.60,
      avatarUrl: null,
      userExists: false,
      userDeleted: !!userDeleted,
    };
  }

  const userId = userData.id;
  const createdTime = userData.createdTime ?? Date.now();
  const ageDays = (Date.now() - createdTime) / 86_400_000;

  const [
    portfolioFetch,
    rankData,
    transactionData,
    loanData,
  ] = await Promise.all([
    fetchUserPortfolio(userId),
    fetchManaAndRecentRank(userId),
    fetchTransactionCount(username),
    fetchLoanTransactions(userId),
  ]);

  if (!portfolioFetch.success || !portfolioFetch.portfolio) {
    throw new Error(`Failed to fetch portfolio for '${username}'.`);
  }

  const outstandingDebtImpact = calculateNetLoanBalance(
    userId,
    loanData.transactions,
    MANIFOLD_USER_ID,
  );
  const calculatedProfit = portfolioFetch.portfolio.investmentValue +
    portfolioFetch.portfolio.balance - portfolioFetch.portfolio.totalDeposits;
  const rawMMR = computeMMR(
    portfolioFetch.portfolio.balance,
    calculatedProfit,
    ageDays,
    rankData.latestRank ?? 100,
    transactionData.count,
    outstandingDebtImpact,
  );
  const creditScore = mapToCreditScore(rawMMR);
  const riskBaseFee = calculateriskBaseFee(creditScore);

  return {
    username: userData.username,
    userId: userData.id,
    creditScore,
    riskBaseFee,
    avatarUrl: userData.avatarUrl || null,
    userExists: true,
    userDeleted: !!userData.userDeleted,
  };
}

function calculateDurationFee(loanAmount: number, dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const loanDueDate = new Date(dueDate + "T00:00:00");
  const days = Math.ceil(
    (loanDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (days <= 0) return 0;

  const a = 0.00001379;
  const b = 1.5;
  const percentage = Math.min(a * Math.pow(days, b), 0.50);
  return Math.ceil(loanAmount * percentage);
}

function getCoverageFee(loanAmount: number, coverage: number): number {
  const coverageFees: { [key: number]: number } = {
    25: 0.02,
    50: 0.05,
    75: 0.08,
    100: 0.12,
  };
  const feeMultiplier = coverageFees[coverage] || 0;
  return loanAmount * feeMultiplier;
}

function validatePartnerCode(code?: string): boolean {
  if (!code) return false;
  const validCodesStr = Deno.env.get("PARTNER_CODES") || "";
  const validCodes = new Set(
    validCodesStr.split(",").map((c) => c.trim().toUpperCase()).filter(Boolean),
  );
  return validCodes.has(code.toUpperCase());
}

function generateReceiptMessage(
  details: {
    loanTxId: string;
    insuranceTxId: string;
    coverage: number;
    lenderUsername: string;
    borrowerUsername: string;
    loanAmount: number;
    loanDueDate: string;
    riskBaseFee: number;
    durationFee: number;
    finalInsuranceFee: number;
    discountApplied: boolean;
  },
): string {
  const policyEndDate = new Date(details.loanDueDate + "T00:00:00");
  policyEndDate.setDate(policyEndDate.getDate() + 7);
  const policyEndDateStr = policyEndDate.toISOString().split("T")[0];

  const coverageFees: { [key: number]: number } = {
    25: 0.02,
    50: 0.05,
    75: 0.08,
    100: 0.12,
  };
  const formattedCoverageFee = `${coverageFees[details.coverage] * 100}%`;
  const discountLine = details.discountApplied
    ? "\nDiscount Code Applied: 25%"
    : "";

  return `# 🦝RISK Insurance Receipt
### Summary
Transaction ID (Loan): ${details.loanTxId}
Transaction ID (Insurance Fee): ${details.insuranceTxId}
Coverage: C${details.coverage}
Lender: @${details.lenderUsername}
Borrower: @${details.borrowerUsername}
Loan Amount: Ṁ${details.loanAmount}
Date of Policy Start: ${new Date().toISOString().split("T")[0]}
Loan Due Date: ${details.loanDueDate}
Policy Ends: ${policyEndDateStr}
### Fees
Base Fee (risk multiplier): ${details.riskBaseFee * 100}%
Coverage Fee: ${formattedCoverageFee}
Duration Fee: Ṁ${details.durationFee}
${discountLine}
Total Fee (to RISK): Ṁ${Math.round(details.finalInsuranceFee)}
### Terms
By using this service, you agree to The Fine Print at the very bottom of our dashboard. 60% refund may be available if borrower repays on time and in full. No refund if borrower defaults, but insurance will cover the policy amount.
---
Have questions or need to activate coverage? Message @${CONTACT_USERNAME} and we’ll walk you through it.
Risk Free 🦝RISK Fee Guarantee™️
🦝RISK: Recovery Loan Insurance Kiosk`;
}

// --- Main Exported Functions ---

export async function calculateInsuranceDetails(
  params: {
    borrowerUsername: string;
    lenderUsername: string;
    loanAmount: number;
    coverage: number;
    dueDate: string;
    partnerCode?: string;
    lenderFee?: number;
  },
): Promise<InsuranceCalculationResult> {
  try {
    const [borrowerProfile, lenderData] = await Promise.all([
      getUserScoreProfile(params.borrowerUsername),
      fetchUserData(params.lenderUsername),
    ]);

    if (!borrowerProfile.userExists || borrowerProfile.userDeleted) {
      return { success: false, error: "Borrower not found or is deleted" };
    }
    if (
      !lenderData.fetchSuccess || !lenderData.userData || lenderData.userDeleted
    ) {
      return { success: false, error: "Lender not found or is deleted" };
    }

    const lenderProfile = {
      username: lenderData.userData.username,
      userId: lenderData.userData.id,
      userExists: true,
      userDeleted: false,
    };

    const riskFee = params.loanAmount * borrowerProfile.riskBaseFee;
    const coverageFee = getCoverageFee(params.loanAmount, params.coverage);
    const durationFee = calculateDurationFee(params.loanAmount, params.dueDate);
    const totalInitialFee = riskFee + coverageFee + durationFee;

    const discountApplied = validatePartnerCode(params.partnerCode);
    const discountAmount = discountApplied ? totalInitialFee * 0.25 : 0;
    const finalFee = totalInitialFee - discountAmount;

    const feeDetails: InsuranceFeeDetails = {
      riskFee,
      coverageFee,
      durationFee,
      totalInitialFee,
      discountApplied,
      discountAmount,
      finalFee,
    };

    let lenderFeeMana = 0;
    if (params.lenderFee) {
      // Assuming fee is percentage if < 100, otherwise flat mana.
      // A more robust API would have separate params like `lenderFeePercent` and `lenderFeeMana`.
      lenderFeeMana = params.lenderFee < 100
        ? params.loanAmount * (params.lenderFee / 100)
        : params.lenderFee;
    }

    return {
      success: true,
      borrowerProfile,
      lenderProfile,
      feeDetails,
      lenderFeeMana: Math.round(lenderFeeMana),
      loanAmount: params.loanAmount,
      coverage: params.coverage,
      dueDate: params.dueDate,
    };
  } catch (e) {
    const error = e as Error;
    return { success: false, error: error.message };
  }
}

export async function executeInsuranceTransaction(
  apiKey: string,
  params: {
    borrowerUserId: string;
    borrowerUsername: string;
    lenderUsername: string;
    loanAmount: number;
    coverage: number;
    dueDate: string;
    finalFee: number;
    riskBaseFee: number;
    durationFee: number;
    discountApplied: boolean;
    lenderFee: number;
    managramMessage?: string;
    institution?: "IMF" | "BANK" | "RISK";
    commentId?: string;
  },
): Promise<TransactionExecutionResult> {
  const roundedInsuranceFee = Math.round(params.finalFee);
  // Use ternary for direct const assignment
  const targetMarketId: string = params.institution
    ? INSTITUTION_MARKETS[params.institution].id
    : INSURANCE_MARKET_ID;

  let loanBountyResult: {
    success: boolean;
    data: ManaPaymentTransaction | null; // Corrected 'any' to specific type
    error: string | null;
  };

  if (params.institution) {
    if (!params.commentId) {
      return { success: false, error: "Comment ID is required for institutional funding" };
    }
    loanBountyResult = await addBounty(
      targetMarketId,
      params.loanAmount,
      params.commentId,
      apiKey,
    );
  } else {
    const amountDueBack = params.loanAmount + params.lenderFee;
    const defaultMessage =
      `Loan M${params.loanAmount}. M${amountDueBack} due back ${params.dueDate}. | ${params.coverage}% INSURED BY RISK`;
    const message = params.managramMessage || defaultMessage;
    const managramResult = await sendManagram(
      [params.borrowerUserId],
      params.loanAmount,
      message.substring(0, 100),
      apiKey,
    );
    loanBountyResult = {
      success: managramResult.success,
      data: managramResult.data,
      error: managramResult.error,
    };
  }

  if (!loanBountyResult.success || !loanBountyResult.data) {
    return { success: false, error: `Failed to process loan transaction: ${loanBountyResult.error}` };
  }
  // Now loanTxId can be const as it's assigned unconditionally after this check
  const loanTxId = loanBountyResult.data.id;

  const insuranceBountyResult = await addBounty(
    INSURANCE_MARKET_ID,
    roundedInsuranceFee,
    null,
    apiKey,
  );
  if (!insuranceBountyResult.success || !insuranceBountyResult.data) {
    return { success: false, error: `Failed to pay insurance fee: ${insuranceBountyResult.error}` };
  }
  const insuranceTxId = (insuranceBountyResult.data as ManaPaymentTransaction).id;

  const receiptMessage = generateReceiptMessage({
    loanTxId,
    insuranceTxId,
    coverage: params.coverage,
    lenderUsername: params.lenderUsername,
    borrowerUsername: params.borrowerUsername,
    loanAmount: params.loanAmount,
    loanDueDate: params.dueDate,
    riskBaseFee: params.riskBaseFee,
    durationFee: params.durationFee,
    finalInsuranceFee: params.finalFee,
    discountApplied: params.discountApplied,
  });

  const postCommentResult = await postComment(
    targetMarketId,
    receiptMessage,
    apiKey,
  );
  if (!postCommentResult.success || !postCommentResult.data) {
    console.warn(`Transactions succeeded but failed to post receipt comment: ${postCommentResult.error}`);
  }

  return {
    success: true,
    message: "Loan and insurance fee processed successfully.",
    loanTransactionId: loanTxId,
    insuranceTransactionId: insuranceTxId,
    receiptCommentId: postCommentResult.data?.id,
    marketUrl: `https://manifold.markets/market/${targetMarketId}`,
  };
}
