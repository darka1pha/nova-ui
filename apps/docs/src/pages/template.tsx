import {
  Avatar,
  Badge,
  AreaChart,
  BarChart,
  BarList,
  DonutChart,
  Button,
  Card,
  CardDescription,
  CardTitle,
  CircularProgress,
  DataTable,
  DateRangePicker,
  NotificationCenter,
  type NotificationItem,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Heading,
  IconButton,
  Input,
  ResponsiveSidebar,
  SearchInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  Stack,
  Stat,
  StatusIndicator,
  Text,
  Timeline,
  ThemeProvider,
  Tooltip,
  cn,
  presets,
  type DataTableColumn,
  type PresetName,
} from "@darkalpha/nova-ui";
import {
  type Density,
  type RadiusPreset,
  type ShadowStyle,
  type SurfaceStyle,
} from "@darkalpha/nova-tokens";
import {
  Anchor,
  CheckCircle2,
  CreditCard,
  Download,
  Home,
  Layers,
  Maximize2,
  Minimize2,
  Moon,
  MoreHorizontal,
  Package,
  Plus,
  Ship,
  Sliders,
  Sparkles,
  Sun,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

/* ----------------------------------------------------------------- Mock data */

interface Shipment {
  id: string;
  trackingNo: string;
  vessel: string;
  port: string;
  destination: string;
  weight: string;
  status: "In Transit" | "Clearing" | "Delivered" | "Pending";
  eta: string;
}

const initialShipments: Shipment[] = [
  { id: "1", trackingNo: "KMS-94812", vessel: "Alvand Voyager", port: "Bandar Abbas", destination: "Dubai (Jebel Ali)", weight: "24,800 Tons", status: "In Transit", eta: "Tomorrow, 08:30" },
  { id: "2", trackingNo: "KMS-94813", vessel: "Zagros Pioneer", port: "Bushehr", destination: "Doha Port", weight: "18,200 Tons", status: "Clearing", eta: "Oct 31, 14:00" },
  { id: "3", trackingNo: "KMS-94814", vessel: "Damavand Star", port: "Chabahar", destination: "Mumbai (JNPT)", weight: "42,500 Tons", status: "In Transit", eta: "Nov 02, 19:45" },
  { id: "4", trackingNo: "KMS-94815", vessel: "Caspian Breeze", port: "Anzali", destination: "Baku Cargo Terminal", weight: "12,100 Tons", status: "Delivered", eta: "Delivered Oct 28" },
  { id: "5", trackingNo: "KMS-94816", vessel: "Persian Gulf Pride", port: "Kish Island", destination: "Sharjah Port", weight: "16,400 Tons", status: "Pending", eta: "Nov 05, 11:00" },
];

interface Invoice {
  id: string;
  client: string;
  amount: string;
  status: "Paid" | "Pending" | "Overdue";
  date: string;
}

const sampleInvoices: Invoice[] = [
  { id: "INV-2026-081", client: "Petrochem Trans Global", amount: "$84,200.00", status: "Paid", date: "Oct 28, 2026" },
  { id: "INV-2026-082", client: "Kaveh Gulf Freight Corp", amount: "$142,500.00", status: "Paid", date: "Oct 25, 2026" },
  { id: "INV-2026-083", client: "Orient Container Logistics", amount: "$38,400.00", status: "Pending", date: "Oct 22, 2026" },
  { id: "INV-2026-084", client: "Caspian Shipping Lines", amount: "$94,150.00", status: "Overdue", date: "Oct 15, 2026" },
];

/* ------------------------------------------------------------- Main Component */

const startingNotifications = (): NotificationItem[] => [
  { id: "t1", title: "Iran Shahr berthed at Berth 2", description: "Shahid Rajaee terminal", time: new Date(Date.now() - 4 * 60_000), tone: "success", category: "vessels" },
  { id: "t2", title: "Customs hold on MSKU 482117", description: "Documents requested", time: new Date(Date.now() - 38 * 60_000), tone: "warning", category: "customs" },
  { id: "t3", title: "Bunkering completed for Kish Star", time: new Date(Date.now() - 26 * 3_600_000), tone: "info", category: "vessels", read: true },
];
const reportingPeriod = { start: new Date(2026, 3, 1), end: new Date(2026, 8, 30) };
const terminalThroughput = [
  { month: "Apr", bandarAbbas: 182, bushehr: 96, chabahar: 41 },
  { month: "May", bandarAbbas: 191, bushehr: 101, chabahar: 47 },
  { month: "Jun", bandarAbbas: 176, bushehr: 108, chabahar: 52 },
  { month: "Jul", bandarAbbas: 204, bushehr: 112, chabahar: 58 },
  { month: "Aug", bandarAbbas: 219, bushehr: 109, chabahar: 63 },
  { month: "Sep", bandarAbbas: 228, bushehr: 118, chabahar: 71 },
];
const terminalSeries = [
  { key: "bandarAbbas" as const, label: "Bandar Abbas" },
  { key: "bushehr" as const, label: "Bushehr" },
  { key: "chabahar" as const, label: "Chabahar" },
];
const cargoMixData = [
  { label: "Containers", value: 5420 },
  { label: "Dry bulk", value: 2310 },
  { label: "Liquid bulk", value: 1880 },
  { label: "Ro-Ro", value: 640 },
];
const bunkerFuel = [
  { month: "Apr", mgo: 42, vlsfo: 61 },
  { month: "May", mgo: 45, vlsfo: 66 },
  { month: "Jun", mgo: 39, vlsfo: 70 },
  { month: "Jul", mgo: 48, vlsfo: 74 },
  { month: "Aug", mgo: 51, vlsfo: 79 },
  { month: "Sep", mgo: 47, vlsfo: 83 },
];
const fuelSeries = [
  { key: "mgo" as const, label: "MGO" },
  { key: "vlsfo" as const, label: "VLSFO" },
];

export function TemplatePage() {
  const [notifications, setNotifications] = useState(startingNotifications);
  const [activePreset, setActivePreset] = useState<PresetName>("kaveh");
  const [activeMode, setActiveMode] = useState<"light" | "dark">("light");
  const [activeDensity, setActiveDensity] = useState<Density>("comfortable");
  const [activeRadius, setActiveRadius] = useState<RadiusPreset>("md");
  const [activeShadow, setActiveShadow] = useState<ShadowStyle>("crisp");
  const [activeSurface, setActiveSurface] = useState<SurfaceStyle>("classic");
  const [activeView, setActiveView] = useState<"dashboard" | "shipments" | "analytics" | "invoices" | "team" | "settings">("dashboard");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const themeWithCustomization = useMemo(() => ({
    ...presets[activePreset],
    shadow: activeShadow,
    surface: activeSurface,
  }), [activePreset, activeShadow, activeSurface]);

  // New shipment modal form state
  const [newVessel, setNewVessel] = useState("");
  const [newPort, setNewPort] = useState("Bandar Abbas");
  const [newDest, setNewDest] = useState("Dubai (Jebel Ali)");
  const [shipments, setShipments] = useState<Shipment[]>(initialShipments);

  const filteredShipments = useMemo(() => {
    if (!searchQuery.trim()) return shipments;
    const q = searchQuery.toLowerCase();
    return shipments.filter(
      (s) =>
        s.trackingNo.toLowerCase().includes(q) ||
        s.vessel.toLowerCase().includes(q) ||
        s.port.toLowerCase().includes(q) ||
        s.destination.toLowerCase().includes(q) ||
        s.status.toLowerCase().includes(q),
    );
  }, [shipments, searchQuery]);


  const handleCreateShipment = () => {
    if (!newVessel.trim()) return;
    const next: Shipment = {
      id: String(Date.now()),
      trackingNo: `KMS-${Math.floor(10000 + Math.random() * 90000)}`,
      vessel: newVessel,
      port: newPort,
      destination: newDest,
      weight: "22,000 Tons",
      status: "In Transit",
      eta: "Nov 06, 12:00",
    };
    setShipments([next, ...shipments]);
    setNewVessel("");
    setDialogOpen(false);
  };

  const shipmentColumns: DataTableColumn<Shipment>[] = [
    {
      id: "trackingNo",
      header: "Tracking ID",
      cell: (row) => <span className="font-mono text-xs font-semibold text-primary-text">{row.trackingNo}</span>,
    },
    {
      id: "vessel",
      header: "Vessel Name",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Ship className="size-4 text-foreground-muted shrink-0" />
          <span className="font-medium text-foreground text-xs">{row.vessel}</span>
        </div>
      ),
    },
    {
      id: "port",
      header: "Port Origin → Dest",
      cell: (row) => (
        <span className="text-xs text-foreground-secondary">
          {row.port} → {row.destination}
        </span>
      ),
    },
    {
      id: "weight",
      header: "Cargo Weight",
      cell: (row) => <span className="text-xs">{row.weight}</span>,
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => {
        const variant =
          row.status === "Delivered"
            ? ("success" as const)
            : row.status === "In Transit"
              ? ("primary" as const)
              : row.status === "Clearing"
                ? ("warning" as const)
                : ("neutral" as const);
        return <Badge size="sm" variant={variant}>{row.status}</Badge>;
      },
    },
    {
      id: "eta",
      header: "ETA",
      cell: (row) => <span className="text-xs text-foreground-muted">{row.eta}</span>,
    },
  ];

  const invoiceColumns: DataTableColumn<Invoice>[] = [
    {
      id: "id",
      header: "Invoice No.",
      cell: (row) => <span className="font-mono text-xs font-semibold">{row.id}</span>,
    },
    {
      id: "client",
      header: "Client Account",
      cell: (row) => <span className="font-medium text-xs">{row.client}</span>,
    },
    {
      id: "amount",
      header: "Amount",
      cell: (row) => <span className="font-semibold text-xs text-foreground">{row.amount}</span>,
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => (
        <Badge size="sm" variant={row.status === "Paid" ? "success" : row.status === "Pending" ? "warning" : "danger"}>
          {row.status}
        </Badge>
      ),
    },
    {
      id: "date",
      header: "Issue Date",
      cell: (row) => <span className="text-xs text-foreground-muted">{row.date}</span>,
    },
  ];

  return (
    <div className={cn("flex flex-col gap-5 w-full", isFullscreen ? "fixed inset-0 z-50 overflow-y-auto bg-background p-4" : "p-4 sm:p-8 max-w-[96rem] mx-auto")}>
      {/* ------------------------------------------- Header / Presets Studio Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-raised p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-on-solid shadow-sm">
              <Sparkles className="size-4" />
            </span>
            <div>
              <Heading level={1} size="xs" className="leading-tight">
                Project Template Preview
              </Heading>
              <Text size="xs" tone="muted">
                Experience presets inside a full-scale production dashboard application.
              </Text>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Tooltip content={isFullscreen ? "Exit Fullscreen" : "Fullscreen Preview"}>
              <IconButton
                size="sm"
                variant="outline"
                aria-label="Toggle fullscreen mode"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
              </IconButton>
            </Tooltip>
            <IconButton
              size="sm"
              variant="outline"
              aria-label="Toggle color mode"
              onClick={() => setActiveMode(activeMode === "light" ? "dark" : "light")}
            >
              {activeMode === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
            </IconButton>
          </div>
        </div>

        {/* Preset Selector Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/60">
          <Text size="xs" weight="medium" className="me-2 text-foreground-muted">
            Preset:
          </Text>
          {(Object.keys(presets) as PresetName[]).map((pId) => {
            const p = presets[pId];
            const isSelected = activePreset === pId;
            return (
              <button
                key={pId}
                type="button"
                onClick={() => setActivePreset(pId)}
                aria-pressed={isSelected}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-(--nv-duration-fast)",
                  isSelected
                    ? "bg-primary text-primary-on-solid shadow-sm scale-105"
                    : "bg-surface-sunken text-foreground-secondary hover:bg-surface-hover hover:text-foreground",
                )}
              >
                <span
                  className="size-2.5 rounded-full ring-1 ring-white/30"
                  style={{
                    backgroundColor:
                      pId === "kaveh"
                        ? "#164f9a"
                        : pId === "vibrant"
                          ? "#6d4aff"
                          : pId === "ocean"
                            ? "#2563ff"
                            : pId === "sunset"
                              ? "#ff6b57"
                              : pId === "forest"
                                ? "#1f9d55"
                                : pId === "berry"
                                  ? "#c026d3"
                                  : pId === "minimal"
                                    ? "#777777"
                                    : pId === "midnight"
                                      ? "#06b6d4"
                                      : "#c9a13b",
                  }}
                />
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Tuning Knobs: Density, Radius, Shadow */}
        <div className="flex flex-wrap items-center gap-4 text-xs pt-1 border-t border-border/40 text-foreground-muted">
          <div className="flex items-center gap-2">
            <span>Radius:</span>
            {(["none", "sm", "md", "lg", "xl"] as RadiusPreset[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setActiveRadius(r)}
                className={cn(
                  "px-2 py-0.5 rounded text-2xs uppercase font-medium",
                  activeRadius === r ? "bg-primary text-primary-on-solid font-bold" : "hover:text-foreground",
                )}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span>Shadow:</span>
            {(["soft", "crisp", "flat"] as ShadowStyle[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setActiveShadow(s)}
                className={cn(
                  "px-2 py-0.5 rounded text-2xs capitalize font-medium",
                  activeShadow === s ? "bg-primary text-primary-on-solid font-bold" : "hover:text-foreground",
                )}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span>Materiality:</span>
            {(["classic", "glass", "clay", "neomorphic"] as SurfaceStyle[]).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setActiveSurface(st)}
                className={cn(
                  "px-2 py-0.5 rounded text-2xs capitalize font-medium transition-colors",
                  activeSurface === st ? "bg-primary text-primary-on-solid font-bold" : "hover:text-foreground",
                )}
              >
                {st === "classic" ? "Classic" : st === "glass" ? "Glass" : st === "clay" ? "Clay" : "Neomorph"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ms-auto">
            <span>Density:</span>
            <button
              type="button"
              onClick={() => setActiveDensity(activeDensity === "comfortable" ? "compact" : "comfortable")}
              className="font-semibold text-primary-text underline hover:opacity-80"
            >
              {activeDensity === "comfortable" ? "Comfortable" : "Compact"}
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------- Real Project Preview Frame */}
      <ThemeProvider
        theme={themeWithCustomization}
        mode={activeMode}
        radius={activeRadius}
        density={activeDensity}
        surface={activeSurface}
      >
        <div className="relative flex min-h-[720px] w-full flex-col overflow-hidden rounded-2xl border border-border bg-surface text-foreground shadow-xl transition-all duration-(--nv-duration-slow)">
          <SidebarProvider defaultOpen className="flex h-full min-h-[720px] flex-row w-full bg-surface-sunken">
            {/* Sidebar Navigation */}
            <ResponsiveSidebar
              label="Kaveh Fleet Portal"
              brand={{
                logo: (
                  <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-on-solid font-bold shadow-sm animate-nv-pop-in">
                    {activePreset === "kaveh" ? <Anchor className="size-4" /> : <Package className="size-4" />}
                  </span>
                ),
                title: activePreset === "kaveh" ? "Kaveh Marine Services" : "Nova UI Logistics",
                subtitle: activePreset === "kaveh" ? "Since 1948 · Port & Marine" : "Enterprise Global Suite",
              }}
              groups={[
                {
                  title: "Operations",
                  items: [
                    { title: "Dashboard", icon: <Home />, isActive: activeView === "dashboard", onClick: () => setActiveView("dashboard") },
                    {
                      title: "Fleet & Cargo",
                      icon: <Ship />,
                      isActive: activeView === "shipments",
                      badge: <Badge size="sm" variant="primary">5 Live</Badge>,
                      onClick: () => setActiveView("shipments"),
                    },
                    { title: "Analytics & Fuel", icon: <Layers />, isActive: activeView === "analytics", onClick: () => setActiveView("analytics") },
                  ],
                },
                {
                  title: "Financials & People",
                  items: [
                    { title: "Invoices & Billing", icon: <CreditCard />, isActive: activeView === "invoices", onClick: () => setActiveView("invoices") },
                    { title: "Team & Officers", icon: <Users />, isActive: activeView === "team", onClick: () => setActiveView("team") },
                    { title: "Customization", icon: <Sliders />, isActive: activeView === "settings", onClick: () => setActiveView("settings") },
                  ],
                },
              ]}
              footerUser={{
                name: "Capt. Reza Omrani",
                email: "omrani@kaveh-marine.com",
                avatar: <Avatar name="Reza Omrani" size="sm" />,
                action: <Badge size="sm" variant="neutral">DIR</Badge>,
              }}
            />

            {/* Main Application Inset Area */}
            <SidebarInset className="min-h-0 overflow-y-auto">
              {/* App Shell Header */}
              <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface/75 px-4 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <SidebarTrigger />
                  <Separator orientation="vertical" className="h-4" />
                  <div className="relative hidden sm:block w-64">
                    <SearchInput
                      placeholder="Search vessels, tracking ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge size="sm" variant="primary" className="hidden md:inline-flex capitalize">
                    Theme: {activePreset}
                  </Badge>

                  <NotificationCenter
                    items={notifications}
                    categories={[
                      { id: "vessels", label: "Vessels" },
                      { id: "customs", label: "Customs" },
                    ]}
                    onMarkRead={(id, read) => setNotifications((all) => all.map((n) => (n.id === id ? { ...n, read } : n)))}
                    onMarkAllRead={() => setNotifications((all) => all.map((n) => ({ ...n, read: true })))}
                    onDismiss={(id) => setNotifications((all) => all.filter((n) => n.id !== id))}
                  />

                  {/* Add Shipment Action Button */}
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="primary" className="gap-1.5">
                        <Plus className="size-3.5" />
                        <span className="hidden sm:inline">New Shipment</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent size="sm">
                      <DialogHeader>
                        <DialogTitle>Register New Cargo Shipment</DialogTitle>
                        <DialogDescription>Add a new port-to-port maritime shipment into the fleet scheduler.</DialogDescription>
                      </DialogHeader>
                      <Stack gap={3} className="py-2">
                        <label className="flex flex-col gap-1 text-xs font-medium">
                          <span>Vessel Name</span>
                          <Input placeholder="e.g. Alvand Navigator" value={newVessel} onChange={(e) => setNewVessel(e.target.value)} />
                        </label>
                        <label className="flex flex-col gap-1 text-xs font-medium">
                          <span>Port of Origin</span>
                          <Select value={newPort} onValueChange={setNewPort}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Bandar Abbas">Bandar Abbas Port</SelectItem>
                              <SelectItem value="Bushehr">Bushehr Marine Terminal</SelectItem>
                              <SelectItem value="Chabahar">Chabahar Deep Sea Port</SelectItem>
                              <SelectItem value="Anzali">Anzali Caspian Port</SelectItem>
                            </SelectContent>
                          </Select>
                        </label>
                        <label className="flex flex-col gap-1 text-xs font-medium">
                          <span>Destination</span>
                          <Select value={newDest} onValueChange={setNewDest}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Dubai (Jebel Ali)">Dubai (Jebel Ali)</SelectItem>
                              <SelectItem value="Doha Port">Doha Commercial Port</SelectItem>
                              <SelectItem value="Mumbai (JNPT)">Mumbai (JNPT)</SelectItem>
                              <SelectItem value="Baku Cargo Terminal">Baku Cargo Terminal</SelectItem>
                            </SelectContent>
                          </Select>
                        </label>
                      </Stack>
                      <DialogFooter>
                        <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button variant="primary" size="sm" onClick={handleCreateShipment}>Register Shipment</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <IconButton size="sm" variant="ghost" aria-label="Quick user actions">
                        <MoreHorizontal className="size-4" />
                      </IconButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setActiveView("settings")}>Preset Studio</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSearchQuery("")}>Clear Filters</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => window.print()}>Export Report</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </header>

              {/* Dynamic View Body */}
              <div key={activeView} className="p-4 sm:p-6 flex flex-col gap-6 animate-nv-fade-in animate-nv-slide-up">
                {activeView === "dashboard" && (
                  <>
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <Stat
                        label="Active Fleet Vessels"
                        value={48}
                        delta={12.5}
                        trend={[32, 36, 40, 39, 44, 46, 48]}
                        icon={<Ship className="size-4" />}
                      />
                      <Stat
                        label="Monthly Cargo Volume"
                        value="142.8k Tons"
                        delta={18.4}
                        trend={[110, 118, 124, 130, 138, 142]}
                        icon={<Package className="size-4" />}
                      />
                      <Stat
                        label="On-Time Fleet Clearance"
                        value="99.4%"
                        delta={0.2}
                        trend={[98, 99, 99, 98, 99, 100]}
                        icon={<CheckCircle2 className="size-4" />}
                      />
                      <Stat
                        label="Gross Operating Revenue"
                        value="$3.84M"
                        delta={16.2}
                        trend={[2.8, 3.1, 3.2, 3.5, 3.7, 3.84]}
                        icon={<TrendingUp className="size-4" />}
                      />
                    </div>

                    {/* Middle Section: Chart + Port Terminal Clearance */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <Card variant="outline" className="lg:col-span-2 p-5 gap-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-sm">Cargo Volume by Iranian Port Terminals</CardTitle>
                            <CardDescription className="text-xs">Metric tons processed through customs and berths</CardDescription>
                          </div>
                          <Badge size="sm" variant="primary">Q4 2026</Badge>
                        </div>
                        <BarList
                          aria-label="Port cargo throughput"
                          data={[
                            { label: "Bandar Abbas (Shahid Rajaee)", value: 68400 },
                            { label: "Bushehr Commercial Port", value: 42100 },
                            { label: "Chabahar Deep Sea Port", value: 31200 },
                            { label: "Anzali Caspian Port", value: 18900 },
                            { label: "Amirabad Special Zone", value: 12200 },
                          ]}
                        />
                      </Card>

                      <Card variant="outline" className="p-5 gap-3">
                        <CardTitle className="text-sm">Real-Time Port Operations</CardTitle>
                        <CardDescription className="text-xs">Live activity log from regional harbormasters</CardDescription>
                        <Timeline
                          items={[
                            { title: "Vessel Berthing Approved", description: "Damavand Star berthed at Pier 4, Chabahar", time: "14m ago", tone: "success" },
                            { title: "Customs Clearance Issued", description: "Container batch #4812 released at Bandar Abbas", time: "42m ago", tone: "primary" },
                            { title: "Fuel Bunkering Scheduled", description: "Zagros Pioneer bunkering 400T MGO at Bushehr", time: "2h ago", tone: "warning" },
                            { title: "Arrival Notice Received", description: "Alvand Voyager ETA reported on schedule", time: "5h ago", tone: "neutral" },
                          ]}
                        />
                      </Card>
                    </div>

                    {/* Live DataTable */}
                    <Card variant="outline" className="p-5 gap-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <CardTitle className="text-sm">Active Fleet Shipments</CardTitle>
                          <CardDescription className="text-xs">Real-time maritime tracking, port schedules, and weights</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {selectedIds.length > 0 ? (
                            <Badge size="sm" variant="primary">
                              {selectedIds.length} Selected
                            </Badge>
                          ) : null}
                          <Button size="xs" variant="outline" onClick={() => setSelectedIds([])}>
                            Deselect
                          </Button>
                        </div>
                      </div>

                      <DataTable
                        data={filteredShipments}
                        columns={shipmentColumns}
                        getRowId={(r) => r.id}
                        selectable
                        selectedIds={selectedIds}
                        onSelectionChange={setSelectedIds}
                        caption="Live active shipments"
                      />
                    </Card>
                  </>
                )}

                {activeView === "shipments" && (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Heading level={3} size="xs">Fleet & Vessel Tracker</Heading>
                        <Text size="xs" tone="muted">Active vessels currently in transit or docked at marine berths</Text>
                      </div>
                      <Badge size="sm" variant="primary">5 Active Vessels</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {shipments.map((s) => (
                        <Card key={s.id} variant="outline" className="p-4 gap-3 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-primary-text">{s.trackingNo}</span>
                            <Badge size="sm" variant={s.status === "Delivered" ? "success" : s.status === "In Transit" ? "primary" : "warning"}>
                              {s.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Ship className="size-5 text-primary-text shrink-0" />
                            <Text weight="semibold" size="sm">{s.vessel}</Text>
                          </div>
                          <Separator />
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <Text tone="muted" size="xs">Origin</Text>
                              <Text weight="medium" size="xs">{s.port}</Text>
                            </div>
                            <div>
                              <Text tone="muted" size="xs">Destination</Text>
                              <Text weight="medium" size="xs">{s.destination}</Text>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-1 text-xs text-foreground-muted">
                            <span>Capacity: {s.weight}</span>
                            <span className="font-semibold">{s.eta}</span>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {activeView === "analytics" && (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <Heading level={3} size="xs">Fleet Telemetry & Throughput</Heading>
                        <Text size="xs" tone="muted">Deep analytics across maritime freight volumes and operational efficiency</Text>
                      </div>
                      {/* One filter row above everything it scopes. */}
                      <DateRangePicker aria-label="Reporting period" size="sm" className="w-auto min-w-64" defaultValue={reportingPeriod} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card variant="outline" className="p-4 flex flex-col items-center text-center gap-2">
                        <CircularProgress value={88} size={90} label="Fleet Utilization" />
                        <Text weight="semibold" size="xs" className="mt-2">Fleet Utilization</Text>
                        <Text size="xs" tone="muted">88% of container space allocated</Text>
                      </Card>
                      <Card variant="outline" className="p-4 flex flex-col items-center text-center gap-2">
                        <CircularProgress value={96} size={90} tone="success" label="Berth Efficiency" />
                        <Text weight="semibold" size="xs" className="mt-2">Berth Clearance</Text>
                        <Text size="xs" tone="muted">Average turnaround under 14 hours</Text>
                      </Card>
                      <Card variant="outline" className="p-4 flex flex-col items-center text-center gap-2">
                        <CircularProgress value={99} size={90} tone="primary" label="Safety Compliance" />
                        <Text weight="semibold" size="xs" className="mt-2">Safety Audits</Text>
                        <Text size="xs" tone="muted">Zero maritime incidents this quarter</Text>
                      </Card>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                      <Card variant="outline" className="lg:col-span-3 p-5 gap-3">
                        <div>
                          <Text weight="semibold" size="sm">Throughput by terminal</Text>
                          <Text size="xs" tone="muted">Thousand TEU per month</Text>
                        </div>
                        <AreaChart label="Throughput by terminal (k TEU)" data={terminalThroughput} index="month" series={terminalSeries} stacked height={240} />
                      </Card>
                      <Card variant="outline" className="lg:col-span-2 p-5 gap-3">
                        <div>
                          <Text weight="semibold" size="sm">Cargo mix</Text>
                          <Text size="xs" tone="muted">Thousand tonnes this quarter</Text>
                        </div>
                        <DonutChart label="Cargo mix (k tonnes)" data={cargoMixData} size={168} />
                      </Card>
                    </div>
                    <Card variant="outline" className="p-5 gap-3">
                      <div>
                        <Text weight="semibold" size="sm">Bunker fuel delivered</Text>
                        <Text size="xs" tone="muted">Thousand tonnes, MGO vs VLSFO</Text>
                      </div>
                      <BarChart label="Bunker fuel delivered (k tonnes)" data={bunkerFuel} index="month" series={fuelSeries} height={220} />
                    </Card>
                  </div>
                )}

                {activeView === "invoices" && (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Heading level={3} size="xs">Invoices & Billing History</Heading>
                        <Text size="xs" tone="muted">Port service fees, handling charges, and terminal clearing settlements</Text>
                      </div>
                      <Button size="xs" variant="outline" className="gap-1">
                        <Download className="size-3" />
                        Export Statements
                      </Button>
                    </div>

                    <Card variant="outline" className="p-5 gap-3">
                      <DataTable
                        data={sampleInvoices}
                        columns={invoiceColumns}
                        getRowId={(r) => r.id}
                        caption="Invoices table"
                      />
                    </Card>
                  </div>
                )}

                {activeView === "team" && (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Heading level={3} size="xs">Fleet Officers & Marine Operators</Heading>
                        <Text size="xs" tone="muted">Personnel assigned to port logistics and harbormaster communications</Text>
                      </div>
                      <Button size="xs" variant="primary">Invite Officer</Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { name: "Capt. Reza Omrani", role: "Fleet Operations Director", email: "omrani@kaveh-marine.com", status: "online" as const },
                        { name: "Ali Rostami", role: "Chief Harbormaster (Bandar Abbas)", email: "rostami@kaveh-marine.com", status: "online" as const },
                        { name: "Sara Danesh", role: "Customs & Port Clearance Lead", email: "danesh@kaveh-marine.com", status: "online" as const },
                        { name: "Hossein Moradi", role: "Marine Fuel Logistics Specialist", email: "moradi@kaveh-marine.com", status: "offline" as const },
                      ].map((officer) => (
                        <Card key={officer.email} variant="outline" className="p-3.5 flex-row items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={officer.name} size="md" />
                            <div>
                              <Text weight="semibold" size="xs">{officer.name}</Text>
                              <Text size="xs" tone="muted">{officer.role}</Text>
                              <Text size="xs" tone="secondary" className="font-mono">{officer.email}</Text>
                            </div>
                          </div>
                          <StatusIndicator status={officer.status} label={officer.status === "online" ? "On Duty" : "Off Duty"} />
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {activeView === "settings" && (
                  <div className="flex flex-col gap-4">
                    <div>
                      <Heading level={3} size="xs">Preset & Brand Customization Studio</Heading>
                      <Text size="xs" tone="muted">Live preview controls for tuning tokens in a simulated production environment</Text>
                    </div>

                    <Card variant="outline" className="p-5 gap-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Text weight="semibold" size="xs">Active Theme Preset</Text>
                          <Text size="xs" tone="muted">Switch presets and watch every surface, button, and chart restyle instantly</Text>
                        </div>
                        <Select value={activePreset} onValueChange={(v) => setActivePreset(v as PresetName)}>
                          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {(Object.keys(presets) as PresetName[]).map((pId) => (
                              <SelectItem key={pId} value={pId}>
                                {presets[pId].label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div>
                          <Text weight="semibold" size="xs">Surface Materiality</Text>
                          <Text size="xs" tone="muted">Glassmorphism, Claymorphism, Neumorphism, or Classic flat/crisp styling</Text>
                        </div>
                        <div className="flex gap-1">
                          {(["classic", "glass", "clay", "neomorphic"] as SurfaceStyle[]).map((st) => (
                            <Button
                              key={st}
                              size="xs"
                              variant={activeSurface === st ? "primary" : "outline"}
                              onClick={() => setActiveSurface(st)}
                            >
                              {st === "classic" ? "Classic" : st === "glass" ? "Glass" : st === "clay" ? "Clay" : "Neomorph"}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div>
                          <Text weight="semibold" size="xs">Theme Mode</Text>
                          <Text size="xs" tone="muted">Toggle between Light and Dark color modes</Text>
                        </div>
                        <Button size="xs" variant="outline" onClick={() => setActiveMode(activeMode === "light" ? "dark" : "light")}>
                          Switch to {activeMode === "light" ? "Dark" : "Light"}
                        </Button>
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div>
                          <Text weight="semibold" size="xs">Corner Radius Tuning</Text>
                          <Text size="xs" tone="muted">Scales every component border radius from this token</Text>
                        </div>
                        <div className="flex gap-1">
                          {(["none", "sm", "md", "lg", "xl"] as RadiusPreset[]).map((r) => (
                            <Button
                              key={r}
                              size="xs"
                              variant={activeRadius === r ? "primary" : "outline"}
                              onClick={() => setActiveRadius(r)}
                            >
                              {r}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            </SidebarInset>
          </SidebarProvider>
        </div>
      </ThemeProvider>
    </div>
  );
}
