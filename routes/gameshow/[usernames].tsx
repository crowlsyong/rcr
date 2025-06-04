// routes/gameshow/[usernames].tsx
import { PageProps } from "$fresh/server.ts";
import GameShowCreditScore from "../../islands/GameShowCreditScore.tsx";

export default function GameShowPage({ params }: PageProps) {
  const { usernames } = params;

  const usernameList = usernames ? usernames.split(",") : [];

  return (
    <div class="bg-[#0F1729] min-h-screen flex flex-col items-center py-4">
      {/* Prominent Logo at the top middle */}
      <div class="mb-8">
        <img
          src="/logo-bg-transparent.png"
          alt="Company Logo"
          class="max-w-xs md:max-w-sm lg:max-w-md mx-auto" // Adjust max-width as needed
        />
      </div>

      {/* Main content area, centered horizontally */}
      <div class="flex items-center justify-center w-full max-w-7xl px-4">
        <GameShowCreditScore usernames={usernameList} />
      </div>
    </div>
  );
}
