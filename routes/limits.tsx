// routes/limits.tsx
import { Head } from "$fresh/runtime.ts";
import LimitOrderCalculator from "../islands/tools/limits/LimitOrderCalculator.tsx";

export default function Home() {
  return (
    <>
      <Head>
        <title>RISK Limit App</title>
      </Head>
      <div class="pt-14 bg-[#0F1729] text-white dark:bg-[#0F1729] dark:text-white">
        <LimitOrderCalculator />
      </div>
    </>
  );
}
