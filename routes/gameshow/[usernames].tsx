// routes/gameshow/[usernames].tsx
import { PageProps } from "$fresh/server.ts";
import GameShowCreditScore from "../../islands/GameShowCreditScore.tsx";

export default function GameShowPage({ params }: PageProps) {
  const { usernames } = params;

  const usernameList = usernames ? usernames.split(",") : [];

  return (
    <div class="bg-[#0F1729] min-h-screen flex flex-col items-center py-4">
      <div>
        <img
          src="/nash-pit-transaprent-risk.png"
          alt="Company Logo"
          class="max-w-xs md:max-w-sm lg:max-w-md mx-auto"
        />
      </div>

      {/* Main content area, simplified positioning with negative margin-top */}
      {/* Remove absolute positioning and z-index. Add mt-[-Xpx] directly. */}
      <div class="w-full max-w-screen-xl px-4 mt-[-60px]">
        {/* Adjust mt-[-value] as needed */}
        <GameShowCreditScore usernames={usernameList} />
      </div>
    </div>
  );
}
