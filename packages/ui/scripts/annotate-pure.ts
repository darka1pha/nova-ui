/**
 * Marks top-level component factories in dist/ as side-effect free.
 *
 * Bundlers must assume a call like `forwardRef(...)` may have side effects, so
 * without annotations importing `Button` also keeps every other component
 * defined in the same module. `/* @__PURE__ *\/` lets them drop unused ones.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const dist = fileURLToPath(new URL("../dist/", import.meta.url));
const FACTORIES = /(=\s*)(forwardRef|createContext|cva|section|lazy)\(/g;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : path.endsWith(".js") ? [path] : [];
  });
}

let count = 0;
for (const file of walk(dist)) {
  const source = readFileSync(file, "utf8");
  const annotated = source.replace(FACTORIES, (_, assign: string, fn: string) => {
    count++;
    return `${assign}/* @__PURE__ */ ${fn}(`;
  });
  if (annotated !== source) writeFileSync(file, annotated);
}
console.log(`Annotated ${count} pure factory calls`);
