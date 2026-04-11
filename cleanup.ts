// cleanup.ts
import { join } from "jsr:@std/path@^1.0.2";

const ROOT = Deno.cwd();
const WRITE = Deno.args.includes("--write");

type PatchResult = {
  file: string;
  changed: boolean;
  notes: string[];
  before?: string;
  after?: string;
};

const TARGETS = new Set([
  "routes/admin/index.tsx",
  "routes/chart/index.tsx",
  "routes/slots/index.tsx",
  "routes/api/v0/place-arbitrage-bets.ts",
  "routes/api/v0/place-limit-orders.ts",
  "routes/_middleware.ts",
  "components/Button.tsx",
  "islands/shared/PasswordGate.tsx",
  "islands/shared/UsernameInput.tsx",
  "routes/docs/api.tsx",
  "islands/menu/MenuBar.tsx",
  "islands/tools/custom/EliezerPayoutTool.tsx",
  "islands/tools/limits/LimitOrderCalculator.tsx",
  "islands/tools/limits/advanced/AdvancedMarketInfoDisplay.tsx",
  "islands/tools/limits/advanced/BasicChart.tsx",
  "islands/tools/limits/advanced/CurrentProbabilityControl.tsx",
  "islands/tools/limits/advanced/MinMaxProbabilityControl.tsx",
  "islands/tools/limits/advanced/PointsGranularityControl.tsx",
  "islands/tools/refund/PayoutTool.tsx",
]);

async function main() {
  const results: PatchResult[] = [];

  for (const rel of TARGETS) {
    const full = join(ROOT, rel);
    let original: string;

    try {
      original = await Deno.readTextFile(full);
    } catch {
      results.push({
        file: rel,
        changed: false,
        notes: ["missing-file"],
      });
      continue;
    }

    let text = original;
    const notes: string[] = [];

    if (rel === "routes/chart/index.tsx" || rel === "routes/slots/index.tsx") {
      const next = removeCompatHandler(text);
      if (next !== text) {
        text = next;
        notes.push("removed-empty-handler");
      }
    }

    if (rel === "routes/admin/index.tsx") {
      const next = patchAdminRoute(text);
      if (next !== text) {
        text = next;
        notes.push("patched-admin-handler");
      }
    }

    if (
      rel === "routes/api/v0/place-arbitrage-bets.ts" ||
      rel === "routes/api/v0/place-limit-orders.ts"
    ) {
      const next = text.replace(/\basync POST\(_ctx\)/g, "async POST(ctx)");
      if (next !== text) {
        text = next;
        notes.push("fixed-ctx-param");
      }
    }

    if (rel === "routes/_middleware.ts") {
      const next = patchMiddleware(text);
      if (next !== text) {
        text = next;
        notes.push("silenced-404-noise");
      }
    }

    if (rel === "components/Button.tsx") {
      const next = patchButtonDisabled(text);
      if (next !== text) {
        text = next;
        notes.push("added-disabled-prop");
      }
    }

    if (rel === "islands/shared/PasswordGate.tsx") {
      const next = patchJsxNamespace(text);
      if (next !== text) {
        text = next;
        notes.push("fixed-jsx-namespace");
      }
    }

    if (rel === "islands/shared/UsernameInput.tsx") {
      const next = patchRefImport(text);
      if (next !== text) {
        text = next;
        notes.push("fixed-ref-import");
      }
    }

    if (rel === "routes/docs/api.tsx") {
      const next = patchFragment(text);
      if (next !== text) {
        text = next;
        notes.push("replaced-fragment-tags");
      }
    }

    if (rel === "islands/tools/limits/advanced/BasicChart.tsx") {
      const next = text.replace(
        /Math\.round\(context\.parsed\.y\)/g,
        "Math.round(context.parsed.y ?? 0)",
      );
      if (next !== text) {
        text = next;
        notes.push("made-round-null-safe");
      }
    }

    if (isIconFile(rel)) {
      const next = removeSizeProp(text);
      if (next !== text) {
        text = next;
        notes.push("removed-icon-size-props");
      }
    }

    const changed = text !== original;

    if (changed && WRITE) {
      await Deno.writeTextFile(full, text);
    }

    results.push({
      file: rel,
      changed,
      notes,
      before: !WRITE && changed ? original : undefined,
      after: !WRITE && changed ? text : undefined,
    });
  }

  let changedCount = 0;

  for (const result of results) {
    const status = result.changed ? (WRITE ? "updated" : "would update") : "ok";
    console.log(
      `${status}: ${result.file}${
        result.notes.length ? ` [${result.notes.join(", ")}]` : ""
      }`,
    );
    if (result.changed) changedCount++;
  }

  console.log("");
  console.log(`${WRITE ? "wrote" : "planned"} ${changedCount} file(s)`);

  if (!WRITE) {
    console.log("dry run only. rerun with: deno run -A cleanup.ts --write");
  }
}

function isIconFile(rel: string): boolean {
  return [
    "islands/menu/MenuBar.tsx",
    "islands/tools/custom/EliezerPayoutTool.tsx",
    "islands/tools/limits/LimitOrderCalculator.tsx",
    "islands/tools/limits/advanced/AdvancedMarketInfoDisplay.tsx",
    "islands/tools/limits/advanced/CurrentProbabilityControl.tsx",
    "islands/tools/limits/advanced/MinMaxProbabilityControl.tsx",
    "islands/tools/limits/advanced/PointsGranularityControl.tsx",
    "islands/tools/refund/PayoutTool.tsx",
  ].includes(rel);
}

