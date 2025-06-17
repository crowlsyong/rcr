import { Handlers } from "$fresh/server.ts";
import {
  cancelManifoldBet,
  ManifoldBetResponse,
  placeManifoldBet,
} from "../../utils/api/manifold_bet_helpers.ts";

// Interface for a single bet payload (used internally and by old frontend)
interface SingleBetPayload {
  amount: number;
  contractId: string;
  outcome: "YES" | "NO";
  limitProb: number;
  expiresMillisAfter?: number;
  expiresAt?: number;
}

// Interface for the incoming order objects within the new 'orders' array
interface ApiOrder {
  amount: number;
  outcome: "YES" | "NO";
  limitProb: number;
}

// Interface for the new request body (for volatility bets)
interface MultiBetPlacementBody {
  apiKey: string;
  contractId: string;
  orders: ApiOrder[];
  expiresMillisAfter?: number;
  expiresAt?: number;
}

// Combined interface to handle both possible incoming request body shapes
type IncomingRequestBody =
  | MultiBetPlacementBody
  | (SingleBetPayload & {
    apiKey: string;
    contractId: string;
    yesAmount: number; // For the old format
    noAmount: number; // For the old format
    yesLimitProb: number; // For the old format
    noLimitProb: number; // For the old format
  });

export const handler: Handlers = {
  async POST(req, _ctx) {
    try {
      const body: IncomingRequestBody = await req.json();
      const { apiKey, contractId, expiresAt, expiresMillisAfter } = body;

      // Basic common validation
      if (!apiKey || !contractId) {
        return new Response(
          JSON.stringify({ error: "Missing API Key or Contract ID" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      // Check for expiration parameter validity if provided
      if (expiresMillisAfter !== undefined && isNaN(expiresMillisAfter)) {
        return new Response(
          JSON.stringify({
            error: "If provided, expiresMillisAfter must be a number",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }
      if (expiresAt !== undefined && isNaN(expiresAt)) {
        return new Response(
          JSON.stringify({
            error: "If provided, expiresAt must be a number",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      // --- LOGIC TO HANDLE BOTH OLD AND NEW PAYLOAD STRUCTURES ---
      // New payload: expects 'orders' array
      if ("orders" in body && Array.isArray(body.orders)) {
        if (body.orders.length === 0) {
          return new Response(
            JSON.stringify({ error: "No orders provided for multi-bet" }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }

        const successfulBetIds: string[] = [];

        try {
          for (const order of body.orders) {
            // Validate individual order structure
            if (
              isNaN(order.amount) || !order.outcome || isNaN(order.limitProb) ||
              (order.outcome !== "YES" && order.outcome !== "NO")
            ) {
              throw new Error("Invalid individual order parameters");
            }

            const betPayload: SingleBetPayload = {
              contractId,
              amount: order.amount,
              outcome: order.outcome,
              limitProb: order.limitProb,
              ...(expiresAt && { expiresAt }),
              ...(expiresMillisAfter && { expiresMillisAfter }),
            };

            const { data, error } = await placeManifoldBet(apiKey, betPayload);

            if (error || !data) {
              throw new Error(error || "Bet placement failed with no message");
            }
            successfulBetIds.push(data.id);
          }

          return new Response(
            JSON.stringify({
              message:
                `Successfully placed ${successfulBetIds.length} limit orders`,
              betIds: successfulBetIds,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (e) {
          // If any bet fails, attempt to cancel the ones that succeeded
          if (successfulBetIds.length > 0) {
            console.warn(
              `Attempting to cancel ${successfulBetIds.length} successful bet(s) due to a subsequent failure.`,
            );
            await Promise.all(
              successfulBetIds.map((betId) => cancelManifoldBet(apiKey, betId)),
            );
          }

          const errorMessage = typeof e === "object" && e !== null &&
              "message" in e
            ? (e as { message: string }).message
            : String(e);

          return new Response(
            JSON.stringify({
              error:
                `A bet failed: ${errorMessage}. Attempted to cancel ${successfulBetIds.length} prior successful bet(s). Please verify on Manifold.`,
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      } // Old payload: expects yesAmount, noAmount etc. (for single pair)
      else if (
        "yesAmount" in body && "noAmount" in body && "yesLimitProb" in body &&
        "noLimitProb" in body
      ) {
        const { yesAmount, noAmount, yesLimitProb, noLimitProb } = body;

        // Validation for old format
        if (
          isNaN(yesAmount) || isNaN(noAmount) || isNaN(yesLimitProb) ||
          isNaN(noLimitProb)
        ) {
          return new Response(
            JSON.stringify({
              error: "Missing or invalid required parameters for single bet",
            }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }

        let yesBetId: string | null = null;
        let overallSuccess = false;
        const placementResults: {
          yesBetResponse?: ManifoldBetResponse;
          noBetResponse?: ManifoldBetResponse;
          error?: string;
        } = {};

        try {
          const yesPayload: SingleBetPayload = {
            amount: yesAmount,
            contractId: contractId,
            outcome: "YES",
            limitProb: yesLimitProb,
            ...(expiresMillisAfter && { expiresMillisAfter }),
            ...(expiresAt && { expiresAt }),
          };

          const { data: yesData, error: yesError } = await placeManifoldBet(
            apiKey,
            yesPayload,
          );

          if (yesError || !yesData) {
            throw new Error(`YES bet failed: ${yesError}`);
          }
          yesBetId = yesData.id;
          placementResults.yesBetResponse = yesData;

          const noPayload: SingleBetPayload = {
            amount: noAmount,
            contractId: contractId,
            outcome: "NO",
            limitProb: noLimitProb,
            ...(expiresMillisAfter && { expiresMillisAfter }),
            ...(expiresAt && { expiresAt }),
          };

          const { data: noData, error: noError } = await placeManifoldBet(
            apiKey,
            noPayload,
          );

          if (noError || !noData) {
            throw new Error(`NO bet failed: ${noError}`);
          }
          placementResults.noBetResponse = noData;

          overallSuccess = true;
        } catch (betError) {
          placementResults.error = `Bet placement failed: ${
            typeof betError === "object" && betError !== null &&
              "message" in betError
              ? (betError as { message: string }).message
              : String(betError)
          }`;
          console.error(
            "Single bet placement attempt failed:",
            placementResults.error,
          );
        } finally {
          if (!overallSuccess && yesBetId) {
            console.warn(
              `Attempting to cancel YES bet ${yesBetId} due to NO bet failure.`,
            );
            const { success, error } = await cancelManifoldBet(
              apiKey,
              yesBetId,
            );
            if (!success) {
              placementResults.error +=
                `. Additionally, failed to automatically cancel the successful YES bet. Please manually cancel bet ID: ${yesBetId}. Error: ${error}`;
            } else {
              placementResults.error +=
                `. Successfully rolled back by canceling YES bet ${yesBetId}.`;
            }
          }
        }

        if (overallSuccess) {
          return new Response(
            JSON.stringify({
              message: "Both bets placed successfully!",
              data: placementResults,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } else {
          return new Response(
            JSON.stringify({
              message: "Failed to place both bets.",
              error: placementResults.error,
              data: placementResults,
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      } else {
        // Fallback if neither expected structure is found
        return new Response(
          JSON.stringify({ error: "Invalid request body structure" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }
    } catch (e) {
      return new Response(
        JSON.stringify({
          error: `Internal server error processing request: ${
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
