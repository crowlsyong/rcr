// database/scripts/migration/migrate-user-profiles.ts
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
      console.log(
        "No .env file found, relying on existing environment variables.",
      );
    } else {
      console.warn(
        `Warning: Could not load .env file: ${
          typeof error === "object" && error !== null && "message" in error
            ? (error as { message: string }).message
            : String(error)
        }`,
      );
    }
  }
}

// IMPORTANT: Hardcode your remote database URL here for this script.
const REMOTE_KV_URL =
  "https://api.deno.com/databases/a452056e-540a-4299-8f8b-19bec18e3e3f/connect";

interface UserProfile {
  id: string;
  username: string;
}

async function migrateUserProfiles() {
  let db: Deno.Kv;
  await loadEnv();
  const accessToken = Deno.env.get("DENO_KV_ACCESS_TOKEN");
  if (!accessToken) {
    throw new Error("DENO_KV_ACCESS_TOKEN environment variable is missing.");
  }

  try {
    db = await Deno.openKv(REMOTE_KV_URL);
    console.log(
      "✅ Script connected directly to REMOTE Deno KV database for migration.",
    );
  } catch (error) {
    console.error(
      `Critical Error: Failed to open Deno KV for migration: ${
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : String(error)
      }`,
    );
    throw new Error("Failed to initialize Deno KV for migration.");
  }

  console.log("Starting user profile migration...");
  const uniqueUsers = new Map<string, string>();

  const iter = db.list({ prefix: ["credit_scores"] });
  for await (const entry of iter) {
    if (Array.isArray(entry.key) && entry.key.length > 1) {
      const userId = entry.key[1] as string;
      let username: string | undefined;

      if (
        entry.value && typeof entry.value === "object" &&
        "username" in entry.value &&
        typeof (entry.value as { username: string }).username === "string"
      ) {
        username = (entry.value as { username: string }).username;
      }

      if (username) {
        uniqueUsers.set(userId, username);
      }
    }
  }

  console.log(
    `Found ${uniqueUsers.size} unique users. Populating 'users' collection...`,
  );

  let count = 0;
  let atomicOp = db.atomic();
  const BATCH_SIZE = 450;

  for (const [userId, username] of uniqueUsers.entries()) {
    atomicOp = atomicOp.set(["users", userId], {
      id: userId,
      username: username,
    });
    count++;

    if (count % BATCH_SIZE === 0) {
      await atomicOp.commit();
      console.log(`Processed ${count} users, committed batch.`);
      atomicOp = db.atomic();
    }
  }

  if (count % BATCH_SIZE !== 0) { // Commit any remaining items in the last batch
    await atomicOp.commit();
  }

  console.log(`✅ Migration complete. Populated ${count} user profiles.`);
  db.close();
}

if (import.meta.main) {
  try {
    await migrateUserProfiles();
    console.log("Migration script finished successfully.");
  } catch (error) {
    console.error(
      `Migration failed: ${
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : String(error)
      }`,
    );
    Deno.exit(1);
  }
}
