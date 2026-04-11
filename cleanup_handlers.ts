import { walk } from "$std/fs/walk.ts";

const ROUTE_DIR = "./routes";
const DRY_RUN = true; // Toggle to false when ready

console.log(`Starting scan in ${ROUTE_DIR}...`);

for await (const entry of walk(ROUTE_DIR, { exts: [".ts", ".tsx"] })) {
  if (entry.isDirectory) continue;

  let content = await Deno.readTextFile(entry.path);

  // Looks specifically for empty GET handlers
  const pattern = /async\s+GET\(ctx\)\s*{\s*return\s+ctx\.render\(\);\s*},?/g;

  if (pattern.test(content)) {
    console.log(`🎯 [MATCH FOUND] Empty GET handler in: ${entry.path}`);

    if (!DRY_RUN) {
      // 1. Remove the handler
      content = content.replace(pattern, "");
      // 2. Remove the surrounding export if it's now empty
      content = content.replace(/export const handler: Handlers = {\s*};/g, "");

      await Deno.writeTextFile(entry.path, content);
      console.log(`   ✅ Cleaned & Saved: ${entry.path}`);
    }
  }
}

if (DRY_RUN) {
  console.log("\n🛡️  THIS WAS A DRY RUN. No files were modified.");
  console.log(
    "Review the files above. If they look correct, change 'const DRY_RUN = false;' to execute.",
  );
} else {
  console.log(
    "\n🚀 Cleanup complete. Run 'deno check' to see the remaining errors.",
  );
}
