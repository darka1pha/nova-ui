import {
  Badge,
  BreadcrumbItem,
  Breadcrumbs,
  Button,
  Card,
  DonutChart,
  Stat,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Timeline,
} from "@darkalpha/nova-ui";
import { Anchor, BillOfLading, ContainerShip, CustomsStamp } from "@darkalpha/nova-ui/icons";
import { FileDown, MoreHorizontal } from "lucide-react";

/** A detail page: breadcrumbs, identity and actions, key figures, then tabbed detail. */
export function VesselDetailBlock() {
  return (
    <div className="flex w-full flex-col gap-5 p-6">
      <Breadcrumbs>
        <BreadcrumbItem href="#/blocks">Vessels</BreadcrumbItem>
        <BreadcrumbItem current>Iran Shahr</BreadcrumbItem>
      </Breadcrumbs>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-subtle text-primary-text">
            <ContainerShip size={30} variant="soft" />
          </span>
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-2xl font-semibold text-foreground">Iran Shahr</h2>
              <Badge variant="success" dot>
                Berthed
              </Badge>
            </div>
            <p className="text-sm text-foreground-muted">IMO 9405930 · Container ship · Shahid Rajaee, Berth 2</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" startIcon={<FileDown />}>
            Manifest
          </Button>
          <Button variant="ghost" size="sm" aria-label="More actions">
            <MoreHorizontal />
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Containers to discharge" value={312} delta={-4.2} invertDelta />
        <Stat label="Containers to load" value={268} delta={6.5} />
        <Stat label="Time at berth (h)" value={14} helpText="Planned 18 h" />
      </div>

      <Tabs defaultValue="activity">
        <TabsList>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="cargo">Cargo</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>
        <TabsContent value="activity">
          <Card variant="outline" className="p-5">
            <Timeline
              items={[
                { title: "Discharge started", description: "Cranes STS-04 and STS-05", time: "11:40", tone: "primary", icon: <ContainerShip /> },
                { title: "All fast at Berth 2", time: "10:05", tone: "success", icon: <Anchor /> },
                { title: "Customs pre-clearance approved", time: "09:30", tone: "info", icon: <CustomsStamp /> },
                { title: "Pilot on board", time: "09:12", tone: "neutral" },
              ]}
            />
          </Card>
        </TabsContent>
        <TabsContent value="cargo">
          <Card variant="outline" className="p-5">
            <DonutChart
              label="Cargo on board (TEU)"
              data={[
                { label: "Dry", value: 3100 },
                { label: "Reefer", value: 640 },
                { label: "Dangerous goods", value: 180 },
                { label: "Empty", value: 280 },
              ]}
              size={168}
            />
          </Card>
        </TabsContent>
        <TabsContent value="documents">
          <Card variant="outline" className="flex flex-col gap-2 p-5">
            {["Bill of lading BL-2026-4471", "Cargo manifest", "Dangerous goods declaration"].map((doc) => (
              <div key={doc} className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-surface-hover">
                <BillOfLading size={18} className="text-foreground-muted" />
                <span className="flex-1 text-sm text-foreground">{doc}</span>
                <Button size="xs" variant="ghost">
                  Open
                </Button>
              </div>
            ))}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
