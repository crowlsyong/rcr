// routes/api/v0/_middleware.ts
import { FreshContext } from "$fresh/server.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*", // Allow any origin
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Requested-With",
};

export async function handler(req: Request, ctx: FreshContext) {
  // Handle preflight OPTIONS requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204, // No Content
      headers: CORS_HEADERS,
    });
  }

  // Add CORS headers to actual responses
  const resp = await ctx.next();
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    resp.headers.set(key, value);
  }

  return resp;
}
