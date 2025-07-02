// routes/limits/_layout.tsx

import { Head } from "$fresh/runtime.ts"; // Import Head from Fresh runtime
import { PageProps } from "$fresh/server.ts"; // Import PageProps
import MenuBar from "../../islands/menu/MenuBar.tsx"; // Keep MenuBar import for later, or remove if testing barebones

export default function LimitsLayout({ Component, url }: PageProps) { // Use PageProps and destructure Component, url
  // No need for 'new URL(_req.url)' anymore, 'url' is directly a URL object from PageProps
  const currentPathname = url.pathname;

  // Decide if MenuBar should show based on global rules (copied from _app.tsx)
  const showMenuBar = !currentPathname.startsWith("/iframe") &&
    !currentPathname.startsWith("/old-ext") &&
    !currentPathname.startsWith("/gameshow") &&
    !currentPathname.startsWith("/docs");

  // For this test, we'll keep the MenuBar conditional render in case you re-enable it.
  // The theme logic also moves back here.
  const menuBarTheme = currentPathname.startsWith("/limits/advanced")
    ? "dark"
    : "default";

  return (
    <>
      {/* Head section from _layout.tsx, similar to docs/_layout.tsx */}
      <Head>
        <title>RISK Limits</title> {/* Can be generic for the section */}
        {/* You might want a meta description common to all limits pages */}
      </Head>

      {showMenuBar && <MenuBar theme={menuBarTheme} />}{" "}
      {/* Render MenuBar if desired */}

      {/* This is the essential part - render the nested component */}
      <Component />
    </>
  );
}
