// routes/extension.tsx
import { Head } from "$fresh/runtime.ts";

export default function RiskExtensionPage() {
  return (
    <>
      <Head>
        <title>RISK Chrome Extension</title>
      </Head>
      <div className="bg-[#0F1729] text-white min-h-screen flex items-center justify-center p-6 sm:p-10">
        <section className="w-full max-w-3xl mx-auto text-center py-8 px-4 sm:py-12 sm:px-8 bg-[#0F1729] rounded-xl sm:shadow-2xl sm:shadow-blue-500/40 sm:border sm:border-gray-700 relative overflow-hidden">
          {/* Blue bar: only visible on sm screens and up */}
          <div className="sm:absolute sm:top-0 sm:left-0 sm:right-0 sm:h-[4px] sm:bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400">
          </div>
          <p className="text-xl sm:text-2xl text-gray-400 mb-2 font-light">
            Introducing the
          </p>
          <h1 class="text-2xl sm:text-4xl lg:text-3xl font-extrabold mb-6 leading-tight text-blue-400 drop-shadow-lg">
            🦝RISK Chrome Extension
          </h1>
          <p className="text-base sm:text-lg text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Enhance your Manifold Markets experience with the official RISK
            Chrome Extension. Gain advanced insights and tools to help you make
            more informed betting decisions directly in your browser.
          </p>

          <div className="text-center mb-8">
            <a
              href="https://chromewebstore.google.com/detail/risk-credit-score/oemipgilahmncafhojjdiecpibhohdoa?authuser=0&hl=en"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold py-3 px-8 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 text-lg sm:text-xl"
            >
              Add Extension
            </a>
          </div>

          <div className="flex justify-end">
            <a
              href="https://github.com/crowlsyong/rcr-chrome-ext"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center
              bg-gray-800 text-gray-500 font-normal py-1 px-3 rounded-md
              sm:bg-gray-700 sm:hover:bg-gray-600 sm:text-gray-300 sm:hover:text-white sm:font-bold sm:py-2 sm:px-6 sm:rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 text-xs sm:text-sm"
            >
              View on GitHub
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
