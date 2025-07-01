// database/scripts/danger/clean-retroactive-history-in-place.ts
/// <reference lib="deno.unstable" />

import db from "../../db.ts";
import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";

// IMPORTANT: Ensure this is Spin's actual userId.
const TARGET_USER_ID = "Y3ZEdMHLtoUXwiXGHaT6pj2Zj123";

interface CreditScoreDataPoint {
  userId: string;
  username: string;
  creditScore: number;
  timestamp: number;
  // This structure matches what's currently in your DB for these points
  retroactiveAdjustment?: {
    modifierApplied: number;
    description: string;
    adjustedAt: number;
    originalScore: number; // The score before the retroactive script ran
  };
}

async function cleanRetroactiveHistoryInPlace(): Promise<void> {
  await load({ export: true });

  if (!TARGET_USER_ID) {
    console.error("Error: TARGET_USER_ID is not set. Please set a user ID.");
    Deno.exit(1);
  }

  console.log(
    `\nATTEMPTING TO CLEAN POLLUTED CREDIT HISTORY ENTRIES FOR USER ID: ${TARGET_USER_ID}\n`,
  );
  console.log(
    "This will revert 'creditScore' and remove 'retroactiveAdjustment' from specific entries.\n",
  );
  console.log("THIS ACTION IS IRREVERSIBLE FOR THE MODIFIED ENTRIES.\n");

  const confirm = prompt("Type 'CLEAN_IN_PLACE' to proceed with cleaning:");
  if (confirm !== "CLEAN_IN_PLACE") {
    console.log("Operation cancelled.");
    Deno.exit(0);
  }

  const prefix = ["credit_scores", TARGET_USER_ID];
  const entriesToClean: { key: Deno.KvKey; value: CreditScoreDataPoint }[] = [];

  try {
    console.log(
      `Identifying entries with 'retroactiveAdjustment' for user '${TARGET_USER_ID}'...`,
    );
    for await (const entry of db.list<CreditScoreDataPoint>({ prefix })) {
      if (entry.value?.retroactiveAdjustment) {
        entriesToClean.push({ key: entry.key, value: entry.value });
        console.log(
          `  Identified: ${
            JSON.stringify(entry.key)
          } (Current Score: ${entry.value.creditScore}, Original Pre-Retro: ${entry.value.retroactiveAdjustment.originalScore})`,
        );
      }
    }
    console.log(`Found ${entriesToClean.length} entries to clean.`);
  } catch (error) {
    console.error(`Error listing entries: ${getErrorMessage(error)}`);
    Deno.exit(1);
  }

  if (entriesToClean.length === 0) {
    console.log(
      "No entries with 'retroactiveAdjustment' found. Nothing to clean.",
    );
    return;
  }

  console.log(
    `\nExecuting atomic update for ${entriesToClean.length} entries...`,
  );
  try {
    const atomic = db.atomic();
    let cleanedCount = 0;

    for (const { key, value: pollutedDataPoint } of entriesToClean) {
      // Get the target score from the retroactiveAdjustment's originalScore
      const targetCreditScore =
        pollutedDataPoint.retroactiveAdjustment!.originalScore;

      // Create the clean data point without the retroactiveAdjustment property
      const cleanedDataPoint: CreditScoreDataPoint = {
        userId: pollutedDataPoint.userId,
        username: pollutedDataPoint.username,
        creditScore: targetCreditScore, // Set to the desired originalScore
        timestamp: pollutedDataPoint.timestamp,
        // The retroactiveAdjustment property is intentionally omitted here
      };

      atomic.set(key, cleanedDataPoint);
      cleanedCount++;
      console.log(
        `  Cleaned ${
          JSON.stringify(key)
        } from ${pollutedDataPoint.creditScore} to ${cleanedDataPoint.creditScore}`,
      );
    }

    await atomic.commit();
    console.log(
      `\n✅ Successfully cleaned ${cleanedCount} credit history entries for user ID: ${TARGET_USER_ID}`,
    );
  } catch (error) {
    console.error(`Error during cleaning: ${getErrorMessage(error)}`);
    Deno.exit(1);
  }
}

function getErrorMessage(e: unknown): string {
  return typeof e === "object" && e !== null && "message" in e
    ? (e as { message: string }).message
    : String(e);
}

if (import.meta.main) {
  await cleanRetroactiveHistoryInPlace();
}
