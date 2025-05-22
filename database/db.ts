/// <reference lib="deno.unstable" />

import { dirname, fromFileUrl, join } from "$std/path/mod.ts";

const currentModuleDir = dirname(fromFileUrl(import.meta.url));
const dataDirectory = join(currentModuleDir, "data");
const kvPath = join(dataDirectory, ".deno_kv.sqlite");

let db: Deno.Kv;

try {
  await Deno.mkdir(dataDirectory, { recursive: true }).catch(() => {});
  db = await Deno.openKv(kvPath);
  console.log(`Deno KV opened successfully.`);
} catch (error) {
  console.error(
    `Critical Error: Failed to open Deno KV at path ${kvPath}:`,
    error,
  );
  // Type guard to check if error is an instance of Error
  if (error instanceof Error) {
    throw new Error(`Failed to initialize Deno KV: ${error.message}`);
  } else {
    // Handle cases where the caught value is not an Error object
    throw new Error(`Failed to initialize Deno KV: ${error}`); // Coerce non-Error to string
  }
}

export default db;
