import { Card, cn, Text, ToggleGroup, ToggleGroupItem } from "@darkalpha/nova-ui";
import { useState, type ReactNode } from "react";
import { CodeBlock, CopyButton, Section } from "./kit.tsx";

/** A block preview with its real source: what you copy is exactly what renders. */
export function BlockFrame({ id, title, description, source, children }: { id: string; title: string; description: string; source: string; children: ReactNode }) {
  const [view, setView] = useState("preview");
  return (
    <Section title={title} id={id}>
      <Text tone="secondary" className="-mt-2 max-w-2xl">
        {description}
      </Text>
      <Card variant="outline" className="gap-0 overflow-hidden p-0">
        <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
          <ToggleGroup type="single" size="sm" value={view} onValueChange={(v) => v && setView(v)} aria-label={`${title} view`}>
            <ToggleGroupItem value="preview" className="h-7 px-2.5 text-xs">
              Preview
            </ToggleGroupItem>
            <ToggleGroupItem value="code" className="h-7 px-2.5 text-xs">
              Code
            </ToggleGroupItem>
          </ToggleGroup>
          <CopyButton text={source} label={`Copy ${title} code`} />
        </div>
        {/* Keep the preview mounted so its state survives a look at the code. */}
        <div className={cn("bg-surface-sunken/40", view !== "preview" && "hidden")}>{children}</div>
        {view === "code" ? <CodeBlock code={source} className="max-h-[36rem] overflow-auto rounded-none border-0" /> : null}
      </Card>
    </Section>
  );
}
