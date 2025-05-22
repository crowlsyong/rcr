// routes/chart/[username].tsx

import { PageProps, Handlers } from "$fresh/server.ts";
import CreditScoreChart from "../../islands/Chart.tsx"; // Corrected import name

interface UserScoreData {
  username: string;
  creditScore: number;
  riskMultiplier: number;
  avatarUrl: string | null;
  userExists: boolean;
  latestRank: number | null;
  outstandingDebtImpact: number;
  calculatedProfit: number;
  balance: number;
  rawMMR: number;
  historicalDataSaved: boolean;
  userId: string;
}

interface UserChartPageData extends UserScoreData {
  error?: string;
}

export const handler: Handlers<UserChartPageData> = {
  async GET(_req, ctx): Promise<Response> {
    const { username } = ctx.params;

    try {
      // Construct the full URL explicitly using protocol, host, and path
      const fetchUrl = `${ctx.url.protocol}//${ctx.url.host}/api/score?username=${username}`;
      console.log(`[chart] Fetching score data from URL: ${fetchUrl}`); // Log the URL being fetched

      const apiRes = await fetch(fetchUrl);

      if (apiRes.status === 404) {
        console.warn(`[chart] User ${username} not found by /api/score`);
        return ctx.render({
          username,
          creditScore: 0,
          riskMultiplier: 0,
          avatarUrl: null,
          userExists: false,
          latestRank: null,
          outstandingDebtImpact: 0,
          calculatedProfit: 0,
          balance: 0,
          rawMMR: 0,
          historicalDataSaved: false,
          userId: "",
          error: `User '${username}' not found.`,
        }, { status: 404 });
      }

      if (!apiRes.ok) {
         console.error(`[chart] /api/score response not ok: ${apiRes.statusText}`);
          // Attempt to log the error body if the response is not OK
          try {
            const errorBody = await apiRes.text();
            console.error(`[chart] /api/score error body: ${errorBody}`);
          } catch (e) {
            console.error(`[chart] Failed to read /api/score error body: ${e}`);
          }
        throw new Error(`Failed to fetch score data for ${username}: ${apiRes.statusText}`);
      }

      const userData: UserScoreData = await apiRes.json();

      return ctx.render(userData);

    } catch (error) {
      console.error(`Error in /chart/[username].tsx handler for '${username}':`, error);
      return ctx.render({
        username,
        creditScore: 0,
        riskMultiplier: 0,
        avatarUrl: null,
        userExists: false,
        latestRank: null,
        outstandingDebtImpact: 0,
        calculatedProfit: 0,
        balance: 0,
        rawMMR: 0,
        historicalDataSaved: false,
        userId: "",
        error: "An error occurred while fetching data.",
      }, { status: 500 });
    }
  },
};

export default function UserChartPage({ data }: PageProps<UserChartPageData>) {
  if (data.error) {
    return (
      <div class="p-4 mx-auto max-w-screen-md mt-16">
        <h1 class="text-2xl font-bold mb-4">Error</h1>
        <p class="text-red-500">{data.error}</p>
      </div>
    );
  }

  return (
    <div class="pt-16 px-4 mx-auto max-w-screen-lg md:px-8">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center">
          {data.avatarUrl && (
            <img
              src={data.avatarUrl}
              alt={`${data.username}'s avatar`}
              class="w-12 h-12 rounded-full mr-3 md:w-16 md:h-16 md:mr-4"
            />
          )}
          <div>
            <h1 class="text-xl md:text-3xl font-bold text-gray-100 leading-tight">
              Credit Score Chart
            </h1>
            <p class="text-lg md:text-2xl text-gray-300">{data.username}</p>
          </div>
        </div>
        <div class="text-right">
            <p class="text-sm md:text-lg text-gray-400">Current Score:</p>
            <p class="text-3xl md:text-5xl font-bold text-blue-400">{data.creditScore}</p>
        </div>
      </div>

      <div class="bg-gray-800 p-4 md:p-6 rounded-lg shadow-xl mb-6">
        {data.userId ? <CreditScoreChart userId={data.userId} /> : <p>Cannot load chart without user ID.</p>}
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-200">
        <div class="bg-gray-800 p-4 md:p-6 rounded-lg shadow">
          <h2 class="text-xl font-semibold mb-3 text-gray-100">Current Score Details</h2>
          <p class="text-sm"><strong>Risk Multiplier:</strong> {data.riskMultiplier}</p>
          <p class="text-sm"><strong>Latest League Rank:</strong> {data.latestRank ?? "N/A"}</p>
          <p class="text-sm"><strong>Outstanding Debt Impact:</strong> {data.outstandingDebtImpact}</p>
          <p class="text-sm"><strong>Calculated Profit:</strong> {data.calculatedProfit}</p>
          <p class="text-sm"><strong>Current Balance:</strong> {data.balance}</p>
        </div>
        <div class="bg-gray-800 p-4 md:p-6 rounded-lg shadow">
            <h2 class="text-xl font-semibold mb-3 text-gray-100">Notes</h2>
            <p class="text-xs text-gray-400">
                The historical data updates at most every 24 hours. The current score displayed above reflects the latest data from Manifold Markets.
            </p>
             {data.historicalDataSaved && (
                <p class="text-xs text-green-500 mt-2">Historical data point saved during this request.</p>
             )}
        </div>
      </div>
    </div>
  );
}
