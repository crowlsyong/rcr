// scripts/backup-kv.ts
/// <reference lib="deno.unstable" />

// This script will manually load environment variables from .env if present.
// This is specific to standalone scripts that need env vars available immediately.
async function loadEnv() {
  try {
    const envContent = await Deno.readTextFile(".env");
    envContent.split("\n").forEach((line) => {
      const parts = line.split("=");
      if (parts.length === 2) {
        const key = parts[0].trim();
        const value = parts[1].trim();
        // Set env variable if not already set, or if you want to override
        if (!Deno.env.get(key)) {
          Deno.env.set(key, value);
        }
      }
    });
    console.log("✅ .env file loaded successfully by script.");
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      // .env file not found, which is fine if env vars are set externally
      console.log("No .env file found, relying on existing environment variables.");
    } else {
      console.warn(
        `Warning: Could not load .env file: ${
          typeof error === "object" && error !== null && "message" in error
            ? (error as { message: string }).message
            : String(error)
        }`
      );
    }
  }
}

// You will need to hardcode your remote database URL here for this script.
const REMOTE_KV_URL = "https://api.deno.com/databases/a452056e-540a-4299-8f8b-19bec18e3e3f/connect";

async function backupDatabase() {
  let db: Deno.Kv;

  // Manually load environment variables first
  await loadEnv();

  // Now, DENO_KV_ACCESS_TOKEN should be available via Deno.env.get()
  const accessToken = Deno.env.get("DENO_KV_ACCESS_TOKEN");
  if (!accessToken) {
    throw new Error(
      "DENO_KV_ACCESS_TOKEN environment variable is missing. Please ensure it's in your .env file or set in your shell.",
    );
  }

  try {
    // Open the remote KV database directly for this script
    // Deno.openKv() will implicitly use DENO_KV_ACCESS_TOKEN from Deno.env
    db = await Deno.openKv(REMOTE_KV_URL);
    console.log("✅ Script connected directly to REMOTE Deno KV database for backup.");
  } catch (error) {
    console.error(`Critical Error: Failed to open Deno KV for backup: ${
      typeof error === "object" && error !== null && "message" in error
        ? (error as { message: string }).message
        : String(error)
    }`, error);
    throw new Error(`Failed to initialize Deno KV for backup: ${
      typeof error === "object" && error !== null && "message" in error
        ? (error as { message: string }).message
        : String(error)
    }`);
  }

  const backupData = [];
  console.log("Starting Deno KV backup...");

  const iter = db.list({ prefix: [] });
  for await (const entry of iter) {
    backupData.push({
      key: entry.key,
      value: entry.value,
    });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `deno-kv-backup-${timestamp}.json`;

  await Deno.writeTextFile(filename, JSON.stringify(backupData, null, 2));
  console.log(`✅ Backup complete! ${backupData.length} entries saved to ${filename}`);

  db.close();
}

if (import.meta.main) {
  await backupDatabase();
}
