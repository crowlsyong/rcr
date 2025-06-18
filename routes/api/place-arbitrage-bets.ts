import { Handlers } from "$fresh/server.ts";
import {
  cancelManifoldBet,
  placeManifoldBet,
} from "../../utils/api/manifold_bet_helpers.ts";
import { BetPayload } from "../../utils/api/manifold_types.ts";

interface MarketInfo {
  slug: string;
  question: string;
}

interface RequestBody {
  apiKey: string;
  betA: BetPayload;
  betB: BetPayload;
  marketAInfo: MarketInfo;
  marketBInfo: MarketInfo;
}

interface PlaceBetResult {
  success: boolean;
  data?: { id: string; amount: number; shares: number };
  error: string | null; // Changed to string | null
  skipped?: boolean;
  message: string;
}

export const handler: Handlers = {
  async POST(req, _ctx) {
    try {
      const { apiKey, betA, betB, marketAInfo, marketBInfo }: RequestBody =
        await req.json();

      if (!apiKey || !betA || !betB || !marketAInfo || !marketBInfo) {
        return new Response(
          JSON.stringify({ message: "Missing required parameters" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const MIN_MANA_BET = 1; // Manifold's minimum bet amount

      // Helper to safely place a bet, handling rounding and minimum amount
      const safePlaceBet = async (
        betPayload: BetPayload,
        apiKey: string,
      ): Promise<PlaceBetResult> => {
        const roundedAmount = Math.round(betPayload.amount);

        if (roundedAmount < MIN_MANA_BET) {
          return {
            success: true,
            skipped: true,
            error: null,
            message: `Amount M${
              betPayload.amount.toFixed(2)
            } rounded to M${roundedAmount} is less than M${MIN_MANA_BET}, skipping bet`,
          };
        }

        const { data, error } = await placeManifoldBet(apiKey, {
          ...betPayload,
          amount: roundedAmount, // Use the rounded integer amount
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

      let betAId: string | null = null;
      const betDetails: Array<
        { market: string; status: string; amount?: number }
      > = [];
      let finalResponseMessage = "Arbitrage execution complete."; // Base message for success

      // Place Bet A
      const bet1Response = await safePlaceBet(betA, apiKey);
      if (bet1Response.skipped) {
        betDetails.push({
          market: "Market A",
          status: "skipped",
          amount: betA.amount,
        });
      } else if (!bet1Response.success) {
        throw new Error(`Bet on Market A failed: ${bet1Response.error}`);
      } else {
        betAId = bet1Response.data!.id;
        betDetails.push({
          market: "Market A",
          status: "placed",
          amount: bet1Response.data!.amount,
        });
      }

      // Place Bet B (only if Bet A was successful or skipped)
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
          if (cancelSuccess) {
            cancellationMessage =
              `The successful bet on Market A was automatically canceled.`;
          } else {
            cancellationMessage =
              `CRITICAL: Failed to cancel the bet on Market A (ID: ${betAId}). Please cancel it manually. Error: ${cancelError}`;
          }
        }
        throw new Error(
          `Bet on Market B failed: ${bet2Response.error}. ${cancellationMessage}`,
        );
      } else {
        betDetails.push({
          market: "Market B",
          status: "placed",
          amount: bet2Response.data!.amount,
        });
      }

      // Determine final success message based on what happened
      const allSkipped = betDetails.every((d) => d.status === "skipped");
      const anyPlaced = betDetails.some((d) => d.status === "placed");

      if (allSkipped) {
        finalResponseMessage = "All bets were too small and skipped.";
      } else if (anyPlaced) {
        finalResponseMessage = "Arbitrage bets placed successfully!";
      }

      return new Response(
        JSON.stringify({
          message: finalResponseMessage,
          marketAInfo: marketAInfo,
          marketBInfo: marketBInfo,
          betDetails: betDetails, // Send details about each bet's outcome
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    } catch (e) {
      // Catch errors from the top-level or from bet placement/cancellation failures
      const errorMessage = `Arbitrage execution failed: ${
        typeof e === "object" && e !== null && "message" in e
          ? (e as { message: string }).message
          : String(e)
      }`;
      return new Response(
        JSON.stringify({ message: errorMessage }), // Use 'message' for errors
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
};
