import { resolve } from "node:path";
import type { Plugin } from "vite";
import { extractApi } from "./api-extractor.ts";

const id = "virtual:nova-api";
const resolvedId = "\0" + id;

/**
 * Serves `virtual:nova-api`: the props of every component, extracted from
 * packages/ui's TypeScript source. In dev it re-extracts when that source changes.
 */
export function novaApi(): Plugin {
  const uiSrc = resolve(import.meta.dirname, "../../../packages/ui/src");
  let cached: string | null = null;
  return {
    name: "nova-api",
    resolveId: (source) => (source === id ? resolvedId : undefined),
    load(loadId) {
      if (loadId !== resolvedId) return undefined;
      cached ??= `export default ${JSON.stringify(extractApi())};`;
      return cached;
    },
    configureServer(server) {
      server.watcher.add(uiSrc);
      server.watcher.on("change", (file) => {
        // Only TypeScript changes the API; the build also rewrites generated CSS in src.
        if (!resolve(file).startsWith(uiSrc) || !/\.tsx?$/.test(file)) return;
        cached = null;
        const mod = server.moduleGraph.getModuleById(resolvedId);
        if (mod) server.reloadModule(mod);
      });
    },
  };
}
