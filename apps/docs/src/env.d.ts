/** @darkalpha/nova-ui version, injected by vite.config.ts. */
declare const __NOVA_VERSION__: string;

declare module "virtual:nova-api" {
  import type { ApiData } from "../scripts/api-types.ts";
  const api: ApiData;
  export default api;
}

declare module "virtual:nova-api/loaders" {
  import type { ComponentApi } from "../scripts/api-types.ts";
  /** One loader per export: its props, in a chunk of its own. */
  const loaders: Record<string, () => Promise<ComponentApi | null>>;
  export default loaders;
}
