// routes/index.tsx
import { useSignal } from "@preact/signals";
import CreditScore from "../islands/CreditScore.tsx"; // Import the island
import TechnicalDifficulties from "../components/TechnicalDifficulties.tsx"; // Import the warning component

export default function Home() {
  return (
    <div class="min-h-screen bg-[#0F1729] text-white dark:bg-[#0F1729] dark:text-white">
      
      <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center min-h-screen px-4 py-8">
                {/* Show technical difficulties warning */}
                <div class="w-full mb-6">
          <TechnicalDifficulties />
        </div>
        <img
          class="my-6"
          src="/risk.png"
          width="266"
          alt="the RISK mascot: a raccoon"
        />
        <h1 class="text-3xl sm:text-4xl font-bold text-center mb-4">
          🦝RISK Credit Score
        </h1>


        {/* Include the CreditScore island */}
        <CreditScore />
      </div>
    </div>
  );
}
