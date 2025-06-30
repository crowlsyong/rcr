// database/db.ts
/// <reference lib="deno.unstable" />

// NEW: Import and call load() at the very top of the file
import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
await load({ export: true }); // Ensure .env is loaded before Deno.openKv()

let db: Deno.Kv;

try {
  const isDenoDeployment = Deno.env.get("DENO_DEPLOYMENT_ID") !== undefined;

  if (isDenoDeployment) {
    db = await Deno.openKv();
    console.log("✅ Connected to Deno Deploy KV database");
  } else {
    const accessToken = Deno.env.get("DENO_KV_ACCESS_TOKEN");

    if (accessToken) {
      db = await Deno.openKv(
        "https://api.deno.com/databases/a452056e-540a-4299-8f8b-19bec18e3e3f/connect",
      );
      console.log("✅ Connected to production Deno KV database from local dev");
    } else {
      db = await Deno.openKv();
      console.log("✅ Connected to local Deno KV database");
    }
  }
} catch (error) {
  console.error(`Critical Error: Failed to open Deno KV:`, error);
  if (error instanceof Error) {
    throw new Error(`Failed to initialize Deno KV: ${error.message}`);
  } else {
    throw new Error(`Failed to initialize Deno KV: ${error}`);
  }
}

export default db;

interface OauthSession {
  state: string;
  codeVerifier: string;
}

interface AdminSession {
  githubLogin: string;
}

export async function setOauthSession(session: string, value: OauthSession) {
  await db.set(["oauth_sessions", session], value, {
    expireIn: 1000 * 60 * 10,
  });
}

export async function getAndDeleteOauthSession(
  session: string,
): Promise<OauthSession | null> {
  const res = await db.get<OauthSession>(["oauth_sessions", session]);
  if (res.versionstamp === null) return null;
  await db.delete(["oauth_sessions", session]);
  return res.value;
}

export async function setAdminSession(session: string, githubLogin: string) {
  await db.set(["admin_sessions", session], { githubLogin }, {
    expireIn: 1000 * 60 * 60 * 24 * 30,
  });
}

export async function getAdminLoginBySession(
  session: string,
): Promise<string | null> {
  const res = await db.get<AdminSession>(["admin_sessions", session]);
  return res.value ? res.value.githubLogin : null;
}

export async function deleteAdminSession(session: string) {
  await db.delete(["admin_sessions", session]);
}
