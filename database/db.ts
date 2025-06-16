/// <reference lib="deno.unstable" />

let db: Deno.Kv;

try {
  // Check if we're running on Deno Deploy
  const isDenoDeployment = Deno.env.get("DENO_DEPLOYMENT_ID") !== undefined;
  
  if (isDenoDeployment) {
    // On Deno Deploy - use the automatically linked KV database
    db = await Deno.openKv();
    console.log("✅ Connected to Deno Deploy KV database");
  } else {
    // Local development - check for access token to connect to remote KV
    const accessToken = Deno.env.get("DENO_KV_ACCESS_TOKEN");
    
    if (accessToken) {
      // Connect to production KV database from local dev
      db = await Deno.openKv("https://api.deno.com/databases/a452056e-540a-4299-8f8b-19bec18e3e3f/connect");
      console.log("✅ Connected to production Deno KV database from local dev");
    } else {
      // Fall back to local SQLite KV
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

// --- Authentication-Related KV Functions ---

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
  }); // 10 minute expiry
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
  }); // 30 day expiry
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