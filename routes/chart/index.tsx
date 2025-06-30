// routes/chart/index.tsx
import { Handlers } from "$fresh/server.ts";
import Chart from "../../islands/tools/chart/Chart.tsx"; // The main chart island
import ShareURL from "../../islands/buttons/ShareURL.tsx"; // Import ShareURL

// The handler now simply renders the page, the island handles URL parsing.
export const handler: Handlers = {
  GET(_req, ctx) {
    return ctx.render();
  },
};

// The page component now includes the ShareURL button in the header.
export default function ChartPage() {
  return (
    <div class="pt-16 px-4 mx-auto max-w-screen-lg md:px-8">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-xl md:text-3xl font-bold text-gray-100 leading-tight">
          Credit Score Chart
        </h1>
        {/* NEW: ShareURL button placed in the route header */}
        <ShareURL />
      </div>

      <div class="bg-gray-800">
        {/* The Chart island itself, no longer receiving username prop */}
        <Chart />
      </div>
    </div>
  );
}
