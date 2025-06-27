// routes/api/validate-partner-code.ts

import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  async POST(req) {
    const { code } = await req.json();

    const VALID_PARTNER_CODES_STR = Deno.env.get("PARTNER_CODES") || "";
    const VALID_PARTNER_CODES = new Set(
      VALID_PARTNER_CODES_STR.split(",")
        .map((c) => c.trim().toUpperCase())
        .filter(Boolean),
    );

    const upperCaseCode = code.toUpperCase();
    const isCodeValid = VALID_PARTNER_CODES.has(upperCaseCode);

    const discountType = isCodeValid ? "GENERIC_DISCOUNT" : null;

    if (isCodeValid) {
      return new Response(
        JSON.stringify({
          isValid: true,
          message: "Partner discount applied!",
          discountType: discountType,
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 200,
        },
      );
    } else {
      return new Response(
        JSON.stringify({
          isValid: false,
          message: "Invalid partner code",
          discountType: null,
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 200,
        },
      );
    }
  },
};
