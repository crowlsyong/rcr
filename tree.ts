// tree.ts
import { join } from "jsr:@std/path";

async function listDirTree(
  dir: string,
  prefix = "",
  exclude: string[] = [
    "node_modules",
    "_fresh",
    ".github",
    ".vscode",
    ".git",
  ],
  lines: string[] = [],
): Promise<string[]> {
  const entries: Deno.DirEntry[] = [];
  for await (const entry of Deno.readDir(dir)) {
    if (exclude.includes(entry.name)) continue;
    entries.push(entry);
  }

  // Sort: folders first, then files alphabetically
  entries.sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.name.localeCompare(b.name);
  });

  const lastIndex = entries.length - 1;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const isLast = i === lastIndex;
    const branch = isLast ? "└─ " : "├─ ";

    lines.push(prefix + branch + entry.name);

    if (entry.isDirectory) {
      const nextPrefix = prefix + (isLast ? "   " : "│  ");
      await listDirTree(join(dir, entry.name), nextPrefix, exclude, lines);
    }
  }
  return lines;
}

if (import.meta.main) {
  const root = Deno.cwd();
  const lines: string[] = [];

  // Add the root folder name at the top
  lines.push(root.split(/[\\/]/).pop() + "/");

  await listDirTree(root, "", [
    "node_modules",
    "_fresh",
    ".github",
    ".vscode",
    ".git",
  ], lines);

  const outPath = join(root, "tree.txt");
  await Deno.writeTextFile(outPath, lines.join("\n"));

  console.log(`Directory tree successfully written to ${outPath}`);
}
