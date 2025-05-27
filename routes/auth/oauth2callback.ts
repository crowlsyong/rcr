// routes/auth/oauth2callback.ts
import { Handlers } from "$fresh/server.ts";
import { deleteCookie, getCookies, setCookie } from "$std/http/cookie.ts";
import {
  getAndDeleteOauthSession,
  setAdminSession,
} from "../../database/db.ts";
import { getAuthenticatedUser } from "../../utils/github.ts";
import { oauth2Client } from "../../utils/oauth.ts";
import { ALLOWED_ADMIN_LOGINS } from "../../utils/allowed_users.ts";

export const handler: Handlers = {
  async GET(req) {
    const cookies = getCookies(req.headers);
    const oauthSessionId = cookies["oauth-session"];

    if (!oauthSessionId) {
      return new Response("Missing OAuth session cookie", { status: 400 });
    }

    const oauthSession = await getAndDeleteOauthSession(oauthSessionId);
    if (!oauthSession) {
      return new Response("Invalid or expired OAuth session", { status: 400 });
    }

    const tokens = await oauth2Client.code.getToken(req.url, {
      state: oauthSession.state,
      codeVerifier: oauthSession.codeVerifier,
    });

    const ghUser = await getAuthenticatedUser(tokens.accessToken);

    if (!ALLOWED_ADMIN_LOGINS.includes(ghUser.login)) {
      const resp = new Response("User not authorized for admin access", {
        headers: { Location: "/forbidden" },
        status: 302,
      });
      deleteCookie(resp.headers, "oauth-session");
      return resp;
    }

    const adminSessionId = crypto.randomUUID();
    await setAdminSession(adminSessionId, ghUser.login);

    const resp = new Response("Login successful, redirecting...", {
      headers: { Location: "/admin" },
      status: 302,
    });

    deleteCookie(resp.headers, "oauth-session");
    setCookie(resp.headers, {
      name: "session",
      value: adminSessionId,
      path: "/",
      httpOnly: true,
      secure: true, // Recommended for production
      sameSite: "Lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    return resp;
  },
};
