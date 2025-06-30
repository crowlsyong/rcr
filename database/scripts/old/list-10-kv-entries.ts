// database/scripts/old/list-kv-entries.ts
/// <reference lib="deno.unstable" />

// Adjust the path to your db.ts file if this script is not in 'scripts/'
import db from "../../db.ts";

/**
 * Lists the first N entries from the Deno KV database.
 *
 * @param count The number of entries to list.
 */
async function listKvEntries(count: number): Promise<void> {
  console.log(`Attempting to list the first ${count} entries from Deno KV...`);
  let entriesListed = 0;

  try {
    // Corrected: List all entries from the root using prefix: []
    const iter = db.list({ prefix: [] });

    for await (const entry of iter) {
      console.log(`--- Entry ${entriesListed + 1} ---`);
      console.log("Key:", entry.key);
      console.log("Value:", entry.value);
      console.log("Versionstamp:", entry.versionstamp);
      console.log("----------------------");
      entriesListed++;

      if (entriesListed >= count) {
        break; // Stop after listing the desired number of entries
      }
    }

    if (entriesListed === 0) {
      console.log("No entries found in the database.");
    } else {
      console.log(`Successfully listed ${entriesListed} entries.`);
    }
  } catch (error) {
    console.error(
      `Error listing Deno KV entries: ${
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : String(error)
      }`,
      error,
    );
    Deno.exit(1); // Exit with an error code
  }
}

// Run the function when the script is executed directly
if (import.meta.main) {
  // Call it to list the first 10 entries
  await listKvEntries(10);
}
