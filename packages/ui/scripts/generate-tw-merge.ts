/**
 * Writes src/utils/tw-merge-config.generated.ts: tailwind-merge's default config cut down to
 * the class groups Nova UI's components use, plus every group that conflicts with them.
 *
 * `cn()` only has to resolve conflicts between a component's own classes and a consumer's
 * `className`. A conflict needs a class from the component's side, so groups no component
 * uses (and that don't conflict with one that does) never change the result, but the full
 * default config is about 60% of tailwind-merge and ships with every component.
 *
 * The output is sliced from tailwind-merge's own `getDefaultConfig` source, so validators and
 * scales stay exactly the library's. Run with `--check` to fail when the file is out of date
 * (CI), e.g. after adding a component that uses a new kind of utility.
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createTailwindMerge, getDefaultConfig, validators, type Config } from "tailwind-merge";
import ts from "typescript";

const pkgRoot = fileURLToPath(new URL("..", import.meta.url));
const outFile = join(pkgRoot, "src", "utils", "tw-merge-config.generated.ts");
const check = process.argv.includes("--check");

/* ------------------------------------------------ Classes the components use */

function* sourceFiles(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      if (name !== "generated") yield* sourceFiles(path);
    } else if (/\.tsx?$/.test(name) && !name.endsWith(".generated.ts")) yield path;
  }
}

