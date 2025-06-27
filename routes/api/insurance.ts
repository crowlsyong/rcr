// routes/api/insurance.ts
import { Handlers } from "$fresh/server.ts";
import {
  calculateInsuranceDetails,
  executeInsuranceTransaction,
  InsuranceCalculationResult,
} from "../../utils/api/insurance_calculator_logic.ts";

function handleError(message: string, status: number): Response {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const handler: Handlers<InsuranceCalculationResult | null> = {
  async GET(req) {
    const url = new URL(req.url);
    const params = url.searchParams;

    const borrowerUsername = params.get("borrowerUsername");
    const lenderUsername = params.get("lenderUsername");
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
      return handleError(`Server error: ${
        typeof e === "object" && e !== null && "message" in e
          ? (e as { message: string }).message
          : String(e)
      }`, 500);
    }
  },

  async POST(req) {
    const body = await req.json();
    const {
      apiKey,
      borrowerUsername,
      lenderUsername,
      loanAmount,
      coverage,
      dueDate,
      partnerCode,
      lenderFee,
      managramMessage,
      institution,
      commentId,
    } = body;

    if (!apiKey) {
      return handleError("API key is required for POST requests", 401);
    }
    if (
      !borrowerUsername || !lenderUsername || !loanAmount || !coverage ||
      !dueDate
    ) {
      return handleError("Missing required parameters in POST body", 400);
    }
    if (institution && !["IMF", "BANK", "RISK"].includes(institution)) {
      return handleError("Invalid institution specified", 400);
    }
    if (institution && !commentId) {
      return handleError("Comment ID is required for institutional funding", 400);
    }

    try {
      // Recalculate on the server to ensure data integrity
      const calcResult = await calculateInsuranceDetails({
        borrowerUsername,
        lenderUsername,
        loanAmount,
        coverage,
        dueDate,
        partnerCode,
        lenderFee,
      });

      if (
        !calcResult.success || !calcResult.feeDetails ||
        !calcResult.borrowerProfile
      ) {
        return handleError(
          calcResult.error || "Failed to validate loan details before execution",
          500,
        );
      }

      const executionResult = await executeInsuranceTransaction(apiKey, {
        borrowerUserId: calcResult.borrowerProfile.userId,
        borrowerUsername,
        lenderUsername,
        loanAmount,
        coverage,
        dueDate,
        finalFee: calcResult.feeDetails.finalFee,
        riskBaseFee: calcResult.borrowerProfile.riskBaseFee,
        durationFee: calcResult.feeDetails.durationFee,
        discountApplied: calcResult.feeDetails.discountApplied,
        lenderFee: calcResult.lenderFeeMana || 0,
        managramMessage,
        institution,
        commentId,
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
      return handleError(`Server error: ${
        typeof e === "object" && e !== null && "message" in e
          ? (e as { message: string }).message
          : String(e)
      }`, 500);
    }
  },
};
