import { describe, expect, it } from "vitest";
import { figmaVariables, getResolvedTheme, type FigmaLocalVariables } from "../src/index.ts";

const vibrant = getResolvedTheme("vibrant");
const ocean = getResolvedTheme("ocean");

describe("figmaVariables", () => {
  const payload = figmaVariables([vibrant, ocean]);
  const ids = new Set(payload.variables.map((v) => v.id));
  const byName = new Map(payload.variables.map((v) => [v.name, v]));

  it("creates a primitives and a theme collection with a light and dark mode per theme", () => {
    expect(payload.variableCollections.map((c) => [c.action, c.name])).toEqual([
      ["CREATE", "Nova primitives"],
      ["CREATE", "Nova theme"],
    ]);
    expect(payload.variableModes.map((m) => m.name)).toEqual(["Value", "Vibrant · Light", "Vibrant · Dark", "Ocean · Light", "Ocean · Dark"]);
    // The default mode of each new collection is renamed rather than created.
    const initial = payload.variableCollections.map((c) => c.initialModeId);
    expect(payload.variableModes.filter((m) => m.action === "UPDATE").map((m) => m.id)).toEqual(initial);
  });

  it("gives every theme variable a value in every mode, aliasing palette steps", () => {
    const modes = payload.variableModes.filter((m) => m.name !== "Value").map((m) => m.id);
    const primary = byName.get("color/primary/solid");
    expect(primary?.resolvedType).toBe("COLOR");
    const values = payload.variableModeValues.filter((v) => v.variableId === primary?.id);
    expect(values.map((v) => v.modeId).sort()).toEqual([...modes].sort());
    // Every alias points at a variable in the same request.
    const aliases = payload.variableModeValues.flatMap((v) => (typeof v.value === "object" && "type" in v.value ? [v.value.id] : []));
    expect(aliases.length).toBeGreaterThan(100);
    expect(aliases.every((id) => ids.has(id))).toBe(true);
    // Values are RGB 0–1 with alpha.
    const literal = payload.variableModeValues.find((v) => typeof v.value === "object" && "r" in v.value);
    expect(literal?.value).toMatchObject({ r: expect.any(Number), g: expect.any(Number), b: expect.any(Number), a: 1 });
  });

  it("converts scales to Figma units", () => {
    const value = (name: string) => payload.variableModeValues.find((v) => v.variableId === byName.get(name)?.id)?.value;
    expect(value("radius/md")).toBe(8);
    expect(value("font-size/md")).toBe(16);
    expect(value("font-weight/bold")).toBe(700);
    expect(value("opacity/disabled")).toBe(50);
    expect(value("font-family/mono")).toBe("JetBrains Mono Variable");
  });

  it("updates variables that already exist instead of duplicating them", () => {
    const existing: FigmaLocalVariables = {
      variableCollections: {
        c1: { id: "c1", name: "Nova primitives", modes: [{ modeId: "m1", name: "Value" }] },
        c2: { id: "c2", name: "Nova theme", modes: [{ modeId: "m2", name: "Vibrant · Light" }] },
      },
      variables: {
        v1: { id: "v1", name: "color/violet/500", variableCollectionId: "c1" },
        v2: { id: "v2", name: "color/primary/solid", variableCollectionId: "c2" },
      },
    };
    const update = figmaVariables([vibrant], { existing });
    expect(update.variableCollections.map((c) => [c.action, c.id])).toEqual([
      ["UPDATE", "c1"],
      ["UPDATE", "c2"],
    ]);
    // Only the missing dark mode is created.
    expect(update.variableModes).toEqual([expect.objectContaining({ action: "CREATE", name: "Vibrant · Dark", variableCollectionId: "c2" })]);
    expect(update.variables.find((v) => v.id === "v1")?.action).toBe("UPDATE");
    expect(update.variables.find((v) => v.id === "v2")?.action).toBe("UPDATE");
    expect(update.variables.filter((v) => v.name === "color/primary/solid")).toHaveLength(0);
    expect(update.variableModeValues.some((v) => v.variableId === "v2" && v.modeId === "m2")).toBe(true);
  });
});
