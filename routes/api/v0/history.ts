// routes/api/v0/history.ts
import { Handlers } from "$fresh/server.ts";
import db from "../../../database/db.ts";
import { OverrideEvent } from "./credit-score/index.ts"; // Import OverrideEvent

interface CreditScoreDataPoint {
  userId: string;
  username: string;
  creditScore: number; // This should now always be the BASE score when stored
  timestamp: number;
}

const getErrorMessage = (e: unknown): string => {
  return typeof e === "object" && e !== null && "message" in e
    ? (e as { message: string }).message
    : String(e);
};

export const handler: Handlers = {
  async GET(req): Promise<Response> {
    const url = new URL(req.url);
    const username = url.searchParams.get("username");
    const userId = url.searchParams.get("userId");

    if (!username && !userId) {
      return new Response("Username or userId is required", { status: 400 });
    }

    let targetUserId: string | null = userId;

    if (!targetUserId && username) {
      try {
        // Assume fetchUserData is available to get userId from username
        const userRes = await fetch(
          `https://api.manifold.markets/v0/user/${username}`,
        );
        if (!userRes.ok) {
          if (userRes.status === 404) {
            return new Response(`User ${username} not found`, { status: 404 });
          }
          throw new Error(
            `Failed to fetch user data for ${username}: ${userRes.statusText}`,
          );
        }
        const userData = await userRes.json();
        targetUserId = userData.id;
      } catch (error) {
        console.error(
          `Error fetching user ID for username '${username}':`,
          error,
        );
        return new Response(`Error fetching user data for ${username}`, {
          status: 500,
        });
      }
    }

    if (!targetUserId) {
      return new Response("Could not determine user ID", { status: 500 });
    }

    const historicalData: CreditScoreDataPoint[] = [];
    const historyPrefix = ["credit_scores", targetUserId];

    const overrideEvents: OverrideEvent[] = []; // This will fetch all override events
    const overridePrefix = ["score_overrides", targetUserId];

    try {
      // Fetch all historical score data points (these are now BASE scores)
      for await (
        const entry of db.list<CreditScoreDataPoint>({ prefix: historyPrefix })
      ) {
        historicalData.push(entry.value);
      }

      // Fetch all override events for the user
      for await (
        const entry of db.list<OverrideEvent>({ prefix: overridePrefix })
      ) {
        overrideEvents.push(entry.value);
      }

      // Sort historical data by timestamp in ascending order
      historicalData.sort((a, b) => a.timestamp - b.timestamp);

      // **** CRITICAL: Apply overrides to BASE historical data points ON READ ****
      const adjustedHistoricalData = historicalData.map((dataPoint) => {
        let totalModifierForThisDate = 0;
        // Sum modifiers from all events whose dateOfInfraction is ON or BEFORE this historical dataPoint's timestamp
        // And ensure the event's timestamp is also <= the dataPoint's timestamp (if you want the event to "exist" at that time)
        for (const overrideEvent of overrideEvents) {
          // Only apply modifier if its dateOfInfraction is on or before the current data point's timestamp
          if (overrideEvent.dateOfInfraction <= dataPoint.timestamp) {
            totalModifierForThisDate += overrideEvent.modifier;
          }
        }

        // Calculate the adjusted score for this historical data point
        // Ensure score stays within 0-1000 range
        const adjustedScore = Math.max(
          0,
          Math.min(1000, dataPoint.creditScore + totalModifierForThisDate),
        );

        // Return a new data point with the adjusted score
        return {
          ...dataPoint,
          creditScore: adjustedScore,
        };
      });

      return new Response(JSON.stringify(adjustedHistoricalData), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error(
        `Error fetching and adjusting historical data for user ID '${targetUserId}':`,
        error,
      );
      return new Response(
        `Error fetching historical data: ${getErrorMessage(error)}`,
        { status: 500 },
      );
    }
  },
};
