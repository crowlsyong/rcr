// routes/_middleware.ts

import { FreshContext } from "$fresh/server.ts";
import { deleteCookie, getCookies } from "$std/http/cookie.ts";
import { deleteAdminSession, getAdminLoginBySession } from "../database/db.ts";
import { ALLOWED_ADMIN_LOGINS } from "../utils/auth/allowed_users.ts";

export interface AdminState {
  isAdmin: boolean;
  githubLogin: string | null;
}

export async function handler(
  req: Request,
  ctx: FreshContext<AdminState>,
) {
  const url = new URL(req.url);
  ctx.state.isAdmin = false;
  ctx.state.githubLogin = null;

  if (url.hostname === "localhost" && url.port === "8000") {
    ctx.state.isAdmin = true;
    ctx.state.githubLogin = "localhost_admin";
  } else {
    const cookies = getCookies(req.headers);
    const adminSessionId = cookies["session"];

    if (adminSessionId) {
      const githubLogin = await getAdminLoginBySession(adminSessionId);
      if (githubLogin && ALLOWED_ADMIN_LOGINS.includes(githubLogin)) {
        ctx.state.isAdmin = true;
        ctx.state.githubLogin = githubLogin;
      } else if (githubLogin) {
        await deleteAdminSession(adminSessionId);
        const resp = new Response("", { status: 401 });
        deleteCookie(resp.headers, "session", { path: "/" });
        return resp;
      }
    }
  }

  const resp = await ctx.next();

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
      "'unsafe-eval'",
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
      "https://www.notion.so",
      "https://notion.site",
      "https://atom-club-701.notion.site",
    ],
    fontSrc: ["'self'", "https://manifold.markets"],
    connectSrc: [
      "'self'",
      "https://manifold.markets",
      "https://api.manifold.markets",
      "https://www.notion.so",
      "https://notion.site",
      "https://atom-club-701.notion.site",
    ],
    frameSrc: [
      "'self'",
      "https://notion.site",
      "https://www.notion.so",
      "https://atom-club-701.notion.site",
      "https://docs.google.com", // Added for Google Docs iframes
    ],
    childSrc: [
      "'self'",
      "https://notion.site",
      "https://www.notion.so",
      "https://atom-club-701.notion.site",
      "https://docs.google.com", // Added for Google Docs iframes
    ],
  };

  const cspString = Object.entries(cspDirectives)
    .map(([directive, sources]) =>
      `${kebabCase(directive)} ${sources.join(" ")}`
    )
    .join("; ");

  headers.set("Content-Security-Policy", cspString);

  return resp;
}

function kebabCase(str: string): string {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1-$2").toLowerCase();
}
