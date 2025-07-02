// utils/cron/test-cron.ts

/// <reference lib="deno.unstable" />

Deno.cron("My Simple Test Cron", "*/1 * * * *", () => {
  console.log("TEST CRON: This simple test cron is running!");
});
