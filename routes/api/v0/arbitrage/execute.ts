// routes/api/v0/arbitrage/execute.ts
import { Handlers } from "$fresh/server.ts";
import {
  cancelManifoldBet,
  placeManifoldBet,
} from "../../../../utils/api/manifold_api_service.ts";
import { BetPayload } from "../../../../utils/api/manifold_types.ts";

interface ArbitrageExecutionBody {
  apiKey: string;
  betA: BetPayload;
  betB: BetPayload;
}

interface PlaceBetResult {
  success: boolean;
  data?: { id: string; amount: number; shares: number };
  error?: string | null;
  skipped?: boolean;
  message: string;
}

function createErrorResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const safePlaceBet = async (
  betPayload: BetPayload,
  apiKey: string,
): Promise<PlaceBetResult> => {
  const MIN_MANA_BET = 1;
  const roundedAmount = Math.round(betPayload.amount);

  if (roundedAmount < MIN_MANA_BET) {
    return {
      success: true,
      skipped: true,
      error: null,
      message: `Amount M${
        betPayload.amount.toFixed(2)
      } rounded to M${roundedAmount}, which is less than the M${MIN_MANA_BET} minimum. Bet skipped.`,
    };
  }

  const { data, error } = await placeManifoldBet(apiKey, {
    ...betPayload,
    amount: roundedAmount,
  });

  if (error || !data) {
    return {
      success: false,
      error: error,
      message: `Failed to place bet: ${error || "Unknown error"}`,
    };
  }
  return {
    success: true,
    data: data,
    error: null,
    message: "Bet placed successfully",
  };
};

export const handler: Handlers = {
  async POST(req) {
    try {
      const { apiKey, betA, betB }: ArbitrageExecutionBody = await req.json();

      if (!apiKey || !betA || !betB) {
        return createErrorResponse("Missing required parameters", 400);
      }

      let betAId: string | null = null;
      const betDetails: Array<
        { market: string; status: string; amount?: number }
      > = [];

      // Place Bet A
      const bet1Response = await safePlaceBet(betA, apiKey);
      if (bet1Response.skipped) {
        betDetails.push({
          market: "Market A",
          status: "skipped",
          amount: betA.amount,
        });
      } else if (!bet1Response.success) {
        return createErrorResponse(
          `Bet on Market A failed: ${bet1Response.error}`,
          500,
        );
      } else {
        betAId = bet1Response.data!.id;
        betDetails.push({
          market: "Market A",
          status: "placed",
          amount: bet1Response.data!.amount,
        });
      }

      // Place Bet B
      const bet2Response = await safePlaceBet(betB, apiKey);
      if (bet2Response.skipped) {
        betDetails.push({
          market: "Market B",
          status: "skipped",
          amount: betB.amount,
        });
      } else if (!bet2Response.success) {
        let cancellationMessage = "";
        if (betAId) {
          console.warn(
            `Attempting to cancel bet ${betAId} due to a subsequent failure.`,
          );
          const { success: cancelSuccess, error: cancelError } =
            await cancelManifoldBet(apiKey, betAId);
          cancellationMessage = cancelSuccess
            ? "The successful bet on Market A was automatically canceled."
            : `CRITICAL: Failed to cancel the bet on Market A (ID: ${betAId}). Please cancel it manually. Error: ${cancelError}`;
        }
        return createErrorResponse(
          `Bet on Market B failed: ${bet2Response.error}. ${cancellationMessage}`,
          500,
        );
      } else {
        betDetails.push({
          market: "Market B",
          status: "placed",
          amount: bet2Response.data!.amount,
        });
      }

      const allSkipped = betDetails.every((d) => d.status === "skipped");
      const anyPlaced = betDetails.some((d) => d.status === "placed");
      let finalResponseMessage = "Arbitrage execution complete.";
      if (allSkipped) {
        finalResponseMessage = "All bets were too small and were skipped.";
      } else if (anyPlaced) {
        finalResponseMessage = "Arbitrage bets processed successfully!";
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: finalResponseMessage,
          betDetails: betDetails,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    } catch (e) {
      const errorMessage = typeof e === "object" && e !== null && "message" in e
        ? (e as { message: string }).message
        : String(e);
      return createErrorResponse(
        `Internal server error: ${errorMessage}`,
        500,
      );
    }
  },
};
