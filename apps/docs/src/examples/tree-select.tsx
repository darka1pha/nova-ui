import { FormField, Text, type TreeItem } from "@darkalpha/nova-ui";
import { TreeSelect } from "@darkalpha/nova-ui/experimental";
import { Anchor, Building2, Ship } from "lucide-react";
import { useState } from "react";
import { Example } from "../docs/kit.tsx";

const ports: TreeItem[] = [
  {
    id: "gulf",
    label: "Persian Gulf",
    icon: <Anchor />,
    children: [
      {
        id: "bandar-abbas",
        label: "Bandar Abbas",
        icon: <Building2 />,
        children: [
          { id: "shahid-rajaee", label: "Shahid Rajaee", icon: <Ship /> },
          { id: "shahid-bahonar", label: "Shahid Bahonar", icon: <Ship /> },
        ],
      },
      { id: "bushehr", label: "Bushehr", icon: <Building2 /> },
      { id: "kish", label: "Kish", icon: <Building2 />, disabled: true },
    ],
  },
  {
    id: "caspian",
    label: "Caspian Sea",
    icon: <Anchor />,
    children: [
      { id: "anzali", label: "Anzali", icon: <Building2 /> },
      { id: "amirabad", label: "Amirabad", icon: <Building2 /> },
    ],
  },
  { id: "chabahar", label: "Chabahar", icon: <Building2 /> },
];

export function TreeSelectExamples() {
  const [port, setPort] = useState<string | null>("shahid-rajaee");
  const [many, setMany] = useState<string[]>(["anzali", "amirabad"]);
  return (
    <>
      <Example
        title="TreeSelect"
        description="Pick one item from a hierarchy. Branches open instead of being picked (branchesSelectable allows both). The search box filters and keeps each match's path; Down moves into the tree, where the TreeView keys work."
        code={`<FormField label="Destination port">
  <TreeSelect items={ports} value={port} onValueChange={setPort} defaultExpanded={["gulf"]} />
</FormField>`}
      >
        <div className="flex w-full max-w-xs flex-col gap-2">
          <FormField label="Destination port">
            <TreeSelect items={ports} value={port} onValueChange={setPort} defaultExpanded={["gulf", "bandar-abbas"]} placeholder="Choose a port" />
          </FormField>
          <Text size="sm" tone="muted">
            Value: <code>{port ?? "null"}</code>
          </Text>
        </div>
      </Example>

      <Example
        title="Several"
        description="multiple picks with checkboxes and stays open. Checking a branch picks every enabled leaf under it; the value is the leaf ids. The trigger shows two labels, then a count."
        code={`<TreeSelect multiple items={ports} value={ports} onValueChange={setPorts} />`}
      >
        <div className="flex w-full max-w-xs flex-col gap-2">
          <FormField label="Ports of call">
            <TreeSelect multiple items={ports} value={many} onValueChange={setMany} defaultExpanded={["caspian"]} placeholder="Choose ports" />
          </FormField>
          <Text size="sm" tone="muted">
            Value: <code>{JSON.stringify(many)}</code>
          </Text>
        </div>
      </Example>
    </>
  );
}
