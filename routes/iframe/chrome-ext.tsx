// routes/iframe/credit-score.tsx

// import { useSignal } from "@preact/signals";
// import CreditScore from "../../islands/CreditScore.tsx";
import InsuranceCalc from "../../islands/InsuranceCalc.tsx";
// import MenuBar from "../../components/MenuBar.tsx";

export default function Home() {
  return (
    <div class="bg-[#0F1729] text-white dark:bg-[#0F1729] dark:text-white">
      <div class="max-w-screen-sm mx-auto flex flex-col items-center justify-center min-h-screen px-2 py-2">
        <div class="w-full mb-2">
          {/* <TechnicalDifficulties /> */}
        </div>
        <h1 class="font-bold text-center mb-1">
          🦝Insurance Calculator
        </h1>
        <p class="text-xs text-gray-500 text-center mb-1">
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
        <p class="text-xs font-bold mb-1">
          ⚠️ This product is in Alpha Testing
        </p>

        <div class="w-full space-y-2 mt-2">
          <InsuranceCalc />
        </div>
      </div>
    </div>
  );
}
