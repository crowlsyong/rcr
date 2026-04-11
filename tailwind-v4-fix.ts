// tailwind-v4-fix.ts
import { extname, join, relative } from "jsr:@std/path@^1.1.2";

const ROOT = Deno.cwd();
const WRITE = Deno.args.includes("--write");

const TEXT_EXTS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".css",
  ".md",
  ".html",
]);

type FileResult = {
  file: string;
  changed: boolean;
  replacements: number;
};

function canonicalSpacing(px: string): string | null {
  const n = Number(px);
  if (!Number.isFinite(n) || n < 0) return null;
  if (n % 4 !== 0) return null;
  return String(n / 4);
}

function convertOpacityToken(value: string): string | null {
  const trimmed = value.trim();
  if (!/^\d*\.?\d+$/.test(trimmed)) return null;
  const num = Number(trimmed);
  if (!Number.isFinite(num)) return null;
  if (num < 0 || num > 1) return null;
  const pct = Math.round(num * 100);
  if (Math.abs(num * 100 - pct) > 1e-9) return null;
  return String(pct);
}

function transformText(input: string): { text: string; replacements: number } {
  let text = input;
  let replacements = 0;

  const apply = (
    pattern: RegExp,
    replacer: (match: string, ...args: string[]) => string,
  ) => {
    text = text.replace(pattern, (...args) => {
      const match = args[0] as string;
      const groups = args.slice(1, -2) as string[];
      const next = replacer(match, ...groups);
      if (next !== match) replacements++;
      return next;
    });
  };

  apply(/\bbg-gradient-to-(t|tr|r|br|b|bl|l|tl)\b/g, (_match, dir) => {
    return `bg-linear-to-${dir}`;
  });

  apply(/\b(max-w|min-w)-\[(\d+)px\]\b/g, (match, prefix, px) => {
    const canonical = canonicalSpacing(px);
    return canonical ? `${prefix}-${canonical}` : match;
  });

  apply(
    /\b((?:bg|text|border|ring|fill|stroke|decoration|outline|shadow(?:-[a-z]+)?)-[a-z0-9-]+)\/\[(0?\.\d+|0|1(?:\.0+)?)\]\b/g,
    (match, base, opacity) => {
      const canonical = convertOpacityToken(opacity);
      return canonical ? `${base}/${canonical}` : match;
    },
  );

  return { text, replacements };
}

async function collectFiles(dir: string): Promise<string[]> {
  const out: string[] = [];

  for await (const entry of Deno.readDir(dir)) {
    if (
      entry.name === ".git" ||
      entry.name === "node_modules" ||
      entry.name === "_fresh" ||
      entry.name === ".next" ||
      entry.name === "dist" ||
      entry.name === "build" ||
      entry.name === "coverage"
    ) {
      continue;
    }

    const full = join(dir, entry.name);

    if (entry.isDirectory) {
      out.push(...await collectFiles(full));
      continue;
    }

    if (TEXT_EXTS.has(extname(entry.name))) {
      out.push(full);
    }
  }

  return out;
}

async function main() {
  const files = await collectFiles(ROOT);
  const results: FileResult[] = [];

  let report = "";

  for (const file of files) {
    const original = await Deno.readTextFile(file);
    const { text, replacements } = transformText(original);
    const changed = text !== original;

    if (changed) {
      const rel = relative(ROOT, file).replaceAll("\\", "/");

      report += `\n===== ${rel} (${replacements}) =====\n`;

      const beforeLines = original.split("\n");
      const afterLines = text.split("\n");

      const max = Math.max(beforeLines.length, afterLines.length);

      for (let i = 0; i < max; i++) {
        const b = beforeLines[i] ?? "";
        const a = afterLines[i] ?? "";

        if (b !== a) {
          report += `\n- ${b}\n+ ${a}\n`;
        }
      }

      report += `\n`;

      if (WRITE) {
        await Deno.writeTextFile(file, text);
      }
    }

    results.push({
      file: relative(ROOT, file).replaceAll("\\", "/"),
      changed,
      replacements,
    });
  }

  const touched = results.filter((r) => r.changed);
  const totalReplacements = touched.reduce((sum, r) => sum + r.replacements, 0);

  for (const result of touched) {
    console.log(
      `${
        WRITE ? "updated" : "would update"
      } ${result.file} (${result.replacements})`,
    );
  }

  console.log(
    `${
      WRITE ? "wrote" : "planned"
    } ${touched.length} file(s), ${totalReplacements} replacement(s)`,
  );

  // write report
  await Deno.writeTextFile("tailwind-v4-report.txt", report);

  console.log("report written → tailwind-v4-report.txt");

  if (!WRITE) {
    console.log("dry run only");
  }
}

await main();
