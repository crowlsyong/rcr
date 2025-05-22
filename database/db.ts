/// <reference lib="deno.unstable" />

// For Deno Deploy, Deno.openKv() with no arguments accesses the
// project's default KV database. Custom paths are not supported.

let db: Deno.Kv;

try {
  // On Deno Deploy, this connects to the provisioned KV.
  // Locally, this opens the default file-based KV (potentially in a temp dir).
  db = await Deno.openKv();
  console.log(`Deno KV opened successfully.`);
} catch (error) {
  console.error(`Critical Error: Failed to open Deno KV:`, error);
  if (error instanceof Error) {
    throw new Error(`Failed to initialize Deno KV: ${error.message}`);
  } else {
    throw new Error(`Failed to initialize Deno KV: ${error}`);
  }
}

export default db;
