// routes/api/place-limit-orders.ts
import { Handlers } from "$fresh/server.ts";

interface BetPayload {
  amount: number;
  contractId: string;
  outcome: "YES" | "NO";
  limitProb: number;
  expiresMillisAfter?: number;
  expiresAt?: number; // Add optional expiresAt
}

// ... (BetResponse interface remains the same) ...
interface BetResponse {
  id: string;
  userId: string;
  contractId: string;
  createdTime: number;
  amount: number;
  outcome: "YES" | "NO";
  shares: number;
  probBefore: number;
  probAfter: number;
  isFilled: boolean;
  isCancelled: boolean;
}

export const handler: Handlers = {
  async POST(req) {
    try {
      const {
        apiKey,
        contractId,
        yesAmount,
        noAmount,
        yesLimitProb,
        noLimitProb,
        expiresMillisAfter,
        expiresAt, // This can be a number or undefined
      } = await req.json();

      // ... (Validation logic remains the same) ...
      if (
        !apiKey || !contractId || isNaN(yesAmount) || isNaN(noAmount) ||
        isNaN(yesLimitProb) || isNaN(noLimitProb)
      ) {
        return new Response(
          JSON.stringify({ error: "Missing or invalid required parameters" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      if (expiresMillisAfter !== undefined && isNaN(expiresMillisAfter)) {
        return new Response(
          JSON.stringify({
            error: "If provided, expiresMillisAfter must be a number",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      if (expiresAt !== undefined && isNaN(expiresAt)) {
        return new Response(
          JSON.stringify({
            error: "If provided, expiresAt must be a number",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const manifoldApiUrl = "https://api.manifold.markets/v0/bet";
      const authHeaders = {
        "Authorization": `Key ${apiKey}`,
        "Content-Type": "application/json",
      };

      let yesBetId: string | null = null;
      let overallSuccess = false;
      const placementResults: {
        yesBetResponse?: BetResponse;
        noBetResponse?: BetResponse;
        error?: string;
      } = {};

      try {
        const yesPayload: BetPayload = {
          amount: yesAmount,
          contractId: contractId,
          outcome: "YES",
          limitProb: yesLimitProb,
        };
        if (expiresMillisAfter) {
          yesPayload.expiresMillisAfter = expiresMillisAfter;
        } else if (expiresAt) {
          yesPayload.expiresAt = expiresAt;
        }

        const yesResponse = await fetch(manifoldApiUrl, {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify(yesPayload),
        });

        const yesData = await yesResponse.json();
        if (!yesResponse.ok) {
          throw new Error(
            `YES bet failed: ${JSON.stringify(yesData?.message || yesData)}`,
          );
        }
        yesBetId = yesData.id;
        placementResults.yesBetResponse = yesData as BetResponse;

        const noPayload: BetPayload = {
          amount: noAmount,
          contractId: contractId,
          outcome: "NO",
          limitProb: noLimitProb,
        };
        if (expiresMillisAfter) {
          noPayload.expiresMillisAfter = expiresMillisAfter;
        } else if (expiresAt) {
          noPayload.expiresAt = expiresAt;
        }

        const noResponse = await fetch(manifoldApiUrl, {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify(noPayload),
        });

        const noData = await noResponse.json();
        if (!noResponse.ok) {
          throw new Error(
            `NO bet failed: ${JSON.stringify(noData?.message || noData)}`,
          );
        }
        placementResults.noBetResponse = noData as BetResponse;

        overallSuccess = true;
      } catch (betError) {
        placementResults.error = `Bet placement failed: ${
          typeof betError === "object" && betError !== null &&
            "message" in betError
            ? (betError as { message: string }).message
            : String(betError)
        }`;
        console.error("Bet placement attempt failed:", placementResults.error);
      } finally {
        if (!overallSuccess && yesBetId) {
          console.warn(
            `Attempting to cancel YES bet ${yesBetId} due to NO bet failure.`,
          );
          try {
            const cancelResponse = await fetch(
              `https://api.manifold.markets/v0/bet/cancel/${yesBetId}`,
              {
                method: "POST",
                headers: { "Authorization": `Key ${apiKey}` },
              },
            );
            if (!cancelResponse.ok) {
              const cancelError = await cancelResponse.json();
              const errorMsg = `Failed to cancel YES bet ${yesBetId}: ${
                JSON.stringify(cancelError)
              }`;
              console.error(errorMsg);
              placementResults.error +=
                `. Additionally, failed to automatically cancel the successful YES bet. Please manually cancel bet ID: ${yesBetId}`;
            } else {
              placementResults.error +=
                `. Successfully rolled back by canceling YES bet ${yesBetId}.`;
            }
          } catch (cancelErr) {
            const errorMsg =
              `Network error during cancellation of YES bet ${yesBetId}: ${
                String(cancelErr)
              }`;
            console.error(errorMsg);
            placementResults.error +=
              `. Network error while attempting to cancel the successful YES bet. Please manually cancel bet ID: ${yesBetId}`;
          }
        }
      }

      if (overallSuccess) {
        return new Response(
          JSON.stringify({
            message: "Both bets placed successfully!",
            data: placementResults,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      } else {
        return new Response(
          JSON.stringify({
            message: "Failed to place both bets.",
            error: placementResults.error,
            data: placementResults,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          },
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
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
};
