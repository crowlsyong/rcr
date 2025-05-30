/// <reference lib="deno.unstable" />

import db from "../../database/db.ts";
import { handler as scoreHandler } from "../../routes/api/score.ts";

const CRON_NAME = "Update User Credit Scores";
// Process a fixed number of users per cron run to stay within execution limits
const USERS_PER_CRON_RUN = 30;
// Delay between processing users to avoid overwhelming services
const DELAY_BETWEEN_USERS_MS = 1000;

/**
 * Fetches all UNIQUE user IDs from the KV database under the credit_scores prefix.
 */
async function getAllUserIds(): Promise<string[]> {
  const uniqueUserIds = new Set<string>();
  const iter = db.list({ prefix: ["credit_scores"] });

  for await (const entry of iter) {
    if (Array.isArray(entry.key) && entry.key.length > 1) {
      const userId = entry.key[1] as string;
      uniqueUserIds.add(userId);
    }
  }
  return Array.from(uniqueUserIds);
}

/**
 * Processes a single user's score by calling the API handler.
 * It fetches the username from the latest credit score entry for logging purposes.
 */
async function processUserScore(userId: string): Promise<void> {
  console.debug(`[${CRON_NAME}] Attempting to process user ID: ${userId}`);
  let usernameForLog: string | undefined = userId;

  try {
    const creditScoreEntriesIter = db.list({
      prefix: ["credit_scores", userId],
    });

    let latestTimestamp = 0;

    for await (const entry of creditScoreEntriesIter) {
      if (
        Array.isArray(entry.key) && entry.key.length === 3 && entry.key[2] &&
        typeof entry.key[2] === "number"
      ) {
        const timestamp = entry.key[2];
        if (
          entry.value && typeof entry.value === "object" &&
          "username" in entry.value
        ) {
          if (timestamp > latestTimestamp) {
            latestTimestamp = timestamp;
            usernameForLog = (entry.value as { username: string }).username;
          }
        }
      }
    }

    if (!usernameForLog || usernameForLog === userId) {
      console.info(
        `[${CRON_NAME}] Username not found in KV for user ID: ${userId}. Proceeding with ID.`,
      );
    }

    const mockRequest = new Request(
      `http://localhost/api/score?username=${
        encodeURIComponent(usernameForLog)
      }`,
      { method: "GET" },
    );

    const response = await scoreHandler(mockRequest);
    const responseBody = await response.json().catch(() => ({}));

    if (response.ok) {
      const apiUsername = responseBody.username || usernameForLog;
      const historicalDataSaved = responseBody.historicalDataSaved;
      let statusMessage =
        `User '${apiUsername}' (ID: ${userId}): Score processed.`;
      if (responseBody.userExists === false) {
        statusMessage =
          `User '${apiUsername}' (ID: ${userId}): Not found by API.`;
        console.warn(`[${CRON_NAME}] ${statusMessage}`);
      } else {
        statusMessage += ` Historical data saved: ${historicalDataSaved}.`;
        console.info(`[${CRON_NAME}] ${statusMessage}`);
      }
    } else {
      const errorDetail = responseBody.error || response.statusText ||
        "Unknown error";
      console.warn(
        `[${CRON_NAME}] User '${usernameForLog}' (ID: ${userId}): Failed to update score. Status: ${response.status}. Details: ${errorDetail}`,
      );
    }
  } catch (error) {
    const errorMessage =
      typeof error === "object" && error !== null && "message" in error
        ? (error as { message: string }).message
        : String(error);
    console.warn(
      `[${CRON_NAME}] User '${usernameForLog}' (ID: ${userId}): Error during processing. Details: ${errorMessage}`,
    );
  }
}

// Cron schedule: 8:00 AM UTC daily
const DAILY_SCHEDULE = "0 */4 * * *";

