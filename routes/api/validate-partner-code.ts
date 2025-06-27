// routes/api/validate-partner-code.ts

import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  async POST(req) {
    const { code } = await req.json();

    // IMPORTANT: Access the environment variable securely on the server
    const VALID_PARTNER_CODES_STR = Deno.env.get("PARTNER_CODES") || "";
    const VALID_PARTNER_CODES = VALID_PARTNER_CODES_STR.split(",")
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean); // Split by comma, trim, uppercase, remove empty strings

    const isCodeValid = VALID_PARTNER_CODES.includes(code.toUpperCase());

    if (isCodeValid) {
      return new Response(JSON.stringify({ isValid: true, message: "Partner discount applied!" }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      return new Response(
        JSON.stringify({ isValid: false, message: "Invalid partner code" }),
        {
          headers: { "Content-Type": "application/json" },
          status: 200, // Returning 200 even for invalid code is common for validation
        },
      );
    }
  },
};
