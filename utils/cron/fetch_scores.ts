/// <reference lib="deno.unstable" />

import db from "../../database/db.ts";
import { handler as scoreHandler } from "../../routes/api/score.ts";

const CRON_NAME = "Update User Credit Scores";
const USERS_PER_DAY = 1 * 60 * 24; // 1440 users per day
const DELAY_BETWEEN_USERS_MS = 100; // Delay between processing users

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
  let usernameForLog: string | undefined = userId; // Default to userId if username not found
  let latestTimestamp = 0;

  try {
    // Iterate through credit_scores for this user to find the latest username
    const creditScoreEntriesIter = db.list({
      prefix: ["credit_scores", userId],
    });

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
          // We'll keep track of the username from the entry with the latest timestamp
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

const DAILY_SCHEDULE = "0 8 * * *";

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
      // Ensure last_index is reset if no users are found
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

    if (lastProcessedIndex >= totalUserCount) {
      console.info(
        `[${CRON_NAME}] Cycle completed or index out of bounds. Resetting index to 0.`,
      );
      lastProcessedIndex = 0;
      await db.atomic().set(lastProcessedIndexKey, 0).commit();
    }

    const usersToProcessInThisRun = Math.min(
      USERS_PER_DAY,
      totalUserCount - lastProcessedIndex,
    );

    console.info(
      `[${CRON_NAME}] Starting processing from index ${lastProcessedIndex}. Will process ${usersToProcessInThisRun} users this run.`,
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
      if (i < usersToProcessInThisRun - 1) { // Avoid delay after the last user
        await new Promise((resolve) =>
          setTimeout(resolve, DELAY_BETWEEN_USERS_MS)
        );
      }
    }

    const nextIndex = lastProcessedIndex + processedCount;

    // If we processed any users and nextIndex reaches or exceeds totalUserCount,
    // it means we've completed a full cycle (or the remainder of one). Reset to 0 for next day.
    const finalNextIndex = nextIndex >= totalUserCount ? 0 : nextIndex;

    await db.atomic().set(lastProcessedIndexKey, finalNextIndex).commit();

    console.info(
      `[${CRON_NAME}] Finished processing ${processedCount} users. Next run will start from index ${finalNextIndex}.`,
    );

    if (finalNextIndex === 0 && processedCount > 0) {
      console.info(
        `[${CRON_NAME}] Completed a full cycle through all users.`,
      );
    }
  } catch (error) {
    // This catches critical errors in the main cron logic (e.g., KV operations for progress)
    console.error(
      `[${CRON_NAME}] CRITICAL ERROR during cron execution: ${
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : String(error)
      }`,
      error, // Log the full error object for more details if needed
    );
  }
});
