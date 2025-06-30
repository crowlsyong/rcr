// routes/api/v0/insurance/quote.ts
import { Handlers } from "$fresh/server.ts";
import {
  calculateInsuranceDetails,
  InsuranceCalculationResult,
} from "../../../../utils/api/insurance_calculator_logic.ts";

function createErrorResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

interface InsuranceQuoteRequestBody {
  borrowerUsername?: string;
  borrowerId?: string;
  lenderUsername?: string;
  lenderId?: string;
  loanAmount: number;
  coverage: number;
  dueDate: string;
  partnerCode?: string;
  lenderFee?: number;
}

export const handler: Handlers<InsuranceCalculationResult | null> = {
  async POST(req) {
    try {
      const body: InsuranceQuoteRequestBody = await req.json();

      const {
        borrowerUsername,
        borrowerId,
        lenderUsername,
        lenderId,
        loanAmount,
        coverage,
        dueDate,
        partnerCode,
        lenderFee,
      } = body;

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
      if (isNaN(loanAmount) || isNaN(coverage) || loanAmount <= 0) {
        return createErrorResponse(
          "Invalid number format for loanAmount or coverage",
          400,
        );
      }
      if (![25, 50, 75, 100].includes(coverage)) {
        return createErrorResponse(
          "Coverage must be one of 25, 50, 75, 100",
          400,
        );
      }
      if (new Date(dueDate) <= new Date()) {
        return createErrorResponse("Due date must be in the future", 400);
      }

      const result = await calculateInsuranceDetails({
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

      if (!result.success) {
        return createErrorResponse(result.error || "Calculation failed", 500);
      }

      return new Response(JSON.stringify(result), {
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
