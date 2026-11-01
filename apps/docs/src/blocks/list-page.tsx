import { Badge, Button, DataTable, DateRangePicker, type DataTableColumn } from "@darkalpha/nova-ui";
import { ContainerShip } from "@darkalpha/nova-ui/icons";
import { Download, Plus } from "lucide-react";

type Vessel = { id: string; name: string; type: string; berth: string; eta: Date; teu: number; status: "Berthed" | "At anchor" | "Underway" | "Delayed" };

const vessels: Vessel[] = [
  ["IRS", "Iran Shahr", "Container", "Shahid Rajaee 2", 0, 4200, "Berthed"],
  ["MSA", "MSC Aurora", "Container", "Shahid Rajaee 1", 0, 9800, "Berthed"],
  ["KST", "Kish Star", "Tanker", "—", 1, 0, "At anchor"],
  ["PGF", "Persian Gulf", "Bulk", "Bushehr 4", 2, 0, "Underway"],
  ["CHB", "Chabahar Pride", "Container", "Shahid Beheshti 1", 3, 2600, "Delayed"],
  ["ARV", "Arvand", "Ro-Ro", "Shahid Bahonar 3", 4, 0, "Underway"],
  ["HRM", "Hormuz Way", "Container", "Shahid Rajaee 5", 5, 6100, "Underway"],
  ["SRD", "Sardar", "General cargo", "Bushehr 2", 6, 0, "At anchor"],
].map(([id, name, type, berth, days, teu, status]) => ({
  id: id as string,
  name: name as string,
  type: type as string,
  berth: berth as string,
  eta: new Date(2026, 10, 1 + (days as number), 8 + (days as number)),
  teu: teu as number,
  status: status as Vessel["status"],
}));

const statusTone = { Berthed: "success", "At anchor": "info", Underway: "neutral", Delayed: "warning" } as const;

const columns: DataTableColumn<Vessel>[] = [
  {
    id: "name",
    header: "Vessel",
    sortable: true,
    hideable: false,
    cell: (v) => (
      <span className="flex items-center gap-2.5">
        <ContainerShip size={18} variant="duotone" className="text-primary-text" />
        <span className="font-medium text-foreground">{v.name}</span>
      </span>
    ),
  },
  { id: "type", header: "Type", sortable: true },
  { id: "berth", header: "Berth" },
  { id: "eta", header: "ETA", sortable: true, cell: (v) => v.eta.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) },
  { id: "teu", header: "TEU", align: "end", sortable: true, cell: (v) => (v.teu ? v.teu.toLocaleString() : "—") },
  { id: "status", header: "Status", sortable: true, cell: (v) => <Badge variant={statusTone[v.status]} dot>{v.status}</Badge> },
];

/** A list page: title and actions, one row of filters, then a searchable, paginated table. */
export function VesselListBlock() {
  return (
    <div className="flex w-full flex-col gap-5 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-xl font-semibold text-foreground">Vessels</h2>
          <p className="text-sm text-foreground-muted">Arrivals and berth assignments across all terminals.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" startIcon={<Download />}>
            Export
          </Button>
          <Button size="sm" startIcon={<Plus />}>
            Register arrival
          </Button>
        </div>
      </div>
      <DataTable
        data={vessels}
        columns={columns}
        getRowId={(v) => v.id}
        searchable
        columnToggle
        pageSize={5}
        toolbar={<DateRangePicker aria-label="ETA window" size="sm" className="w-auto" />}
        labels={{ search: "Search vessels, berths…" }}
        caption="Vessels expected this week"
      />
    </div>
  );
}
