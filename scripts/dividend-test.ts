// scripts//dividend.ts

import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";

const MANAGRAM_API_BASE_URL = "https://api.manifold.markets";

async function sendManagram(
  toIds: string[],
  amount: number,
  message: string,
  apiKey: string,
): Promise<
  { success: boolean; status?: number; error?: string; response?: unknown }
> {
  const finalAmount = Math.max(10, amount);
  if (finalAmount !== amount) {
    console.warn(
      `Managram amount for user(s) ${
        toIds.join(", ")
      } adjusted from ${amount} to ${finalAmount} (minimum 10).`,
    );
  }

  try {
    const response = await fetch(`${MANAGRAM_API_BASE_URL}/v0/managram`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Key ${apiKey}`,
      },
      body: JSON.stringify({
        toIds,
        amount: finalAmount,
        message,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        status: response.status,
        error: `Failed to send managram: HTTP status ${response.status}. ` +
          (errorData.message || response.statusText || "Unknown error."),
      };
    }

    const responseData = await response.json();
    return { success: true, response: responseData };
  } catch (error: unknown) {
    return {
      success: false,
      error: `Network/fetch error: ${
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : String(error)
      }`,
      status: 500,
    };
  }
}

const DRY_RUN_MODE = false;

async function main() {
  await load({ envPath: "../.env", export: true });

  const RISKBOT_API_KEY = Deno.env.get("RISKBOT_API_KEY");

  if (!RISKBOT_API_KEY) {
    console.error(
      "RISKBOT_API_KEY environment variable is not set. " +
        "It is required to send mana. Please ensure it is in your .env file.",
    );
    Deno.exit(1);
  }

  if (DRY_RUN_MODE) {
    console.warn("DRY RUN MODE IS ACTIVE.");
    console.warn(
      "Mana will be sent only to the configured dry-run test users using their specified dividend amounts.",
    );
  } else {
    console.log(
      "LIVE RUN MODE IS ACTIVE. Mana will be sent to all investors from the list.",
    );
  }

  interface Investor {
    userId: string;
    name: string;
    dividend: number;
    percentageOwned: number;
  }

  const allInvestors: Investor[] = [
    {
      name: "crowlsyong",
      userId: "p9Y7TzXx4NO1JQb9kjdbUYRUU3X2",
      dividend: 10,
      percentageOwned: 1.00,
    },
  ];

  if (allInvestors.length === 0) {
    console.log("No investor data found to process.");
    return;
  }

  console.log(`Found ${allInvestors.length} investors in total.`);

  let investorsToProcess: Investor[] = [];

  if (DRY_RUN_MODE) {
    const dryRunUsers: Investor[] = [
      {
        name: "crowlsyong",
        userId: "p9Y7TzXx4NO1JQb9kjdbUYRUU3X2",
        dividend: 10,
        percentageOwned: 0.55,
      },
    ];
    investorsToProcess = dryRunUsers;
    console.log(
      `[DRY RUN] Mana will be sent to: ${
        investorsToProcess
          .map((i) => `${i.name} (${i.userId}) — ${i.dividend} mana`)
          .join(", ")
      }.`,
    );
  } else {
    investorsToProcess = allInvestors;
    console.log(
      `Live run: Processing all ${investorsToProcess.length} investors.`,
    );
  }

  investorsToProcess = investorsToProcess.filter((investor) => {
    if (investor.dividend < 10) {
      console.warn(
        `Skipping ${investor.name} (${investor.userId}) because dividend ` +
          `(${investor.dividend}) is less than the minimum 10 mana.`,
      );
      return false;
    }
    return true;
  });

  if (investorsToProcess.length === 0) {
    console.log(
      "No investors to send dividends to based on current configuration.",
    );
    return;
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentQuarter = Math.floor(currentMonth / 3) + 1;

  const reportLink =
    `https://risk.markets/reports/RISK_${currentYear}_Q3_REPORT.pdf`;
  // normal:    `https://risk.markets/reports/RISK_${currentYear}_Q${currentQuarter}_REPORT.pdf`;
  for (const investor of investorsToProcess) {
    const message =
      `Here is your quarterly RISK investor dividend! Read the Q${currentQuarter} ${currentYear} report here: ${reportLink}`;
    const dividendAmount = investor.dividend;

    console.log(
      `Attempting to send ${dividendAmount} mana to ${investor.name} ` +
        `(${investor.userId})...`,
    );
    const result = await sendManagram(
      [investor.userId],
      dividendAmount,
      message,
      RISKBOT_API_KEY as string,
    );

    if (result.success) {
      console.log(
        `Successfully handled dividend for ${investor.name}. ` +
          `Response: ${JSON.stringify(result.response)}.`,
      );
    } else {
      console.error(
        `Failed to handle dividend for ${investor.name} (${investor.userId}): ${result.error}.`,
      );
    }
  }

  console.log("Dividend distribution attempt complete.");
  console.log(
    "\nIMPORTANT: To switch between dry run and live run, change `const DRY_RUN_MODE` at the top of the file.",
  );
  console.log("Ensure your `RISKBOT_API_KEY` is set in your .env file.");
}

if (import.meta.main) {
  main();
}
