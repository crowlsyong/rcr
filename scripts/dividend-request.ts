// /post-dividend-request.ts

import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";

const MANIFOLD_API_BASE_URL = "https://api.manifold.markets";
const CONTRACT_ID = "QEytQ5ch0P";
const COMMENT_MARKDOWN = `# Q3 PAYMENTS
RISK net income was **M0** in fees during Q3. 30% goes to investor dividends and the rest goes to RISKBOT which is the official financial holder of RISK's income. 
## DIVIDEND REQUEST
Requesting M140 (M10 late fee) to distribute as for Q3 dividend distribution
## PROFIT REQUEST
Requesting M0 (70% of M0) Q2 net profits.`;

async function main() {
  await load({ envPath: "../.env", export: true });

  const RISKBOT_API_KEY = Deno.env.get("RISKBOT_API_KEY");

  if (!RISKBOT_API_KEY) {
    console.error(
      "RISKBOT_API_KEY environment variable is not set. " +
        "It is required to post comments. Please ensure it is in your .env file.",
    );
    Deno.exit(1);
  }

  try {
    console.log(`Attempting to post comment to market ID: ${CONTRACT_ID}`);
    const response = await fetch(`${MANIFOLD_API_BASE_URL}/v0/comment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Key ${RISKBOT_API_KEY}`,
      },
      body: JSON.stringify({
        contractId: CONTRACT_ID,
        markdown: COMMENT_MARKDOWN,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(
        `Failed to post comment: HTTP status ${response.status}. ` +
          `Error: ${
            errorData.message || response.statusText || "Unknown error."
          }`,
      );
      Deno.exit(1);
    }

    const responseData = await response.json();
    console.log("Comment posted successfully!");
    console.log(`Response: ${JSON.stringify(responseData, null, 2)}`);
  } catch (error: unknown) {
    console.error(
      `Network/fetch error: ${
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : String(error)
      }`,
    );
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}
