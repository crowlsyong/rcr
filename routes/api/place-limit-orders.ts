import { Handlers } from "$fresh/server.ts";
import {
  cancelManifoldBet,
  placeManifoldBet,
} from "../../utils/api/manifold_bet_helpers.ts";
import {
  BetPayload,
  ManifoldBetResponse,
} from "../../utils/api/manifold_types.ts";

interface ApiOrder {
  amount: number;
  outcome: "YES" | "NO";
  limitProb: number;
}

interface MultiBetPlacementBody {
  apiKey: string;
  contractId: string;
  orders: ApiOrder[];
  answerId?: string;
  expiresMillisAfter?: number;
  expiresAt?: number;
}

type IncomingRequestBody =
  | MultiBetPlacementBody
  | (BetPayload & {
    apiKey: string;
    contractId: string;
    answerId?: string;
    yesAmount: number;
    noAmount: number;
    yesLimitProb: number;
    noLimitProb: number;
  });

export const handler: Handlers = {
  async POST(req, _ctx) {
    try {
      const body: IncomingRequestBody = await req.json();
      const { apiKey, contractId, expiresAt, expiresMillisAfter, answerId } =
        body;

      if (!apiKey || !contractId) {
        return new Response(
          JSON.stringify({ error: "Missing API Key or Contract ID" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

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
            if (
              isNaN(order.amount) || !order.outcome || isNaN(order.limitProb) ||
              (order.outcome !== "YES" && order.outcome !== "NO")
            ) {
              throw new Error("Invalid individual order parameters");
            }

            const betPayload: BetPayload = {
              contractId,
              amount: order.amount,
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
              message:
                `Successfully placed ${successfulBetIds.length} limit orders`,
              betIds: successfulBetIds,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (e) {
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
      } else if (
        "yesAmount" in body && "noAmount" in body && "yesLimitProb" in body &&
        "noLimitProb" in body
      ) {
        const { yesAmount, noAmount, yesLimitProb, noLimitProb } = body;

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
          const yesPayload: BetPayload = {
            amount: yesAmount,
            contractId: contractId,
            outcome: "YES",
            limitProb: yesLimitProb,
            ...(answerId && { answerId }),
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

          const noPayload: BetPayload = {
            amount: noAmount,
            contractId: contractId,
            outcome: "NO",
            limitProb: noLimitProb,
            ...(answerId && { answerId }),
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
