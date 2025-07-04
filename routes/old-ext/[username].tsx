// routes/ext/[username].tsx
import { PageProps } from "$fresh/server.ts";
import CreditScore from "../../islands/tools/creditscore/CreditScoreChExt.tsx"; // Importing the island

export default function UserPage({ params }: PageProps) {
  const { username } = params; // Extracting the username from the URL

  return (
    <div class="bg-[#0F1729]">
      {/* Added background color */}
      {/* Pass the username to the CreditScore island component */}
      <CreditScore username={username} />
    </div>
  );
}
