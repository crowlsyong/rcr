// utils/api/insurance_calculator_logic.ts
import {
  addBounty,
  fetchLoanTransactions,
  fetchManaAndRecentRank,
  fetchTransactionCount,
  fetchUserData,
  fetchUserDataLiteById, // Keep this import
  fetchUserPortfolio,
  postComment,
  sendManagram,
} from "./manifold_api_service.ts";
import {
  calculateNetLoanBalance,
  calculateriskBaseFee,
  computeMMR,
  mapToCreditScore,
} from "./score_calculation_logic.ts";
import { ManaPaymentTransaction, ManifoldUser } from "./manifold_types.ts";

export const MANIFOLD_USER_ID = "IPTOzEqrpkWmEzh6hwvAyY9PqFb2";
export const INSURANCE_MARKET_ID = "QEytQ5ch0P";
export const CONTACT_USERNAME = "crowlsyong";
const INSTITUTION_MARKETS: {
  [key: string]: { id: string; name: string };
} = {
  IMF: { id: "PdLcZARORc", name: "IMF" },
  BANK: { id: "tqQIAgd6EZ", name: "BANK" },
  RISK: { id: "QEytQ5ch0P", name: "RISK" },
  OFFSHORE: { id: "CAQchupgyN", name: "OFFSHORE" },
};

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
  message?: string;
  error?: string;
  loanTransactionId?: string;
  insuranceTransactionId?: string;
  receiptCommentId?: string;
  marketUrl?: string;

  dryRunMode?: boolean;
  dryRunLoanTxId?: string;
  dryRunInsuranceTxId?: string;

  totalFee?: number;
  totalFeeBeforeDiscount?: number;
  baseFee?: number;
  coverageFee?: number;
  durationFee?: number;
  discountCodeSuccessful?: boolean;
  discountMessage?: string;
}

async function fetchUserIdentity(
  identifier: { username?: string; userId?: string },
): Promise<{
  userData: ManifoldUser | null;
  fetchSuccess: boolean;
  userDeleted: boolean;
}> {
  console.log("DEBUG: fetchUserIdentity called with:", identifier); // Keep for general debugging
  if (identifier.username) {
    const result = await fetchUserData(identifier.username);
    console.log("DEBUG: fetchUserIdentity - fetched by username result:", result); // Keep
    return result;
  } else if (identifier.userId) {
    const liteResult = await fetchUserDataLiteById(identifier.userId);
    console.log("DEBUG: fetchUserIdentity - fetched lite by userId result:", liteResult); // Keep

    if (liteResult.fetchSuccess && liteResult.userData?.username) {
      const fullProfileResult = await fetchUserData(
        liteResult.userData.username,
      );
      console.log("DEBUG: fetchUserIdentity - fetched full profile from resolved username:", fullProfileResult); // Keep
      return fullProfileResult;
    } else {
      console.log(
        `DEBUG: fetchUserIdentity - Failed to resolve username from userId '${identifier.userId}' via lite endpoint.`,
      ); // Keep
      return { userData: null, fetchSuccess: false, userDeleted: false };
    }
  }

  console.log("DEBUG: fetchUserIdentity returning null (no valid identifier provided)."); // Keep
  return { userData: null, fetchSuccess: false, userDeleted: false };
}

