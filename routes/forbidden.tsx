// routes/forbidden.tsx
import { Head } from "$fresh/runtime.ts";

export default function ForbiddenPage() {
  return (
    <>
      <Head>
        <title>Access Forbidden</title>
      </Head>
      <div class="pt-16 p-4 mx-auto max-w-screen-md text-center">
        <h1 class="text-2xl font-bold mb-4 text-red-500">Access Forbidden</h1>
        <p class="text-gray-400">
          You do not have permission to view this page.
        </p>
        <a href="/" class="text-blue-500 hover:underline mt-4 inline-block">
          Go to Homepage
        </a>
      </div>
    </>
  );
}
