import { Text } from "@darkalpha/nova-ui";
import { Splitter } from "@darkalpha/nova-ui/experimental";
import { Example } from "../docs/kit.tsx";

const Pane = ({ title, children }: { title: string; children: string }) => (
  <div className="flex h-full flex-col gap-1 overflow-auto p-4">
    <Text weight="semibold">{title}</Text>
    <Text size="sm" tone="muted">
      {children}
    </Text>
  </div>
);

export function SplitterExamples() {
  return (
    <>
      <Example
        title="Splitter"
        description="Resizable panes from a list, with a named handle between each pair. Drag a handle, or focus it and use the arrow keys; Enter collapses a collapsible pane. autoSaveId remembers the layout."
        code={`<Splitter
  autoSaveId="mail"
  panes={[
    { id: "folders", label: "Folders", content: <Folders />, defaultSize: 22, minSize: 15, collapsible: true },
    { id: "messages", label: "Messages", content: <Messages />, defaultSize: 33 },
    { id: "reading", label: "Reading pane", content: <Reading /> },
  ]}
/>`}
      >
        <div className="h-64 w-full overflow-hidden rounded-lg border border-border">
          <Splitter
            panes={[
              { id: "folders", label: "Folders", content: <Pane title="Folders">Inbox, Customs, Port calls</Pane>, defaultSize: 22, minSize: 15, collapsible: true },
              { id: "messages", label: "Messages", content: <Pane title="Messages">12 unread</Pane>, defaultSize: 33 },
              { id: "reading", label: "Reading pane", content: <Pane title="Reading pane">Berth 4 confirmed for Damavand Star.</Pane> },
            ]}
          />
        </div>
      </Example>

      <Example title="Vertical" description='direction="vertical" stacks the panes, e.g. an editor over a console.' code={`<Splitter direction="vertical" panes={[…]} />`}>
        <div className="h-64 w-full overflow-hidden rounded-lg border border-border">
          <Splitter
            direction="vertical"
            panes={[
              { id: "editor", label: "Editor", content: <Pane title="Editor">route.ts</Pane>, defaultSize: 65, minSize: 30 },
              { id: "console", label: "Console", content: <Pane title="Console">Build finished in 2.6 s</Pane> },
            ]}
          />
        </div>
      </Example>
    </>
  );
}
