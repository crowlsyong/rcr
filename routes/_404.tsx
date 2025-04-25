import { Head } from "$fresh/runtime.ts";

export default function Error404() {
  return (
    <>
      <Head>
        <title>404 - Page not found</title>
      </Head>
      <div class="min-h-screen bg-[#0F1729] text-white flex items-center justify-center">
        <div class="text-center px-4 py-8">
          <img
            class="my-6"
            src="/risk.png"
            width="128"
            height="128"
            alt="the RISK mascot: a raccoon"
          />
          <h1 class="text-4xl font-bold mb-4">404 - Page not found</h1>
          <p class="my-4">The page you were looking for doesn't exist.</p>
          <a href="/" class="underline text-green-400 hover:text-green-500">
            Go back home
          </a>
        </div>
      </div>
    </>
  );
}
