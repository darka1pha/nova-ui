import { describe, expect, it } from "vitest";
import { dtcgTokens, getResolvedTheme, presets, themeTokens, type DtcgGroup } from "../src/index.ts";

const TYPES = new Set(["color", "dimension", "fontFamily", "fontWeight", "duration", "cubicBezier", "number"]);
const isToken = (node: unknown): node is { $value: unknown } => typeof node === "object" && node !== null && "$value" in node;

/** Every token with its path and inherited $type. */
function leaves(group: DtcgGroup, path: string[] = [], inherited?: string): { path: string; type?: string; value: unknown }[] {
  const type = group.$type ?? inherited;
  return Object.entries(group).flatMap(([key, node]) => {
    if (key.startsWith("$")) return [];
    if (isToken(node)) return [{ path: [...path, key].join("."), type: (node as { $type?: string }).$type ?? type, value: node.$value }];
    return typeof node === "object" && node ? leaves(node as DtcgGroup, [...path, key], type) : [];
  });
}

describe("DTCG export", () => {
  const doc = dtcgTokens(Object.values(presets).map((t) => getResolvedTheme(t)));
  const all = leaves(doc);
  const byPath = new Map(all.map((l) => [l.path, l]));

  it("gives every token a known $type", () => {
    expect(all.length).toBeGreaterThan(500);
    for (const token of all) expect(TYPES.has(token.type ?? ""), `${token.path} has type ${token.type}`).toBe(true);
  });

  it("resolves every reference to a token of the same type", () => {
    const refs = all.filter((t) => typeof t.value === "string" && /^\{.+\}$/.test(t.value));
    expect(refs.length).toBeGreaterThan(50);
    for (const ref of refs) {
      const target = byPath.get((ref.value as string).slice(1, -1));
      expect(target, `${ref.path} → ${String(ref.value)}`).toBeDefined();
      expect(target?.type).toBe(ref.type);
    }
  });

  it("uses DTCG value shapes", () => {
    expect(byPath.get("primitive.duration.fast")?.value).toEqual({ value: 120, unit: "ms" });
    expect(byPath.get("primitive.easing.standard")?.value).toEqual([0.2, 0, 0, 1]);
    expect(byPath.get("primitive.radius.md")?.value).toEqual({ value: 0.5, unit: "rem" });
    for (const t of all.filter((l) => l.type === "color")) {
      expect(String(t.value), t.path).toMatch(/^(#[0-9a-f]{6}|\{primitive\.color\.[a-z]+\.\d+\})$/i);
    }
  });

  it("matches the resolved theme colors exactly", () => {
    const kaveh = getResolvedTheme(presets.kaveh);
    const tokens = themeTokens(kaveh, "dark");
    const color = tokens.color as Record<string, { $value: string }>;
    // Brand navy isn't a palette step, so it stays literal; chart colors are fixed hexes.
    expect(color["chart-1"]?.$value).toBe(kaveh.dark["chart-1"]);
    for (const [role, hex] of Object.entries(kaveh.dark)) {
      const value = color[role]?.$value ?? "";
      const resolved = value.startsWith("{") ? byPath.get(`primitive.${value.slice(1, -1)}`)?.value : value;
      expect(String(resolved).toLowerCase(), role).toBe(hex.toLowerCase());
    }
  });
});
