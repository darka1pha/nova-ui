import { Badge, Card, Heading, LoadingState, Text } from "@darkalpha/nova-ui";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Suspense } from "react";
import { ApiSection } from "../docs/api.tsx";
import { A11yNotes, CodeBlock, Page } from "../docs/kit.tsx";
import { categories, componentById, components, type CategoryId } from "../docs/registry.ts";

/** One component: import line, live examples, accessibility notes and the generated API reference. */
export function ComponentPage({ id }: { id: string }) {
  const entry = componentById.get(id);
  const category = categories.find((c) => c.id === entry?.category);
  if (!entry || !category) return null;
  const siblings = components.filter((c) => c.category === entry.category);
  const index = siblings.indexOf(entry);
  const prev = siblings[index - 1];
  const next = siblings[index + 1];
  const Examples = entry.examples;
  // Sub-parts (DialogTitle, SelectItem…) come along with their root; import the ones used most.
  const imports = entry.parts.slice(0, 6).join(", ");

  return (
    <Page eyebrow={category.label} title={entry.name} lead={entry.summary}>
      <CodeBlock language="tsx" code={`import { ${imports} } from "@darkalpha/nova-ui${entry.entry ? `/${entry.entry}` : ""}";`} />
      <Suspense fallback={<LoadingState title="Loading examples…" className="py-16" />}>
        <Examples />
      </Suspense>
      {entry.a11y ? <A11yNotes items={entry.a11y} /> : null}
      <ApiSection parts={entry.parts} />
      <nav aria-label={`More in ${category.label}`} className="grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
        {prev ? (
          <a href={`#/components/${prev.id}`} className="group flex flex-col gap-1 rounded-lg border border-border p-4 hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus-ring">
            <span className="flex items-center gap-1 text-xs text-foreground-muted">
              <ArrowLeft className="size-3.5 rtl:-scale-x-100" /> Previous
            </span>
            <span className="font-semibold text-foreground">{prev.name}</span>
          </a>
        ) : (
          <span />
        )}
        {next ? (
          <a href={`#/components/${next.id}`} className="group flex flex-col items-end gap-1 rounded-lg border border-border p-4 text-end hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus-ring">
            <span className="flex items-center gap-1 text-xs text-foreground-muted">
              Next <ArrowRight className="size-3.5 rtl:-scale-x-100" />
            </span>
            <span className="font-semibold text-foreground">{next.name}</span>
          </a>
        ) : null}
      </nav>
    </Page>
  );
}

/** A category overview: a card per component. */
export function CategoryPage({ id }: { id: CategoryId }) {
  const category = categories.find((c) => c.id === id);
  if (!category) return null;
  const items = components.filter((c) => c.category === id);
  return (
    <Page eyebrow="Components" title={category.label} lead={category.lead} wide>
      <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((c) => (
          <li key={c.id}>
            <Card asChild interactive className="h-full gap-2 p-5">
              <a href={`#/components/${c.id}`}>
                <Heading level={2} size="xs">
                  {c.name}
                </Heading>
                <Text size="sm" tone="muted">
                  {c.summary}
                </Text>
              </a>
            </Card>
          </li>
        ))}
      </ul>
      <Text size="sm" tone="muted">
        <Badge size="sm" variant="neutral" className="me-2">
          {items.length}
        </Badge>
        components in {category.label}.
      </Text>
    </Page>
  );
}
