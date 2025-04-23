import { useSignal } from "@preact/signals";
import CreditScore from "../islands/CreditScore.tsx";
// import TechnicalDifficulties from "../components/TechnicalDifficulties.tsx";
import MenuBar from "../components/MenuBar.tsx"; // Import the MenuBar

export default function Home() {
  return (
    <div class="min-h-screen bg-[#0F1729] text-white dark:bg-[#0F1729] dark:text-white">
      <MenuBar />
      <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center min-h-screen px-4 py-8">
        <div class="w-full mb-6">
          {/* <TechnicalDifficulties /> */}
        </div>
        <h1 class="text-3xl sm:text-4xl font-bold text-center mb-4">
          🦝RISK Credit Score
        </h1>
        <p class="text-xs sm:text-base text-center mb-4">
          Built for Manifold.Markets
        </p>
        <p class="text-xxs font-bold">
          ⚠️ This product is in Alpha Testing
        </p>
        <CreditScore />
      </div>
    </div>
  );
}
