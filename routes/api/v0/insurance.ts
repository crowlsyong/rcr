// routes/api/v0/insurance.ts
import { Handlers } from "$fresh/server.ts";
import {
  calculateInsuranceDetails,
  executeInsuranceTransaction,
  InsuranceCalculationResult,
  TransactionExecutionResult,
} from "../../../utils/api/insurance_calculator_logic.ts";

function handleError(message: string, status: number): Response {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// NOTE: The GET handler remains unchanged as it's purely for calculation.
// It will continue to use usernames as it's typically for UI-driven lookups.
export const handler: Handlers<
  InsuranceCalculationResult | TransactionExecutionResult | null
> = {
  async GET(req) {
    const url = new URL(req.url);
    const params = url.searchParams;

    const borrowerUsername = params.get("borrowerUsername") || undefined;
    const lenderUsername = params.get("lenderUsername") || undefined;

    const loanAmountStr = params.get("loanAmount");
    const coverageStr = params.get("coverage");
    const dueDate = params.get("dueDate");
    const partnerCode = params.get("partnerCode") || undefined;
    const lenderFeeStr = params.get("lenderFee") || undefined;

    if (
      !borrowerUsername || !lenderUsername || !loanAmountStr || !coverageStr ||
      !dueDate
    ) {
      return handleError(
        "Missing required parameters: borrowerUsername, lenderUsername, loanAmount, coverage, dueDate",
        400,
      );
    }

    try {
      const loanAmount = parseInt(loanAmountStr, 10);
      const coverage = parseInt(coverageStr, 10);
      const lenderFee = lenderFeeStr ? parseFloat(lenderFeeStr) : undefined;

      if (isNaN(loanAmount) || isNaN(coverage) || loanAmount <= 0) {
        return handleError(
          "Invalid number format for loanAmount or coverage",
          400,
        );
      }
      if (![25, 50, 75, 100].includes(coverage)) {
        return handleError("Coverage must be one of 25, 50, 75, 100", 400);
      }
      if (new Date(dueDate) <= new Date()) {
        return handleError("Due date must be in the future", 400);
      }

      const result = await calculateInsuranceDetails({
        borrowerUsername,
        lenderUsername,
        loanAmount,
        coverage,
        dueDate,
        partnerCode,
        lenderFee,
      });

      if (!result.success) {
        return handleError(result.error || "Calculation failed", 500);
      }

      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
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

  async POST(req) {
    const body = await req.json();
    const {
      apiKey,
      borrowerUsername,
      borrowerId,
      lenderUsername,
      lenderId,
      loanAmount,
      coverage,
      dueDate,
      partnerCode,
      lenderFee,
      managramMessage,
      institution,
      commentId,
      dryRun = false,
    } = body;

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

    // API Key is only strictly required for non-dryRun requests
    if (!apiKey && !dryRun) {
      return handleError(
        "API key is required for non-dryRun POST requests",
        401,
      );
    }
    if (
      !loanAmount || !coverage || !dueDate
    ) {
      return handleError(
        "Missing required parameters in POST body (loanAmount, coverage, dueDate)",
        400,
      );
    }
    if (
      !dryRun && institution &&
      !["IMF", "BANK", "RISK", "OFFSHORE"].includes(institution)
    ) {
      return handleError("Invalid institution specified", 400);
    }
    if (!dryRun && institution && !commentId) {
      return handleError(
        "Comment ID is required for institutional funding in non-dryRun mode",
        400,
      );
    }

    try {
      // Recalculate on the server to ensure data integrity
      const calcResult = await calculateInsuranceDetails({
        borrowerUsername: actualBorrowerUsername,
        borrowerId: actualBorrowerId,
        lenderUsername: actualLenderUsername,
        lenderId: actualLenderId,
        loanAmount,
        coverage,
        dueDate,
        partnerCode,
        lenderFee,
      });

      if (
        !calcResult.success || !calcResult.feeDetails ||
        !calcResult.borrowerProfile || !calcResult.lenderProfile
      ) {
        return handleError(
          calcResult.error ||
            "Failed to validate loan details before execution",
          500,
        );
      }

      const finalBorrowerUsername = calcResult.borrowerProfile.username;
      const finalBorrowerId = calcResult.borrowerProfile.userId;
      const finalLenderUsername = calcResult.lenderProfile.username;

      const executionResult = await executeInsuranceTransaction(apiKey, {
        borrowerUserId: finalBorrowerId,
        borrowerUsername: finalBorrowerUsername,
        lenderUsername: finalLenderUsername,
        loanAmount,
        coverage,
        dueDate,
        finalFee: calcResult.feeDetails.finalFee,
        riskBaseFee: calcResult.borrowerProfile.riskBaseFee, // Needed for receipt
        durationFee: calcResult.feeDetails.durationFee, // Needed for receipt
        discountApplied: calcResult.feeDetails.discountApplied, // Needed for receipt
        lenderFee: calcResult.lenderFeeMana || 0, // Needed for managram message
        managramMessage,
        institution,
        commentId,
        dryRun,
        // The following are the *output* values which are passed explicitly
        // to populate TransactionExecutionResult's response. No duplication here.
        totalFee: Math.round(calcResult.feeDetails.finalFee),
        totalFeeBeforeDiscount: Math.round(
          calcResult.feeDetails.totalInitialFee,
        ),
        baseFee: Math.round(calcResult.feeDetails.riskFee),
        coverageFee: Math.round(calcResult.feeDetails.coverageFee),
        // durationFee: Math.round(calcResult.feeDetails.durationFee), // REMOVED THIS DUPLICATE LINE
        discountCodeSuccessful: calcResult.feeDetails.discountApplied,
        discountMessage: calcResult.feeDetails.discountApplied
          ? "25% off applied to order"
          : "No discount applied",
      });

      if (!executionResult.success) {
        return handleError(
          executionResult.error || "Transaction execution failed",
          500,
        );
      }

      return new Response(JSON.stringify(executionResult), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
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