// Every whitespace-separated word inside a string or template literal. Over-collecting is
// harmless: a word that isn't a utility matches no group.
const tokens = new Set<string>();
for (const file of sourceFiles(join(pkgRoot, "src"))) {
  const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, false, ts.ScriptKind.TSX);
  const visit = (node: ts.Node) => {
    if (ts.isStringLiteralLike(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
      for (const word of node.text.split(/\s+/)) if (/^[!@\-[(*a-z0-9]/i.test(word) && word.length < 200) tokens.add(word);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
}

/* -------------------------------------------------------- Groups to keep */

const full = getDefaultConfig();
const groupIds = Object.keys(full.classGroups);
type AnyConfig = Config<string, string>;
const fullGroups = full.classGroups as AnyConfig["classGroups"];
const mergerFor = (classGroups: AnyConfig["classGroups"]) =>
  createTailwindMerge((): AnyConfig => ({ ...(full as AnyConfig), cacheSize: 0, classGroups, conflictingClassGroups: {}, conflictingClassGroupModifiers: {}, postfixLookupClassGroups: [] }));

// Arbitrary properties ("[mask-type:alpha]") collapse with any config; they belong to no group.
const noGroups = mergerFor({});
for (const token of tokens) if (noGroups(`${token} ${token}`) === token) tokens.delete(token);
const keep = new Set<string>(["animate"]); // extended below with the library's nv-* animations

for (const id of groupIds) {
  // A merger that knows only this group collapses "x x" to "x" exactly when x belongs to it.
  const merge = mergerFor({ [id]: fullGroups[id] ?? [] });
  for (const token of tokens) {
    if (merge(`${token} ${token}`) === token) {
      keep.add(id);
      break;
    }
  }
}

// A consumer's class comes after the component's in cn(), and tailwind-merge drops an earlier
// class when a later one's group lists it as a conflict. So keep every group whose conflicts
// include a kept group: a consumer's `p-2` must still be known to replace a component's `px-4`.
// (The reverse needs nothing: a later `px-2` never removes an earlier `p-4`.)
const conflicts = { ...full.conflictingClassGroups } as Record<string, readonly string[]>;
const modifierConflicts = { ...full.conflictingClassGroupModifiers } as Record<string, readonly string[]>;
const direct = keep.size;
for (const [id, others] of [...Object.entries(conflicts), ...Object.entries(modifierConflicts)]) {
  if (others.some((o) => keep.has(o)) && groupIds.includes(id)) keep.add(id);
}
console.log(`${direct} groups used directly, ${keep.size - direct} more that conflict with them.`);

/* --------------------------------------------- Slice tailwind-merge's source */

const require = createRequire(import.meta.url);
const bundle = join(dirname(require.resolve("tailwind-merge")), "bundle-mjs.mjs");
const text = readFileSync(bundle, "utf8");
const sf = ts.createSourceFile(bundle, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);

let body: ts.Block | undefined;
sf.forEachChild((node) => {
  if (!ts.isVariableStatement(node)) return;
  for (const decl of node.declarationList.declarations) {
    if (ts.isIdentifier(decl.name) && decl.name.text === "getDefaultConfig" && decl.initializer && ts.isArrowFunction(decl.initializer) && ts.isBlock(decl.initializer.body)) body = decl.initializer.body;
  }
});
if (!body) throw new Error("getDefaultConfig not found in tailwind-merge; the generator needs updating for this version.");

const ret = body.statements.find(ts.isReturnStatement);
const config = ret?.expression && ts.isObjectLiteralExpression(ret.expression) ? ret.expression : undefined;
if (!config) throw new Error("getDefaultConfig doesn't return an object literal.");
const helpers = body.statements.filter((s) => s !== ret).map((s) => s.getText(sf));

const keyOf = (p: ts.ObjectLiteralElementLike) => (p.name && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) ? p.name.text : "");
const prop = (name: string) => {
  const p = config.properties.find((x) => keyOf(x) === name);
  if (!p || !ts.isPropertyAssignment(p)) throw new Error(`config.${name} not found`);
  return p.initializer;
};
const quote = (s: string) => JSON.stringify(s);
const kept = (list: Iterable<string>) => [...list].filter((g) => keep.has(g));

const classGroups = prop("classGroups");
if (!ts.isObjectLiteralExpression(classGroups)) throw new Error("classGroups isn't an object literal");
const groupLines = classGroups.properties
  .filter((p) => keep.has(keyOf(p)))
  .map((p) => {
    if (!ts.isPropertyAssignment(p)) throw new Error(`unexpected classGroups entry ${keyOf(p)}`);
    const value = p.initializer.getText(sf);
    return keyOf(p) === "animate" ? `    animate: [...${value}, { animate: [isNvAnimation] }],` : `    ${quote(keyOf(p))}: ${value},`;
  });

const conflictLines = (map: Record<string, readonly string[]>) =>
  Object.entries(map)
    .filter(([id]) => keep.has(id))
    .map(([id, others]) => `    ${quote(id)}: [${kept(others).map(quote).join(", ")}],`);

const usedValidators = Object.keys(validators).filter((name) => new RegExp(`\\b${name}\\b`).test([...helpers, ...groupLines, prop("theme").getText(sf)].join("\n")));
const version = JSON.parse(readFileSync(join(dirname(bundle), "..", "package.json"), "utf8")).version as string;

const output = `/* eslint-disable */
// Generated by scripts/generate-tw-merge.ts from tailwind-merge ${version} — do not edit.
// ${keep.size} of ${groupIds.length} class groups: the ones Nova UI's components use, and the groups that conflict with them.
import { fromTheme, validators, type Config } from "tailwind-merge";

const { ${usedValidators.join(", ")} } = validators;

/** The library's own animate-nv-* utilities, so a consumer's animate-none replaces them. */
const isNvAnimation = (value: string) => value.startsWith("nv-");

export const getNovaMergeConfig = (): Config<string, string> => {
${helpers.map((h) => `  ${h.replace(/\n/g, "\n  ")}`).join("\n")}
  return {
    cacheSize: 500,
    theme: ${prop("theme").getText(sf).replace(/\n/g, "\n  ")},
    classGroups: {
${groupLines.join("\n")}
    },
    conflictingClassGroups: {
${conflictLines(conflicts).join("\n")}
    },
    conflictingClassGroupModifiers: {
${conflictLines(modifierConflicts).join("\n")}
    },
    postfixLookupClassGroups: [${kept(full.postfixLookupClassGroups ?? []).map(quote).join(", ")}],
    orderSensitiveModifiers: ${prop("orderSensitiveModifiers").getText(sf)},
  };
};
`;

const current = (() => {
  try {
    // A Windows checkout may have CRLF line endings; the content is what matters.
    return readFileSync(outFile, "utf8").replace(/\r\n/g, "\n");
  } catch {
    return "";
  }
})();
if (check) {
  if (current !== output) {
    console.error("src/utils/tw-merge-config.generated.ts is out of date. Run `pnpm --filter @darkalpha/nova-ui merge:config` and commit the result.");
    process.exitCode = 1;
  } else console.log(`tw-merge config is up to date (${keep.size}/${groupIds.length} groups).`);
} else {
  if (current !== output) writeFileSync(outFile, output);
  console.log(`Wrote tw-merge-config.generated.ts (${keep.size} of ${groupIds.length} class groups).`);
}
