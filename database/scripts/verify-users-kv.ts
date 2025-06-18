// database/scripts/verify-users-kv.ts
/// <reference lib="deno.unstable" />

async function loadEnv() {
  try {
    const envContent = await Deno.readTextFile(".env");
    envContent.split("\n").forEach((line) => {
      const parts = line.split("=");
      if (parts.length === 2) {
        const key = parts[0].trim();
        const value = parts[1].trim();
        if (!Deno.env.get(key)) {
          Deno.env.set(key, value);
        }
      }
    });
    console.log("✅ .env file loaded successfully by script.");
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
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

// IMPORTANT: Hardcode your remote database URL here for this script.
const REMOTE_KV_URL = "https://api.deno.com/databases/a452056e-540a-4299-8f8b-19bec18e3e3f/connect";

async function verifyUserKvEntries(count: number): Promise<void> {
  let db: Deno.Kv;
  await loadEnv();
  const accessToken = Deno.env.get("DENO_KV_ACCESS_TOKEN");
  if (!accessToken) {
    throw new Error("DENO_KV_ACCESS_TOKEN environment variable is missing.");
  }

  try {
    db = await Deno.openKv(REMOTE_KV_URL);
    console.log("✅ Script connected directly to REMOTE Deno KV database for verification.");
  } catch (error) {
    console.error(`Critical Error: Failed to open Deno KV for verification: ${
      typeof error === "object" && error !== null && "message" in error
        ? (error as { message: string }).message
        : String(error)
    }`);
    throw new Error("Failed to initialize Deno KV for verification.");
  }

  console.log(`Attempting to list the first ${count} 'users' entries from Deno KV...`);
  let entriesListed = 0;

  try {
    // List entries specifically under the "users" prefix
    const iter = db.list({ prefix: ["users"] });

    for await (const entry of iter) {
      console.log(`--- Entry ${entriesListed + 1} ---`);
      console.log("Key:", entry.key);
      console.log("Value:", entry.value);
      console.log("Versionstamp:", entry.versionstamp);
      console.log("----------------------");
      entriesListed++;

      if (entriesListed >= count) {
        break;
      }
    }

    if (entriesListed === 0) {
      console.log("No 'users' entries found in the database. Migration might not have run or completed.");
    } else {
      console.log(`Successfully listed ${entriesListed} 'users' entries.`);
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
    Deno.exit(1);
  } finally {
    db.close();
  }
}

if (import.meta.main) {
  await verifyUserKvEntries(10); // List the first 10 user entries
}