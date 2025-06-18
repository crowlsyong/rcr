/// <reference lib="deno.unstable" />

import db from "../../database/db.ts";
import { handler as scoreHandler } from "../../routes/api/score.ts";

const CRON_NAME = "Update User Credit Scores";
const USERS_PER_DAY = 1440;
const DELAY_BETWEEN_USERS_MS = 100;
const DAILY_SCHEDULE = "0 8 * * *";
const CRON_PROGRESS_KEY = ["cron_progress", CRON_NAME, "last_index"];

interface User {
  id: string;
  username: string;
}

async function getAllUsers(): Promise<User[]> {
  const users: User[] = [];
  const iter = db.list<User>({ prefix: ["users"] });

  for await (const entry of iter) {
    users.push(entry.value);
  }
  return users;
}

async function processUserScore(user: User): Promise<void> {
  console.debug(
    `[${CRON_NAME}] Attempting to process user: ${user.username} (ID: ${user.id})`,
  );
  try {
    const mockRequest = new Request(
      `http://localhost/api/score?username=${
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

Deno.cron(CRON_NAME, DAILY_SCHEDULE, async () => {
  console.info(
    `[${CRON_NAME}] Cron job triggered with schedule "${DAILY_SCHEDULE}"`,
  );
  try {
    const allUsers = await getAllUsers();
    const totalUserCount = allUsers.length;

    if (totalUserCount === 0) {
      console.info(
        `[${CRON_NAME}] No users found in 'users' collection, skipping run`,
      );
      await db.set(CRON_PROGRESS_KEY, 0);
      return;
    }
    console.info(`[${CRON_NAME}] Found ${totalUserCount} total users`);

    const lastIndexEntry = await db.get<number>(CRON_PROGRESS_KEY);
    let lastProcessedIndex = lastIndexEntry.value ?? 0;

    if (lastProcessedIndex >= totalUserCount) {
      console.info(`[${CRON_NAME}] Cycle completed, resetting index to 0`);
      lastProcessedIndex = 0;
    }

    const usersToProcessCount = Math.min(
      USERS_PER_DAY,
      totalUserCount - lastProcessedIndex,
    );

    console.info(
      `[${CRON_NAME}] Starting at index ${lastProcessedIndex}. Processing ${usersToProcessCount} users`,
    );

    let processedCount = 0;
    for (let i = 0; i < usersToProcessCount; i++) {
      const currentUserIndex = lastProcessedIndex + i;
      const user = allUsers[currentUserIndex];
      if (user) {
        await processUserScore(user);
        processedCount++;
        if (i < usersToProcessCount - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, DELAY_BETWEEN_USERS_MS)
          );
        }
      }
    }

    const nextIndex = (lastProcessedIndex + processedCount) % totalUserCount;
    await db.set(CRON_PROGRESS_KEY, nextIndex);

    console.info(
      `[${CRON_NAME}] Finished processing ${processedCount} users. Next run will start from index ${nextIndex}`,
    );

    if (nextIndex === 0 && processedCount > 0) {
      console.info(`[${CRON_NAME}] Completed a full cycle through all users`);
    }
  } catch (error) {
    console.error(
      `[${CRON_NAME}] CRITICAL ERROR in cron execution: ${
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : String(error)
      }`,
      error,
    );
  }
});
