/// <reference lib="deno.unstable" />
// routes/api/history.ts

import { Handlers } from "$fresh/server.ts";
import db from "../../database/db.ts"; // Import the KV database instance

interface CreditScoreDataPoint {
  userId: string;
  username: string;
  creditScore: number;
  timestamp: number;
}

export const handler: Handlers = {
  async GET(req): Promise<Response> {
    const url = new URL(req.url);
    const username = url.searchParams.get("username");
    const userId = url.searchParams.get("userId"); // Also allow fetching by userId

    if (!username && !userId) {
      return new Response("Username or userId is required", { status: 400 });
    }

    let targetUserId: string | null = userId;

    // If only username is provided, try to fetch the user data to get the userId
    if (!targetUserId && username) {
      try {
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
      // This case should theoretically not happen if username or userId was provided and processed
      return new Response("Could not determine user ID", { status: 500 });
    }

    const historicalData: CreditScoreDataPoint[] = [];
    const prefix = ["credit_scores", targetUserId];

    try {
      // Use db.list to get all entries with the specified prefix
      // The keys are ordered by the components, so this will return data chronologically
      for await (const entry of db.list<CreditScoreDataPoint>({ prefix })) {
        historicalData.push(entry.value);
      }

      // Sort the data points by timestamp in ascending order, just in case db.list order changes
      // although with the timestamp in the key, it should be sorted by default.
      historicalData.sort((a, b) => a.timestamp - b.timestamp);

      return new Response(JSON.stringify(historicalData), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error(
        `Error fetching historical data for user ID '${targetUserId}':`,
        error,
      );
      return new Response("Error fetching historical data", { status: 500 });
    }
  },
};
