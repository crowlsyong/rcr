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
          <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-blue-400">
            Introducing the RISK Chrome Extension
          </h1>
          <p class="text-lg sm:text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Enhance your Manifold Markets experience with the official RISK
            Chrome Extension. Gain advanced insights and tools to help you
            make more informed betting decisions directly in your browser.
          </p>
          <a
            href="https://github.com/crowlsyong/rcr-chrome-ext"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-colors duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            View on GitHub
          </a>
          <p class="mt-8 text-sm text-gray-400">
            Coming soon to the Chrome Web Store!
          </p>
        </section>
      </div>
    </>
  );
}