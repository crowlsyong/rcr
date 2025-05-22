/// <reference lib="deno.unstable" />

import { dirname, fromFileUrl, join } from "$std/path/mod.ts";

// Get the absolute path to the directory containing this module (database/)
const currentModuleDir = dirname(fromFileUrl(import.meta.url));

// Define the directory where KV files should be stored
const dataDirectory = join(currentModuleDir, "data");

// Define the path to the main KV database *file* within the data directory
// We'll name the main file '.deno_kv.sqlite' as a convention
const kvPath = join(dataDirectory, ".deno_kv.sqlite");

let db: Deno.Kv;

try {
  // Ensure the data directory exists before trying to open the file within it
  await Deno.mkdir(dataDirectory, { recursive: true }).catch(() => {}); // Create directory if it doesn't exist, ignore if it does

  // Attempt to open the KV database *file*
  db = await Deno.openKv(kvPath);
  console.log(`Deno KV opened at path: ${kvPath}`); // Log the absolute file path
} catch (error) {
  console.error(`Error opening Deno KV at path ${kvPath}:`, error);
  Deno.exit(1);
}

export default db;
