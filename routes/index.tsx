import CreditScore from "../islands/CreditScore.tsx";
// import TechnicalDifficulties from "../components/TechnicalDifficulties.tsx";

export default function Home() {
  return (
    <div class="min-h-screen pt-14  bg-[#0F1729] text-white dark:bg-[#0F1729] dark:text-white">
      <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center px-4 py-8 md:pt-8">
        <h1 class="text-xl sm:text-4xl font-bold text-center mb-4">
          🦝RISK Credit Score
        </h1>
        <p class="text-sm text-center mb-4 text-gray-500">
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

        {
          /*
        <p class="text-xxs font-bold">
          ⚠️ This product is in Beta Testing
        </p>
        */
        }

        <CreditScore />
      </div>
    </div>
  );
}
