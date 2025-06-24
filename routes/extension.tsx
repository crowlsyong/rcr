// routes/extension.tsx
import { Head } from "$fresh/runtime.ts";

export default function RiskExtensionPage() {
  return (
    <>
      <Head>
        <title>RISK Chrome Extension</title>
      </Head>
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white min-h-screen flex items-center justify-center p-4">
        <section className="max-w-3xl mx-auto text-center py-10 px-6 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg shadow-2xl border border-gray-700 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400"></div>
          <p className="text-xl sm:text-2xl text-gray-400 mb-2">
            Introducing the
          </p>
          <h1 class="text-5xl sm:text-6xl lg:text-4xl font-bold mb-6 leading-tight text-blue-400">
            🦝RISK Chrome Extension
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Enhance your Manifold Markets experience with the official RISK
            Chrome Extension. Gain advanced insights and tools to help you make
            more informed betting decisions directly in your browser.
          </p>
          
          <div className="text-center mb-8">
            <a
              href="https://chromewebstore.google.com/detail/risk-credit-score/oemipgilahmncafhojjdiecpibhohdoa?authuser=0&hl=en"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold py-4 px-10 rounded-full shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 text-xl"
            >
              Add extension
            </a>
          </div>
          
          <div className="flex justify-end">
            <a
              href="https://github.com/crowlsyong/rcr-chrome-ext"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 text-sm"
            >
              View on GitHub
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
