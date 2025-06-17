import { Head } from "$fresh/runtime.ts";
import ArbitrageCalculator from "../islands/tools/arbitrage/ArbitrageCalculator.tsx";

export default function ArbitragePage() {
  return (
    <>
      <Head>
        <title>Manifold Arbitrage Calculator</title>
        <meta
          name="description"
          content="Calculate arbitrage opportunities between two Manifold prediction markets to find guaranteed profit."
        />
      </Head>
      <div class="pt-14 bg-[#0F1729] text-white dark:bg-[#0F1729] dark:text-white">
        <ArbitrageCalculator />
      </div>
    </>
  );
}
