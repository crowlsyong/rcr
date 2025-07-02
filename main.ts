/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import "$std/dotenv/load.ts";

import { start } from "$fresh/server.ts";
import manifest from "./fresh.gen.ts";
import config from "./fresh.config.ts";
import "./utils/cron/test-cron.ts"; // <-- Import the simple test cron
// import "./utils/cron/fetch_scores.ts"; // <-- Comment this out temporarily

await start(manifest, config);
