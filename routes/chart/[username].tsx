// routes/Chart/[username].tsx

import { Handlers, PageProps } from "$fresh/server.ts";
import CreditScoreChart from "../../islands/Chart.tsx";

// Define an interface for the data we expect from the /api/score endpoint
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
  userId: string; // Make sure this is included in the /api/score output
}

// Define the data type for the PageProps
interface UserChartPageData extends UserScoreData {
  error?: string; // Optional error property if fetching fails
}

export const handler: Handlers<UserChartPageData> = {
  async GET(_req, ctx): Promise<Response> {
    const { username } = ctx.params;

    try {
      // Fetch the user's current credit score data from your API using a relative path
      // This avoids the "Loop Detected" issue on Deno Deploy
      const apiRes = await fetch(`/api/score?username=${username}`); // <-- Change here

      if (apiRes.status === 404) {
        // User not found
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
        // Other API errors
        throw new Error(
          `Failed to fetch score data for ${username}: ${apiRes.statusText}`,
        );
      }

      const userData: UserScoreData = await apiRes.json();

      // Render the page with the fetched user data
      return ctx.render(userData);
    } catch (error) {
      console.error(
        `Error in /chart/[username].tsx handler for '${username}':`,
        error,
      );
      // Render the page with an error message
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
  // If user was not found or an error occurred, display a message
  if (data.error) {
    return (
      <div class="p-4 mx-auto max-w-screen-md mt-16">
        {/* Added mt-16 for top padding */}
        <h1 class="text-2xl font-bold mb-4">Error</h1>
        <p class="text-red-500">{data.error}</p>
      </div>
    );
  }

  // Otherwise, display the user's data and the chart
  return (
    // Added pt-16 for overall top padding to clear the menubar
    // Added px-4 on mobile for left/right padding
    <div class="pt-16 px-4 mx-auto max-w-screen-lg md:px-8">
      {/* Updated flex container to remain row on mobile and adjust item alignment */}
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center">
          {/* Avatar and title container */}
          {data.avatarUrl && (
            <img
              src={data.avatarUrl}
              alt={`${data.username}'s avatar`}
              class="w-12 h-12 rounded-full mr-3 md:w-16 md:h-16 md:mr-4"
            />
          )}
          <div>
            <h1 class="text-xl md:text-3xl font-bold text-gray-100 leading-tight">
              {/* Adjusted title font size for mobile */}
              Credit History
            </h1>
            <p class="text-lg md:text-2xl text-gray-300">{data.username}</p>
            {" "}
            {/* Adjusted username font size for mobile */}
          </div>
        </div>
        {/* Current credit score number */}
        <div class="text-right">
          {/* Ensure text is right-aligned */}
          <p class="text-sm md:text-lg text-gray-400">Current Score:</p>{" "}
          {/* Adjusted label font size */}
          <p class="text-3xl md:text-5xl font-bold text-blue-400">
            {data.creditScore}
          </p>{" "}
          {/* Adjusted score font size for mobile */}
        </div>
      </div>

      <div class="bg-gray-800 p-4 md:p-6 rounded-lg shadow-xl mb-6">
        {/* Styled container for the chart */}
        {data.userId
          ? <CreditScoreChart userId={data.userId} />
          : <p>Cannot load chart without user ID.</p>}
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-200">
        {/* Moved details and notes below chart */}
        <div class="bg-gray-800 p-4 md:p-6 rounded-lg shadow">
          {/* Styled container for details */}
          <h2 class="text-xl font-semibold mb-3 text-gray-100">
            Current Score Details
          </h2>
          <p class="text-sm">
            <strong>Risk Multiplier:</strong> {data.riskMultiplier}
          </p>{" "}
          {/* Kept font sizes consistent */}
          <p class="text-sm">
            <strong>Latest League Rank:</strong> {data.latestRank ?? "N/A"}
          </p>
          <p class="text-sm">
            <strong>Outstanding Debt Impact:</strong>{" "}
            {data.outstandingDebtImpact}
          </p>
          <p class="text-sm">
            <strong>Calculated Profit:</strong> {data.calculatedProfit}
          </p>
          <p class="text-sm">
            <strong>Current Balance:</strong> {data.balance}
          </p>
        </div>
        <div class="bg-gray-800 p-4 md:p-6 rounded-lg shadow">
          {/* Styled container for notes */}
          <h2 class="text-xl font-semibold mb-3 text-gray-100">Notes</h2>
          <p class="text-xs text-gray-400">
            The historical data updates at most every 5 minutes. The current
            score displayed above reflects the latest data from Manifold
            Markets.
          </p>
          {data.historicalDataSaved && (
            <p class="text-xs text-green-500 mt-2">
              Historical data point saved during this request.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
