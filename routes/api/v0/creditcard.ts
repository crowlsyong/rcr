// routes/api/v0/creditcard.ts
import { Handlers } from "$fresh/server.ts";
import {
  calculateInsuranceDetails,
  generateCreditCardReceiptMessage,
  INSURANCE_MARKET_ID,
} from "../../../utils/api/insurance_calculator_logic.ts";
import { addBounty, postComment } from "../../../utils/api/manifold_api_service.ts";
import { ManaPaymentTransaction } from "../../../utils/api/manifold_types.ts";

interface CreditInsuranceRequestBody {
  creditcard: boolean;
  policy: "C25" | "C50" | "C75" | "C100";
  apikey: string;
  lenderUsername?: string;
  lenderId?: string;
  borrowerUsername?: string;
  borrowerId?: string;
  amount: number;
  discountcode?: string;
  loanDue: number; // Unix timestamp
  dryRun?: boolean;
}

interface CreditInsuranceResponse {
  insuranceActivated: boolean;
  covered: number;
  totalFee: number;
  totalFeeBeforeDiscount?: number;
  baseFee: number;
  coverageFee: number;
  durationFee: number;
  discountCodeSuccessful: boolean;
  discountMessage: string;
  receipt: string; // Describes the outcome of posting the receipt comment
  loanDue: number; // Unix timestamp
  policyEnds: number; // Unix timestamp
  dryRunMode?: boolean;
  dryRunInsuranceTxId?: string;
  dryRunReceiptContent?: string;
}

