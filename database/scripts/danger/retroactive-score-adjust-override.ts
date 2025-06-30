// database/scripts/danger/retroactive-score-adjust-override.ts
/// <reference lib="deno.unstable" />

import db from "../../db.ts"; // Path to db.ts is `database/db.ts`
import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";

const USER_USER_ID = "Y3ZEdMHLtoUXwiXGHaT6pj2Zj123";

function getUtcDateString(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toISOString().split("T")[0];
}

// Define the adjustments to apply. These are *additive* to the current score.
const RETROACTIVE_ADDITIVE_ADJUSTMENTS: {
  [utcDateString: string]: { modifier: number; description: string };
} = {
  "2025-06-28": {
    modifier: +50,
    description: "Partial un-ding (June 28, 2025)",
  },
  "2025-06-30": {
    modifier: +100,
    description: "Partial un-ding (June 29, 2025) - recorded on June 30 UTC",
  },
};

interface CreditScoreDataPoint {
  userId: string;
  username: string;
  creditScore: number;
  timestamp: number;
  retroactiveAdjustment?: {
    modifierApplied: number; // This will store the modifier from this script run
    description: string;
    adjustedAt: number;
    originalScore: number; // The score *before* this specific adjustment was applied
  };
}

async function adjustUserCreditScoreHistoryAdditive(): Promise<void> {
  await load({ export: true });

  console.log(
    `Starting retroactive ADDITIVE credit score adjustment for User (${USER_USER_ID})...`,
  );

  await new Promise((resolve) => setTimeout(resolve, 100));

  let adjustedCount = 0;
  const prefix = ["credit_scores", USER_USER_ID];

  try {
    const iter = db.list<CreditScoreDataPoint>({ prefix: prefix });
    const entriesToProcess: { key: Deno.KvKey; value: CreditScoreDataPoint }[] =
      [];

    for await (const entry of iter) {
      const existingPoint = entry.value;

      if (
        !existingPoint || !existingPoint.timestamp || !existingPoint.creditScore
      ) {
        console.warn(`Skipping malformed entry: ${JSON.stringify(entry.key)}`);
        continue;
      }

      const utcDateStringForComparison = getUtcDateString(
        existingPoint.timestamp,
      );

      const adjustment =
        RETROACTIVE_ADDITIVE_ADJUSTMENTS[utcDateStringForComparison];

      // We only process if an adjustment is defined for this date.
      // We are *not* checking `!existingPoint.retroactiveAdjustment` here,
      // as this script is intended to be able to re-adjust or further adjust.
      if (adjustment) {
        entriesToProcess.push({ key: entry.key, value: existingPoint });
      }
    }

    if (entriesToProcess.length === 0) {
      console.log(
        "No matching credit score entries found for additive adjustment in the retrieved range.",
      );
      return;
    }

    console.log(
      `Found ${entriesToProcess.length} entries eligible for additive adjustment.`,
    );

    for (const { key, value: existingPoint } of entriesToProcess) {
      const utcDateStringForComparison = getUtcDateString(
        existingPoint.timestamp,
      );
      const adjustment =
        RETROACTIVE_ADDITIVE_ADJUSTMENTS[utcDateStringForComparison];

      if (!adjustment) continue;

      // Store the current score *before* this additive adjustment
      const scoreBeforeThisAdditiveAdjustment = existingPoint.creditScore;

      // Apply the additive modifier to the *current* score in KV
      const newCreditScore = Math.max(
        0,
        Math.min(1000, existingPoint.creditScore + adjustment.modifier),
      );

      const adjustedPoint: CreditScoreDataPoint = {
        ...existingPoint, // Keep all other original properties
        creditScore: newCreditScore, // Set the new, additively adjusted score
        retroactiveAdjustment: { // Update adjustment details for *this* script's action
          modifierApplied: adjustment.modifier, // Store the modifier this script just applied
          description: adjustment.description,
          adjustedAt: Date.now(), // Timestamp of when this adjustment was applied
          originalScore: scoreBeforeThisAdditiveAdjustment, // Store score *before this specific run's adjustment*
        },
      };

      await db.set(key, adjustedPoint);

      console.log(
        `ADDITIVE Adjust: ${existingPoint.username} on ${utcDateStringForComparison}: ` +
          `Original (before this run): ${scoreBeforeThisAdditiveAdjustment}, ` +
          `New (after this run): ${newCreditScore} (Change: ${adjustment.modifier} points).`,
      );
      adjustedCount++;
    }

    if (adjustedCount === 0) {
      console.log(
        "No credit score entries were additively adjusted during this run.",
      );
    } else {
      console.log(
        `Successfully additively adjusted ${adjustedCount} credit score entries.`,
      );
    }
  } catch (error) {
    console.error(
      `Error performing additive credit score adjustment: ${
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
  // CONFIRMATION: This will execute the adjustment.
  // USE WITH EXTREME CAUTION. This script can modify scores multiple times.
  // It is intended for specific, controlled additive changes.
  await adjustUserCreditScoreHistoryAdditive();
}
