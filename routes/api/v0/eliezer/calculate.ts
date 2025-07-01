// routes/api/v0/eliezer/calculate.ts
import { Handlers } from "$fresh/server.ts";
import {
  getMarketDataBySlug,
  fetchUserDataLiteById,
} from "../../../../utils/api/manifold_api_service.ts";
import {
  ContractMetric,
  MarketData,
} from "../../../../utils/api/manifold_types.ts";

interface CalculatePayoutsRequest {
  marketUrl: string;
  apologyPercentage: number;
}

interface UserPayout {
  userId: string;
  username: string;
  originalInvested: number;
  calculatedPayout: number;
}

interface EliezerCalculateResponse {
  success: boolean;
  marketSlug?: string;
  marketQuestion?: string;
  totalUsersToPay?: number;
  totalPayoutMana?: number;
  users?: UserPayout[];
  error?: string;
}

function handleError(message: string, status: number): Response {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const getMarketSlugFromUrlPath = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    const parts = urlObj.pathname.split("/");
    if (parts.length >= 3 && parts[parts.length - 1]) {
      return parts[parts.length - 1];
    }
    return null;
  } catch (_e) {
    return null;
  }
};

export const handler: Handlers<EliezerCalculateResponse> = {
  async POST(req) {
    const body: CalculatePayoutsRequest = await req.json();
    const { marketUrl, apologyPercentage } = body;

    if (!marketUrl) {
      return handleError("Missing marketUrl in request body.", 400);
    }
    if (typeof apologyPercentage !== "number" || apologyPercentage < 0 || apologyPercentage > 100) {
      return handleError("Invalid apology percentage provided. Must be between 0 and 100.", 400);
    }

    const PAYOUT_MULTIPLIER = apologyPercentage / 100;

    const pureMarketSlug = getMarketSlugFromUrlPath(marketUrl);
    if (!pureMarketSlug) {
      return handleError("Invalid Manifold market URL format provided.", 400);
    }

    try {
      console.log(`DEBUG: Attempting to fetch market data for slug: ${pureMarketSlug}`);
      const marketDataResult = await getMarketDataBySlug(pureMarketSlug);

      if (marketDataResult.error || !marketDataResult.data) {
        console.error(`DEBUG: Failed getMarketDataBySlug for '${pureMarketSlug}': ${marketDataResult.error}`);
        return handleError(
          marketDataResult.error || `Could not find market for slug: '${pureMarketSlug}'.`,
          404,
        );
      }
      const marketData: MarketData = marketDataResult.data;
      const marketId = marketData.id;
      const marketQuestion = marketData.question;
      console.log(`DEBUG: Found market ID: ${marketId}, Question: ${marketQuestion}`);

      const positionsUrl = `https://api.manifold.markets/v0/market/${marketId}/positions`;
      console.log(`DEBUG: Attempting to fetch positions from URL: ${positionsUrl}`);

      const fetchOptions: RequestInit = {
        headers: {
          "Accept": "application/json",
          "User-Agent": "Deno/1.x Fresh/1.x (ManifoldPayoutTool)",
        },
      };

      const positionsRawResponse = await fetch(positionsUrl, fetchOptions);

      if (!positionsRawResponse.ok) {
        let errorBody = "No response body.";
        try {
          errorBody = await positionsRawResponse.text();
        } catch (readErr) {
          errorBody = `Could not read error body: ${String(readErr)}`;
        }
        console.error(`DEBUG: Manifold positions API raw error response:`);
        console.error(`  Status: ${positionsRawResponse.status}`);
        console.error(`  StatusText: ${positionsRawResponse.statusText}`);
        console.error(`  Body: ${errorBody}`);
        return handleError(
          `Failed to fetch market positions from Manifold API. Status: ${positionsRawResponse.status}, Message: ${errorBody}`,
          500,
        );
      }

      const positions: ContractMetric[] = await positionsRawResponse.json();
      console.log(`DEBUG: Successfully fetched positions. Count: ${positions.length}`);

      const userManaSpent = new Map<string, {
        totalSpentMana: number;
      }>();
      const uniqueUserIds = new Set<string>();

      for (let i = 0; i < positions.length; i++) {
        const position = positions[i];

        if (position.userId && position.totalSpent) {
          uniqueUserIds.add(position.userId);

          const manaSpentOnPosition =
            (position.totalSpent.YES || 0) + (position.totalSpent.NO || 0);

          if (manaSpentOnPosition > 0) {
            const currentSpent = userManaSpent.get(position.userId);
            const newTotalSpent = (currentSpent?.totalSpentMana || 0) +
              manaSpentOnPosition;

            userManaSpent.set(position.userId, {
              totalSpentMana: newTotalSpent,
            });
          }
        }
      }

      console.log(`DEBUG: Number of unique user IDs with positions: ${uniqueUserIds.size}`);
      console.log(`DEBUG: Number of unique users with recorded mana spent > 0: ${userManaSpent.size}`);

      const userLookups = Array.from(uniqueUserIds).map(async (userId) => {
        const result = await fetchUserDataLiteById(userId);
        return { userId, userData: result.userData };
      });

      const userLookupResults = await Promise.all(userLookups);
      const userIdToUsernameMap = new Map<string, string>();

      for (const result of userLookupResults) {
        if (result.userData) {
          userIdToUsernameMap.set(result.userId, result.userData.username);
        }
      }
      console.log(`DEBUG: Successfully resolved usernames for ${userIdToUsernameMap.size} users.`);

      const usersToPay: UserPayout[] = [];
      let totalPayoutMana = 0;

      for (const [userId, data] of userManaSpent.entries()) {
        const username = userIdToUsernameMap.get(userId);
        if (username) {
          console.log(`CALC_DEBUG: User @${username} (ID: ${userId})`);
          console.log(`CALC_DEBUG:   totalSpentMana (originalInvested candidate): ${data.totalSpentMana}`);
          console.log(`CALC_DEBUG:   PAYOUT_MULTIPLIER: ${PAYOUT_MULTIPLIER}`);
          const calculatedPayoutBeforeCeil = data.totalSpentMana * PAYOUT_MULTIPLIER;
          console.log(`CALC_DEBUG:   calculatedPayout (before Math.ceil): ${calculatedPayoutBeforeCeil}`);
          const calculatedPayout = Math.ceil(calculatedPayoutBeforeCeil);
          console.log(`CALC_DEBUG:   calculatedPayout (after Math.ceil): ${calculatedPayout}`);

          if (calculatedPayout > 0) {
            usersToPay.push({
              userId: userId,
              username: username,
              originalInvested: data.totalSpentMana,
              calculatedPayout: calculatedPayout,
            });
            totalPayoutMana += calculatedPayout;
          } else {
            console.log(`DEBUG: Skipping user ${username} (${userId}) because calculated payout is 0.`);
          }
        } else {
          console.warn(`DEBUG: Could not resolve username for userId: ${userId}. Skipping payout.`);
        }
      }

      console.log(`DEBUG: Calculated payouts for ${usersToPay.length} final unique users.`);

      return new Response(
        JSON.stringify({
          success: true,
          marketSlug: `${marketData.creatorUsername || marketData.creatorName}/${marketData.slug}`,
          marketQuestion: marketQuestion,
          totalUsersToPay: usersToPay.length,
          totalPayoutMana: totalPayoutMana,
          users: usersToPay,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (e: unknown) {
      console.error(`DEBUG: Caught unhandled error in POST handler (outside direct fetch):`);
      console.error(e);
      return handleError(
        `Server error during calculation: ${
          typeof e === "object" && e !== null && "message" in e
            ? (e as { message: string }).message
            : String(e)
        }`,
        500,
      );
    }
  },
};
