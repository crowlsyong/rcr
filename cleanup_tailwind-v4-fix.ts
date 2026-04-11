// cleanup_tailwind-v4-fix.ts
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

type ChangeRecord = {
  before: string;
  after: string;
};

const SPACING_UTILITIES = [
  "m",
  "mx",
  "my",
  "ms",
  "me",
  "mt",
  "mr",
  "mb",
  "ml",
  "p",
  "px",
  "py",
  "ps",
  "pe",
  "pt",
  "pr",
  "pb",
  "pl",
  "space-x",
  "space-y",
  "w",
  "min-w",
  "max-w",
  "h",
  "min-h",
  "max-h",
  "size",
  "gap",
  "gap-x",
  "gap-y",
  "inset",
  "inset-x",
  "inset-y",
  "top",
  "right",
  "bottom",
  "left",
  "start",
  "end",
  "translate-x",
  "translate-y",
  "scroll-m",
  "scroll-mx",
  "scroll-my",
  "scroll-ms",
  "scroll-me",
  "scroll-mt",
  "scroll-mr",
  "scroll-mb",
  "scroll-ml",
  "scroll-p",
  "scroll-px",
  "scroll-py",
  "scroll-ps",
  "scroll-pe",
  "scroll-pt",
  "scroll-pr",
  "scroll-pb",
  "scroll-pl",
] as const;

const FRACTION_TO_PERCENT = new Map<string, string>([
  ["1/2", "50"],
  ["1/3", "33"],
  ["2/3", "67"],
  ["1/4", "25"],
  ["2/4", "50"],
  ["3/4", "75"],
  ["1/5", "20"],
  ["2/5", "40"],
  ["3/5", "60"],
  ["4/5", "80"],
]);

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function canonicalSpacing(px: string): string | null {
  const n = Number(px);
  if (!Number.isFinite(n) || n < 0) return null;
  if (n % 2 !== 0) return null;
  return String(n / 4);
}

function normalizeInteger(value: number): string {
  return Number.isInteger(value) ? String(value) : String(value);
}

function parseArbitrarySpacingValue(raw: string): string | null {
  const value = raw.trim();

  if (/^\d+px$/.test(value)) {
    return canonicalSpacing(value.slice(0, -2));
  }

  if (/^\d+(?:\.\d+)?rem$/.test(value)) {
    const rem = Number(value.slice(0, -3));
    if (!Number.isFinite(rem) || rem < 0) return null;
    const unit = rem / 0.25;
    if (Math.abs(unit - Math.round(unit)) > 1e-9) return null;
    return normalizeInteger(Math.round(unit));
  }

  if (/^\d+(?:\.\d+)?$/.test(value)) {
    const num = Number(value);
    if (!Number.isFinite(num) || num < 0) return null;
    if (Math.abs(num - Math.round(num)) > 1e-9) return null;
    return String(Math.round(num));
  }

  return null;
}

function convertFractionPercent(value: string): string | null {
  return FRACTION_TO_PERCENT.get(value) ?? null;
}

function createApply(
  state: { text: string; replacements: number; changes: ChangeRecord[] },
) {
  return (
    pattern: RegExp,
    replacer: (match: string, ...args: string[]) => string,
  ) => {
    state.text = state.text.replace(pattern, (...args) => {
      const match = args[0] as string;
      const groups = args.slice(1, -2) as string[];
      const next = replacer(match, ...groups);

      if (next !== match) {
        state.replacements++;
        state.changes.push({
          before: match,
          after: next,
        });
      }

      return next;
    });
  };
}

function transformText(input: string): {
  text: string;
  replacements: number;
  changes: ChangeRecord[];
} {
  const state = {
    text: input,
    replacements: 0,
    changes: [] as ChangeRecord[],
  };

  const apply = createApply(state);

  const spacingPattern = new RegExp(
    `(?<![\\w-])((?:[a-z@][\\w-]*:)*)(-?)(` +
      SPACING_UTILITIES.map(escapeRegex).join("|") +
      `)-\\[([^\\]]+)\\]`,
    "g",
  );

  apply(spacingPattern, (match, variants, negative, utility, rawValue) => {
    const canonical = parseArbitrarySpacingValue(rawValue);
    if (!canonical) return match;
    return `${variants}${negative}${utility}-${canonical}`;
  });

  apply(
    /(?<![\w-])((?:[a-z@][\w-]*:)*)(from|via|to)-\[(\d+\/\d+)\](?![\w-])/g,
    (match, variants, prefix, fraction) => {
      const canonical = convertFractionPercent(fraction);
      if (!canonical) return match;
      return `${variants}${prefix}-${canonical}%`;
    },
  );

  apply(
    /(?<![\w-])((?:[a-z@][\w-]*:)*)(shadow|drop-shadow)-\[(0(?:\.\d+)?|1(?:\.0+)?)\](?![\w-])/g,
    (match, variants, prefix, opacity) => {
      const trimmed = opacity.trim();
      if (!/^\d*\.?\d+$/.test(trimmed)) return match;

      const num = Number(trimmed);
      if (!Number.isFinite(num) || num < 0 || num > 1) return match;

      const pct = Math.round(num * 100);
      if (Math.abs(num * 100 - pct) > 1e-9) return match;

      return `${variants}${prefix}/${pct}`;
    },
  );

  apply(
    /(?<![\w-])((?:[a-z@][\w-]*:)*)(?:flex|grid)-cols-\[repeat\(var\(--([a-z0-9-]+)\),minmax\(0,1fr\)\)\](?![\w-])/gi,
    (_match, variants, token) => {
      return `${variants}grid-cols-(--${token})`;
    },
  );

  apply(
    /(?<![\w-])((?:[a-z@][\w-]*:)*)(?:flex|grid)-rows-\[repeat\(var\(--([a-z0-9-]+)\),minmax\(0,1fr\)\)\](?![\w-])/gi,
    (_match, variants, token) => {
      return `${variants}grid-rows-(--${token})`;
    },
  );

  return {
    text: state.text,
    replacements: state.replacements,
    changes: state.changes,
  };
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

function buildDiffReport(original: string, updated: string): string {
  const beforeLines = original.split("\n");
  const afterLines = updated.split("\n");
  const max = Math.max(beforeLines.length, afterLines.length);

  let report = "";

  for (let i = 0; i < max; i++) {
    const before = beforeLines[i] ?? "";
    const after = afterLines[i] ?? "";

    if (before !== after) {
      report += `\n- ${before}\n+ ${after}\n`;
    }
  }

  return report;
}

async function main() {
  const files = await collectFiles(ROOT);
  const results: FileResult[] = [];
  let report = "";

  for (const file of files) {
    const original = await Deno.readTextFile(file);
    const { text, replacements, changes } = transformText(original);
    const changed = text !== original;

    if (changed) {
      const rel = relative(ROOT, file).replaceAll("\\", "/");

      report += `\n===== ${rel} (${replacements}) =====\n`;

      for (const change of changes) {
        report += `\nmatch: ${change.before}\nnext:  ${change.after}\n`;
      }

      report += "\n--- line diff ---\n";
      report += buildDiffReport(original, text);
      report += "\n";

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

  await Deno.writeTextFile("tailwind-v4-report.txt", report);

  console.log("report written → tailwind-v4-report.txt");

  if (!WRITE) {
    console.log("dry run only");
  }
}

await main();
