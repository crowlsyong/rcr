// database/scripts/danger/retroactive-score-adjust.ts
/// <reference lib="deno.unstable" />

import db from "../../db.ts";
import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";

const USER_USER_ID = "Y3ZEdMHLtoUXwiXGHaT6pj2Zj123";

function getUtcDateString(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toISOString().split("T")[0];
}

// FIXED: Adjusted modifier for "2025-06-30" to -200 for cumulative deduction
const RETROACTIVE_ADJUSTMENTS: {
  [utcDateString: string]: { modifier: number; description: string };
} = {
  "2025-06-28": { modifier: -100, description: "Loan default (June 28, 2025)" },
  "2025-06-30": {
    modifier: -200,
    description:
      "Second loan default (June 29, 2025) - recorded on June 30 UTC",
  },
};

interface CreditScoreDataPoint {
  userId: string;
  username: string;
  creditScore: number;
  timestamp: number;
  retroactiveAdjustment?: {
    modifierApplied: number;
    description: string;
    adjustedAt: number;
    originalScore: number;
  };
}

async function adjustUserCreditScoreHistory(): Promise<void> {
  await load({ export: true });

  console.log(
    `Starting retroactive credit score adjustment for User (${USER_USER_ID})...`,
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

      const adjustment = RETROACTIVE_ADJUSTMENTS[utcDateStringForComparison];

      if (adjustment && !existingPoint.retroactiveAdjustment) {
        entriesToProcess.push({ key: entry.key, value: existingPoint });
      } else if (adjustment && existingPoint.retroactiveAdjustment) {
        console.log(
          `Skipping already adjusted entry for ${existingPoint.username} on ${utcDateStringForComparison}.`,
        );
      }
    }

    if (entriesToProcess.length === 0) {
      console.log(
        "No new matching credit score entries found for adjustment in the retrieved range.",
      );
      return;
    }

    console.log(
      `Found ${entriesToProcess.length} entries eligible for adjustment.`,
    );

    for (const { key, value: existingPoint } of entriesToProcess) {
      const utcDateStringForComparison = getUtcDateString(
        existingPoint.timestamp,
      );
      const adjustment = RETROACTIVE_ADJUSTMENTS[utcDateStringForComparison];

      if (!adjustment) continue;

      const newCreditScore = Math.max(
        0,
        existingPoint.creditScore + adjustment.modifier,
      );

      const adjustedPoint: CreditScoreDataPoint = {
        ...existingPoint,
        creditScore: newCreditScore,
        retroactiveAdjustment: {
          modifierApplied: adjustment.modifier,
          description: adjustment.description,
          adjustedAt: Date.now(),
          originalScore: existingPoint.creditScore,
        },
      };

      await db.set(key, adjustedPoint);

      console.log(
        `Adjusted score for ${existingPoint.username} on ${utcDateStringForComparison}: ` +
          `Original: ${existingPoint.creditScore}, New: ${newCreditScore} (${adjustment.modifier} points).`,
      );
      adjustedCount++;
    }

    if (adjustedCount === 0) {
      console.log("No credit score entries were adjusted during this run.");
    } else {
      console.log(
        `Successfully adjusted ${adjustedCount} credit score entries.`,
      );
    }
  } catch (error) {
    console.error(
      `Error adjusting User's credit score history: ${
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
  await adjustUserCreditScoreHistory();
}
