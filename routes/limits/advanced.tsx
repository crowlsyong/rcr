// routes/limits/advanced.tsx

import { Head } from "$fresh/runtime.ts";
import AdvancedLimitsContainer from "../../islands/tools/limits/advanced/route/Container.tsx";

export default function AdvancedLimitsPage() {
  return (
    <>
      <Head>
        <title>Manifold Limit Order Tool - Advanced</title>
        <meta
          name="description"
          content="Advanced Limit Order management tool for Manifold Markets."
        />
      </Head>
      <div class="pt-14 bg-black text-white dark:text-white">
        <AdvancedLimitsContainer />
      </div>
    </>
  );
}
