// routes/api/validate-partner-code.ts

import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  async POST(req) {
    const { code } = await req.json();

    // IMPORTANT: Access the environment variable securely on the server
    const VALID_PARTNER_CODES_STR = Deno.env.get("PARTNER_CODES") || "";
    // Create a map for quick lookup and to store the discount type
    const PARTNER_CODE_MAP: { [key: string]: string } = {};

    VALID_PARTNER_CODES_STR.split(",")
      .map((c) => c.trim())
      .filter(Boolean)
      .forEach((validCode) => {
        // Assuming format like "100-BANK-25" or "IMF-BANK-25"
        const parts = validCode.split("-");
        if (parts.length >= 2) {
          // Use the first part as the 'type' for the display
          PARTNER_CODE_MAP[validCode.toUpperCase()] = parts[0].toUpperCase();
        } else {
          // Fallback if code format isn't as expected
          PARTNER_CODE_MAP[validCode.toUpperCase()] = "PARTNER";
        }
      });

    const upperCaseCode = code.toUpperCase();
    const isCodeValid = Object.prototype.hasOwnProperty.call(
      PARTNER_CODE_MAP,
      upperCaseCode,
    );
    const discountType = isCodeValid ? PARTNER_CODE_MAP[upperCaseCode] : null;

    if (isCodeValid) {
      return new Response(
        JSON.stringify({
          isValid: true,
          message: "Partner discount applied!",
          discountType: discountType, // Include the specific discount type
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 200,
        },
      );
    } else {
      return new Response(
        JSON.stringify({ isValid: false, message: "Invalid partner code", discountType: null }),
        {
          headers: { "Content-Type": "application/json" },
          status: 200, // Returning 200 even for invalid code is common for validation
        },
      );
    }
  },
};
