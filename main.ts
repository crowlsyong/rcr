import "$std/dotenv/load.ts";
import { App, staticFiles } from "fresh";

export const app = new App()
  .use(staticFiles())
  .fsRoutes();

if (import.meta.main) {
  // Dynamically import cron jobs ONLY when the actual Deno server is running,
  // keeping it completely hidden from Vite's SSR module evaluator.
  await import("./utils/cron/fetch_scores.ts");

  await app.listen();
}
