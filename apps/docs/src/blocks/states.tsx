import { Button, Card, EmptyState, ErrorState } from "@kaleido/ui";
import { Waves } from "@kaleido/ui/icons";
import { Plus, RotateCw, SearchX } from "lucide-react";

/** Empty and error states: first use, no matches, and a failed load, each with a next step. */
export function StatesBlock() {
  return (
    <div className="grid w-full gap-4 p-6 md:grid-cols-3">
      <Card variant="outline" className="justify-center">
        <EmptyState
          size="sm"
          icon={<Waves />}
          title="No voyages yet"
          description="Register your first arrival to start tracking berths and cargo."
          actions={
            <Button size="sm" startIcon={<Plus />}>
              Register arrival
            </Button>
          }
        />
      </Card>
      <Card variant="outline" className="justify-center">
        <EmptyState
          size="sm"
          icon={<SearchX />}
          title="No vessels match “tanker bushehr”"
          description="Check the spelling or clear the filters."
          actions={
            <Button size="sm" variant="outline">
              Clear filters
            </Button>
          }
        />
      </Card>
      <Card variant="outline" className="justify-center">
        <ErrorState
          size="sm"
          title="Couldn't load berth schedule"
          description="The terminal system didn't respond. Your data is safe."
          actions={
            <Button size="sm" variant="outline" startIcon={<RotateCw />}>
              Try again
            </Button>
          }
        />
      </Card>
    </div>
  );
}
