/// <reference lib="deno.unstable" />

let db: Deno.Kv;

try {
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
