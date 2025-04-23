// routes/index.tsx
import { useSignal } from "@preact/signals";
import CreditScore from "../islands/CreditScore.tsx"; // Import the island

export default function Home() {
  return (
    <div class="min-h-screen bg-[#0F1729] text-white dark:bg-[#0F1729] dark:text-white">
      <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center min-h-screen px-4 py-8">
        <img
          class="my-6"
          src="/risk.png"
          width="266"
          alt="the Fresh logo: a sliced lemon dripping with juice"
        />
        <h1 class="text-3xl sm:text-4xl font-bold text-center mb-4">
          Manifold Credit Score
        </h1>
        <p class="my-4 text-center text-lg sm:text-xl">
          Enter a username to fetch their credit score.
        </p>
        {/* Include the CreditScore island */}
        <CreditScore />
      </div>
    </div>
  );
}
