/// <reference lib="deno.unstable" />

import db from "../database/db.ts";
import { handler as scoreHandler } from "../routes/api/score.ts";

const cronName = "Update User Credit Scores";
const usersPerDay = 1 * 60 * 24; // 1440 users per day

/**
 * Fetches all UNIQUE user IDs from the KV database under the credit_scores prefix.
 */
async function getAllUserIds(): Promise<string[]> {
  const uniqueUserIds = new Set<string>();
  const iter = db.list({ prefix: ["credit_scores"] });

  for await (const entry of iter) {
    // Key structure is ["credit_scores", userId, timestamp]
    if (Array.isArray(entry.key) && entry.key.length > 1) {
      const userId = entry.key[1] as string;
      uniqueUserIds.add(userId);
    }
  }
  return Array.from(uniqueUserIds);
}

/**
 * Processes a single user's score by calling the API handler.
 */
async function processUserScore(userId: string) {
  console.log(`[${cronName}] Processing score for user ID: ${userId}`);
  try {
    // Fetch username from KV or another source (adjust prefix/key if needed)
    const userProfileEntry = await db.get<{ username: string }>([
      "user_profile", // <-- ADJUST THIS PREFIX/KEY STRUCTURE if needed
      userId,
      "profile", // <-- ADJUST THIS KEY STRUCTURE if needed
    ]);
    const username = userProfileEntry.value?.username;

    if (!username) {
      console.warn(`[${cronName}] Username not found for user ID: ${userId}. Skipping.`);
      return;
    }

    const mockRequest = new Request(
      `http://localhost/api/score?username=${encodeURIComponent(username)}`,
      { method: "GET" },
    );

    const response = await scoreHandler(mockRequest);

    if (response.ok) {
      console.log(`[${cronName}] Successfully updated score for user: ${username}`);
    } else {
      const errorBody = await response.text();
      console.error(
        `[${cronName}] Failed to update score for user ${username}: ${response.status} - ${errorBody}`,
      );
    }
  } catch (error) {
    console.error(`[${cronName}] Error processing user ${userId}:`, error);
  }
}

// Cron schedule: 6:17 AM UTC daily (corresponds to 1:17 AM CDT/CST if UTC-5)
const dailySchedule = "19 6 * * *";

// Define the Deno.cron task at the top level
Deno.cron(cronName, dailySchedule, async () => {
  console.log(`[${cronName}] Cron job triggered with schedule "${dailySchedule}".`);
  try {
    const allUserIds = await getAllUserIds();
    const totalUserCount = allUserIds.length;
    console.log(
      `[${cronName}] Total unique users in DB: ${totalUserCount}.`,
    );

    if (totalUserCount === 0) {
      console.log(`[${cronName}] No users found. Skipping processing.`);
      const lastProcessedIndexKey = ["cron_progress", cronName, "last_index"];
      const atomic = db.atomic();
      atomic.set(lastProcessedIndexKey, 0);
      await atomic.commit();
      return;
    }

    const lastProcessedIndexKey = ["cron_progress", cronName, "last_index"];
    const lastProcessedIndexEntry = await db.get<number>(
      lastProcessedIndexKey,
    );

    let lastProcessedIndex = (
        lastProcessedIndexEntry.value !== null &&
        lastProcessedIndexEntry.value !== undefined &&
        !isNaN(lastProcessedIndexEntry.value) &&
        lastProcessedIndexEntry.value >= 0
      )
      ? lastProcessedIndexEntry.value
      : 0;

    if (lastProcessedIndex >= totalUserCount) {
      console.log(`[${cronName}] Index out of bounds or cycle completed. Resetting index to 0.`);
      lastProcessedIndex = 0;
      const atomicReset = db.atomic();
      atomicReset.set(lastProcessedIndexKey, 0);
      await atomicReset.commit();
    }

    const usersToProcessInThisRun = Math.min(
      usersPerDay,
      totalUserCount - lastProcessedIndex,
    );

    console.log(
      `[${cronName}] Starting processing from index ${lastProcessedIndex}. Processing ${usersToProcessInThisRun} users.`,
    );

    let processedCount = 0;
    for (
      let i = 0;
      i < usersToProcessInThisRun &&
      (lastProcessedIndex + i) < totalUserCount;
      i++
    ) {
      const userId = allUserIds[lastProcessedIndex + i];
      await processUserScore(userId);
      processedCount++;
    }

    const nextIndex = (lastProcessedIndex + processedCount) % totalUserCount;
    const atomic = db.atomic();
    atomic.set(lastProcessedIndexKey, nextIndex);
    await atomic.commit();

    console.log(
      `[${cronName}] Finished processing ${processedCount} users. Next run will start from index ${nextIndex}.`,
    );

    if (nextIndex === 0 && processedCount > 0) {
      console.log(`[${cronName}] Completed a full cycle through all users.`);
    }

  } catch (error) {
    console.error(`[${cronName}] Error during cron execution:`, error);
  }
});
