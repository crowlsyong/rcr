// routes/api/v0/admin/adjust-score.ts
import { Handlers } from "$fresh/server.ts";
import db from "../../../../database/db.ts";
import { AdminState } from "../../../../routes/_middleware.ts";

interface OverrideEvent {
  username: string;
  modifier: number;
  url: string;
  timestamp: number;
  dateOfInfraction: number;
  description: string;
}

const getErrorMessage = (e: unknown): string => {
  return typeof e === "object" && e !== null && "message" in e
    ? (e as { message: string }).message
    : String(e);
};

export const handler: Handlers<null, AdminState> = {
  async POST(req, ctx) {
    console.log("API: /api/v0/admin/adjust-score POST handler hit!"); // NEW: Debugging log

    if (!ctx.state.isAdmin) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Admin access required." }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    try {
      const { userId, username, modifier, url, dateOfInfraction, description } =
        await req.json();

      if (
        !userId || !username || typeof modifier !== "number" || !url ||
        typeof dateOfInfraction !== "number" || !description
      ) {
        return new Response(
          JSON.stringify({ error: "Missing or invalid required fields." }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }
      if (isNaN(dateOfInfraction)) {
        return new Response(
          JSON.stringify({
            error: "dateOfInfraction must be a valid timestamp.",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const newOverrideEvent: OverrideEvent = {
        username,
        modifier,
        url,
        timestamp: Date.now(),
        dateOfInfraction,
        description,
      };

      const kvKey = ["score_overrides", userId, newOverrideEvent.timestamp];

      const existingEntry = await db.get(kvKey);
      if (existingEntry.value !== null) {
        return new Response(
          JSON.stringify({
            success: false,
            error:
              "An override for this user with this exact timestamp already exists. Please use a unique timestamp.",
          }),
          { status: 409, headers: { "Content-Type": "application/json" } },
        );
      }

      await db.set(kvKey, newOverrideEvent);

      console.log(
        `Admin Adjust: Added override for ${username} (${userId}). Modifier: ${modifier}, Date: ${
          new Date(dateOfInfraction).toLocaleDateString()
        }.`,
      );

      return new Response(
        JSON.stringify({
          success: true,
          message: "Credit score override added successfully.",
          event: newOverrideEvent,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    } catch (e) {
      console.error("API: adjust-score handler caught error:", e); // NEW: Log handler errors
      return new Response(
        JSON.stringify({
          error: `Server error: ${getErrorMessage(e)}`,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
};
