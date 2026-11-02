import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import type { ApiData, ComponentApi, PropInfo } from "./api-types.ts";

/**
 * Reads every component exported from @darkalpha/nova-ui's source with the
 * TypeScript compiler and returns its props: type, default, required and the
 * JSDoc description. Props inherited from DOM attributes are left out (they're
 * summarized as "also accepts <div> attributes"); Radix props are kept.
 */

export type { ApiData, ComponentApi, PropInfo };

const uiRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../packages/ui");
const uiSrc = resolve(uiRoot, "src") + sep;

const fromUi = (file: string) => resolve(file).startsWith(uiSrc);
const fromReactTypes = (file: string) => /[\\/]@types[\\/]react[\\/]/.test(file);

function clean(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

/** `size = "md"` style initializers in the component's own parameter list. */
function destructuredDefaults(fn: ts.SignatureDeclaration | undefined): Map<string, string> {
  const out = new Map<string, string>();
  const param = fn?.parameters[0];
  if (!param || !ts.isObjectBindingPattern(param.name)) return out;
  for (const el of param.name.elements) {
    if (!el.initializer) continue;
    const key = el.propertyName ?? el.name;
    if (ts.isIdentifier(key) || ts.isStringLiteral(key)) out.set(key.text, clean(el.initializer.getText()));
  }
  return out;
}

/** The function that implements a component: `function X(…)`, `forwardRef(function X(…))`, or an arrow. */
function implementation(decl: ts.Declaration | undefined): ts.SignatureDeclaration | undefined {
  if (!decl) return undefined;
  if (ts.isFunctionDeclaration(decl)) return decl;
  if (ts.isVariableDeclaration(decl) && decl.initializer) {
    let init: ts.Expression = decl.initializer;
    while (ts.isAsExpression(init) || ts.isParenthesizedExpression(init)) init = init.expression;
    if (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) return init;
    if (ts.isCallExpression(init)) {
      const fn = init.arguments.find((a): a is ts.FunctionExpression | ts.ArrowFunction => ts.isFunctionExpression(a) || ts.isArrowFunction(a));
      if (fn) return fn;
    }
  }
  return undefined;
}

/** For a cva variant key (`size: { sm: …, md: … }`), its `defaultVariants` entry. */
function cvaDefault(decl: ts.Declaration): string | undefined {
  if (!ts.isPropertyAssignment(decl)) return undefined;
  const variants = decl.parent?.parent;
  if (!variants || !ts.isPropertyAssignment(variants) || variants.name.getText() !== "variants") return undefined;
  const config = variants.parent;
  if (!ts.isObjectLiteralExpression(config)) return undefined;
  const defaults = config.properties.find((p): p is ts.PropertyAssignment => ts.isPropertyAssignment(p) && p.name.getText() === "defaultVariants");
  if (!defaults || !ts.isObjectLiteralExpression(defaults.initializer)) return undefined;
  const entry = defaults.initializer.properties.find((p): p is ts.PropertyAssignment => ts.isPropertyAssignment(p) && p.name.getText() === decl.name.getText());
  return entry ? clean(entry.initializer.getText()) : undefined;
}

/** `"sm" | "md"` for a cva variant key, from the keys of its options object. */
function cvaType(decl: ts.Declaration): string | undefined {
  if (!ts.isPropertyAssignment(decl) || !ts.isObjectLiteralExpression(decl.initializer)) return undefined;
  const keys = decl.initializer.properties.map((p) => p.name?.getText().replace(/^["']|["']$/g, "")).filter(Boolean) as string[];
  if (keys.length === 0) return undefined;
  return keys.map((k) => (k === "true" || k === "false" ? k : `"${k}"`)).join(" | ").replace('true | false', "boolean").replace('false | true', "boolean");
}

function typeText(checker: ts.TypeChecker, symbol: ts.Symbol, decl: ts.Declaration | undefined, at: ts.Node): string {
  if (decl && (ts.isPropertySignature(decl) || ts.isPropertyDeclaration(decl)) && decl.type && fromUi(decl.getSourceFile().fileName)) {
    return clean(decl.type.getText());
  }
  const fromCva = decl ? cvaType(decl) : undefined;
  if (fromCva) return fromCva;
  const type = checker.getNonNullableType(checker.getTypeOfSymbolAtLocation(symbol, at));
  const text = clean(checker.typeToString(type, at, ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope));
  // The checker orders numeric unions by creation, e.g. "0 | 4 | 1"; sort them for reading.
  // React expands ReactNode into its members; fold it back.
  if (text.includes("ReactPortal") && text.includes("Iterable<ReactNode>")) return "ReactNode";
  const parts = text.split(" | ");
  return parts.length > 1 && parts.every((p) => /^\d+$/.test(p)) ? parts.sort((a, b) => Number(a) - Number(b)).join(" | ") : text;
}

function jsdocDefault(symbol: ts.Symbol): string | undefined {
  const tag = symbol.getJsDocTags().find((t) => t.name === "default" || t.name === "defaultValue");
  return tag?.text ? clean(ts.displayPartsToString(tag.text)) : undefined;
}

/** Where a prop is declared in packages/ui, for tooling that edits the source (e.g. adding JSDoc). */
export type PropSources = Map<string, { file: string; line: number }>;

export function extractApi(sources?: PropSources): ApiData {
  const configPath = resolve(uiRoot, "tsconfig.json");
  const config = ts.getParsedCommandLineOfConfigFile(configPath, {}, { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => {} });
  if (!config) throw new Error(`Couldn't read ${configPath}`);
  const program = ts.createProgram({ rootNames: [resolve(uiSrc, "index.ts")], options: { ...config.options, noEmit: true } });
  const checker = program.getTypeChecker();
  const index = program.getSourceFile(resolve(uiSrc, "index.ts"));
  if (!index) throw new Error("packages/ui/src/index.ts not found");
  const moduleSymbol = checker.getSymbolAtLocation(index);
  if (!moduleSymbol) throw new Error("index.ts has no exports");

  const out: ApiData = {};
  for (const exported of checker.getExportsOfModule(moduleSymbol)) {
    const name = exported.getName();
    if (!/^[A-Z]/.test(name)) continue;
    const symbol = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
    if (!(symbol.flags & (ts.SymbolFlags.Function | ts.SymbolFlags.Variable))) continue;
    const decl = symbol.valueDeclaration ?? symbol.declarations?.[0];
    if (!decl) continue;

    const componentType = checker.getTypeOfSymbolAtLocation(symbol, decl);
    const signature = componentType.getCallSignatures()[0];
    const propsParam = signature?.getParameters()[0];
    // Components take one props object and return JSX; skip hooks, helpers and plain objects.
    if (!signature || !propsParam || signature.getParameters().length > 2) continue;
    const returns = checker.typeToString(signature.getReturnType());
    if (!/ReactNode|Element|ReactElement/.test(returns)) continue;

    const propsType = checker.getTypeOfSymbolAtLocation(propsParam, decl);
    const defaults = destructuredDefaults(implementation(decl));
    const props: PropInfo[] = [];
    let element: string | undefined;

    for (const prop of checker.getPropertiesOfType(propsType)) {
      const propName = prop.getName();
      const propDecl = prop.declarations?.[0];
      const file = propDecl?.getSourceFile().fileName ?? "";
      if (propName === "ref") {
        const refType = checker.typeToString(checker.getTypeOfSymbolAtLocation(prop, decl));
        element = /HTML(\w+)Element/.exec(refType)?.[1]?.toLowerCase() ?? /SVG\w*Element/.exec(refType)?.[0];
        continue;
      }
      // Radix's internal context scoping, not part of the public API.
      if (propName.startsWith("__scope")) continue;
      if (fromReactTypes(file)) {
        element ??= "element";
        continue;
      }
      const description = clean(ts.displayPartsToString(prop.getDocumentationComment(checker)));
      if (sources && propDecl && fromUi(file)) {
        sources.set(`${name}.${propName}`, { file, line: propDecl.getSourceFile().getLineAndCharacterOfPosition(propDecl.getStart()).line + 1 });
      }
      props.push({
        name: propName,
        type: typeText(checker, prop, propDecl, decl),
        default: defaults.get(propName) ?? jsdocDefault(prop) ?? (propDecl ? cvaDefault(propDecl) : undefined),
        required: !(prop.flags & ts.SymbolFlags.Optional),
        description,
      });
    }

    // Required first, then alphabetical: the usual reading order for an API table.
    props.sort((a, b) => Number(b.required) - Number(a.required) || a.name.localeCompare(b.name));
    if (element === "element") element = undefined;
    out[name] = { name, description: clean(ts.displayPartsToString(symbol.getDocumentationComment(checker))), props, ...(element ? { element } : {}) };
  }
  return out;
}
