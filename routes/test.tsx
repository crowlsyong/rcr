// routes/index.tsx

import { FreshContext } from "fresh";
import { RouteContext } from "fresh/compat";

export default function Home(_ctx: FreshContext) {
  return (
    <div class="pt-14 bg-[#0F1729] text-white dark:bg-[#0F1729] dark:text-white">
      <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center px-4 py-8 md:pt-8">
        <h1 class="text-xl sm:text-4xl font-bold text-center mb-4">
          🦝 Test Page test
        </h1>
      </div>
    </div>
  );
}
