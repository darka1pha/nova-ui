import { resolve } from "node:path";
import type { Plugin } from "vite";
import { extractApi, type ApiData } from "./api-extractor.ts";

const ALL = "virtual:nova-api";
const LOADERS = "virtual:nova-api/loaders";
const PART = "virtual:nova-api/part/";

/**
 * Serves the props of every component, extracted from packages/ui's TypeScript
 * source:
 * - `virtual:nova-api/loaders`: `{ Button: () => import(…) }`, one small chunk
 *   per export, so a component page downloads only its own props.
 * - `virtual:nova-api`: everything at once (the search palette).
 * In dev it re-extracts when that source changes.
 */
export function novaApi(): Plugin {
  const uiSrc = resolve(import.meta.dirname, "../../../packages/ui/src");
  let cached: ApiData | null = null;
  const api = () => (cached ??= extractApi());
  return {
    name: "nova-api",
    resolveId: (source) => (source === ALL || source === LOADERS || source.startsWith(PART) ? "\0" + source : undefined),
    load(loadId) {
      if (!loadId.startsWith("\0virtual:nova-api")) return undefined;
      const id = loadId.slice(1);
      if (id === ALL) return `export default ${JSON.stringify(api())};`;
      if (id === LOADERS) {
        const entries = Object.keys(api()).map((name) => `  ${JSON.stringify(name)}: () => import(${JSON.stringify(PART + name)}).then((m) => m.default),`);
        return `export default {\n${entries.join("\n")}\n};`;
      }
      const name = id.slice(PART.length);
      return `export default ${JSON.stringify(api()[name] ?? null)};`;
    },
    configureServer(server) {
      server.watcher.add(uiSrc);
      server.watcher.on("change", (file) => {
        // Only TypeScript changes the API; the build also rewrites generated CSS in src.
        if (!resolve(file).startsWith(uiSrc) || !/\.tsx?$/.test(file)) return;
        cached = null;
        for (const mod of server.moduleGraph.idToModuleMap.values()) {
          if (mod.id?.startsWith("\0virtual:nova-api")) server.reloadModule(mod);
        }
      });
    },
  };
}
