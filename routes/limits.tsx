// routes/limits.tsx
import { Head } from "$fresh/runtime.ts";
import LimitOrderCalculator from "../islands/tools/LimitOrderCalculator.tsx";

export default function Home() {
  return (
    <>
      <Head>
        <title>Manifold Markets Limit Order Calculator</title>
      </Head>
      <div class="pt-14 bg-[#0F1729] text-white dark:bg-[#0F1729] dark:text-white">
        <LimitOrderCalculator />
      </div>
    </>
  );
}
