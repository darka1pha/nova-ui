import { parseHex, parseHexAlpha } from "./color/convert.ts";
import * as primitives from "./primitives/index.ts";
import type { ColorMode, ResolvedTheme } from "./themes/types.ts";

/*
 * Nova UI tokens as Figma variables, in the shape of the Figma REST API's
 * `POST /v1/files/:file_key/variables` body. Two collections:
 *
 * - "Nova primitives" (one mode): the color palette, radius, font sizes,
 *   weights, line heights, opacity and font families.
 * - "Nova theme": every semantic color plus fonts and base radius, with a
 *   Light and a Dark mode per theme ("Vibrant · Light", "Vibrant · Dark", …).
 *   A semantic color that is exactly a palette step is an alias of that
 *   palette variable, so the link survives in Figma.
 *
 * Pass the file's existing variables (GET /v1/files/:file_key/variables/local)
 * to update them in place instead of creating duplicates. scripts/figma-sync.ts
 * does both calls.
 */

type FigmaColor = { r: number; g: number; b: number; a: number };
type FigmaValue = FigmaColor | number | string | boolean | { type: "VARIABLE_ALIAS"; id: string };
type ResolvedType = "COLOR" | "FLOAT" | "STRING";
type Action = "CREATE" | "UPDATE";

export interface FigmaVariablesPayload {
  variableCollections: { action: Action; id: string; name?: string; initialModeId?: string }[];
  variableModes: { action: Action; id: string; name: string; variableCollectionId: string }[];
  variables: {
    action: Action;
    id: string;
    name?: string;
    variableCollectionId?: string;
    resolvedType?: ResolvedType;
    description?: string;
    scopes?: string[];
  }[];
  variableModeValues: { variableId: string; modeId: string; value: FigmaValue }[];
}

/** The parts of `GET /v1/files/:file_key/variables/local`'s `meta` this needs. */
export interface FigmaLocalVariables {
  variableCollections: Record<string, { id: string; name: string; modes: { modeId: string; name: string }[] }>;
  variables: Record<string, { id: string; name: string; variableCollectionId: string }>;
}

export interface FigmaVariablesOptions {
  /** Variables already in the file, so existing ones are updated rather than duplicated. */
  existing?: FigmaLocalVariables;
  /** Collection names. */
  primitivesCollection?: string;
  themeCollection?: string;
}

const PRIMITIVES = "Nova primitives";
const THEME = "Nova theme";
const REM = 16;

const toPx = (v: string) => {
  const m = /^(-?[\d.]+)(px|rem)$/.exec(v);
  return m ? Number(m[1]) * (m[2] === "rem" ? REM : 1) : null;
};
const color = (hex: string): FigmaColor | null => {
  const rgb = parseHex(hex);
  return rgb ? { ...rgb, a: parseHexAlpha(hex) } : null;
};
/** "primary-solid-hover" → "primary/solid-hover", "chart-1" → "chart/1": groups in Figma's variable panel. */
const roleName = (role: string) => role.replace("-", "/");
const label = (id: string) => id.replace(/(^|-)(\w)/g, (_, dash: string, ch: string) => (dash ? " " : "") + ch.toUpperCase());

