import { Handlers } from "$fresh/server.ts";
import {
  cancelManifoldBet,
  placeManifoldBet,
} from "../../utils/api/manifold_bet_helpers.ts";
import { BetPayload } from "../../utils/api/manifold_types.ts";

interface RequestBody {
  apiKey: string;
  betA: BetPayload;
  betB: BetPayload;
}

export const handler: Handlers = {
  async POST(req, _ctx) {
    try {
      const { apiKey, betA, betB }: RequestBody = await req.json();

      if (!apiKey || !betA || !betB) {
        return new Response(
          JSON.stringify({ error: "Missing required parameters" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      let betAId: string | null = null;
      try {
        const { data: betAData, error: betAError } = await placeManifoldBet(
          apiKey,
          betA,
        );

        if (betAError || !betAData) {
          throw new Error(`Bet on Market A failed: ${betAError}`);
        }
        betAId = betAData.id;

        const { data: betBData, error: betBError } = await placeManifoldBet(
          apiKey,
          betB,
        );

        if (betBError || !betBData) {
          throw new Error(`Bet on Market B failed: ${betBError}`);
        }

        return new Response(
          JSON.stringify({
            message: "Arbitrage bets placed successfully!",
            betA: betAData,
            betB: betBData,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      } catch (e) {
        let errorMessage = typeof e === "object" && e !== null &&
            "message" in e
          ? (e as { message: string }).message
          : String(e);

        if (betAId) {
          console.warn(
            `Attempting to cancel bet ${betAId} due to a subsequent failure.`,
          );
          const { success, error: cancelError } = await cancelManifoldBet(
            apiKey,
            betAId,
          );
          if (success) {
            errorMessage +=
              `. The successful bet on Market A was automatically canceled.`;
          } else {
            errorMessage +=
              `. CRITICAL: Failed to cancel the bet on Market A (ID: ${betAId}). Please cancel it manually. Error: ${cancelError}`;
          }
        }

        return new Response(
          JSON.stringify({ error: errorMessage }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }
    } catch (e) {
      return new Response(
        JSON.stringify({
          error: `Internal server error: ${
            typeof e === "object" && e !== null && "message" in e
              ? (e as { message: string }).message
              : String(e)
          }`,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
};
