const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;

/** True outside production builds. Bundlers statically replace NODE_ENV. */
export const isDev = env?.NODE_ENV !== "production";

const warned = new Set<string>();

/** Logs a development-only warning once per unique message. */
export function devWarn(message: string): void {
  if (!isDev || warned.has(message)) return;
  warned.add(message);
  console.warn(`[nova-ui] ${message}`);
}
