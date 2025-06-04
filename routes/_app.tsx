import { type PageProps } from "$fresh/server.ts";
import MenuBar from "../islands/MenuBar.tsx"; // Import the MenuBar

//Conditionally show MenuBar based on the route
export default function App({ Component, url }: PageProps) {
  const showMenuBar = !url.pathname.startsWith("/iframe") &&
    !url.pathname.startsWith("/ext") &&
    !url.pathname.startsWith("/gameshow"); // Added the new gameshow route

  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        <title>🦝RISK Credit Report | For Manifold Markets</title>
        <meta
          name="description"
          content="Instantly get a credit risk score for any Manifold user."
        />
        <meta
          name="keywords"
          content="manifold credit score, manifold markets, user analysis"
        />
        <meta name="author" content="crowlsyong" />

        <meta property="og:title" content="🦝RISK Credit Report" />
        <meta
          property="og:description"
          content="Check a Manifold Markets user's credit risk instantly."
        />
        <meta property="og:image" content="/risk-logo-manifold-seo.png" />{" "}
        {/* Optional if you have a social preview image */}
        <meta property="og:url" content="https://risk.markets" />{" "}
        {/* Update this */}
        <meta property="og:type" content="website" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="🦝RISK Credit Report" />
        <meta
          name="twitter:description"
          content="Analyze Manifold Markets' users in seconds. Credit risk scores."
        />
        <meta name="twitter:image" content="/risk-logo-manifold-seo.png" />{" "}
        {/* Optional */}

        <link rel="canonical" href="https://risk.markets" />{" "}
        {/* Update this */}
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body>
        {/* Conditionally render the MenuBar based on route */}
        {showMenuBar && <MenuBar />}
        <Component />
      </body>
    </html>
  );
}
