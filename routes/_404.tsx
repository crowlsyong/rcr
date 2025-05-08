import { Head } from "$fresh/runtime.ts";
import { Button } from "../islands/buttons/Button.tsx";

export default function Error404() {
  return (
    <>
      <Head>
        <title>404 - Page not found</title>
      </Head>
      <div class="min-h-screen bg-[#0F1729] text-white flex items-center justify-center">
        <div class="px-4 py-8">
          <h1 class="text-4xl font-bold mb-4">404</h1>
          <p class="my-4">The page you were looking for doesn't exist.</p>
          <p class="my-4 text-sm">
            If you think this is an error,{" "}
            <a
              href="https://manifold.markets/crowlsyong"
              target="_blank"
              class="underline text-blue-400 hover:text-blue-500"
            >
              contact crowlsyong
            </a>
          </p>
          <div class="mt-4">
            <Button url="/">Go back home</Button>
          </div>
        </div>
      </div>
    </>
  );
}
