// routes/docs/api.tsx
import { Fragment } from "preact";
import { Head } from "$fresh/runtime.ts";

export default function NotionDocsEmbed() {
  const notionPageUrl =
    "https://atom-club-701.notion.site/ebd/21fbae07692a8078a968faceafc2329c";

  const pageTitle = "Manifold Risk Markets API Documentation";
  const pageDescription =
    "Comprehensive API documentation for Manifold Risk Markets, covering credit scoring, insurance, transactions, and partner validation.";
  const keywords =
    "Manifold Markets, Risk Markets, API, documentation, credit score, insurance, loan, transaction, partner code, Manifold Mana, blockchain, web3";

  return (
    <Fragment>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={keywords} />

        <link rel="canonical" href={notionPageUrl} />

        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={notionPageUrl} />
        <meta property="og:type" content="website" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />

        <meta name="robots" content="index, follow" />
      </Head>

      <div class="fixed inset-0 overflow-hidden">
        {/* These sr-only tags remain good for SEO/accessibility without visual clutter */}
        <h1 class="sr-only">Manifold Risk Markets API Documentation</h1>
        <p class="sr-only">
          This page provides comprehensive API documentation for Manifold Risk
          Markets, covering functionalities for credit scoring, insurance fee
          calculation, transaction execution, historical data retrieval, and
          partner code validation. The full interactive documentation is
          embedded below via Notion.
        </p>

        <iframe
          src={notionPageUrl}
          width="100%"
          height="100%" // Still use 100% to fill the parent container from _layout.tsx
          frameborder="0"
          allowFullScreen
          class="w-full h-full border-none p-0 m-0"
        >
          {
            /*
            This content inside iframe tags is the *standard HTML fallback*
            for browsers that do not support iframes, or if the src fails to load.
            It is correctly parsed by browsers and search engines.
          */
          }
          <p class="text-gray-700 dark:text-gray-300 p-4">
            Your browser does not support inline frames (iframes), or there was
            an issue loading the documentation.
          </p>
          <p class="text-gray-700 dark:text-gray-300 p-4">
            To access the{" "}
            <strong class="font-semibold">{pageTitle}</strong>, please visit the
            documentation directly:
            <br />
            <a
              href={notionPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="text-blue-600 hover:underline dark:text-blue-400 font-mono break-words"
            >
              {notionPageUrl}
            </a>
          </p>
          <p class="text-gray-600 dark:text-gray-400 p-4">
            The documentation includes details on credit scoring, insurance fee
            calculation, transaction execution, historical data retrieval, and
            partner code validation.
          </p>
        </iframe>
      </div>
    </Fragment>
  );
}
