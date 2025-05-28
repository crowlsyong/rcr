// routes/_middleware.ts
import { FreshContext } from "$fresh/server.ts";
import { deleteCookie, getCookies } from "$std/http/cookie.ts"; // Need deleteCookie
import { deleteAdminSession, getAdminLoginBySession } from "../database/db.ts"; // Import auth functions
import { ALLOWED_ADMIN_LOGINS } from "../utils/allowed_users.ts"; // Import allowed users

// Define the state interface for the middleware
export interface AdminState {
  isAdmin: boolean;
  githubLogin: string | null;
}

export async function handler(
  req: Request,
  ctx: FreshContext<AdminState>,
) {
  //  console.log("Middleware handler executed for:", req.url);

  const url = new URL(req.url);
  ctx.state.isAdmin = false;
  ctx.state.githubLogin = null;

  const cookies = getCookies(req.headers);
  const adminSessionId = cookies["session"];

  // --- Authentication Check and State Setting ---
  if (adminSessionId) {
    const githubLogin = await getAdminLoginBySession(adminSessionId);
    if (githubLogin && ALLOWED_ADMIN_LOGINS.includes(githubLogin)) {
      ctx.state.isAdmin = true;
      ctx.state.githubLogin = githubLogin;
    } else if (githubLogin) {
      // Valid session ID in KV, but login not in allowed list
      // This user is authenticated but not authorized for admin
      // Optionally invalidate their session.
      await deleteAdminSession(adminSessionId);
      const resp = new Response("Session invalidated", { status: 401 });
      deleteCookie(resp.headers, "session", { path: "/" });
      return resp; // Stop processing and return error
    }
    // If githubLogin is null, the session ID in the cookie is not in KV (invalid or expired).
    // The state remains non-admin.
  }
  // --- End Authentication Check ---

  // If trying to access the admin page and NOT an admin (and no valid session,
  // which is handled above), redirect to the sign-in page.
  // We do this here so the middleware can enforce the redirect before
  // the admin handler runs.
  if (url.pathname === "/admin" && !ctx.state.isAdmin) {
    // Allow the request to proceed to the admin handler.
    // The admin handler will check isAdmin and display the sign-in prompt.
    // We removed the direct redirect from here to rely on the admin page's component logic.
  }

  const resp = await ctx.next();

  // --- Existing CORS and CSP Headers ---
  const origin = req.headers.get("Origin") || "*";
  const headers = resp.headers;

  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With",
  );
  headers.set(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS, GET, PUT, DELETE",
  );

  const cspDirectives: Record<string, string[]> = {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "https://manifold.markets",
      "'unsafe-eval'", // Consider removing unsafe-eval and unsafe-inline if possible
      "'unsafe-inline'",
    ],
    styleSrc: [
      "'self'",
      "https://manifold.markets",
      "'unsafe-inline'",
    ],
    imgSrc: [
      "'self'",
      "https://firebasestorage.googleapis.com",
      "https://lh3.googleusercontent.com",
      "data:",
    ],
    fontSrc: ["'self'", "https://manifold.markets"],
    connectSrc: ["'self'", "https://manifold.markets"],
  };

  const cspString = Object.entries(cspDirectives)
    .map(([directive, sources]) =>
      `${kebabCase(directive)} ${sources.join(" ")}`
    )
    .join("; ");

  headers.set("Content-Security-Policy", cspString);
  // --- End CORS and CSP Headers ---

  return resp;
}

// Helper function to convert camelCase to kebab-case for CSP directives
function kebabCase(str: string): string {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1-$2").toLowerCase();
}
