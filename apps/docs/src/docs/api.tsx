import { Badge, Heading, LoadingState, Text } from "@darkalpha/nova-ui";
import { Suspense, use, type ReactNode } from "react";
import type { ComponentApi, PropInfo } from "../../scripts/api-types.ts";
import { Prose, Section } from "./kit.tsx";

/*
 * The API reference: props extracted from packages/ui's TypeScript source at
 * build time (virtual:nova-api). Descriptions come from the source's JSDoc;
 * props that are the same everywhere (value, open, asChild…) fall back to the
 * shared wording below, so each component's JSDoc only covers what's its own.
 */

// Each export's props are a chunk of their own; a page loads only its parts.
// Cached per set of parts, so `use()` gets the same promise on every render.
const loaded = new Map<string, Promise<ComponentApi[]>>();
function loadParts(parts: string[]): Promise<ComponentApi[]> {
  const key = parts.join(",");
  let promise = loaded.get(key);
  if (!promise) {
    promise = import("virtual:nova-api/loaders").then(({ default: loaders }) =>
      Promise.all(parts.map((part) => loaders[part]?.() ?? Promise.resolve(null))).then((list) => list.filter((p: ComponentApi | null): p is ComponentApi => p !== null)),
    );
    loaded.set(key, promise);
  }
  return promise;
}

const shared: Record<string, string> = {
  asChild: "Render the child element instead, merging these props and behavior into it (Radix Slot).",
  children: "Content.",
  className: "Extra classes, merged with tailwind-merge so yours win conflicts.",
  value: "The controlled value. Pair with the change callback.",
  defaultValue: "The initial value when uncontrolled.",
  onValueChange: "Called with the new value when it changes.",
  open: "Controlled open state. Pair with onOpenChange.",
  defaultOpen: "Open on first render when uncontrolled.",
  onOpenChange: "Called with the new open state when it changes.",
  checked: "Controlled checked state. Pair with onCheckedChange.",
  defaultChecked: "Checked on first render when uncontrolled.",
  onCheckedChange: "Called with the new checked state when it changes.",
  disabled: "Prevents interaction and dims the control.",
  required: "Marks the field as required for form validation.",
  name: "Field name used when submitting a form.",
  form: "The id of the form this field belongs to, when it's outside that form.",
  placeholder: "Hint shown while empty.",
  size: "Size of the control.",
  variant: "Visual style.",
  tone: "Semantic color.",
  label: "Visible label.",
  labels: "Text for built-in labels and announcements, for localization.",
  locale: "BCP 47 locale for formatting. Defaults to the ThemeProvider's, then the browser's.",
  dir: "Reading direction. Defaults to the ThemeProvider's.",
  orientation: "Layout and arrow-key direction.",
  loop: "Keyboard focus wraps from the last item to the first.",
  modal: "When true, the rest of the page is inert while open.",
  min: "Smallest allowed value.",
  max: "Largest allowed value.",
  step: "Increment between allowed values.",
  textValue: "Text used for typeahead when the item's content isn't plain text.",
  onSelect: "Called when the item is chosen. Call event.preventDefault() to keep the menu open.",
  side: "Preferred side of the trigger to render against.",
  sideOffset: "Distance in px from the trigger.",
  align: "Alignment against the trigger.",
  alignOffset: "Offset in px from the align position.",
  avoidCollisions: "Flip and shift to stay in view.",
  collisionBoundary: "Element(s) used as the collision boundary. Defaults to the viewport.",
  collisionPadding: "Distance in px from the boundary edges where collisions are detected.",
  arrowPadding: "Padding between the arrow and the content edges.",
  sticky: "Keep the content in the boundary when the trigger scrolls out.",
  hideWhenDetached: "Hide the content when the trigger is fully occluded.",
  updatePositionStrategy: '"always" re-measures every frame, for triggers that move.',
  onEscapeKeyDown: "Called when Escape is pressed. Call event.preventDefault() to keep it open.",
  onPointerDownOutside: "Called on a pointer down outside. Call event.preventDefault() to keep it open.",
  onFocusOutside: "Called when focus moves outside. Call event.preventDefault() to keep it open.",
  onInteractOutside: "Called on any outside pointer or focus interaction.",
  onOpenAutoFocus: "Called when focus moves into the content on open. Call event.preventDefault() to manage it yourself.",
  onCloseAutoFocus: "Called when focus returns on close. Call event.preventDefault() to manage it yourself.",
  forceMount: "Always render the content, for animation libraries that control mounting.",
  collapsible: "Allow closing the open item, leaving none open.",
  type: '"single" allows one item at a time, "multiple" any number.',
  icon: "Icon shown before the content.",
  title: "Heading text.",
  description: "Supporting text under the title.",
  inset: "Indent to line up with items that have an icon.",
  id: "Element id.",
};

