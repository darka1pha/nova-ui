import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Heading, Stat, Text } from "@darkalpha/nova-ui";
import { Board, type Task } from "./board";
import { BookingForm } from "./booking-form";
import { ModeToggle } from "./mode-toggle";

// Pretend this comes from a database: the page is a Server Component, so it can await data.
async function getTasks(): Promise<Record<"todo" | "doing" | "done", Task[]>> {
  return {
    todo: [
      { id: "1", title: "Write release notes", owner: "Sam" },
      { id: "2", title: "Audit form errors", owner: "Rin" },
    ],
    doing: [{ id: "3", title: "Ship DateTimePicker", owner: "Ava" }],
    done: [{ id: "4", title: "Set up Next.js example", owner: "Lee" }],
  };
}

export default async function Page() {
  const tasks = await getTasks();
  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 16px", display: "grid", gap: 24 }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "grid", gap: 8 }}>
          <Badge variant="gradient">App Router · Server Components</Badge>
          <Heading level={1}>Nova UI on Next.js</Heading>
          <Text tone="muted">This page renders on the server; only the interactive parts hydrate.</Text>
        </div>
        <ModeToggle />
      </header>

      {/* Display components render straight from a Server Component. */}
      <section style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <Stat label="Open tasks" value={tasks.todo.length + tasks.doing.length} delta={12} helpText="vs last week" />
        <Stat label="Shipped" value={tasks.done.length} delta={-4} helpText="vs last week" />
        <Stat label="Revenue" value={48200} format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }} delta={8.1} />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Sprint board</CardTitle>
          <CardDescription>Data loaded on the server, passed to a client component that owns the drag state.</CardDescription>
        </CardHeader>
        <CardContent>
          <Board initial={tasks} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Book a session</CardTitle>
          <CardDescription>A native form posted to a Server Action. Pickers submit through hidden inputs, so no client-side form library is needed.</CardDescription>
        </CardHeader>
        <CardContent>
          <BookingForm />
        </CardContent>
      </Card>
    </main>
  );
}