function handleError(message: string, status: number): Response {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function getCoverageValueFromPolicy(policy: string): number | null {
  switch (policy) {
    case "C25":
      return 25;
    case "C50":
      return 50;
    case "C75":
      return 75;
    case "C100":
      return 100;
    default:
      return null;
  }
}

export const handler: Handlers<CreditInsuranceResponse | null> = {
  async POST(req) {
    const body: CreditInsuranceRequestBody = await req.json();

    const {
      creditcard,
      policy,
      apikey,
      lenderUsername,
      lenderId,
      borrowerUsername,
      borrowerId,
      amount,
      discountcode,
      loanDue, // Unix timestamp
      dryRun = false,
    } = body;

    // 1. Validate Input Parameters (basic validation, even for dryRun)
    if (!creditcard || creditcard !== true) {
      return handleError("Request must signify 'creditcard: true'", 400);
    }
    if (!apikey && !dryRun) { // API key is not required for dryRun requests
      return handleError("API key is required for non-dryRun requests.", 401);
    }

    // --- Validation: Mutually exclusive username/userId and presence check ---
    let actualBorrowerUsername: string | undefined;
    let actualBorrowerId: string | undefined;
    let actualLenderUsername: string | undefined;
    let actualLenderId: string | undefined;

    if (borrowerUsername && borrowerId) {
      return handleError(
        "Please provide either 'borrowerUsername' or 'borrowerId', but not both.",
        400,
      );
    } else if (!borrowerUsername && !borrowerId) {
      return handleError(
        "Missing required parameter: 'borrowerUsername' or 'borrowerId'.",
        400,
      );
    } else if (borrowerUsername) {
      actualBorrowerUsername = borrowerUsername;
    } else if (borrowerId) {
      actualBorrowerId = borrowerId;
    }

    if (lenderUsername && lenderId) {
      return handleError(
        "Please provide either 'lenderUsername' or 'lenderId', but not both.",
        400,
      );
    } else if (!lenderUsername && !lenderId) {
      return handleError(
        "Missing required parameter: 'lenderUsername' or 'lenderId'.",
        400,
      );
    } else if (lenderUsername) {
      actualLenderUsername = lenderUsername;
    } else if (lenderId) {
      actualLenderId = lenderId;
    }
    // --- END Validation ---

    if (
      !amount || !policy || !loanDue
    ) {
      return handleError("Missing required parameters: amount, policy, loanDue", 400);
    }

    const coverage = getCoverageValueFromPolicy(policy);
    if (coverage === null) {
      return handleError("Invalid policy value. Must be C25, C50, C75, or C100.", 400);
    }
    if (amount <= 0) {
      return handleError("Loan amount must be greater than zero.", 400);
    }

    const loanDueDate = new Date(loanDue * 1000); // Convert Unix to Date object
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today to start of day

    if (isNaN(loanDueDate.getTime()) || loanDueDate <= today) {
      return handleError("Loan due date must be a valid future date (Unix timestamp).", 400);
    }

    // Convert loanDue date object back to YYYY-MM-DD string for calculation logic
    const loanDueDateString = loanDueDate.toISOString().split("T")[0];

    try {
      // 2. Calculate Insurance Details
      const calcResult = await calculateInsuranceDetails({
        borrowerUsername: actualBorrowerUsername,
        borrowerId: actualBorrowerId,
        lenderUsername: actualLenderUsername,
        lenderId: actualLenderId,
        loanAmount: amount,
        coverage,
        dueDate: loanDueDateString,
        partnerCode: discountcode,
        lenderFee: 0, // No lender fee for the loan itself in this flow
      });

      if (!calcResult.success || !calcResult.feeDetails || !calcResult.borrowerProfile || !calcResult.lenderProfile) {
        return handleError(
          calcResult.error || "Failed to calculate insurance details.",
          500,
        );
      }

      const { finalFee, riskFee, coverageFee, durationFee, discountApplied, totalInitialFee } =
        calcResult.feeDetails;

      const roundedInsuranceFee = Math.round(finalFee);
      const policyEndDate = new Date(loanDueDate);
      policyEndDate.setDate(loanDueDate.getDate() + 7);
      const policyEndDateString = policyEndDate.toISOString().split("T")[0];
      const policyEndsUnix = Math.floor(policyEndDate.getTime() / 1000);
      const coveredAmount = amount * (coverage / 100);

      let insuranceActivated = false;
      let insuranceTxId: string | null = null;
      let receiptStatus: string = "";
      let _dryRunInsuranceTxId: string | undefined = undefined;

      // dryRunReceiptContent is now part of the CreditInsuranceResponse interface
      // and will only be assigned in the live transaction path.
      // For dryRun, it will remain `undefined` as requested.

      if (dryRun) {
        insuranceActivated = false;
        _dryRunInsuranceTxId = "simulated-TXN-ID-" + Date.now().toString().slice(-6);
        receiptStatus = "no receipt in dryRun mode";
      } else {
        // 3. Process Actual Insurance Payment
        const insuranceBountyResult = await addBounty(
          INSURANCE_MARKET_ID,
          roundedInsuranceFee,
          null, // No specific comment to award to for the insurance fee
          apikey,
        );

        if (insuranceBountyResult.success && insuranceBountyResult.data) {
          insuranceActivated = true;
          insuranceTxId = (insuranceBountyResult.data as ManaPaymentTransaction).id;
        } else {
          return handleError(
            `Failed to pay insurance fee: ${insuranceBountyResult.error || "Unknown error"}`,
            500,
          );
        }

        // 4. Generate Receipt Message and Post It (always generate full for live)
        const receiptMessage = generateCreditCardReceiptMessage(
          {
            insuranceTxId: insuranceTxId,
            coverage,
            lenderUsername: calcResult.lenderProfile.username,
            borrowerUsername: calcResult.borrowerProfile.username,
            loanAmount: amount,
            loanDueDate: loanDueDateString,
            riskBaseFee: calcResult.borrowerProfile.riskBaseFee,
            durationFee,
            finalInsuranceFee: finalFee,
            discountApplied,
            policyEndDate: policyEndDateString,
          },
          true, // Always include full details for live transactions
        );

        const postCommentResult = await postComment(
          INSURANCE_MARKET_ID,
          receiptMessage,
          apikey,
        );

        if (postCommentResult.success) {
          receiptStatus = "Successfully placed on the RISK Payment Portal.";
        } else {
          console.warn(
            `Credit insurance payment successful but failed to post receipt comment: ${postCommentResult.error}`,
          );
          receiptStatus = "Payment successful, but receipt could not be posted.";
        }
      }

      // 5. Construct and Return Response
      const responseBody: CreditInsuranceResponse = {
        insuranceActivated,
        covered: coveredAmount,
        totalFee: roundedInsuranceFee,
        totalFeeBeforeDiscount: Math.round(totalInitialFee),
        baseFee: Math.round(riskFee),
        coverageFee: Math.round(coverageFee),
        durationFee: Math.round(durationFee),
        discountCodeSuccessful: discountApplied,
        discountMessage: discountApplied
          ? "25% off applied to order"
          : "No discount applied",
        receipt: receiptStatus,
        loanDue, // Echo back original Unix timestamp
        policyEnds: policyEndsUnix,
      };

      if (dryRun) {
        responseBody.dryRunMode = true;
        responseBody.dryRunInsuranceTxId = _dryRunInsuranceTxId;
      }

      return new Response(JSON.stringify(responseBody), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (e: unknown) {
      return handleError(
        `Server error: ${
          typeof e === "object" && e !== null && "message" in e
            ? (e as { message: string }).message
            : String(e)
        }`,
        500,
      );
    }
  },
};