Deno.cron(CRON_NAME, DAILY_SCHEDULE, async () => {
  console.info(
    `[${CRON_NAME}] Cron job triggered with schedule "${DAILY_SCHEDULE}".`,
  );
  try {
    const allUserIds = await getAllUserIds();
    const totalUserCount = allUserIds.length;
    console.info(
      `[${CRON_NAME}] Total unique users in DB: ${totalUserCount}.`,
    );

    if (totalUserCount === 0) {
      console.info(`[${CRON_NAME}] No users found. Skipping processing.`);
      const lastProcessedIndexKey = ["cron_progress", CRON_NAME, "last_index"];
      await db.atomic().set(lastProcessedIndexKey, 0).commit();
      return;
    }

    const lastProcessedIndexKey = ["cron_progress", CRON_NAME, "last_index"];
    const lastProcessedIndexEntry = await db.get<number>(
      lastProcessedIndexKey,
    );

    let lastProcessedIndex = (
        lastProcessedIndexEntry.value !== null &&
        typeof lastProcessedIndexEntry.value === "number" &&
        !isNaN(lastProcessedIndexEntry.value) &&
        lastProcessedIndexEntry.value >= 0
      )
      ? lastProcessedIndexEntry.value
      : 0;

    // If last processed index is beyond the current total count (due to deletions perhaps), reset
    if (lastProcessedIndex >= totalUserCount) {
      console.warn(
        `[${CRON_NAME}] Last processed index (${lastProcessedIndex}) is out of bounds for current user count (${totalUserCount}). Resetting index to 0.`,
      );
      lastProcessedIndex = 0;
      await db.atomic().set(lastProcessedIndexKey, 0).commit();
    }

    const usersToProcessInThisRun = Math.min(
      USERS_PER_CRON_RUN, // Use the new batch size
      totalUserCount - lastProcessedIndex,
    );

    // If no users are left in the current cycle segment, reset and log completion
    if (usersToProcessInThisRun <= 0 && totalUserCount > 0) {
      console.info(
        `[${CRON_NAME}] No users left in the current segment of the cycle starting from index ${lastProcessedIndex}. Resetting index to 0 for the next run.`,
      );
      await db.atomic().set(lastProcessedIndexKey, 0).commit();
      if (lastProcessedIndex > 0) { // Only log full cycle completion if we actually processed some users before
        console.info(
          `[${CRON_NAME}] Completed a full cycle through all users.`,
        );
      }
      return; // Exit this cron run
    }

    console.info(
      `[${CRON_NAME}] Starting processing from index ${lastProcessedIndex}. Will process ${usersToProcessInThisRun} users this run.`,
    );

    let processedCount = 0;
    for (
      let i = 0;
      i < usersToProcessInThisRun;
      i++
    ) {
      const userIndex = lastProcessedIndex + i;
      // Double check index is still valid if user list changed during execution
      if (userIndex >= totalUserCount) {
        console.warn(
          `[${CRON_NAME}] User index ${userIndex} is now out of bounds (${totalUserCount}) during processing. Stopping this run.`,
        );
        break; // Stop processing if the list size changed unexpectedly
      }
      const userId = allUserIds[userIndex];
      await processUserScore(userId);
      processedCount++;
      if (i < usersToProcessInThisRun - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, DELAY_BETWEEN_USERS_MS)
        );
      }
    }

    const nextIndex = lastProcessedIndex + processedCount;
    // Do NOT reset to 0 here unless we've processed the very last user
    const finalNextIndex = (nextIndex >= totalUserCount && processedCount > 0)
      ? 0
      : nextIndex;

    await db.atomic().set(lastProcessedIndexKey, finalNextIndex).commit();

    console.info(
      `[${CRON_NAME}] Finished processing ${processedCount} users this run. Next run will start from index ${finalNextIndex}.`,
    );

    if (finalNextIndex === 0 && processedCount > 0) {
      console.info(
        `[${CRON_NAME}] Completed a full cycle through all users.`,
      );
    }
  } catch (error) {
    console.error(
      `[${CRON_NAME}] CRITICAL ERROR during cron execution: ${
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : String(error)
      }`,
      error,
    );
  }
});
