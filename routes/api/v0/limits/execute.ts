// routes/api/v0/limits/execute.ts
import { Handlers } from "$fresh/server.ts";
import {
  cancelManifoldBet,
  placeManifoldBet,
} from "../../../../utils/api/manifold_api_service.ts";
import { BetPayload } from "../../../../utils/api/manifold_types.ts";

interface ApiOrder {
  amount: number;
  outcome: "YES" | "NO";
  limitProb: number;
}

interface LimitOrderRequestBody {
  apiKey: string;
  contractId: string;
  orders: ApiOrder[];
  answerId?: string;
  expiresMillisAfter?: number;
  expiresAt?: number;
}

function createErrorResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const handler: Handlers = {
  async POST(req) {
    try {
      const body: LimitOrderRequestBody = await req.json();
      const {
        apiKey,
        contractId,
        orders,
        answerId,
        expiresAt,
        expiresMillisAfter,
      } = body;

      if (!apiKey || !contractId) {
        return createErrorResponse("Missing API Key or Contract ID", 400);
      }
      if (!Array.isArray(orders) || orders.length === 0) {
        return createErrorResponse("No orders provided for execution", 400);
      }

      const successfulBetIds: string[] = [];
      try {
        for (const order of orders) {
          if (
            isNaN(order.amount) || !order.outcome || isNaN(order.limitProb) ||
            (order.outcome !== "YES" && order.outcome !== "NO") ||
            order.amount < 1
          ) {
            // Skip orders with invalid data or amount less than 1
            console.warn("Skipping invalid or zero-amount order:", order);
            continue;
          }

          const betPayload: BetPayload = {
            contractId,
            amount: Math.round(order.amount),
            outcome: order.outcome,
            limitProb: order.limitProb,
            ...(answerId && { answerId }),
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
            success: true,
            message:
              `Successfully placed ${successfulBetIds.length} limit orders.`,
            betIds: successfulBetIds,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      } catch (e) {
        // This is the rollback logic
        if (successfulBetIds.length > 0) {
          console.warn(
            `A bet failed. Attempting to cancel ${successfulBetIds.length} successful bet(s).`,
          );
          await Promise.all(
            successfulBetIds.map((betId) => cancelManifoldBet(apiKey, betId)),
          );
        }

        const errorMessage = typeof e === "object" && e !== null &&
            "message" in e
          ? (e as { message: string }).message
          : String(e);

        return createErrorResponse(
          `A bet failed: ${errorMessage}. Attempted to cancel ${successfulBetIds.length} prior successful bet(s). Please verify your position on Manifold.`,
          500,
        );
      }
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
