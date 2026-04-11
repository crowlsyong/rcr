import { walk } from "jsr:@std/fs@1"; // Fixed version

const ROUTE_DIR = "./routes";

// Fixed 'exts' parameter
for await (const entry of walk(ROUTE_DIR, { exts: [".ts", ".tsx"] })) {
  if (entry.isDirectory) continue;

  let content = await Deno.readTextFile(entry.path);

  const pattern = /async\s+GET\(ctx\)\s*{\s*return\s+ctx\.render\(\);\s*},?/g;

  if (pattern.test(content)) {
    console.log(`Nuking empty GET handler in: ${entry.path}`);
    content = content.replace(pattern, "");

    // Clean up empty handler objects
    content = content.replace(/export const handler: Handlers = {\s*};/g, "");

    await Deno.writeTextFile(entry.path, content);
  }
}

console.log(
  "Cleanup complete. Run 'deno check' to see the remaining specific errors.",
);
