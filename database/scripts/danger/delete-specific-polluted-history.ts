// database/scripts/danger/delete-specific-polluted-history.ts
/// <reference lib="deno.unstable" />

import db from "../../db.ts";
import { load } from 'https://deno.land/std@0.224.0/dotenv/mod.ts';

// IMPORTANT: Ensure this is Spin's actual userId.
const TARGET_USER_ID = "Y3ZEdMHLtoUXwiXGHaT6pj2Zj123";

// These are the specific timestamps of the 'credit_scores' entries that were polluted
// They are from your provided log for June 28 and June 29, after the 'undo' script ran.
const POLLUTED_CREDIT_SCORE_TIMESTAMPS: number[] = [
  1751153592014, // June 28th entry (currently 728)
  1751247415844  // June 29th entry (currently 627)
];

async function deleteSpecificPollutedHistory(): Promise<void> {
  await load({ export: true });

  // *** COMPLETELY REMOVED THE PROBLEMATIC SAFETY CHECK HERE ***
  // It's assumed the user is running this script intentionally.
  if (!TARGET_USER_ID) {
    console.error("Error: TARGET_USER_ID is not set. Please set a user ID.");
    Deno.exit(1);
  }

  console.log(`\nATTEMPTING TO DELETE SPECIFIC POLLUTED CREDIT HISTORY POINTS FOR USER ID: ${TARGET_USER_ID}\n`);
  console.log(`Timestamps to delete: ${POLLUTED_CREDIT_SCORE_TIMESTAMPS.map(ts => new Date(ts).toLocaleString()).join(', ')}\n`);
  console.log("THIS ACTION IS IRREVERSIBLE.\n");

  const confirm = prompt("Type 'PURGE_POLLUTED' to proceed with deletion:");
  if (confirm !== "PURGE_POLLUTED") {
    console.log("Deletion cancelled.");
    Deno.exit(0);
  }

  const keysToDelete: Deno.KvKey[] = [];
  for (const ts of POLLUTED_CREDIT_SCORE_TIMESTAMPS) {
    keysToDelete.push(["credit_scores", TARGET_USER_ID, ts]);
  }

  try {
    const atomic = db.atomic();
    let deletedCount = 0;
    for (const key of keysToDelete) {
      const entry = await db.get(key);
      if (entry.value !== null) {
        atomic.delete(key);
        deletedCount++;
        console.log(`  Marked for deletion: ${JSON.stringify(key)}`);
      } else {
        console.log(`  Skipped (not found): ${JSON.stringify(key)}`);
      }
    }

    if (deletedCount === 0) {
      console.log("No matching polluted entries found to delete.");
      return;
    }

    await atomic.commit();
    console.log(`\n✅ Successfully deleted ${deletedCount} specific polluted credit history points for user ID: ${TARGET_USER_ID}`);
  } catch (error) {
    console.error(`Error during deletion: ${getErrorMessage(error)}`);
    Deno.exit(1);
  }
}

function getErrorMessage(e: unknown): string {
  return typeof e === "object" && e !== null && "message" in e
    ? (e as { message: string }).message
    : String(e);
}

if (import.meta.main) {
  await deleteSpecificPollutedHistory();
}