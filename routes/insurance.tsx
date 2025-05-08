// import PasswordGate from "../islands/PasswordGate.tsx";
import InsuranceCalc from "../islands/InsuranceCalc.tsx";

export default function Home() {
  return (
    /*<PasswordGate> */
    <div class="min-h-screen bg-[#0F1729] text-white dark:bg-[#0F1729] dark:text-white">
      <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center min-h-screen px-4 py-8">
        <div class="w-full mb-6">
          {/* <TechnicalDifficulties /> */}
        </div>
        <h1 class="text-3xl sm:text-4xl font-bold text-center mb-4">
          🦝Insurance Calculator
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

        <InsuranceCalc />
      </div>
    </div>
    /* </PasswordGate> */
  );
}
