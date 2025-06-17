// routes/limits.tsx
import { Head } from "$fresh/runtime.ts";
import ArbitrageCalculator from "../islands/tools/arbitrage/Arbitrage.tsx"; // Note the renamed component

export default function Home() {
  return (
    <>
      <Head>
        <title>Arbitrage App</title>
      </Head>
      <div class="pt-14 bg-[#0F1729] text-white dark:bg-[#0F1729] dark:text-white min-h-screen">
        <ArbitrageCalculator />
      </div>
    </>
  );
}