/** Builds the request body. Throws if a theme color isn't a hex color (Figma variables need RGB). */
export function figmaVariables(themes: ResolvedTheme[], options: FigmaVariablesOptions = {}): FigmaVariablesPayload {
  const { existing, primitivesCollection = PRIMITIVES, themeCollection = THEME } = options;
  const payload: FigmaVariablesPayload = { variableCollections: [], variableModes: [], variables: [], variableModeValues: [] };
  let tmp = 0;
  const tempId = (kind: string) => `tmp_${kind}_${++tmp}`;

  const existingCollection = (name: string) => Object.values(existing?.variableCollections ?? {}).find((c) => c.name === name);

  /** A collection and a lookup for its modes, creating whatever's missing. */
  function collection(name: string, modeNames: string[]) {
    const found = existingCollection(name);
    const id = found?.id ?? tempId("collection");
    const modes = new Map<string, string>();
    if (found) {
      payload.variableCollections.push({ action: "UPDATE", id, name });
      for (const m of found.modes) modes.set(m.name, m.modeId);
    } else {
      const initial = tempId("mode");
      payload.variableCollections.push({ action: "CREATE", id, name, initialModeId: initial });
      // The new collection's default mode takes the first name.
      payload.variableModes.push({ action: "UPDATE", id: initial, name: modeNames[0] ?? "Value", variableCollectionId: id });
      modes.set(modeNames[0] ?? "Value", initial);
    }
    for (const modeName of modeNames) {
      if (modes.has(modeName)) continue;
      const modeId = tempId("mode");
      payload.variableModes.push({ action: "CREATE", id: modeId, name: modeName, variableCollectionId: id });
      modes.set(modeName, modeId);
    }
    const existingVars = new Map(
      Object.values(existing?.variables ?? {})
        .filter((v) => v.variableCollectionId === id)
        .map((v) => [v.name, v.id]),
    );
    const declared = new Map<string, string>();
    /** Declares a variable once and returns its id. */
    const variable = (varName: string, resolvedType: ResolvedType, extra: { description?: string; scopes?: string[] } = {}) => {
      const known = declared.get(varName);
      if (known) return known;
      const prior = existingVars.get(varName);
      const varId = prior ?? tempId("variable");
      payload.variables.push(
        prior ? { action: "UPDATE", id: varId, ...extra } : { action: "CREATE", id: varId, name: varName, variableCollectionId: id, resolvedType, ...extra },
      );
      declared.set(varName, varId);
      return varId;
    };
    const set = (varId: string, modeName: string, value: FigmaValue) => {
      const modeId = modes.get(modeName);
      if (!modeId) throw new Error(`Unknown mode "${modeName}" in ${name}.`);
      payload.variableModeValues.push({ variableId: varId, modeId, value });
    };
    return { variable, set };
  }

  // ---- Primitives
  const prim = collection(primitivesCollection, ["Value"]);
  const paletteByHex = new Map<string, string>();
  for (const [scale, steps] of Object.entries(primitives.palette)) {
    for (const [step, hex] of Object.entries(steps as Record<string, string>)) {
      const value = color(hex);
      if (!value) continue;
      const id = prim.variable(`color/${scale}/${step}`, "COLOR", { scopes: ["ALL_FILLS", "STROKE_COLOR", "EFFECT_COLOR"] });
      prim.set(id, "Value", value);
      if (!paletteByHex.has(hex.toLowerCase())) paletteByHex.set(hex.toLowerCase(), id);
    }
  }
  const radiusIds = new Map<string, string>();
  for (const [key, v] of Object.entries(primitives.radius)) {
    const px = toPx(v);
    if (px === null) continue;
    const id = prim.variable(`radius/${key}`, "FLOAT", { scopes: ["CORNER_RADIUS"] });
    prim.set(id, "Value", px);
    radiusIds.set(key, id);
  }
  for (const [key, [size, lineHeight]] of Object.entries(primitives.fontSize as Record<string, readonly [string, string]>)) {
    const px = toPx(size);
    if (px === null) continue;
    prim.set(prim.variable(`font-size/${key}`, "FLOAT", { scopes: ["FONT_SIZE"], description: `Line height ${lineHeight}` }), "Value", px);
  }
  for (const [key, v] of Object.entries(primitives.fontWeight)) prim.set(prim.variable(`font-weight/${key}`, "FLOAT", { scopes: ["FONT_WEIGHT"] }), "Value", Number(v));
  for (const [key, v] of Object.entries(primitives.lineHeight)) prim.set(prim.variable(`line-height/${key}`, "FLOAT", { scopes: ["LINE_HEIGHT"] }), "Value", Number(v));
  for (const [key, v] of Object.entries(primitives.opacity)) prim.set(prim.variable(`opacity/${key}`, "FLOAT", { scopes: ["OPACITY"] }), "Value", Number(v) * 100);
  for (const [key, v] of Object.entries(primitives.fontFamily)) {
    // Figma wants one family name, not a CSS stack: the first one, unquoted.
    const first = v.split(",")[0]?.trim().replace(/^"|"$/g, "") ?? v;
    prim.set(prim.variable(`font-family/${key}`, "STRING", { scopes: ["FONT_FAMILY"], description: v }), "Value", first);
  }

  // ---- Theme
  const modeName = (t: ResolvedTheme, m: ColorMode) => `${label(t.id)} · ${m === "light" ? "Light" : "Dark"}`;
  const theme = collection(
    themeCollection,
    themes.flatMap((t) => [modeName(t, "light"), modeName(t, "dark")]),
  );
  for (const t of themes) {
    for (const m of ["light", "dark"] as const) {
      const mode = modeName(t, m);
      for (const [role, hex] of Object.entries(t[m])) {
        const id = theme.variable(`color/${roleName(role)}`, "COLOR", { scopes: ["ALL_FILLS", "STROKE_COLOR", "EFFECT_COLOR"] });
        const alias = paletteByHex.get(hex.toLowerCase());
        const value = alias ? { type: "VARIABLE_ALIAS" as const, id: alias } : color(hex);
        if (!value) throw new Error(`${t.id} ${m}: "${role}" is "${hex}", which isn't a hex color; Figma variables need RGB.`);
        theme.set(id, mode, value);
      }
      for (const font of ["sans", "display", "mono"] as const) {
        const stack = t.fonts[font];
        theme.set(theme.variable(`font/${font}`, "STRING", { scopes: ["FONT_FAMILY"] }), mode, stack.split(",")[0]?.trim().replace(/^"|"$/g, "") ?? stack);
      }
      const radius = radiusIds.get(t.radius);
      if (radius) theme.set(theme.variable("radius/base", "FLOAT", { scopes: ["CORNER_RADIUS"] }), mode, { type: "VARIABLE_ALIAS", id: radius });
    }
  }
  return payload;
}
