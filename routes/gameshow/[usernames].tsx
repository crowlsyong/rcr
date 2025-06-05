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
          class="max-w-[240px] md:max-w-sm lg:max-w-md mx-auto" // Adjusted max-width for mobile
        />
      </div>

      {/* Main content area, simplified positioning with negative margin-top */}
      {/* Remove absolute positioning and z-index. Add mt-[-Xpx] directly. */}
      <div class="w-full max-w-screen-xl md:px-4 md:mt-[-90px] mt-[-40px]">
        {/* Adjust mt-[-value] as needed */}
        <GameShowCreditScore usernames={usernameList} />
      </div>
      <div class="md:absolute relative bottom-2 left-0 right-0 text-center text-white opacity-50 flex items-center justify-center px-4">
        <span>brought to you by:</span>
        <a href="/" class="block ml-2">
          {/* Link only the image, making it a block to control margin */}
          <img
            src="/risk-logo-mini-t.png"
            alt="RISK Logo"
            class="h-6"
          />
        </a>
      </div>
    </div>
  );
}
