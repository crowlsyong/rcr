// routes/auth/signout.ts
import { deleteCookie, getCookies } from "$std/http/cookie.ts";
import { deleteAdminSession } from "../../database/db.ts";
import { Handlers } from "fresh/compat";

export const handler: Handlers = {
  async GET(ctx) {
    const req = ctx.req;
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
