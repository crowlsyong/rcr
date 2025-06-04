// routes/qr/[string].tsx

import { PageProps } from "$fresh/server.ts";

export default function SimpleDisplayPage(props: PageProps) {
  const { string } = props.params;

  return (
    // Apply the dark background and text colors to the outer div
    <div class="pt-14 bg-[#0F1729] text-white dark:bg-[#0F1729] dark:text-white min-h-screen">
      {/* Use the same max-width container and centering as your index.tsx */}
      <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center px-4 py-8 md:pt-8">
        <h1 class="text-xl sm:text-4xl font-bold text-center mb-4">
          🎉
        </h1>
        <h2 class="text-xl sm:text-3xl font-bold text-center mb-6">
          Your coupon code is:
        </h2>
        <p class="text-3xl sm:text-5xl font-mono text-green-400 select-all break-all px-4 py-2 bg-gray-800 rounded-lg shadow-lg">
          {string || "No string provided"}
        </p>
        <p class="mt-8 text-lg text-gray-400 text-center">
          Present this code the next time you request insurance!
        </p>
        <p class="mt-8 text-xs text-gray-400 text-center">
          any <code>https://risk.markets/qr/[string]</code>{" "}
          will hydrate this page but only 20 codes are stored in the secret
          database.
        </p>
      </div>
    </div>
  );
}
