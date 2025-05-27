// routes/auth/signout.ts
import { Handlers } from "$fresh/server.ts";
import { deleteCookie, getCookies } from "$std/http/cookie.ts";
import { deleteAdminSession } from "../../database/db.ts";

export const handler: Handlers = {
  async GET(req) {
    const cookies = getCookies(req.headers);
    const adminSessionId = cookies["session"];

    if (adminSessionId) {
      await deleteAdminSession(adminSessionId);
    }

    const resp = new Response("Logged out, redirecting...", {
      headers: { Location: "/" }, // Redirect to home page
      status: 302,
    });
    deleteCookie(resp.headers, "session", { path: "/" });
    return resp;
  },
};
