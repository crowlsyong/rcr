/// <reference lib="deno.unstable" />

import db from "../database/db.ts";
import { handler as scoreHandler } from "../routes/api/score.ts";

const cronName = "Update User Credit Scores";
// Process up to 1 user per minute per 24 hours
const usersPerDay = 1 * 60 * 24; // 1440 minutes in a day

/**
 * Fetches all UNIQUE user IDs from the KV database, looking under the credit_scores prefix.
 */
async function getAllUserIds(): Promise<string[]> {
  const uniqueUserIds = new Set<string>();
  // Change the prefix to ["credit_scores"] to match your data structure
  const iter = db.list({ prefix: ["credit_scores"] });

  for await (const entry of iter) {
    // Check if the key is an array and has at least two elements
    // where the second element is the userId (as seen in your KV logs)
    if (Array.isArray(entry.key) && entry.key.length > 1) {
      const userId = entry.key[1] as string;
      // Add the userId to the Set to get unique IDs
      uniqueUserIds.add(userId);
    }
  }
  // Convert the Set back to an array of unique user IDs
  return Array.from(uniqueUserIds);
}

/**
 * Processes a single user to update their score by calling the score API handler.
 */
async function processUserScore(userId: string) {
  console.log(`[${cronName}] Processing score for user ID: ${userId}`);
  try {
    const userProfileEntry = await db.get<{ username: string }>([
      "user_profile", // <-- ADJUST THIS PREFIX/KEY STRUCTURE if needed
      userId,
      "profile", // <-- ADJUST THIS KEY STRUCTURE if needed
    ]);
    const username = userProfileEntry.value?.username;


    if (!username) {
      console.warn(`[${cronName}] Username not found for user ID: ${userId}. Skipping.`);
      // Consider removing deleted users from your processing list if they are not in user_profile
      // but still appear in old credit_scores entries.
      return;
    }

    // Construct a mock Request to pass to your existing API handler
    const mockRequest = new Request(
      `http://localhost/api/score?username=${encodeURIComponent(username)}`,
      {
        method: "GET",
      },
    );

    // Call the existing score API handler to perform the update logic
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
    // Consider logging specific API fetch errors here if they are caught by processUserScore
  }
}

const dailySchedule = "6 6 * * *"; // 1:06 AM CST/CDT (which is 6:06 AM UTC right now if on CDT)

// Define the Deno.cron task at the top level
Deno.cron(cronName, dailySchedule, async () => {
  // Log message indicating the cron job has triggered (moved inside the handler)
  console.log(`[${cronName}] Cron job triggered with schedule "${dailySchedule}".`);
  try {
    // Fetch the list of unique user IDs from the database
    const allUserIds = await getAllUserIds();
    const totalUserCount = allUserIds.length;
    console.log(
      `[${cronName}] Total unique users in DB: ${totalUserCount}.`,
    );

    // --- Handle the case where no users are found ---
    if (totalUserCount === 0) {
      console.log(`[${cronName}] No users found in the database under prefix ["credit_scores"]. Skipping processing.`);
      // Optionally, reset the last processed index to 0 if the user list becomes empty
      const lastProcessedIndexKey = ["cron_progress", cronName, "last_index"];
       const atomic = db.atomic();
       atomic.set(lastProcessedIndexKey, 0);
       await atomic.commit();
      return; // Exit the handler early if no users to process
    }
    // --- End of empty user check ---


    // Retrieve the index of the last processed user from the previous cron run
    const lastProcessedIndexKey = ["cron_progress", cronName, "last_index"];
    const lastProcessedIndexEntry = await db.get<number>(
      lastProcessedIndexKey,
    );
    const lastProcessedIndex = lastProcessedIndexEntry.value ?? 0; // Default to 0 if not found

    // Calculate how many users to process in this specific cron execution
    const usersToProcessInThisRun = Math.min(
      usersPerDay, // The maximum number of users to process per day
      totalUserCount - lastProcessedIndex, // Or the remaining users if fewer than the daily limit
    );

    // Ensure we don't try to process a negative number of users
    if (usersToProcessInThisRun <= 0 && totalUserCount > 0) {
       console.log(`[${cronName}] All users processed in previous runs. Starting new cycle from index 0.`);
        const atomic = db.atomic();
        atomic.set(lastProcessedIndexKey, 0);
        await atomic.commit();
        // Recalculate usersToProcessInThisRun for the new cycle start
         const updatedLastProcessedIndex = 0;
         const updatedUsersToProcess = Math.min(usersPerDay, totalUserCount - updatedLastProcessedIndex);
         console.log(`[${cronName}] Restarting processing from index ${updatedLastProcessedIndex}. Processing ${updatedUsersToProcess} users in this run.`);

        // Proceed with processing from index 0 for updatedUsersToProcess
        let processedCount = 0;
         for (
           let i = 0;
           i < updatedUsersToProcess &&
           (updatedLastProcessedIndex + i) < totalUserCount;
           i++
         ) {
           const userId = allUserIds[updatedLastProcessedIndex + i];
           await processUserScore(userId);
           processedCount++;
         }

         // Update the last processed index for the next run
         const nextIndexAfterRestart = (updatedLastProcessedIndex + processedCount) % totalUserCount;
         const atomicAfterRestart = db.atomic();
         atomicAfterRestart.set(lastProcessedIndexKey, nextIndexAfterRestart);
         await atomicAfterRestart.commit();

        console.log(
          `[${cronName}] Finished processing ${processedCount} users in the new cycle. Next run will start from index ${nextIndexAfterRestart}.`,
        );

        // Since we just started a new cycle, don't log the "Completed a full cycle" message here
        return; // Exit after processing the first chunk of the new cycle
    }


    console.log(
      `[${cronName}] Starting processing from index ${lastProcessedIndex}. Processing ${usersToProcessInThisRun} users in this run.`,
    );

    let processedCount = 0;
    // Loop through the calculated chunk of user IDs starting from lastProcessedIndex
    for (
      let i = 0;
      i < usersToProcessInThisRun &&
      (lastProcessedIndex + i) < totalUserCount; // Ensure index is within bounds
      i++
    ) {
      const userId = allUserIds[lastProcessedIndex + i];
      await processUserScore(userId); // Process the score for the current user
      processedCount++; // Increment the count of processed users in this run
    }

    // Calculate the index for the next cron run
    const nextIndex = (lastProcessedIndex + processedCount) % totalUserCount;

    // Save the next starting index to KV atomically
    const atomic = db.atomic();
    atomic.set(lastProcessedIndexKey, nextIndex);
    await atomic.commit();

    console.log(
      `[${cronName}] Finished processing ${processedCount} users. Next run will start from index ${nextIndex}.`,
    );

    // Check if a full cycle through all users has been completed
    if (nextIndex === 0 && processedCount > 0) {
      console.log(`[${cronName}] Completed a full cycle through all users.`);
    }

  } catch (error) {
    // Log any errors that occur during the cron execution
    console.error(`[${cronName}] Error during cron execution:`, error);
    // Deno.cron has built-in retries, but you could add custom logging/alerting here
  }
});
