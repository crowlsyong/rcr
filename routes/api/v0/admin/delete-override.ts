// routes/api/v0/admin/delete-override.ts
import { Handlers } from "$fresh/server.ts";
import db from "../../../../database/db.ts"; // Path to db.ts
import { AdminState } from "../../../../routes/_middleware.ts"; // Admin state from middleware

const getErrorMessage = (e: unknown): string => {
  return typeof e === "object" && e !== null && "message" in e
    ? (e as { message: string }).message
    : String(e);
};

export const handler: Handlers<null, AdminState> = {
  async POST(req, ctx) {
    if (!ctx.state.isAdmin) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Admin access required." }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    try {
      const { userId, timestamp } = await req.json();

      if (!userId || typeof timestamp !== "number") {
        return new Response(
          JSON.stringify({
            error: "Missing userId or timestamp for deletion.",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const kvKey = ["score_overrides", userId, timestamp];
      const entryToDelete = await db.get(kvKey);

      if (entryToDelete.value === null) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Override entry not found.",
          }),
          { status: 404, headers: { "Content-Type": "application/json" } },
        );
      }

      await db.delete(kvKey);
      console.log(
        `Admin Delete: Deleted override for ${userId} at timestamp ${timestamp}.`,
      );

      return new Response(
        JSON.stringify({
          success: true,
          message: "Adjustment deleted successfully.",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    } catch (e) {
      console.error("API: delete-override handler caught error:", e);
      return new Response(
        JSON.stringify({
          error: `Server error: ${getErrorMessage(e)}`,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
};
