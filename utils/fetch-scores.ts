/// <reference lib="deno.unstable" />

import db from "../database/db.ts";
import { handler as scoreHandler } from "../routes/api/score.ts";

const cronName = "Update User Credit Scores";
// Process up to 3 users per minute over a 24-hour period
const usersPerDay = 1 * 60 * 24; // 1440 users per day

/**
 * Fetches all user IDs from the KV database.
 */
async function getAllUserIds(): Promise<string[]> {
  const userIds: string[] = [];
  const iter = db.list({ prefix: ["user_data"] }); // Adjust prefix as needed

  for await (const entry of iter) {
    if (Array.isArray(entry.key) && entry.key.length > 1) {
      userIds.push(entry.key[1] as string);
    }
  }
  return userIds;
}

/**
 * Processes a single user to update their score.
 */
async function processUserScore(userId: string) {
  console.log(`Processing score for user ID: ${userId}`);
  try {
    // Fetch username from KV or another source
    const userProfileEntry = await db.get<{ username: string }>([
      "user_data",
      userId,
      "profile",
    ]);
    const username = userProfileEntry.value?.username;

    if (!username) {
      console.warn(`Username not found for user ID: ${userId}. Skipping.`);
      return;
    }

    const mockRequest = new Request(
      `http://localhost/api/score?username=${encodeURIComponent(username)}`,
      {
        method: "GET",
      },
    );

    const response = await scoreHandler(mockRequest);

    if (response.ok) {
      console.log(`Successfully updated score for user: ${username}`);
    } else {
      const errorBody = await response.text();
      console.error(
        `Failed to update score for user ${username}: ${response.status} - ${errorBody}`,
      );
    }
  } catch (error) {
    console.error(`Error processing user ${userId}:`, error);
  }
}

const dailySchedule = "0 1 * * *"; // 1:00 AM UTC daily

Deno.cron(cronName, dailySchedule, async () => {
  console.log(`[${cronName}] Triggered.`);
  try {
    const allUserIds = await getAllUserIds();
    const totalUserCount = allUserIds.length;
    console.log(
      `[${cronName}] Total users in DB: ${totalUserCount}.`,
    );

    const lastProcessedIndexKey = ["cron_progress", cronName, "last_index"];
    const lastProcessedIndexEntry = await db.get<number>(
      lastProcessedIndexKey,
    );
    const lastProcessedIndex = lastProcessedIndexEntry.value ?? 0;

    const usersToProcessInThisRun = Math.min(
      usersPerDay,
      totalUserCount - lastProcessedIndex,
    );

    console.log(
      `[${cronName}] Starting processing from index ${lastProcessedIndex}. Processing ${usersToProcessInThisRun} users in this run.`,
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
      // No delay needed here as the rate is controlled by usersPerDay processed daily
    }

    // Update the last processed index in KV
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

console.log(`Cron job "${cronName}" defined with schedule "${dailySchedule}".`);
