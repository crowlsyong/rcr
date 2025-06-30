// routes/api/v0/insurance/execute.ts
import { Handlers } from "$fresh/server.ts";
import {
  calculateInsuranceDetails,
  executeInsuranceTransaction,
  TransactionExecutionResult,
} from "../../../../utils/api/insurance_calculator_logic.ts";

function createErrorResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

interface InsuranceExecutionBody {
  apiKey: string;
  borrowerUsername?: string;
  borrowerId?: string;
  lenderUsername?: string;
  lenderId?: string;
  loanAmount: number;
  coverage: number;
  dueDate: string;
  partnerCode?: string;
  lenderFee?: number;
  managramMessage?: string;
  institution?: "IMF" | "BANK" | "RISK" | "OFFSHORE";
  commentId?: string;
  dryRun?: boolean;
}

export const handler: Handlers<TransactionExecutionResult | null> = {
  async POST(req) {
    try {
      const body: InsuranceExecutionBody = await req.json();
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

      if (!apiKey) {
        return createErrorResponse("API key is required for execution", 401);
      }
      if (!borrowerUsername && !borrowerId) {
        return createErrorResponse(
          "Missing required parameter: 'borrowerUsername' or 'borrowerId'",
          400,
        );
      }
      if (!lenderUsername && !lenderId) {
        return createErrorResponse(
          "Missing required parameter: 'lenderUsername' or 'lenderId'",
          400,
        );
      }
      if (!loanAmount || !coverage || !dueDate) {
        return createErrorResponse(
          "Missing required parameters: loanAmount, coverage, dueDate",
          400,
        );
      }
      if (
        institution &&
        !["IMF", "BANK", "RISK", "OFFSHORE"].includes(institution)
      ) {
        return createErrorResponse("Invalid institution specified", 400);
      }
      if (institution && !commentId) {
        return createErrorResponse(
          "Comment ID is required for institutional funding",
          400,
        );
      }

      const calcResult = await calculateInsuranceDetails({
        borrowerUsername,
        borrowerId,
        lenderUsername,
        lenderId,
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
        return createErrorResponse(
          calcResult.error ||
            "Failed to validate loan details before execution",
          500,
        );
      }

      const {
        finalFee,
        riskFee,
        coverageFee: covFee,
        durationFee,
        discountApplied,
        totalInitialFee,
      } = calcResult.feeDetails;

      const executionResult = await executeInsuranceTransaction(apiKey, {
        borrowerUserId: calcResult.borrowerProfile.userId,
        borrowerUsername: calcResult.borrowerProfile.username,
        lenderUsername: calcResult.lenderProfile.username,
        loanAmount,
        coverage,
        dueDate,
        finalFee,
        riskBaseFee: calcResult.borrowerProfile.riskBaseFee,
        durationFee,
        discountApplied,
        lenderFee: calcResult.lenderFeeMana || 0,
        managramMessage,
        institution,
        commentId,
        dryRun,
        totalFee: Math.round(finalFee),
        totalFeeBeforeDiscount: Math.round(totalInitialFee),
        baseFee: Math.round(riskFee),
        coverageFee: Math.round(covFee),
        discountCodeSuccessful: discountApplied,
        discountMessage: discountApplied
          ? "25% off applied to order"
          : "No discount applied",
      });

      if (!executionResult.success) {
        return createErrorResponse(
          executionResult.error || "Transaction execution failed",
          500,
        );
      }

      return new Response(JSON.stringify(executionResult), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      const errorMessage = typeof e === "object" && e !== null &&
          "message" in e
        ? (e as { message: string }).message
        : String(e);
      return createErrorResponse(`Server error: ${errorMessage}`, 500);
    }
  },
};
