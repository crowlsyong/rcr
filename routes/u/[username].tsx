import { PageProps } from "$fresh/server.ts";
import CreditScore from "../../islands/CreditScoreChExt.tsx"; // Importing the island
import { Button } from "../../islands/Button.tsx"; // Importing the Button island

export default function UserPage({ params }: PageProps) {
  const { username } = params; // Extracting the username from the URL

  // Define the URL for redirection
  const backToSearchUrl = "/"; // URL can be customized here

  return (
    <div class="min-h-screen bg-[#0F1729] text-white dark:bg-[#0F1729] dark:text-white">
      <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center min-h-screen px-4 py-8">
        <div class="w-full mb-6">
          {/* <TechnicalDifficulties /> */}
        </div>
        <h1 class="text-3xl sm:text-4xl font-bold text-center mb-4">
          🦝RISK Credit Score
        </h1>
        <p class="text-xs text-center mb-4 text-gray-500">
          Built for{" "}
          <a
            href="https://manifold.markets/"
            class="underline hover:text-blue-500"
            target="_blank"
            rel="noopener noreferrer"
          >
            manifold.markets
          </a>
        </p>
        <CreditScore username={username} />

        {/* Button with dynamic URL passed as prop */}
        <div class="mt-6">
          <Button url={backToSearchUrl}>Back to search</Button>
        </div>
      </div>
    </div>
  );
}
