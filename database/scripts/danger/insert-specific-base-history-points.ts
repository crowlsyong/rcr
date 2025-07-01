// database/scripts/danger/insert-specific-base-history-points.ts
/// <reference lib="deno.unstable" />
import db from "../../db.ts";
import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";

const TARGET_USER_ID = "Y3ZEdMHLtoUXwiXGHaT6pj2Zj123";

interface CreditScoreDataPoint {
  userId: string;
  username: string;
  creditScore: number;
  timestamp: number;
}

// Define the base historical data points you want to insert
const BASE_HISTORY_TO_INSERT: CreditScoreDataPoint[] = [
  {
    userId: TARGET_USER_ID,
    username: "Spin",
    creditScore: 827,
    timestamp: 1751153592014,
  }, // June 28th original timestamp
  {
    userId: TARGET_USER_ID,
    username: "Spin",
    creditScore: 827,
    timestamp: 1751247415844,
  }, // June 29th original timestamp
];

async function insertSpecificBaseHistoryPoints(): Promise<void> {
  await load({ export: true });
  if (!TARGET_USER_ID) {
    console.error("Error: TARGET_USER_ID is not set.");
    Deno.exit(1);
  }

  console.log(
    `\nATTEMPTING TO INSERT SPECIFIC BASE CREDIT HISTORY POINTS FOR USER ID: ${TARGET_USER_ID}\n`,
  );
  console.log(
    "This will insert new historical data points. Will skip if entry already exists.\n",
  );

  const confirm = prompt("Type 'INSERT_BASE' to proceed:");
  if (confirm !== "INSERT_BASE") {
    console.log("Operation cancelled.");
    Deno.exit(0);
  }

  try {
    const atomic = db.atomic();
    let insertedCount = 0;
    for (const dataPoint of BASE_HISTORY_TO_INSERT) {
      const key = ["credit_scores", dataPoint.userId, dataPoint.timestamp];
      const existing = await db.get(key);
      if (existing.value === null) {
        atomic.set(key, dataPoint);
        insertedCount++;
        console.log(
          `  Marked for insertion: ${
            JSON.stringify(key)
          } with score ${dataPoint.creditScore}`,
        );
      } else {
        console.log(`  Skipped (entry already exists): ${JSON.stringify(key)}`);
      }
    }

    if (insertedCount === 0) {
      console.log("No new entries were inserted.");
      return;
    }

    await atomic.commit();
    console.log(
      `\n✅ Successfully inserted ${insertedCount} base credit history points for user ID: ${TARGET_USER_ID}`,
    );
  } catch (error) {
    console.error(`Error during insertion: ${getErrorMessage(error)}`);
    Deno.exit(1);
  }
}

function getErrorMessage(e: unknown): string {
  return typeof e === "object" && e !== null && "message" in e
    ? (e as { message: string }).message
    : String(e);
}

if (import.meta.main) {
  await insertSpecificBaseHistoryPoints();
}
