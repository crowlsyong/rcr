// routes/reports/[year]/[quarter].tsx

import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { Fragment } from "preact";
// Import with a direct type cast to unknown to bypass strict literal inference initially
import rawAllReportData from "../../../database/reports.json" with {
  type: "json",
};

interface ReportUrls {
  embedUrl: string;
  pdfUrl: string;
  viewUrl: string;
}

// Define the precise structure for runtime access and type safety
type ReportDataStructure = {
  [year: string]: {
    [quarter: string]: ReportUrls;
  };
};

// Cast the imported raw data to the defined structure.
// This is safe because we control the JSON content and its expected shape.
const ALL_REPORT_DATA: ReportDataStructure =
  rawAllReportData as unknown as ReportDataStructure;

interface ReportPageProps {
  year: string;
  quarter: string;
  reportData: ReportUrls;
}

export const handler: Handlers<ReportPageProps> = {
  GET(_req, ctx) {
    const { year, quarter } = ctx.params;
    // Access the data using the strong type, no further 'as' needed here
    const reportData = ALL_REPORT_DATA[year]?.[quarter];

    if (
      !reportData || !reportData.embedUrl || !reportData.pdfUrl ||
      !reportData.viewUrl
    ) {
      return new Response(
        "Report data not found or incomplete for this quarter and year.",
        {
          status: 404,
        },
      );
    }

    return ctx.render({ year, quarter, reportData });
  },
};

export default function QuarterReportPage(
  { data }: PageProps<ReportPageProps>,
) {
  const { year, quarter, reportData } = data;
  const pageTitle = `RISK Financial Report - Q${
    quarter.substring(1).toUpperCase()
  } ${year}`;
  const pageDescription = `The official Q${
    quarter.substring(1).toUpperCase()
  } ${year} financial report for RISK. View detailed financial overview and performance.`;
  const keywords = `RISK, financial report, ${year}, ${quarter}, Q${
    quarter.substring(1).toUpperCase()
  }, income, dividend, performance`;

  return (
    <Fragment>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={keywords} />

        <link
          rel="canonical"
          href={`https://risk.markets/reports/${year}/${quarter}`}
        />

        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta
          property="og:url"
          content={`https://risk.markets/reports/${year}/${quarter}`}
        />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://risk.markets/logo.png" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content="https://risk.markets/logo.png" />

        <meta name="robots" content="index, follow" />
      </Head>

      <div class="fixed inset-0 overflow-hidden flex flex-col justify-start items-center pt-16">
        <h1 class="sr-only">{pageTitle}</h1>
        <p class="sr-only">{pageDescription}</p>

        <div class="w-full max-w-[840px] flex justify-end gap-x-2 mb-4 pr-4">
          <a
            href={reportData.pdfUrl}
            download
            class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg z-10"
          >
            Download PDF
          </a>
          <a
            href={reportData.viewUrl}
            target="_blank"
            rel="noopener noreferrer"
            class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg z-10"
          >
            View on Google Docs
          </a>
        </div>

        <div class="w-full max-w-[840px] h-full mx-auto">
          <iframe
            src={reportData.embedUrl}
            width="100%"
            height="100%"
            frameborder="0"
            allowFullScreen
            loading="lazy"
            class="border-none p-0 m-0"
          >
            <p class="text-gray-700 dark:text-gray-300 p-4">
              Your browser does not support inline frames (iframes), or there
              was an issue loading the report.
            </p>
            <p class="text-gray-700 dark:text-gray-300 p-4">
              To access the{" "}
              <strong class="font-semibold">{pageTitle}</strong>, please visit
              the report directly:
              <br />
              <a
                href={reportData.embedUrl}
                target="_blank"
                rel="noopener noreferrer"
                class="text-blue-600 hover:underline dark:text-blue-400 font-mono break-words"
              >
                {reportData.embedUrl}
              </a>
            </p>
            <p class="text-gray-600 dark:text-gray-400 p-4">
              This document provides a detailed financial overview for RISK for
              the specified period.
            </p>
          </iframe>
        </div>
      </div>
    </Fragment>
  );
}