/** JSDoc text with `code` spans rendered as code. */
function rich(text: string): ReactNode {
  return text.split(/(`[^`]+`)/).map((part, i) => (part.startsWith("`") && part.endsWith("`") && part.length > 2 ? <code key={i}>{part.slice(1, -1)}</code> : part));
}

/** For props whose source can't carry JSDoc (cva shorthand, Radix types) or whose shared wording doesn't fit. */
const overrides: Record<string, string> = {
  "Stack.gap": "Space between items, in steps of 0.25rem.",
  "Inline.gap": "Space between items, in steps of 0.25rem.",
  "Grid.gap": "Space between cells, in steps of 0.25rem.",
  "Stack.justify": "Distribution along the main axis.",
  "Inline.justify": "Distribution along the main axis.",
  "ScrollArea.type": "When scrollbars show: `hover`, `scroll`, `auto` or `always`.",
  "ScrollArea.scrollHideDelay": "Milliseconds before the scrollbars hide again (with `hover` and `scroll`).",
  "AspectRatio.ratio": "Width divided by height, e.g. `16 / 9`.",
  "Select.autoComplete": "Native autocomplete hint, for browser autofill.",
  "SelectContent.position": "`item-aligned` puts the selected item over the trigger, like a native select; `popper` opens below it.",
  "Slider.inverted": "Reverse the direction, so the minimum is at the end.",
  "Slider.minStepsBetweenThumbs": "Minimum distance, in steps, between the thumbs of a range.",
  "Slider.onValueCommit": "Called once when a drag ends or a key changes the value, instead of on every move.",
  "Progress.getValueLabel": "Builds the spoken value from `value` and `max`.",
  "PopoverAnchor.virtualRef": "Anchor to something that isn't an element, such as a text selection.",
  "HoverCard.openDelay": "Milliseconds the pointer rests on the trigger before it opens.",
  "HoverCard.closeDelay": "Milliseconds before it closes after the pointer leaves.",
  "NavigationMenuLink.active": 'Marks the current page (aria-current="page").',
  "CardTitle.level": "Heading level, so the title fits the page outline.",
  "MenubarItem.destructive": "Style as a destructive action.",
};

function describe(component: string, p: PropInfo) {
  return overrides[`${component}.${p.name}`] || p.description || shared[p.name] || "";
}

/** Props with descriptions and inline code, ready for the table. */
function PropsRows({ component, props }: { component: string; props: PropInfo[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[40rem] text-sm">
        <thead className="bg-surface-sunken text-start text-xs uppercase tracking-(--nv-tracking-wide) text-foreground-muted">
          <tr>
            <th scope="col" className="px-4 py-2 text-start font-semibold">Prop</th>
            <th scope="col" className="px-4 py-2 text-start font-semibold">Type</th>
            <th scope="col" className="px-4 py-2 text-start font-semibold">Default</th>
            <th scope="col" className="px-4 py-2 text-start font-semibold">Description</th>
          </tr>
        </thead>
        <tbody>
          {props.map((p) => (
            <tr key={p.name} className="border-t border-border align-top">
              <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[13px] font-semibold text-primary-text">
                {p.name}
                {p.required ? (
                  <Badge size="sm" variant="danger" className="ms-2 align-middle font-sans">
                    Required
                  </Badge>
                ) : null}
              </td>
              <td className="max-w-72 px-4 py-2.5 font-mono text-[12px] break-words text-foreground-secondary" dir="ltr">
                {p.type}
              </td>
              <td className="px-4 py-2.5 font-mono text-[12px] text-foreground-muted" dir="ltr">
                {p.default ?? "—"}
              </td>
              <td className="px-4 py-2.5 text-foreground-secondary [&_code]:rounded-sm [&_code]:bg-surface-sunken [&_code]:px-1 [&_code]:font-mono [&_code]:text-[0.85em]">
                {rich(describe(component, p)) || <span className="text-foreground-muted">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PartReference({ api }: { api: ComponentApi }) {
  const native = api.element ? (
    <>
      Also accepts every native <code>&lt;{api.element}&gt;</code> attribute, and <code>ref</code>.
    </>
  ) : null;
  return (
    <section id={`api-${api.name}`} className="flex scroll-mt-20 flex-col gap-3">
      <Heading level={3} size="sm" className="font-mono">
        {api.name}
      </Heading>
      {api.description ? (
        <Text tone="secondary" className="[&_code]:font-mono [&_code]:text-[0.9em]">
          {rich(api.description)}
        </Text>
      ) : null}
      {api.props.length > 0 ? <PropsRows component={api.name} props={api.props} /> : null}
      {api.props.length === 0 ? (
        <Prose>
          <p>{native ?? "No props of its own."}</p>
        </Prose>
      ) : native ? (
        <Text size="sm" tone="muted" className="[&_code]:font-mono">
          {native}
        </Text>
      ) : null}
    </section>
  );
}

/** Props tables for a component's exports, in the order given. */
export function ApiReference({ parts }: { parts: string[] }) {
  const found = use(loadParts(parts));
  return (
    <div className="flex flex-col gap-8">
      {found.map((part) => (
        <PartReference key={part.name} api={part} />
      ))}
    </div>
  );
}

/** An "API reference" section that loads the props on demand. */
export function ApiSection({ parts }: { parts: string[] }) {
  return (
    <Section title="API reference" id="api">
      <Suspense fallback={<LoadingState title="Loading API…" className="py-10" />}>
        <ApiReference parts={parts} />
      </Suspense>
    </Section>
  );
}
