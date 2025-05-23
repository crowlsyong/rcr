// routes/chart/[username].tsx

import { PageProps } from "$fresh/server.ts";
import CreditScoreChart from "../../islands/Chart.tsx"; // Import the Chart island
import ShareURL from "../../islands/buttons/ShareURL.tsx";

export default function UserChartPage({ params }: PageProps) {
  const { username } = params;

  return (
    <div class="pt-16 px-4 mx-auto max-w-screen-lg md:px-8">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-xl md:text-3xl font-bold text-gray-100 leading-tight">
          Credit Score Chart
        </h1>
        <ShareURL />
      </div>

      <div class="bg-gray-800 p-4 md:p-6 rounded-lg shadow-xl mb-6">
        <CreditScoreChart username={username} />
      </div>
    </div>
  );
}
