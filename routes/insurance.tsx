// routes/insurance.tsx

import InsuranceCalc from "../islands/tools/insurance/InsuranceCalc.tsx";
import { Head } from "$fresh/runtime.ts";
import { RouteContext } from "$fresh/server.ts";

export default function Home(_req: Request, _ctx: RouteContext) {
  return (
    <>
      <Head>
        <title>RISK Insurance App</title>
      </Head>

      <div class="pt-14 bg-[#0F1729] text-white dark:bg-[#0F1729] dark:text-white">
        <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center px-4 py-8 md:pt-8">
          <h1 class="text-2xl font-bold mb-4">
            🦝 Insurance Calculator
          </h1>
          <InsuranceCalc />
        </div>
      </div>
    </>
  );
}
