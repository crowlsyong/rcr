// database/scripts/danger/delete-score-override.ts
/// <reference lib="deno.unstable" />

import db from "../../db.ts";
import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";

const TARGET_USER_ID = "p9Y7TzXx4NO1JQb9kjdbUYRUU3X2"; // Your User ID
// FIXED: Use the correct `timestamp` that was part of the KV key, from your logs.
const TARGET_OVERRIDE_TIMESTAMP = 1751294976374; // This is the `timestamp` field from the logged override event

async function _deleteScoreOverride(): Promise<void> {
  await load({ export: true });

  console.log(
    `Attempting to delete override for User ID: ${TARGET_USER_ID} with timestamp: ${TARGET_OVERRIDE_TIMESTAMP}...`,
  );

  await new Promise((resolve) => setTimeout(resolve, 100));

  const kvKey = ["score_overrides", TARGET_USER_ID, TARGET_OVERRIDE_TIMESTAMP];

  try {
    const entry = await db.get(kvKey);

    if (entry.value === null) {
      console.log(
        `No override found for ${TARGET_USER_ID} at timestamp ${TARGET_OVERRIDE_TIMESTAMP}.`,
      );
      return;
    }

    await db.delete(kvKey);
    console.log(
      `✅ Successfully deleted override for ${TARGET_USER_ID} at timestamp ${TARGET_OVERRIDE_TIMESTAMP}.`,
    );
    console.log(`Deleted value was: ${JSON.stringify(entry.value, null, 2)}`);
  } catch (error) {
    console.error(
      `Error deleting score override: ${
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
  // Execute the function with the correct timestamp.
  await _deleteScoreOverride();
}