function removeCompatHandler(text: string): string {
  let out = text;

  out = out.replace(
    /\nimport\s+\{\s*Handlers\s*\}\s+from\s+"fresh\/compat";\s*\n/g,
    "\n",
  );

  out = out.replace(
    /\nexport const handler:\s*Handlers\s*=\s*\{\s*GET\(ctx\)\s*\{\s*return ctx\.render\(\);\s*\},\s*\};\s*\n/gms,
    "\n",
  );

  out = squeezeBlankLines(out);
  return out;
}

function patchAdminRoute(text: string): string {
  let out = text;

  out = out.replace(
    /import\s+\{\s*Handlers\s*\}\s+from\s+"fresh\/compat";\s*\n/g,
    "",
  );

  out = out.replace(
    /export const handler:\s*Handlers<AdminPageData,\s*AdminState>\s*=\s*\{\s*async GET\(ctx\)\s*\{/m,
    'export async function handler(ctx: PageProps<AdminPageData, AdminState>["context"]) {',
  );

  out = out.replace(
    /return ctx\.render\(\{\s*entries:\s*\[\]\s*\}\);/g,
    "return { data: { entries: [] } };",
  );

  out = out.replace(
    /return ctx\.render\(\{\s*entries,\s*error\s*\}\);/g,
    "return { data: { entries, error } };",
  );

  out = out.replace(
    /\n\};\s*\n(?=\s*export default function AdminPage)/m,
    "\n\n",
  );

  out = squeezeBlankLines(out);
  return out;
}

function patchMiddleware(text: string): string {
  let out = text;

  if (
    out.includes('import { FreshContext } from "fresh";') &&
    !out.includes("HttpError")
  ) {
    out = out.replace(
      'import { FreshContext } from "fresh";',
      'import { FreshContext, HttpError } from "fresh";',
    );
  }

  out = out.replace(
    /}\s*catch\s*\(err\)\s*\{\s*console\.error\("middleware error", err\);\s*return await ctx\.next\(\);\s*\}/ms,
    `} catch (err) {
    if (err instanceof HttpError && err.status === 404) {
      return await ctx.next();
    }

    console.error("middleware error", err);
    return await ctx.next();
  }`,
  );

  return out;
}

function patchButtonDisabled(text: string): string {
  if (/disabled\?:\s*boolean;/.test(text)) return text;

  let out = text;

  out = out.replace(
    /type\s+Props\s*=\s*\{([\s\S]*?)\n\};/m,
    (_match, body) => `type Props = {${body}\n  disabled?: boolean;\n};`,
  );

  out = out.replace(
    /interface\s+Props\s*\{([\s\S]*?)\n\}/m,
    (_match, body) => `interface Props {${body}\n  disabled?: boolean;\n}`,
  );

  return out;
}

function patchJsxNamespace(text: string): string {
  let out = text;

  if (!out.includes("h.JSX.Element")) return out;

  out = out.replace(/\bh\.JSX\.Element\b/g, "JSX.Element");

  if (!/import\s+type\s+\{\s*JSX\s*\}\s+from\s+"preact";/.test(out)) {
    const lines = out.split("\n");
    const importIndexes = lines
      .map((line: string, i: number) => ({ line, i }))
      .filter(({ line }: { line: string }) => /^\s*import\b/.test(line))
      .map(({ i }: { i: number }) => i);

    const insertAt = importIndexes.length
      ? importIndexes[importIndexes.length - 1] + 1
      : 0;
    lines.splice(insertAt, 0, 'import type { JSX } from "preact";');
    out = lines.join("\n");
  }

  return out;
}

function patchRefImport(text: string): string {
  let out = text;

  if (!out.includes('from "preact/hooks"') || !out.includes("Ref")) return out;
  if (!/import\s+\{\s*type Ref\s*\}\s+from\s+"preact";/.test(out)) {
    const lines = out.split("\n");
    const importIndexes = lines
      .map((line: string, i: number) => ({ line, i }))
      .filter(({ line }: { line: string }) => /^\s*import\b/.test(line))
      .map(({ i }: { i: number }) => i);
    const insertAt = importIndexes.length ? importIndexes[0] : 0;
    lines.splice(insertAt, 0, 'import { type Ref } from "preact";');
    out = lines.join("\n");
  }

  out = out.replace(
    /import\s+\{\s*([^}]*)\}\s+from\s+"preact\/hooks";/g,
    (_match, inner) => {
      const names = inner
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean)
        .filter((s: string) => s !== "type Ref" && s !== "Ref");

      return names.length
        ? `import { ${names.join(", ")} } from "preact/hooks";`
        : "";
    },
  );

  out = squeezeBlankLines(out);
  return out;
}

function patchFragment(text: string): string {
  let out = text;
  out = out.replace(/<Fragment>/g, "<>");
  out = out.replace(/<\/Fragment>/g, "</>");
  return out;
}

function removeSizeProp(text: string): string {
  return text.replace(/\s+size=\{[^}]+\}/g, "");
}

function squeezeBlankLines(text: string): string {
  return text.replace(/\n{3,}/g, "\n\n");
}

await main();
