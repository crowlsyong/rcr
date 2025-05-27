// routes/auth/signin.ts
import { Handlers } from "$fresh/server.ts";
import { setCookie } from "$std/http/cookie.ts";
import { setOauthSession } from "../../database/db.ts";
import { oauth2Client } from "../../utils/oauth.ts";

export const handler: Handlers = {
  async GET() {
    const oauthSessionId = crypto.randomUUID();
    const state = crypto.randomUUID();
    const { uri, codeVerifier } = await oauth2Client.code.getAuthorizationUri({
      state,
    });

    await setOauthSession(oauthSessionId, { state, codeVerifier });

    const resp = new Response("Redirecting to GitHub...", {
      headers: { Location: uri.href },
      status: 307, // Temporary Redirect
    });

    setCookie(resp.headers, {
      name: "oauth-session",
      value: oauthSessionId,
      path: "/",
      httpOnly: true,
      secure: true, // Recommended for production
      sameSite: "Lax",
    });
    return resp;
  },
};
