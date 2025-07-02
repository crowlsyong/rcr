// routes/docs/_layout.tsx

import { Fragment } from "preact";
import { PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";

export default function DocsLayout({ Component }: PageProps) {
  return (
    <Fragment>
      <Head>
        <title>Risk Markets Docs</title>
        {/* Viewport meta tag is still good practice */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        {/* No inline style or dangerouslySetInnerHTML needed here */}
      </Head>
      {
        /*
        Now, this div relies on the global CSS to ensure html/body are reset,
        and then it uses fixed positioning for absolute control.
      */
      }
      <div class="fixed pt-[44px] inset-0 bg-white dark:bg-gray-900 transition-colors duration-200">
        <main class="h-full w-full p-0 m-0">
          <Component />
        </main>
      </div>
    </Fragment>
  );
}
