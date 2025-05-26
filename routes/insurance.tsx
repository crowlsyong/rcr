// routes/insurance.tsx

import InsuranceCalc from "../islands/InsuranceCalc.tsx";
import { useCSP } from "$fresh/runtime.ts";
import { RouteConfig, RouteContext } from "$fresh/server.ts";
import Version from "../components/Version.tsx";

export default function Home(_req: Request, _ctx: RouteContext) {
  useCSP((csp) => {
    // Setting the allowed sources for content
    csp.directives.defaultSrc = ["'self'"];
    csp.directives.scriptSrc = ["'self'", "https://manifold.markets"];
    csp.directives.styleSrc = ["'self'", "https://manifold.markets", "'unsafe-inline'"];
    csp.directives.imgSrc = [
      "'self'",
      "https://firebasestorage.googleapis.com",
      "https://lh3.googleusercontent.com",
    ];
    csp.directives.fontSrc = ["'self'", "https://manifold.markets"];
  });
  return (
    <div class="pt-14 bg-[#0F1729] text-white dark:bg-[#0F1729] dark:text-white">
      <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center px-4 py-8 md:pt-8">
        <h1 class="text-xl sm:text-4xl font-bold text-center mb-4">
          🦝Insurance Calculator
        </h1>
        <Version />
        <InsuranceCalc />
      </div>
    </div>
  );
}
export const config: RouteConfig = {
  csp: true,
};
