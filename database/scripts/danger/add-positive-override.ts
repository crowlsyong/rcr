// database/scripts/danger/add-positive-override.ts
/// <reference lib="deno.unstable" />

import db from "../../db.ts"; // Path to db.ts
import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";

const USER_USER_ID = "Y3ZEdMHLtoUXwiXGHaT6pj2Zj123"; // User's ID (Spin's ID)

// Ensure this matches the OverrideEvent interface in routes/api/v0/credit-score/index.ts
interface OverrideEvent {
  username: string;
  modifier: number; // e.g., -50, +50, -100
  url: string;
  timestamp: number; // When this event was recorded/created
  dateOfInfraction: number; // The date/time the event happened (for charting)
}

async function addScoreOverrideEvent(event: OverrideEvent): Promise<void> {
  await load({ export: true });

  console.log(
    `Attempting to add new score override event for ${event.username} (Modifier: ${event.modifier})...`,
  );

  await new Promise((resolve) => setTimeout(resolve, 100));

  // The KV key for each override event should be unique per user and timestamp.
  const kvKey = ["score_overrides", USER_USER_ID, event.timestamp];

  try {
    const check = await db.get(kvKey);
    if (check.value !== null) {
      console.warn(
        `Warning: An override event already exists for ${event.username} with timestamp ${event.timestamp}. Skipping to prevent duplicate.`,
      );
      return;
    }

    await db.set(kvKey, event);
    console.log(
      `✅ Successfully added override event for ${event.username} (Modifier: ${event.modifier}) on ${
        new Date(event.dateOfInfraction).toLocaleDateString()
      } UTC.`,
    );
    console.log(`Details: ${JSON.stringify(event, null, 2)}`);
  } catch (error) {
    console.error(
      `Error adding new score override: ${
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : String(error)
      }`,
      error,
    );
    Deno.exit(1);
  }
}

if (import.meta.main) {
  const now = Date.now(); // Timestamp for when this event is added
  const todayAtNoonUtc = new Date(
    Date.UTC(
      new Date().getUTCFullYear(),
      new Date().getUTCMonth(),
      new Date().getUTCDate(),
      12,
      0,
      0,
    ),
  ).getTime();

  // Define the positive adjustment event
  const positiveAdjustmentEvent: OverrideEvent = {
    username: "Spin", // Use the user's actual username for record keeping
    modifier: +50, // Add 50 points
    url: "https://manifold.markets/crowlsyong/loan-repayment-bonus", // Example URL for the bonus
    timestamp: now, // This timestamp makes the KV key unique for each run
    dateOfInfraction: todayAtNoonUtc, // The date you want the marker to appear on the chart (UTC)
  };

  // Run the function to add the override event
  // After running, check the chart at http://localhost:8000/chart/Spin
  await addScoreOverrideEvent(positiveAdjustmentEvent);
}
