// database/scripts/danger/undo-retroactive-adjust.ts
/// <reference lib="deno.unstable" />

import db from "../../db.ts"; // Path to your db.ts
import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";

// IMPORTANT: Replace with Spin's userId
const TARGET_USER_ID = "Y3ZEdMHLtoUXwiXGHaT6pj2Zj123";

interface CreditScoreDataPoint {
  userId: string;
  username: string;
  creditScore: number;
  timestamp: number;
  retroactiveAdjustment?: {
    modifierApplied: number;
    description: string;
    adjustedAt: number;
    originalScore: number; // This is the key to reverting
  };
}

async function undoRetroactiveAdjustments(): Promise<void> {
  await load({ export: true });

  if (!TARGET_USER_ID || TARGET_USER_ID === "Y3ZEdMHLtoUXwiXGHaT6pj2Zj123") {
    console.error("Error: Please set TARGET_USER_ID to Spin's actual user ID.");
    Deno.exit(1);
  }

  console.log(
    `\nAttempting to UNDO retroactive adjustments for user ID: ${TARGET_USER_ID}\n`,
  );
  console.log(
    "This will revert 'creditScore' in affected historical entries to their 'originalScore'.\n",
  );

  const confirm = prompt("Type 'UNDO' to proceed with undoing:");
  if (confirm !== "UNDO") {
    console.log("Undo operation cancelled.");
    Deno.exit(0);
  }

  const prefix = ["credit_scores", TARGET_USER_ID];
  const entriesToUpdate: { key: Deno.KvKey; value: CreditScoreDataPoint }[] =
    [];

  try {
    console.log(
      `Identifying entries with 'retroactiveAdjustment' for user '${TARGET_USER_ID}'...`,
    );
    for await (const entry of db.list<CreditScoreDataPoint>({ prefix })) {
      if (entry.value?.retroactiveAdjustment) {
        entriesToUpdate.push({ key: entry.key, value: entry.value });
        console.log(
          `  Identified: ${
            JSON.stringify(entry.key)
          } (Current Score: ${entry.value.creditScore}, Original Pre-Retro: ${entry.value.retroactiveAdjustment.originalScore})`,
        );
      }
    }
    console.log(`Found ${entriesToUpdate.length} entries to undo.`);
  } catch (error) {
    console.error(`Error listing entries: ${getErrorMessage(error)}`);
    Deno.exit(1);
  }

  if (entriesToUpdate.length === 0) {
    console.log(
      "No retroactive adjustments found for this user. Nothing to undo.",
    );
    return;
  }

  console.log(
    `\nExecuting atomic update for ${entriesToUpdate.length} entries...`,
  );
  try {
    const atomic = db.atomic();
    let updatedCount = 0;

    for (const { key, value: originalDataPoint } of entriesToUpdate) {
      const originalOriginalScore =
        originalDataPoint.retroactiveAdjustment!.originalScore;

      const revertedDataPoint: CreditScoreDataPoint = {
        ...originalDataPoint,
        creditScore: originalOriginalScore, // Revert to the score *before* the retroactive script ran
        retroactiveAdjustment: undefined, // Remove the retroactive adjustment property
      };

      atomic.set(key, revertedDataPoint);
      updatedCount++;
      console.log(
        `  Reverted ${
          JSON.stringify(key)
        } from ${originalDataPoint.creditScore} to ${revertedDataPoint.creditScore}`,
      );
    }

    await atomic.commit();
    console.log(
      `\n✅ Successfully reverted ${updatedCount} retroactive adjustments for user ID: ${TARGET_USER_ID}`,
    );
  } catch (error) {
    console.error(`Error during undo: ${getErrorMessage(error)}`);
    Deno.exit(1);
  }
}

function getErrorMessage(e: unknown): string {
  return typeof e === "object" && e !== null && "message" in e
    ? (e as { message: string }).message
    : String(e);
}

if (import.meta.main) {
  await undoRetroactiveAdjustments();
}
