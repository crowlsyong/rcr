// routes/extension.tsx
import { Head } from "$fresh/runtime.ts";

export default function RiskExtensionPage() {
  return (
    <>
      <Head>
        <title>RISK Chrome Extension</title>
      </Head>
      <div class="bg-gray-900 text-white min-h-screen flex items-center justify-center p-4">
        <section class="max-w-3xl mx-auto text-center py-16 px-4 sm:px-6 lg:px-8 bg-gray-800 rounded-lg shadow-2xl border border-gray-700">
          {/* Smaller "Introducing the" text */}
          <p class="text-xl sm:text-2xl text-gray-400 mb-2">
            Introducing the
          </p>
          {/* Larger "RISK Chrome Extension" text */}
          <h1 class="text-5xl sm:text-6xl lg:text-4xl font-bold mb-6 leading-tight text-blue-400">
            RISK Chrome Extension
          </h1>
          <p class="text-lg sm:text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Enhance your Manifold Markets experience with the official RISK
            Chrome Extension. Gain advanced insights and tools to help you make
            more informed betting decisions directly in your browser.
          </p>

          {/* Add Extension Button (Primary, Bigger, No Scale) */}
          <div class="text-center mb-8">
            <a
              href="https://chromewebstore.google.com/detail/risk-credit-score/oemipgilahmncafhojjdiecpibhohdoa?authuser=0&hl=en"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-full shadow-lg transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 text-xl"
            >
              Add extension
            </a>
          </div>

          {/* View on GitHub Button (Secondary, aligned right, smaller) */}
          <div class="flex justify-end">
            <a
              href="https://github.com/crowlsyong/rcr-chrome-ext"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-block bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white font-bold py-2 px-6 rounded-lg transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 text-sm"
            >
              View on GitHub
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
