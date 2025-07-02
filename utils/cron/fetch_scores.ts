// utils/cron/fetch_scores.ts
/// <reference lib="deno.unstable" />

import db from "../../database/db.ts";
import { handler as scoreHandler } from "../../routes/api/v0/score.ts";

const CRON_NAME = "Update User Credit Scores";
const USERS_PER_RUN = 100;
const DELAY_BETWEEN_USERS_MS = 50;
const FREQUENT_SCHEDULE = "0 * * * *"; // Every hour at :00
const CRON_PROGRESS_KEY = ["cron_progress", CRON_NAME, "last_index"];

interface User {
  id: string;
  username: string;
}

/**
 * Fetches all user records from the KV database under the "users" prefix.
 */
async function getAllUsers(): Promise<User[]> {
  const users: User[] = [];
  const iter = db.list<User>({ prefix: ["users"] });

  for await (const entry of iter) {
    users.push(entry.value);
  }
  return users;
}

/**
 * Processes a single user's score by calling the API handler.
 */
async function processUserScore(user: User): Promise<void> {
  console.debug(
    `[${CRON_NAME}] Attempting to process user: ${user.username} (ID: ${user.id})`,
  );
  try {
    const mockRequest = new Request(
      `http://localhost/api/v0/score?username=${
        encodeURIComponent(user.username)
      }`,
      { method: "GET" },
    );

    const response = await scoreHandler(mockRequest);
    const responseBody = await response.json().catch(() => ({}));

    if (response.ok) {
      const historicalDataSaved = responseBody.historicalDataSaved ?? "unknown";
      console.info(
        `[${CRON_NAME}] User '${user.username}' (ID: ${user.id}): Score processed. Historical data saved: ${historicalDataSaved}`,
      );
    } else {
      const errorDetail = responseBody.error || response.statusText ||
        "Unknown error";
      console.warn(
        `[${CRON_NAME}] User '${user.username}' (ID: ${user.id}): Failed to update score. Status: ${response.status}. Details: ${errorDetail}`,
      );
    }
  } catch (error) {
    console.warn(
      `[${CRON_NAME}] User '${user.username}' (ID: ${user.id}): Error during processing. Details: ${
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : String(error)
      }`,
    );
  }
}

// The main cron job definition must be at the top-level of this module.
Deno.cron(CRON_NAME, FREQUENT_SCHEDULE, async () => {
  console.info(
    `[${CRON_NAME}] Cron job triggered with schedule "${FREQUENT_SCHEDULE}".`,
  );
  try {
    const allUsers = await getAllUsers();
    const totalUserCount = allUsers.length;

    if (totalUserCount === 0) {
      console.info(
        `[${CRON_NAME}] No users found in 'users' collection, skipping run`,
      );
      await db.set(CRON_PROGRESS_KEY, 0); // Reset index if no users
      return;
    }
    console.info(`[${CRON_NAME}] Found ${totalUserCount} total users`);

    const lastIndexEntry = await db.get<number>(CRON_PROGRESS_KEY);
    let lastProcessedIndex = lastIndexEntry.value ?? 0;

    // Ensure lastProcessedIndex is within valid bounds (especially after user count changes)
    if (lastProcessedIndex >= totalUserCount) {
      console.info(
        `[${CRON_NAME}] Previous index ${lastProcessedIndex} out of bounds for ${totalUserCount} users. Resetting index to 0.`,
      );
      lastProcessedIndex = 0;
      await db.set(CRON_PROGRESS_KEY, 0); // Persist the reset immediately
    }

    const usersToProcessCount = Math.min(
      USERS_PER_RUN, // Use USERS_PER_RUN for this batch
      totalUserCount - lastProcessedIndex,
    );

    if (usersToProcessCount === 0) {
      console.info(
        `[${CRON_NAME}] No users left to process in this cycle. Next run will reset to index 0.`,
      );
      await db.set(CRON_PROGRESS_KEY, 0); // Explicitly reset if nothing to process
      return;
    }

    console.info(
      `[${CRON_NAME}] Starting at index ${lastProcessedIndex}. Will process ${usersToProcessCount} users this run.`,
    );

    let processedCount = 0;
    for (
      let i = 0;
      i < usersToProcessCount;
      i++
    ) {
      const currentUserIndex = lastProcessedIndex + i;
      const user = allUsers[currentUserIndex];
      // Defensive check in case allUsers array gets manipulated during iteration (unlikely but safe)
      if (user) {
        await processUserScore(user);
        processedCount++;
        // Add delay between users, but not after the very last user of the batch
        if (i < usersToProcessCount - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, DELAY_BETWEEN_USERS_MS)
          );
        }
      }
    }

    // Calculate the index for the next run. Use modulo to wrap around to 0
    // once all users have been processed through the cycle.
    const nextIndex = (lastProcessedIndex + processedCount) % totalUserCount;
    await db.set(CRON_PROGRESS_KEY, nextIndex); // Persist the next starting index

    console.info(
      `[${CRON_NAME}] Finished processing ${processedCount} users. Next run will start from index ${nextIndex}.`,
    );

    if (nextIndex === 0 && processedCount > 0) {
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
