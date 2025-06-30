// database/scripts/migration/migrate-overrides-to-kv.ts
/// <reference lib="deno.unstable" />

import db from "../../db.ts"; // Path to db.ts
import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";

// Re-declare OverrideEvent interface here for clarity and independence.
// Ensure it matches the one in routes/api/v0/credit-score/index.ts.
interface OverrideEvent {
  username: string;
  modifier: number;
  url: string;
  timestamp: number;
  dateOfInfraction: number;
}

// Structure of your JSON file
interface JsonOverridesFile {
  [userId: string]: OverrideEvent[];
}

async function migrateOverridesToKv(): Promise<void> {
  await load({ export: true });

  console.log(
    "Starting migration of credit_score_overrides.json to Deno KV...",
  );
  await new Promise((resolve) => setTimeout(resolve, 100)); // Delay for KV connection log

  const jsonPath = "./database/credit_score_overrides.json"; // Path to your JSON file

  try {
    const jsonString = await Deno.readTextFile(jsonPath);
    const overridesData: JsonOverridesFile = JSON.parse(jsonString);

    let migratedUsersCount = 0;
    let migratedEventsCount = 0;

    for (const userId in overridesData) {
      if (Object.prototype.hasOwnProperty.call(overridesData, userId)) {
        const events = overridesData[userId];

        for (const event of events) {
          // KV key for each individual override event
          // Using dateOfInfraction as the final key component for uniqueness and time-ordering
          const kvKey = ["score_overrides", userId, event.dateOfInfraction];

          // Store the entire OverrideEvent object
          await db.set(kvKey, event);
          migratedEventsCount++;
        }
        console.log(
          `Migrated ${events.length} override events for user ID: ${userId}`,
        );
        migratedUsersCount++;
      }
    }

    console.log(
      `\nMigration complete! Migrated ${migratedEventsCount} events for ${migratedUsersCount} users.`,
    );
    console.log(
      "You can now safely delete your database/credit_score_overrides.json file after verification.",
    );
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      console.error(
        `Error: JSON file not found at ${jsonPath}. Please ensure it exists.`,
      );
    } else {
      console.error(
        `Critical Error during migration: ${
          typeof error === "object" && error !== null && "message" in error
            ? (error as { message: string }).message
            : String(error)
        }`,
        error,
      );
    }
    Deno.exit(1);
  }
}

if (import.meta.main) {
  // CONFIRMATION: Uncomment to run the migration.
  // After running, verify the data in KV using `db.list({ prefix: ["score_overrides"] })`
  // then you can delete the JSON file.
  await migrateOverridesToKv();
}
