// routes/docs/_layout.tsx
import { PageProps } from "fresh";
import { Head } from "fresh/runtime";
import { Fragment } from "preact"; // Added missing import

export default function DocsLayout({ Component }: PageProps) {
  return (
    <Fragment>
      <Head>
        <title>Risk Markets Docs</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
      </Head>

      <div class="fixed pt-[44px] inset-0 bg-white dark:bg-gray-900 transition-colors duration-200">
        <main class="h-full w-full p-0 m-0">
          <Component />
        </main>
      </div>
    </Fragment>
  );
}
