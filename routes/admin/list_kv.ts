/// <reference lib="deno.unstable" />

// delete_kv_entries.ts
// Temporary script to delete specific historical data entries from Deno KV.

import db from "../../db.ts"; // Import your database instance

// The user ID for whom to delete data.
const targetUserId: string = "p9Y7TzXx4NO1JQb9kjdbUYRUU3X2";

// The full key of the entry you want to KEEP.
const keyToKeep: Deno.KvKey = ["credit_scores", targetUserId, 1747938055213];

console.log(
  `Deleting historical credit score data for user ID: ${targetUserId}, keeping entry with key: ${
    JSON.stringify(keyToKeep)
  }`,
);

const historicalDataPrefix = ["credit_scores", targetUserId];
const keysToDelete: Deno.KvKey[] = [];

try {
  console.log("Fetching entries to identify those for deletion...");
  // Use db.list to iterate over all entries for the user.
  for await (const entry of db.list({ prefix: historicalDataPrefix })) {
    // Compare the current entry's key with the key you want to keep.
    // If the keys are NOT strictly equal, add it to the list of keys to delete.
    // Using JSON.stringify for comparison as Deno.KvKey arrays might not compare
    // directly with === in all environments, although it often works.
    // A more robust comparison could involve deep comparison of array elements.
    if (JSON.stringify(entry.key) !== JSON.stringify(keyToKeep)) {
      keysToDelete.push(entry.key);
      console.log(`  Identified for deletion: ${JSON.stringify(entry.key)}`);
    } else {
      console.log(`  Keeping entry: ${JSON.stringify(entry.key)}`);
    }
  }
  console.log(`Identified ${keysToDelete.length} entries to delete.`);
} catch (error) {
  console.error("Error listing entries for deletion:", error);
  // Exit if listing fails to prevent accidental deletion.
  Deno.exit(1);
}

// --- Step 3: Execute deletion for identified keys ---

if (keysToDelete.length > 0) {
  console.log(`\nExecuting deletion for ${keysToDelete.length} entries...`);
  try {
    const atomic = db.atomic();
    // Add each key to the atomic delete operation.
    for (const key of keysToDelete) {
      atomic.delete(key);
    }
    // Commit the atomic transaction. All deletes succeed or none do.
    await atomic.commit();
    console.log("Deletion complete.");
  } catch (error) {
    console.error("Error during deletion:", error);
  }
} else {
  console.log(
    "\nNo entries identified for deletion (all entries match the key to keep).",
  );
}

// Close the database connection.
// db.close(); // Explicit close is optional.

console.log("\nScript finished.");
