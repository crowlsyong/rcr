// database/scripts/user.ts
/// <reference lib="deno.unstable" />

import db from "../db.ts"; // Adjust path if your scripts folder is not directly under project root
// Removed: import { load } from 'https://deno.land/std@0.224.0/dotenv/mod.ts';

const USER_USER_ID = "Y3ZEdMHLtoUXwiXGHaT6pj2Zj123"; // User's User ID

interface CreditScoreDataPoint {
  userId: string;
  username: string;
  creditScore: number;
  timestamp: number;
}

async function getUserCreditScoreHistory(): Promise<void> {
  // Removed: await load({ export: true }); // No longer needed here

  console.log(`Fetching credit score history for User (${USER_USER_ID})...`);

  await new Promise((resolve) => setTimeout(resolve, 100));

  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const allUserData: CreditScoreDataPoint[] = [];
  const recentUserData: CreditScoreDataPoint[] = [];
  const prefix = ["credit_scores", USER_USER_ID];

  try {
    const iter = db.list<CreditScoreDataPoint>({ prefix: prefix });

    let foundAnyForUser = false;
    for await (const entry of iter) {
      if (entry.value && entry.value.userId === USER_USER_ID) {
        foundAnyForUser = true;
        allUserData.push(entry.value);

        if (entry.value.timestamp >= sevenDaysAgo) {
          recentUserData.push(entry.value);
        }
      } else {
        console.warn(
          `KV entry key matches prefix but value.userId does not match: ${
            entry.key.join("/")
          }, value.userId: ${entry.value?.userId}`,
        );
      }
    }

    if (!foundAnyForUser) {
      console.log(
        `No credit score entries found for User (${USER_USER_ID}) at all in the database this script is connected to.`,
      );
      return;
    }

    if (allUserData.length > 0) {
      allUserData.sort((a, b) => a.timestamp - b.timestamp);
      console.log(
        `\n--- ALL HISTORICAL ENTRIES FOR USER (${allUserData.length} total) ---`,
      );
      allUserData.forEach((point, index) => {
        const date = new Date(point.timestamp);
        console.log(
          `  ${
            index + 1
          }. Date: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}, Score: ${point.creditScore}, Raw Timestamp: ${point.timestamp}`,
        );
      });
      console.log("----------------------------------------------------");
    }

    if (recentUserData.length === 0) {
      console.log(
        "\nNo credit score entries found for User in the last 7 days (after filtering).",
      );
    } else {
      recentUserData.sort((a, b) => a.timestamp - b.timestamp);
      console.log(
        `\nFound ${recentUserData.length} entries for User in the last 7 days:`,
      );
      recentUserData.forEach((point, index) => {
        const date = new Date(point.timestamp);
        console.log(
          `  ${
            index + 1
          }. Date: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}, Score: ${point.creditScore}, Raw Timestamp: ${point.timestamp}`,
        );
      });
    }
  } catch (error) {
    console.error(
      `Error fetching User's credit score history: ${
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
  await getUserCreditScoreHistory();
}
