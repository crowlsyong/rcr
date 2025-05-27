// utils/allowed_users.ts
import "$std/dotenv/load.ts";

const loginsEnv = Deno.env.get("ALLOWED_ADMIN_LOGINS");
export const ALLOWED_ADMIN_LOGINS: string[] = loginsEnv
  ? loginsEnv.split(",").map((login) => login.trim()).filter(Boolean)
  : [];

if (ALLOWED_ADMIN_LOGINS.length === 0) {
  console.warn(
    "Warning: No ALLOWED_ADMIN_LOGINS configured in environment variables. Admin access will be blocked.",
  );
}
