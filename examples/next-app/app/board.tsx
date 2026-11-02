"use client";

import { KanbanBoard, Text, type KanbanColumn } from "@darkalpha/nova-ui";
import { useState } from "react";

export interface Task {
  id: string;
  title: string;
  owner: string;
}

// getKey and renderItem are functions, so the board lives in a client component;
// the page passes it plain data.
export function Board({ initial }: { initial: Record<"todo" | "doing" | "done", Task[]> }) {
  const [columns, setColumns] = useState<KanbanColumn<Task>[]>([
    { id: "todo", title: "To do", items: initial.todo },
    { id: "doing", title: "In progress", items: initial.doing, limit: 2 },
    { id: "done", title: "Done", items: initial.done },
  ]);
  return (
    <KanbanBoard
      aria-label="Sprint board"
      columns={columns}
      getKey={(t) => t.id}
      getLabel={(t) => t.title}
      onMove={setColumns}
      renderItem={(t) => (
        <span style={{ display: "grid", gap: 2 }}>
          <span style={{ fontWeight: 500 }}>{t.title}</span>
          <Text size="xs" tone="muted">
            {t.owner}
          </Text>
        </span>
      )}
    />
  );
}
