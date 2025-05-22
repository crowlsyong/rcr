// routes/chart/[username].tsx

import { PageProps } from "$fresh/server.ts";
import CreditScoreChart from "../../islands/Chart.tsx"; // Import the Chart island

export default function UserChartPage({ params }: PageProps) {
  const { username } = params;

  return (
    <div class="pt-16 px-4 mx-auto max-w-screen-lg md:px-8">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-xl md:text-3xl font-bold text-gray-100 leading-tight">
          Credit Score Chart
        </h1>
        <p class="text-lg md:text-2xl text-gray-300">{username}</p>
      </div>

      <div class="bg-gray-800 p-4 md:p-6 rounded-lg shadow-xl mb-6">
        <CreditScoreChart username={username} />
      </div>
    </div>
  );
}
