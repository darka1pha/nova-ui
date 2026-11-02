/** @darkalpha/nova-ui version, injected by vite.config.ts. */
declare const __NOVA_VERSION__: string;

declare module "virtual:nova-api" {
  import type { ApiData } from "../scripts/api-types.ts";
  const api: ApiData;
  export default api;
}
