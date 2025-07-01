// routes/api/v0/eliezer/execute.ts
import { Handlers } from "$fresh/server.ts";
import {
  postDataToManifoldApi,
  getMarketDataBySlug,
} from "../../../../utils/api/manifold_api_service.ts";
import {
  ManaPaymentTransaction,
} from "../../../../utils/api/manifold_types.ts";

// Define log entry interfaces
interface SuccessfulPayoutLog {
  timestamp: string;
  status: "success";
  userId: string;
  username: string;
  originalInvested: number;
  calculatedPayout: number;
  manaSent: number;
  managramMessage: string;
  transactionId: string;
  marketUrl: string;
  apologyPercentage: number;
  customMessageUsed: boolean;
}

interface FailedPayoutLog {
  timestamp: string;
  status: "failed" | "skipped";
  userId: string;
  username: string;
  originalInvested: number;
  calculatedPayout: number;
  reason: string;
  managramMessage: string;
  marketUrl: string;
  apologyPercentage: number;
  customMessageUsed: boolean;
}

type DetailedPayoutLog = SuccessfulPayoutLog | FailedPayoutLog;

interface UserPayout {
  userId: string;
  username: string;
  originalInvested: number;
  calculatedPayout: number;
}

interface ExecutePayoutsRequest {
  apiKey: string;
  users: UserPayout[];
  marketId: string;
  marketSlugFull: string;
  apologyPercentage: number;
  customManagramMessage: string | null;
}

interface ExecutePayoutsResponse {
  success: boolean;
  message?: string;
  errors?: { userId: string; username: string; error: string }[];
  transactions?: { userId: string; username: string; transactionId: string }[];
  marketResolution?: { status: string; message: string };
  totalPaidMana?: number;
  totalErrors?: number;
  detailedLogs?: DetailedPayoutLog[];
}

function handleError(message: string, status: number): Response {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const handler: Handlers<ExecutePayoutsResponse> = {
  async POST(req) {
    const body: ExecutePayoutsRequest = await req.json();
    const { apiKey, users, marketId, marketSlugFull, apologyPercentage, customManagramMessage } = body;

    if (!apiKey) {
      return handleError("API key is required for execution.", 401);
    }
    if (!users || users.length === 0 || !marketId || !marketSlugFull || typeof apologyPercentage !== "number") {
      return handleError("Invalid request body for execution.", 400);
    }

    const errors: { userId: string; username: string; error: string }[] = [];
    const transactions: {
      userId: string;
      username: string;
      transactionId: string;
    }[] = [];
    const detailedLogs: DetailedPayoutLog[] = [];
    let totalPaidMana = 0;

    const pureMarketSlugForLookup = marketSlugFull.split("/").pop();
    let marketUrlForMessage = `https://manifold.markets/${marketSlugFull}`;

    if (pureMarketSlugForLookup) {
      const marketDataResult = await getMarketDataBySlug(pureMarketSlugForLookup);
      if (marketDataResult.data && marketDataResult.data.url) {
        marketUrlForMessage = marketDataResult.data.url;
      }
    }

    const MIN_MANAGRAM_AMOUNT = 10;

    for (const user of users) {
      const timestamp = new Date().toISOString();
      const roundedOriginalInvested = Math.round(user.originalInvested);
      const amountToSend = user.calculatedPayout;

      const messageToUse = customManagramMessage
        ? customManagramMessage
        : `${apologyPercentage}% Payment as an apology for locked funds in ${marketUrlForMessage} | Invested M${roundedOriginalInvested} | Apology payment M${amountToSend}`;

      const customMessageWasUsed = customManagramMessage !== null;

      // REMOVED message truncation to finalManagramMessage here.
      // API will handle truncation if needed, based on your testing.
      const finalManagramMessage = messageToUse; 

      if (amountToSend < MIN_MANAGRAM_AMOUNT) {
        const reason = `Skipped: Mana to send (M${amountToSend}) is below Manifold's minimum managram amount of M${MIN_MANAGRAM_AMOUNT}.`;
        errors.push({
          userId: user.userId,
          username: user.username,
          error: reason,
        });
        detailedLogs.push({
          timestamp: timestamp,
          status: "skipped",
          userId: user.userId,
          username: user.username,
          originalInvested: roundedOriginalInvested,
          calculatedPayout: amountToSend,
          reason: reason,
          managramMessage: finalManagramMessage,
          marketUrl: marketUrlForMessage,
          apologyPercentage: apologyPercentage,
          customMessageUsed: customMessageWasUsed,
        });
        continue;
      }

      try {
        const sendResult = await postDataToManifoldApi<ManaPaymentTransaction>(
          "/managram",
          { toIds: [user.userId], amount: amountToSend, message: finalManagramMessage },
          apiKey,
        );

        if (!sendResult.success || !sendResult.data) {
          const reason = sendResult.error || "Unknown error sending mana.";
          errors.push({
            userId: user.userId,
            username: user.username,
            error: reason,
          });
          detailedLogs.push({
            timestamp: timestamp,
            status: "failed",
            userId: user.userId,
            username: user.username,
            originalInvested: roundedOriginalInvested,
            calculatedPayout: amountToSend,
            reason: reason,
            managramMessage: finalManagramMessage,
            marketUrl: marketUrlForMessage,
            apologyPercentage: apologyPercentage,
            customMessageUsed: customMessageWasUsed,
          });
        } else {
          transactions.push({
            userId: user.userId,
            username: user.username,
            transactionId: sendResult.data.id,
          });
          totalPaidMana += amountToSend;
          detailedLogs.push({
            timestamp: timestamp,
            status: "success",
            userId: user.userId,
            username: user.username,
            originalInvested: roundedOriginalInvested,
            calculatedPayout: amountToSend,
            manaSent: amountToSend,
            managramMessage: finalManagramMessage,
            transactionId: sendResult.data.id,
            marketUrl: marketUrlForMessage,
            apologyPercentage: apologyPercentage,
            customMessageUsed: customMessageWasUsed,
          });
        }
      } catch (e: unknown) {
        const reason = `Network/fetch error: ${
          typeof e === "object" && e !== null && "message" in e
            ? (e as { message: string }).message
            : String(e)
        }`;
        errors.push({
          userId: user.userId,
          username: user.username,
          error: reason,
        });
        detailedLogs.push({
          timestamp: timestamp,
          status: "failed",
          userId: user.userId,
          username: user.username,
          originalInvested: roundedOriginalInvested,
          calculatedPayout: amountToSend,
          reason: reason,
          managramMessage: finalManagramMessage,
          marketUrl: marketUrlForMessage,
          apologyPercentage: apologyPercentage,
          customMessageUsed: customMessageWasUsed,
        });
      }
    }

    const marketResolutionStatus =
      "Managrams under M10 are skipped due to Manifold API limitations. Contact @crowlsyong on Manifold if you have questions.";

    return new Response(
      JSON.stringify({
        success: errors.length === 0,
        message:
          errors.length === 0
            ? "All payouts attempted successfully."
            : `Completed payouts with ${errors.length} error(s).`,
        errors: errors,
        transactions: transactions,
        marketResolution: { status: "manual_action_required", message: marketResolutionStatus },
        totalPaidMana: totalPaidMana,
        totalErrors: errors.length,
        detailedLogs: detailedLogs,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  },
};
