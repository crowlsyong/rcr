// routes/api/v0/admin/update-override.ts
import { Handlers } from "$fresh/server.ts";
import db from "../../../../database/db.ts";
import { AdminState } from "../../../../routes/_middleware.ts";
import { OverrideEvent } from "../credit-score/index.ts"; // Import the interface

// Corrected interface: it needs userId, plus all OverrideEvent properties, and originalTimestamp
interface UpdateOverridePayload {
  userId: string; // Explicitly include userId here
  username: string;
  modifier: number;
  url: string;
  timestamp: number; // This 'timestamp' from the payload might be the one from the form,
  // but we'll use Date.now() for the new KV entry.
  dateOfInfraction: number;
  description: string;
  originalTimestamp: number; // The timestamp from the original event being modified
}

const getErrorMessage = (e: unknown): string => {
  return typeof e === "object" && e !== null && "message" in e
    ? (e as { message: string }).message
    : String(e);
};

export const handler: Handlers<null, AdminState> = {
  async POST(req, ctx) {
    console.log("API: /api/v0/admin/update-override POST handler hit!");

    if (!ctx.state.isAdmin) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Admin access required." }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    try {
      // Destructure directly from the parsed JSON, which matches the UpdateOverridePayload
      const {
        userId, // Now correctly part of the interface
        username,
        modifier,
        url,
        dateOfInfraction,
        description,
        originalTimestamp,
      }: UpdateOverridePayload = await req.json();

      if (
        !userId || typeof userId !== "string" || // Added typeof userId check
        !username || typeof modifier !== "number" || !url ||
        typeof dateOfInfraction !== "number" || !description ||
        typeof originalTimestamp !== "number"
      ) {
        return new Response(
          JSON.stringify({
            error: "Missing or invalid required fields for update.",
          }),
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

      // 1. Delete the old record
      const oldKvKey = ["score_overrides", userId, originalTimestamp];
      const oldEntry = await db.get(oldKvKey);

      if (oldEntry.value === null) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Original override entry not found for update.",
          }),
          { status: 404, headers: { "Content-Type": "application/json" } },
        );
      }

      await db.delete(oldKvKey);
      console.log(
        `Admin Update: Deleted old override record for ${username} at original timestamp ${originalTimestamp}.`,
      );

      // 2. Create the new (updated) record with a new timestamp for the event itself
      const updatedOverrideEvent: OverrideEvent = {
        username,
        modifier,
        url,
        timestamp: Date.now(), // New timestamp for the updated event
        dateOfInfraction,
        description,
      };

      const newKvKey = [
        "score_overrides",
        userId,
        updatedOverrideEvent.timestamp,
      ];

      const newExistingEntry = await db.get(newKvKey);
      if (newExistingEntry.value !== null) {
        console.error(
          `Collision detected when trying to save updated override for ${username}. New timestamp ${updatedOverrideEvent.timestamp} already exists.`,
        );
        await db.set(oldKvKey, oldEntry.value); // Attempt to re-add the old entry for data integrity
        return new Response(
          JSON.stringify({
            success: false,
            error:
              "A conflict occurred saving the updated override. Please try again.",
          }),
          { status: 409, headers: { "Content-Type": "application/json" } },
        );
      }

      await db.set(newKvKey, updatedOverrideEvent);

      console.log(
        `Admin Update: Successfully updated override for ${username} (${userId}). Modifier: ${modifier}, Date: ${
          new Date(dateOfInfraction).toLocaleDateString()
        }. New timestamp: ${updatedOverrideEvent.timestamp}.`,
      );

      return new Response(
        JSON.stringify({
          success: true,
          message: "Credit score override updated successfully.",
          event: updatedOverrideEvent,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    } catch (e) {
      console.error("API: update-override handler caught error:", e);
      return new Response(
        JSON.stringify({
          error: `Server error: ${getErrorMessage(e)}`,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
};
