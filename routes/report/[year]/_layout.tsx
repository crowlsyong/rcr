// routes/reports/_layout.tsx

import { Fragment } from "preact";
import { PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";

export default function ReportsLayout({ Component }: PageProps) {
  return (
    <Fragment>
      <Head>
        <title>RISK REPORTS</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
      </Head>
      <div class="fixed inset-0 bg-white dark:bg-gray-900 transition-colors duration-200">
        <main class="h-full w-full p-0 m-0 flex justify-center items-center">
          <Component />
        </main>
      </div>
    </Fragment>
  );
}
