// routes/api/v0/market/[slug].ts
import { FreshContext, Handlers } from "$fresh/server.ts";
import { getMarketDataBySlug } from "../../../../utils/api/manifold_api_service.ts";

export const handler: Handlers = {
  async GET(_req: Request, ctx: FreshContext) {
    const slug = ctx.params.slug;

    if (!slug) {
      return new Response(
        JSON.stringify({ error: "Market slug is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    try {
      const { data, error } = await getMarketDataBySlug(slug);

      if (error || !data) {
        return new Response(
          JSON.stringify({ error: error || "Market not found" }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      const errorMessage = typeof e === "object" && e !== null && "message" in e
        ? (e as { message: string }).message
        : String(e);
      return new Response(
        JSON.stringify({ error: `Internal server error: ${errorMessage}` }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
};