async function getUserScoreProfile(
  identifier: { username?: string; userId?: string },
): Promise<UserScoreProfile> {
  console.log("DEBUG: getUserScoreProfile called with:", identifier); // Keep
  const identifierString = identifier.username || identifier.userId;
  if (!identifierString) {
    console.log(
      "DEBUG: getUserScoreProfile returning early (no identifier string).",
    ); // Keep
    return {
      username: "",
      userId: "",
      creditScore: 0,
      riskBaseFee: 1.60,
      avatarUrl: null,
      userExists: false,
      userDeleted: false,
    };
  }

  const { userData, fetchSuccess, userDeleted } = await fetchUserIdentity(
    identifier,
  );
  console.log(
    "DEBUG: getUserScoreProfile - fetchUserIdentity returned:",
    { userData, fetchSuccess, userDeleted },
  ); // Keep

  if (!fetchSuccess || !userData) {
    console.log(
      `DEBUG: getUserScoreProfile - User '${identifierString}' not found or deleted (fetchSuccess: ${fetchSuccess}, userDeleted: ${userDeleted}).`,
    ); // Keep
    return {
      username: userData?.username || identifier.username || "",
      userId: userData?.id || identifier.userId || "",
      creditScore: 0,
      riskBaseFee: 1.60,
      avatarUrl: null,
      userExists: false,
      userDeleted: !!userDeleted,
    };
  }

  const userId = userData.id;
  const username = userData.username;

  console.log(
    `DEBUG: getUserScoreProfile - Processing user: ID=${userId}, Username=${username}.`,
  ); // Keep

  if (!username) {
    console.warn(
      `DEBUG: getUserScoreProfile: No username found for user ID '${userId}' after fetch. Cannot fetch transaction count. Returning profile with default high risk.`,
    ); // Keep
    return {
      username: userData.username,
      userId: userData.id,
      creditScore: 0,
      riskBaseFee: 1.60,
      avatarUrl: userData.avatarUrl || null,
      userExists: true,
      userDeleted: !!userDeleted,
    };
  }

  try {
    const createdTime = userData.createdTime ?? Date.now();
    const ageDays = (Date.now() - createdTime) / 86_400_000;
    console.log(`DEBUG: getUserScoreProfile - ageDays: ${ageDays}`); // Keep

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

    // console.log( // REMOVED: Excessive logging of entire API fetches results
    //   "DEBUG: getUserScoreProfile - API fetches results:",
    //   { portfolioFetch, rankData, transactionData, loanData },
    // );

    if (!portfolioFetch.success || !portfolioFetch.portfolio) {
      throw new Error(
        `Failed to fetch portfolio for '${username}' (ID: ${userId}).`,
      );
    }
    const safeLatestRank = rankData.latestRank ?? 100;
    const safeTransactionCount = transactionData.count;
    const safeLoanTransactions = loanData.transactions;

    console.log(
      "DEBUG: getUserScoreProfile - Data for MMR calculation:",
      { // Keep this focused log for MMR inputs
        balance: portfolioFetch.portfolio.balance,
        calculatedProfit: portfolioFetch.portfolio.investmentValue +
          portfolioFetch.portfolio.balance -
          portfolioFetch.portfolio.totalDeposits,
        ageDays,
        safeLatestRank,
        safeTransactionCount,
        outstandingDebtImpact: calculateNetLoanBalance(
          userId,
          safeLoanTransactions,
          MANIFOLD_USER_ID,
        ),
      },
    );

    const outstandingDebtImpact = calculateNetLoanBalance(
      userId,
      safeLoanTransactions,
      MANIFOLD_USER_ID,
    );
    const calculatedProfit = portfolioFetch.portfolio.investmentValue +
      portfolioFetch.portfolio.balance - portfolioFetch.portfolio.totalDeposits;
    const rawMMR = computeMMR(
      portfolioFetch.portfolio.balance,
      calculatedProfit,
      ageDays,
      safeLatestRank,
      safeTransactionCount,
      outstandingDebtImpact,
    );
    const creditScore = mapToCreditScore(rawMMR);
    const riskBaseFee = calculateriskBaseFee(creditScore);

    console.log(
      "DEBUG: getUserScoreProfile - Final score profile:",
      { username: userData.username, userId: userData.id, creditScore, riskBaseFee },
    ); // Keep this focused final log

    return {
      username: userData.username,
      userId: userData.id,
      creditScore,
      riskBaseFee,
      avatarUrl: userData.avatarUrl || null,
      userExists: true,
      userDeleted: !!userData.userDeleted,
    };
  } catch (innerError) {
    console.error(
      `DEBUG: getUserScoreProfile - CRITICAL ERROR for '${username}' (ID: ${userId}): ${
        typeof innerError === "object" && innerError !== null &&
          "message" in innerError
          ? (innerError as { message: string }).message
          : String(innerError)
      }. Returning profile with default high risk.`,
    ); // Keep for critical errors
    return {
      username: username,
      userId: userId,
      creditScore: 0,
      riskBaseFee: 1.60,
      avatarUrl: userData.avatarUrl || null,
      userExists: true,
      userDeleted: !!userDeleted,
    };
  }
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

export function generateCreditCardReceiptMessage(
  details: {
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
    policyEndDate: string;
  },
  includeFullDetails: boolean,
): string {
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

  const formattedRiskBaseFee = (details.riskBaseFee * 100).toFixed(2);

  let receiptContent = `# 🦝RISK Credit Card Insurance Receipt

### Summary

Transaction ID (Insurance Fee): ${details.insuranceTxId}

Coverage: C${details.coverage}

Lender: @${details.lenderUsername}

Borrower: @${details.borrowerUsername}

Original Loan Amount (from Credit Card): Ṁ${details.loanAmount}

Date of Policy Start: ${new Date().toISOString().split("T")[0]}

Loan Due Date: ${details.loanDueDate}

Policy Ends: ${details.policyEndDate}

### Fees

Base Fee (risk multiplier): ${formattedRiskBaseFee}%

Coverage Fee: ${formattedCoverageFee}

Duration Fee: Ṁ${details.durationFee}

${discountLine}

Total Fee (to RISK): Ṁ${Math.round(details.finalInsuranceFee)}`;

  if (includeFullDetails) {
    receiptContent += `

### Terms

By using this service, you adhere to The Fine Print at the bottom of our dashboard. This policy is for a credit card loan. A 60% refund may be available if the borrower repays on time and in full to the credit provider. No refund if the borrower defaults, but insurance will cover the policy amount.

---

Have questions or need to activate coverage? Message @${CONTACT_USERNAME} and we’ll walk you through it.


Risk Free 🦝RISK Fee Guarantee™️


🦝RISK: Recovery Loan Insurance Kiosk`;
  }

  return receiptContent;
}

export async function calculateInsuranceDetails(
  params: {
    borrowerUsername?: string;
    borrowerId?: string;
    lenderUsername?: string;
    lenderId?: string;
    loanAmount: number;
    coverage: number;
    dueDate: string;
    partnerCode?: string;
    lenderFee?: number;
  },
): Promise<InsuranceCalculationResult> {
  try {
    const [borrowerProfile, lenderFetchResult] = await Promise.all([
      getUserScoreProfile({
        username: params.borrowerUsername,
        userId: params.borrowerId,
      }),
      fetchUserIdentity({
        username: params.lenderUsername,
        userId: params.lenderId,
      }),
    ]);

    if (!borrowerProfile.userExists || borrowerProfile.userDeleted) {
      return {
        success: false,
        error:
          `Borrower '${
            borrowerProfile.username || borrowerProfile.userId
          }' not found or is deleted.`,
      };
    }
    if (
      !lenderFetchResult.fetchSuccess || !lenderFetchResult.userData ||
      lenderFetchResult.userDeleted
    ) {
      return {
        success: false,
        error:
          `Lender '${
            lenderFetchResult.userData?.username || lenderFetchResult.userData?.id ||
            params.lenderUsername || params.lenderId
          }' not found or is deleted.`,
      };
    }

    const lenderProfile = {
      username: lenderFetchResult.userData.username,
      userId: lenderFetchResult.userData.id,
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
    return { success: false, error: `Calculation error: ${error.message}` };
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
    institution?: "IMF" | "BANK" | "RISK" | "OFFSHORE";
    commentId?: string;
    dryRun: boolean;
    totalFee: number;
    totalFeeBeforeDiscount: number;
    baseFee: number;
    coverageFee: number;
    discountCodeSuccessful: boolean;
    discountMessage: string;
  },
): Promise<TransactionExecutionResult> {
  const roundedInsuranceFee = Math.round(params.finalFee);
  const targetMarketId: string = params.institution
    ? INSTITUTION_MARKETS[params.institution].id
    : INSURANCE_MARKET_ID;

  if (params.dryRun) {
    const simulatedLoanTxId = `simulated-loan-TXN-ID-${Date.now().toString().slice(-6)}`;
    const simulatedInsuranceTxId = `simulated-ins-TXN-ID-${Date.now().toString().slice(-6)}`;
    return {
      success: true,
      message: "Dry run successful. No transactions were executed.",
      dryRunMode: true,
      dryRunLoanTxId: simulatedLoanTxId,
      dryRunInsuranceTxId: simulatedInsuranceTxId,
      totalFee: params.totalFee,
      totalFeeBeforeDiscount: params.totalFeeBeforeDiscount,
      baseFee: params.baseFee,
      coverageFee: params.coverageFee,
      durationFee: params.durationFee,
      discountCodeSuccessful: params.discountCodeSuccessful,
      discountMessage: params.discountMessage,
    };
  }

  let loanBountyResult: {
    success: boolean;
    data: ManaPaymentTransaction | null;
    error: string | null;
  };

  if (params.institution) {
    if (!params.commentId) {
      return {
        success: false,
        error: "Comment ID is required for institutional funding",
      };
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
    return {
      success: false,
      error: `Failed to process loan transaction: ${loanBountyResult.error}`,
    };
  }
  const loanTxId = loanBountyResult.data.id;

  const insuranceBountyResult = await addBounty(
    INSURANCE_MARKET_ID,
    roundedInsuranceFee,
    null,
    apiKey,
  );
  if (!insuranceBountyResult.success || !insuranceBountyResult.data) {
    return {
      success: false,
      error: `Failed to pay insurance fee: ${insuranceBountyResult.error}`,
    };
  }
  const insuranceTxId =
    (insuranceBountyResult.data as ManaPaymentTransaction).id;

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
    console.warn(
      `Transactions succeeded but failed to post receipt comment: ${postCommentResult.error}`,
    );
  }

  return {
    success: true,
    message: "Loan and insurance fee processed successfully.",
    loanTransactionId: loanTxId,
    insuranceTransactionId: insuranceTxId,
    receiptCommentId: postCommentResult.data?.id,
    marketUrl: `https://manifold.markets/market/${targetMarketId}`,
    totalFee: params.totalFee,
    totalFeeBeforeDiscount: params.totalFeeBeforeDiscount,
    baseFee: params.baseFee,
    coverageFee: params.coverageFee,
    durationFee: params.durationFee,
    discountCodeSuccessful: params.discountCodeSuccessful,
    discountMessage: params.discountMessage,
  };
}
