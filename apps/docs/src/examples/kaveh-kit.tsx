import { Avatar, Button, ThemeProvider } from "@darkalpha/nova-ui";
import {
  KavehCard,
  KavehContactCard,
  KavehEmptyState,
  KavehFooter,
  KavehHero,
  KavehKpiCard,
  KavehLink,
  KavehLoader,
  KavehMenu,
  KavehNavMenu,
  KavehNotice,
  KavehPageHeader,
  KavehPortCard,
  KavehServiceCard,
  KavehSidebar,
  KavehTable,
  KavehTimeline,
  VesselStatusBadge,
  type VesselStatus,
} from "@darkalpha/nova-ui/kaveh";
import { Anchor, ContainerShip, ShipWheel, Tanker, Tugboat, VesselTracking } from "@darkalpha/nova-ui/icons";
import { BarChart3, Bell, FileText, Fuel, Home, LifeBuoy, LogOut, MapPin, Settings, Ship, User, Users } from "lucide-react";
import { useState } from "react";
import { Example, to } from "../docs/kit.tsx";

const harbour =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1f3f"/><stop offset=".62" stop-color="#295097"/><stop offset="1" stop-color="#f37537"/></linearGradient></defs><rect width="320" height="180" fill="url(#s)"/><circle cx="232" cy="118" r="24" fill="#ffb35c"/><g fill="#081430"><rect x="44" y="40" width="7" height="100"/><path d="M47 40h150v7H47z"/><rect x="170" y="47" width="2" height="34"/><rect x="190" y="70" width="6" height="70"/><path d="M193 70h100v6H193z"/><rect y="132" width="320" height="48"/></g><g fill="#4f7bc4"><rect x="70" y="116" width="26" height="16"/><rect x="98" y="116" width="26" height="16" fill="#f37537"/><rect x="84" y="100" width="26" height="16" fill="#a9bee3"/></g></svg>`,
  );

const kaveh = (children: React.ReactNode, className = "") => (
  <ThemeProvider theme="kaveh" mode="light" className={`min-h-0! w-full rounded-lg bg-surface-sunken p-4 ${className}`}>
    {children}
  </ThemeProvider>
);

/* ------------------------------------------------------------------ Cards */

export function KavehCardsExamples() {
  return (
    <>
      <Example
        title="KavehCard"
        description="A content card with a bilingual title and the Horizon. horizon has the orange top edge; navy carries the title in a KMS blue band; band uses the Tideband; elevated lifts and draws the Horizon on hover; outline is for tinted panels."
        code={`<KavehCard variant="horizon" eyebrow="Service" title="Ship agency" titleFa="نمایندگی کشتیرانی" description="…" actions={<Button size="sm">Details</Button>} />`}
      >
        {kaveh(
          <div className="grid gap-4 md:grid-cols-3">
            {(["horizon", "navy", "band", "elevated", "outline"] as const).map((variant) => (
              <KavehCard
                key={variant}
                variant={variant}
                eyebrow={variant === "band" ? undefined : "Service"}
                title="Ship agency"
                titleFa="نمایندگی کشتیرانی"
                headerEnd={variant === "navy" ? <VesselStatusBadge status="berthing" variant="solid" label="24/7" /> : undefined}
                description="Port calls, crew change and husbandry, handled end to end."
                actions={
                  <>
                    <Button size="sm">Details</Button>
                    <Button size="sm" variant="outline">
                      Contact
                    </Button>
                  </>
                }
                footer={variant === "horizon" ? "Updated today · 08:40" : undefined}
              />
            ))}
            <KavehCard variant="elevated" media={<img src={harbour} alt="Shahid Rajaee at dusk" className="h-36" />} title="Shahid Rajaee" titleFa="بندر شهید رجایی" description="Iran's largest container port." />
          </div>,
        )}
      </Example>
      <Example
        title="KavehServiceCard"
        description="Service tiles for the website: icon, bilingual title, one line and a link. light, navy and tinted."
        code={`<KavehServiceCard icon={<ContainerShip />} title="Cargo logistics" titleFa="لجستیک کالا" description="…" href="/services/cargo" />`}
      >
        {kaveh(
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KavehServiceCard icon={<Ship />} title="Ship agency" titleFa="نمایندگی کشتیرانی" description="Port calls, crew change, husbandry." href={to("components/kaveh-cards")} />
            <KavehServiceCard icon={<FileText />} title="Clearance" titleFa="ترخیص" description="Customs and port documents in 24 hours." href={to("components/kaveh-cards")} variant="tinted" />
            <KavehServiceCard icon={<Fuel />} title="Bunkering" titleFa="سوخت‌رسانی" description="Fuel coordination at anchorage." href={to("components/kaveh-cards")} variant="navy" />
            <KavehServiceCard icon={<ContainerShip />} title="Cargo logistics" titleFa="لجستیک کالا" description="From berth to warehouse." />
          </div>,
        )}
      </Example>
      <Example
        title="KavehPortCard"
        description="A port at a glance: photo, bilingual name, operating status and key facts. vertical for grids, horizontal (porthole photo) for lists."
        code={`<KavehPortCard name="Shahid Rajaee" nameFa="بندر شهید رجایی" image={photo} status="open" facts={[…]} />`}
      >
        {kaveh(
          <div className="grid gap-4 md:grid-cols-[1fr_1.4fr]">
            <KavehPortCard
              name="Shahid Rajaee"
              nameFa="بندر شهید رجایی"
              image={harbour}
              imageAlt="Shahid Rajaee port"
              status="open"
              facts={[
                { label: "Berths", value: "40" },
                { label: "Max draft", value: "16 m" },
                { label: "Cranes", value: "52" },
              ]}
              actions={<Button size="sm">Port schedule</Button>}
            />
            <div className="grid content-start gap-3">
              <KavehPortCard layout="horizontal" name="Bushehr" nameFa="بندر بوشهر" image={harbour} imageAlt="Bushehr port" status="limited" statusLabel="Limited · wind" facts={[{ label: "Berths", value: "18" }, { label: "Draft", value: "11 m" }, { label: "Pilot", value: "On call" }]} />
              <KavehPortCard layout="horizontal" name="Chabahar" nameFa="بندر چابهار" image={harbour} imageAlt="Chabahar port" status="open" facts={[{ label: "Berths", value: "10" }, { label: "Draft", value: "16 m" }, { label: "Cranes", value: "12" }]} />
            </div>
          </div>,
        )}
      </Example>
      <Example
        title="KavehContactCard"
        description="A person to contact: porthole portrait (or initials), bilingual role, and phone, email and office links. row for lists, stacked for team grids."
        code={`<KavehContactCard name="Sara Ahmadi" role="Port agent" roleFa="نماینده بندر" phone="+98 76 0000 0000" email="ops@example.com" />`}
      >
        {kaveh(
          <div className="grid gap-4 md:grid-cols-[1.3fr_1fr_1fr]">
            <KavehContactCard name="Sara Ahmadi" role="Port agent, Shahid Rajaee" roleFa="نماینده بندر شهید رجایی" phone="+98 76 0000 0000" email="ops@kaveh-marine.example" location="Bandar Abbas" />
            <KavehContactCard layout="stacked" name="Reza Karimi" role="Operations lead" roleFa="مدیر عملیات" avatar={harbour} email="reza@kaveh-marine.example" />
            <KavehContactCard layout="stacked" name="Nazanin Rahimi" role="Customs" roleFa="ترخیص گمرکی" phone="+98 77 0000 0000" />
          </div>,
        )}
        <p className="text-xs text-foreground-muted">Names and contact details are placeholders.</p>
      </Example>
      <Example
        title="KavehKpiCard"
        description="Dashboard metrics: label, figure and change. light has the orange edge; navy and tinted are for hero rows. invertDelta for metrics where a fall is good news."
        code={`<KavehKpiCard label="Vessels in port" labelFa="شناورهای در بندر" value="48" delta={12.5} deltaLabel="vs last week" icon={<Ship />} />
<KavehKpiCard variant="navy" label="Avg. waiting time" value="3.2 h" delta={-8} invertDelta />`}
      >
        {kaveh(
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KavehKpiCard label="Vessels in port" labelFa="شناورهای در بندر" value="48" delta={12.5} deltaLabel="vs last week" icon={<Ship />} />
            <KavehKpiCard variant="navy" label="Avg. waiting time" labelFa="میانگین انتظار" value="3.2 h" delta={-8} invertDelta deltaLabel="vs last week" icon={<BarChart3 />} />
            <KavehKpiCard variant="tinted" label="Documents cleared" labelFa="اسناد ترخیص‌شده" value="1,204" delta={4.1} deltaLabel="this month" icon={<FileText />} />
            <KavehKpiCard label="Bunker deliveries" labelFa="سوخت‌رسانی" value="86" delta={-2.3} deltaLabel="vs last week" icon={<Fuel />} />
          </div>,
        )}
      </Example>
    </>
  );
}

/* --------------------------------------------------------- Page sections */

export function KavehSectionsExamples() {
  return (
    <>
      <Example
        title="KavehHero"
        description="Page heroes: navy (KMS blue with a soft glow), sunset (KMS blue warming into harbour orange), light (inner pages) and split (text on light, emblem on navy). The default art is the KMS emblem; pass art to replace it or null for none."
        code={`<KavehHero
  eyebrow="Port & Marine Services · Since 1948"
  title="Trusted at every port."
  titleFa="در هر بندر، کنار شما"
  description="…"
  actions={<><Button>Request a quote</Button><Button variant="outline">Track a vessel</Button></>}
/>`}
      >
        {kaveh(
          <div className="grid gap-4">
            <KavehHero
              eyebrow="Port & Marine Services · Since 1948"
              title="Trusted at every port."
              titleFa="در هر بندر، کنار شما"
              description="Ship agency, clearance, bunkering and cargo logistics across the Persian Gulf."
              actions={
                <>
                  <Button>Request a quote</Button>
                  <Button variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10">
                    Track a vessel
                  </Button>
                </>
              }
            />
            <div className="grid gap-4 lg:grid-cols-2">
              <KavehHero variant="sunset" eyebrow="Bunkering" title="Fuel on time." titleFa="سوخت‌رسانی به‌موقع" art={null} actions={<Button>Book a delivery</Button>} />
              <KavehHero variant="light" eyebrow="About us" title="Seven decades at the water's edge." art={null} />
            </div>
            <KavehHero variant="split" eyebrow="Careers" title="Join the harbour crew." titleFa="به خدمه کاوه بپیوندید" description="Operations, agency and engineering roles in four ports." actions={<Button>Open roles</Button>} />
          </div>,
        )}
      </Example>
      <Example
        title="KavehPageHeader"
        description="An app page's title area: breadcrumbs, bilingual title, actions and tabs. plain sits on the page with a fading Horizon; band adds a Tideband eyebrow; navy is a KMS blue bar."
        code={`<KavehPageHeader breadcrumbs={<Breadcrumbs …/>} eyebrow="Operations" title="Vessels" titleFa="شناورها" actions={<Button>Add vessel</Button>} />`}
      >
        {kaveh(
          <div className="grid gap-6">
            <KavehPageHeader headingLevel={2}
              breadcrumbs={<span>Operations / Fleet</span>}
              eyebrow="Operations"
              title="Vessels"
              titleFa="شناورها"
              description="Every vessel you represent, with live status and documents."
              actions={
                <>
                  <Button variant="outline">Export</Button>
                  <Button>Add vessel</Button>
                </>
              }
            />
            <KavehPageHeader headingLevel={2} variant="band" eyebrow="Shahid Rajaee · Berth 12" title="MV Persian Gulf" titleFa="شناور خلیج‌فارس" actions={<Button>Open voyage</Button>} />
            <KavehPageHeader headingLevel={2}
              variant="navy"
              breadcrumbs={<span>Reports</span>}
              title="Monthly port report"
              titleFa="گزارش ماهانه بندر"
              actions={<Button>Download PDF</Button>}
              tabs={<KavehNavMenu surface="dark" activeId="summary" items={[{ id: "summary", label: "Summary" }, { id: "vessels", label: "Vessels" }, { id: "cargo", label: "Cargo" }]} />}
            />
          </div>,
        )}
      </Example>
      <Example
        title="KavehFooter"
        description="The site footer: heritage logo, link columns (each a named navigation landmark), contact and the legal line, under the orange Horizon. navy or light."
        code={`<KavehFooter columns={[{ title: "Services", links: […] }, …]} contact={…} legal="© 2026 Kaveh Port & Marine Services" />`}
      >
        {kaveh(
          <div className="grid gap-4">
            {(["navy", "light"] as const).map((variant) => (
              <KavehFooter
                key={variant}
                variant={variant}
                columns={[
                  { title: "Services", links: [{ label: "Ship agency", href: "#" }, { label: "Clearance", href: "#" }, { label: "Bunkering", href: "#" }] },
                  { title: "Ports", links: [{ label: "Shahid Rajaee", href: "#" }, { label: "Bushehr", href: "#" }, { label: "Chabahar", href: "#" }] },
                  { title: "Company", links: [{ label: "About", href: "#" }, { label: "Careers", href: "#" }, { label: "Contact", href: "#" }] },
                ]}
                contact={
                  <>
                    Bandar Abbas, Iran
                    <br />
                    +98 76 0000 0000 · info@kaveh-marine.example
                  </>
                }
                legal="© 2026 Kaveh Port & Marine Services · خدمات بندری و دریایی کاوه"
              />
            ))}
          </div>,
        )}
      </Example>
      <Example
        title="KavehTimeline"
        description="Milestones on a dashed Horizon with Gregorian and solar years. vertical for about pages, horizontal (scrolls) for banners. current highlights one milestone."
        code={`<KavehTimeline current={3} items={[{ year: 1948, yearFa: "۱۳۲۷", title: "Founded in Khorramshahr" }, …]} />`}
      >
        {kaveh(
          <div className="grid gap-8 md:grid-cols-[1fr_1.6fr]">
            <KavehTimeline
              current={3}
              items={[
                { year: 1948, yearFa: "۱۳۲۷", title: "Kaveh is founded", description: "Ship agency at the Gulf ports." },
                { year: 1975, yearFa: "۱۳۵۴", title: "Bunkering services", description: "Fuel coordination at anchorage." },
                { year: 2005, yearFa: "۱۳۸۴", title: "Container logistics", description: "From berth to warehouse." },
                { year: 2026, yearFa: "۱۴۰۵", title: "Digital port services", description: "Live vessel tracking for every client." },
              ]}
            />
            <KavehTimeline
              orientation="horizontal"
              current={1}
              items={[
                { year: "08:00", title: "Pilot boards" },
                { year: "09:30", title: "Berthing", description: "Berth 12" },
                { year: "11:00", title: "Cargo ops" },
                { year: "17:00", title: "Departure" },
              ]}
            />
          </div>,
        )}
        <p className="text-xs text-foreground-muted">Milestone dates are sample copy.</p>
      </Example>
    </>
  );
}

/* ------------------------------------------------------------ Navigation */

const sidebarSections = [
  {
    title: "Operations",
    items: [
      { id: "home", label: "Dashboard", labelFa: "داشبورد", icon: <Home /> },
      { id: "fleet", label: "Fleet", labelFa: "ناوگان", icon: <Ship />, badge: 5 },
      { id: "tracking", label: "Tracking", labelFa: "ردیابی", icon: <VesselTracking /> },
      { id: "docs", label: "Documents", labelFa: "اسناد", icon: <FileText /> },
    ],
  },
  {
    title: "Company",
    items: [
      { id: "team", label: "Team", labelFa: "کارکنان", icon: <Users /> },
      { id: "settings", label: "Settings", labelFa: "تنظیمات", icon: <Settings /> },
    ],
  },
];

const userFooter = (dark: boolean) => (
  <div className="flex items-center gap-3 px-2">
    <Avatar name="Sara Ahmadi" size="sm" />
    <div className="min-w-0 text-sm">
      <p className="truncate font-semibold">Sara Ahmadi</p>
      <p className={dark ? "truncate text-xs text-white/75" : "truncate text-xs text-foreground-muted"}>Port agent</p>
    </div>
  </div>
);

export function KavehNavigationExamples() {
  const [active, setActive] = useState("fleet");
  const [collapsed, setCollapsed] = useState(false);
  const [tab, setTab] = useState("vessels");
  return (
    <>
      <Example
        title="KavehSidebar"
        description="App navigation: logo, grouped items with Persian labels, an orange active marker and badges, and a footer for the signed-in user. light is the default; navy is a KMS blue rail; collapsed keeps icons and moves labels to tooltips and screen readers."
        code={`<KavehSidebar
  sections={[{ title: "Operations", items: [{ id: "fleet", label: "Fleet", labelFa: "ناوگان", icon: <Ship />, badge: 5 }, …] }]}
  activeId={active}
  onNavigate={setActive}
  footer={<User />}
/>`}
      >
        <div className="flex w-full flex-col gap-3">
          <Button size="sm" variant="outline" className="w-fit" onClick={() => setCollapsed((c) => !c)}>
            {collapsed ? "Expand" : "Collapse"}
          </Button>
          {kaveh(
            <div className="flex h-[480px] gap-4 overflow-x-auto">
              <KavehSidebar variant="navy" sections={sidebarSections} activeId={active} onNavigate={setActive} collapsed={collapsed} footer={collapsed ? <Avatar name="Sara Ahmadi" size="sm" /> : userFooter(true)} className="rounded-lg" />
              <KavehSidebar variant="light" sections={sidebarSections} activeId={active} onNavigate={setActive} collapsed={collapsed} footer={collapsed ? <Avatar name="Sara Ahmadi" size="sm" /> : userFooter(false)} className="rounded-lg" />
              <div dir="rtl" lang="fa" className="h-full">
                <KavehSidebar
                  label="منوی اصلی"
                  logo={<span className="font-black text-2xl">کاوه</span>}
                  sections={[
                    {
                      title: "عملیات",
                      items: [
                        { id: "home", label: "داشبورد", icon: <Home /> },
                        { id: "fleet", label: "ناوگان", icon: <Ship />, badge: "۵" },
                        { id: "docs", label: "اسناد", icon: <FileText /> },
                      ],
                    },
                  ]}
                  activeId={active}
                  onNavigate={setActive}
                  collapsed={collapsed}
                  className="rounded-lg"
                />
              </div>
            </div>,
          )}
        </div>
      </Example>
      <Example
        title="KavehNavMenu"
        description="Horizontal navigation with the Kaveh active state: underline (the orange Horizon under the active link), pill (orange pill) and band (a navy strip). Set surface=&quot;dark&quot; on navy."
        code={`<KavehNavMenu items={items} activeId={tab} onNavigate={setTab} />
<KavehNavMenu variant="pill" items={items} activeId={tab} onNavigate={setTab} />
<KavehNavMenu variant="band" items={items} activeId={tab} onNavigate={setTab} />`}
      >
        {kaveh(
          <div className="grid gap-4">
            {(["underline", "pill", "band"] as const).map((variant) => (
              <div key={variant} className={variant === "underline" ? "border-b border-border bg-surface px-2" : undefined}>
                <KavehNavMenu
                  variant={variant}
                  label={`Vessel views (${variant})`}
                  activeId={tab}
                  onNavigate={setTab}
                  items={[
                    { id: "vessels", label: "Vessels", icon: <Ship />, badge: 12 },
                    { id: "berths", label: "Berths", icon: <Anchor /> },
                    { id: "cargo", label: "Cargo", icon: <ContainerShip /> },
                    { id: "reports", label: "Reports", icon: <BarChart3 /> },
                  ]}
                />
              </div>
            ))}
            <div className="rounded-lg bg-[#0b1f3f] px-2">
              <KavehNavMenu variant="pill" surface="dark" label="Vessel views on navy" activeId={tab} onNavigate={setTab} items={[{ id: "vessels", label: "Vessels" }, { id: "berths", label: "Berths" }, { id: "cargo", label: "Cargo" }]} />
            </div>
          </div>,
        )}
      </Example>
      <Example
        title="KavehMenu"
        description="A dropdown with the Kaveh edge, on Nova UI's DropdownMenu, so keyboard, focus and typeahead come for free. Items take an icon, a Persian label, a shortcut and destructive styling. light or navy."
        code={`<KavehMenu
  trigger={<Button variant="outline">Account</Button>}
  header="Sara Ahmadi"
  items={[{ label: "Profile", labelFa: "پروفایل", icon: <User /> }, …, { label: "Sign out", icon: <LogOut />, destructive: true, separated: true }]}
/>`}
      >
        {kaveh(
          <div className="flex flex-wrap items-center gap-4">
            <KavehMenu
              trigger={<Button variant="outline">Account</Button>}
              header={
                <span className="flex flex-col">
                  <span>Sara Ahmadi</span>
                  <span className="text-xs font-normal text-foreground-muted">Port agent</span>
                </span>
              }
              items={[
                { label: "Profile", labelFa: "پروفایل", icon: <User />, shortcut: "⌘P" },
                { label: "Notifications", labelFa: "اعلان‌ها", icon: <Bell /> },
                { label: "Settings", labelFa: "تنظیمات", icon: <Settings /> },
                { label: "Help centre", icon: <LifeBuoy />, separated: true },
                { label: "Sign out", icon: <LogOut />, destructive: true, separated: true },
              ]}
            />
            <KavehMenu
              variant="navy"
              trigger={<Button>Vessel actions</Button>}
              items={[
                { label: "Open voyage", icon: <ShipWheel /> },
                { label: "Request tug", labelFa: "درخواست یدک‌کش", icon: <Tugboat /> },
                { label: "Book bunkering", labelFa: "رزرو سوخت", icon: <Tanker /> },
                { label: "Show on map", icon: <MapPin />, separated: true },
              ]}
            />
          </div>,
          "min-h-56",
        )}
      </Example>
    </>
  );
}

/* --------------------------------------------------------- Data & status */

type Call = { id: string; vessel: string; imo: string; port: string; berth: string; eta: string; status: VesselStatus };
const calls: Call[] = [
  { id: "6", vessel: "MT Arvand", imo: "9455120", port: "Bandar Imam", berth: "9", eta: "Tomorrow 11:00", status: "underway" },
  { id: "7", vessel: "MV Qeshm Star", imo: "9381045", port: "Shahid Rajaee", berth: "21", eta: "18:20", status: "berthing" },
  { id: "8", vessel: "MV Jask Trader", imo: "9502233", port: "Jask", berth: "1", eta: "Arrived", status: "berthed" },
  { id: "1", vessel: "MV Persian Gulf", imo: "9321483", port: "Shahid Rajaee", berth: "12", eta: "14:30", status: "berthing" },
  { id: "2", vessel: "MT Hormuz Star", imo: "9412207", port: "Bandar Abbas", berth: "4", eta: "Tomorrow 06:00", status: "underway" },
  { id: "3", vessel: "MV Kish Breeze", imo: "9530128", port: "Bandar Abbas", berth: "Anch. 3", eta: "16:10", status: "anchored" },
  { id: "4", vessel: "MV Caspian Light", imo: "9288114", port: "Chabahar", berth: "2", eta: "Arrived", status: "berthed" },
  { id: "5", vessel: "MV Gulf Pearl", imo: "9367201", port: "Bushehr", berth: "7", eta: "+6 h", status: "delayed" },
];
const statusOrder: Record<VesselStatus, number> = { delayed: 0, berthing: 1, underway: 2, anchored: 3, berthed: 4 };
const callColumns = [
  { key: "vessel", header: "Vessel", headerFa: "شناور", sortable: true, filterValue: (r: Call) => `${r.vessel} ${r.imo}`, render: (r: Call) => (
    <span className="flex flex-col">
      <span className="font-semibold text-foreground">{r.vessel}</span>
      <span className="text-xs text-foreground-muted">IMO {r.imo}</span>
    </span>
  ) },
  { key: "port", header: "Port", headerFa: "بندر", sortable: true },
  { key: "berth", header: "Berth", headerFa: "اسکله", numeric: true, sortable: true, sortValue: (r: Call) => Number.parseInt(r.berth.replace(/\D/g, ""), 10) || 0 },
  { key: "eta", header: "ETA", headerFa: "زمان رسیدن", align: "end" as const },
  { key: "status", header: "Status", headerFa: "وضعیت", align: "end" as const, sortable: true, sortValue: (r: Call) => statusOrder[r.status], filterValue: (r: Call) => r.status, render: (r: Call) => <VesselStatusBadge status={r.status} /> },
];

export function KavehDataExamples() {
  const [dismissed, setDismissed] = useState(false);
  return (
    <>
      <Example
        title="KavehTable"
        description="A framed data table on Nova UI's DataTable: bilingual title, record count and actions; search, sortable columns (aria-sort), pagination and a columns menu; row selection with a navy bulk-action bar; and an orange marker on the row under the pointer, keyboard focus or selection. Numeric columns line up on tabular digits."
        code={`<KavehTable
  title="Vessel calls"
  titleFa="ورود شناورها"
  actions={<Button size="sm">New call</Button>}
  searchable
  pageSize={5}
  columnToggle
  selectable
  bulkActions={(ids, clear) => <Button size="sm" onClick={clear}>Notify agents</Button>}
  rows={calls}
  rowKey={(r) => r.id}
  columns={[{ key: "vessel", header: "Vessel", headerFa: "شناور", sortable: true }, { key: "berth", header: "Berth", numeric: true, sortable: true }, …]}
/>`}
      >
        {kaveh(
          <KavehTable<Call>
            title="Vessel calls"
            titleFa="ورود شناورها"
            description="Every call you represent this week. Select calls to notify their agents."
            actions={
              <>
                <Button size="sm" variant="outline">
                  Export
                </Button>
                <Button size="sm">New call</Button>
              </>
            }
            searchable
            pageSize={5}
            columnToggle
            selectable
            bulkActions={(ids, clear) => (
              <>
                <Button size="sm" onClick={clear}>
                  Notify agents
                </Button>
                <Button size="sm" variant="ghost" className="text-white hover:bg-white/10" onClick={clear}>
                  Export {ids.length}
                </Button>
              </>
            )}
            renderExpanded={(r) => (
              <div className="grid gap-1 text-sm sm:grid-cols-3">
                <span>
                  <b>IMO</b> {r.imo}
                </span>
                <span>
                  <b>Agent</b> Port desk, {r.port}
                </span>
                <span>
                  <b>Documents</b> {r.status === "delayed" ? "Waiting on customs" : "Complete"}
                </span>
              </div>
            )}
            rows={calls}
            rowKey={(r) => r.id}
            columns={callColumns}
          />,
        )}
      </Example>
      <Example
        title="Heads and density"
        description="band is the default head (pale navy with navy text); navy is a KMS blue head with the orange edge; minimal is an orange rule under a plain head. compact tightens rows for dense screens; stickyHeader with maxHeight keeps the head in view while rows scroll."
        code={`<KavehTable variant="navy" density="compact" … />
<KavehTable variant="minimal" striped={false} stickyHeader maxHeight="16rem" … />`}
      >
        {kaveh(
          <div className="grid gap-6">
            <KavehTable<Call> variant="navy" density="compact" title="Berth plan" titleFa="برنامه اسکله" rows={calls.slice(0, 4)} rowKey={(r) => r.id} columns={callColumns} />
            <KavehTable<Call> variant="minimal" striped={false} stickyHeader maxHeight="16rem" title="Arrivals" count={(n) => `${n} vessels`} rows={calls} rowKey={(r) => r.id} columns={callColumns} />
          </div>,
        )}
      </Example>
      <Example
        title="Loading and empty"
        description="loading shows skeleton rows (the count hides until data arrives). With no rows the table shows the calm Kaveh empty state, or your own empty content; a search with no matches says so."
        code={`<KavehTable loading … />
<KavehTable rows={[]} empty={<KavehEmptyState title="No calls today" />} … />`}
      >
        {kaveh(
          <div className="grid gap-6 lg:grid-cols-2">
            <KavehTable<Call> loading title="Vessel calls" rows={[]} rowKey={(r) => r.id} columns={callColumns.slice(0, 3)} />
            <KavehTable<Call> title="Vessel calls" rows={[]} rowKey={(r) => r.id} columns={callColumns.slice(0, 3)} empty={<KavehEmptyState variant="calm" title="No calls today" titleFa="امروز ورودی نداریم" description="New calls appear here as agents file them." className="py-6" />} />
          </div>,
        )}
      </Example>
      <Example
        title="KavehNotice"
        description="Notices and announcement bars: info, success, warning (orange, announced as an alert), navy (site-wide announcement) and campaign (the harbour sunset, for Yalda and Nowruz offers)."
        code={`<KavehNotice variant="warning" title="Strong winds at Bushehr" titleFa="باد شدید در بوشهر">Pilotage is suspended until 18:00.</KavehNotice>
<KavehNotice variant="campaign" title="Nowruz holiday hours" onDismiss={…} />`}
      >
        {kaveh(
          <div className="grid gap-3">
            <KavehNotice title="New berth schedule">Shahid Rajaee publishes tomorrow's berth plan at 20:00.</KavehNotice>
            <KavehNotice variant="success" title="Documents cleared" titleFa="اسناد ترخیص شد">MV Persian Gulf can berth on arrival.</KavehNotice>
            <KavehNotice variant="warning" title="Strong winds at Bushehr" titleFa="باد شدید در بوشهر">
              Pilotage is suspended until 18:00.
            </KavehNotice>
            <KavehNotice variant="navy" title="Our operations centre is open 24/7" action={<KavehLink href={to("components/kaveh-data")} className="text-[#ffd0b0]">Contact ops</KavehLink>} />
            {dismissed ? (
              <Button size="sm" variant="outline" className="w-fit" onClick={() => setDismissed(false)}>
                Show campaign notice
              </Button>
            ) : (
              <KavehNotice variant="campaign" title="Nowruz holiday hours" titleFa="ساعت کاری نوروز" onDismiss={() => setDismissed(true)}>
                Agency desks stay open 24/7 from 25 Esfand to 13 Farvardin.
              </KavehNotice>
            )}
          </div>,
        )}
      </Example>
      <Example
        title="KavehEmptyState"
        description="Empty and &quot;nothing here yet&quot; states with the anchor: default (anchor in a porthole), calm (anchor on still water) and navy."
        code={`<KavehEmptyState title="No vessels yet" titleFa="هنوز شناوری ثبت نشده" description="…" action={<Button>Add vessel</Button>} />`}
      >
        {kaveh(
          <div className="grid gap-4 md:grid-cols-3">
            <KavehEmptyState title="No vessels yet" titleFa="هنوز شناوری ثبت نشده" description="Add a vessel to track its calls and documents." action={<Button size="sm">Add vessel</Button>} className="bg-surface" />
            <KavehEmptyState variant="calm" title="All quiet at the berth" titleFa="اسکله آرام است" description="No arrivals in the next 24 hours." className="bg-surface" />
            <KavehEmptyState variant="navy" title="No results" titleFa="نتیجه‌ای یافت نشد" description="Try another vessel name or IMO number." action={<Button size="sm">Clear search</Button>} />
          </div>,
        )}
      </Example>
      <Example
        title="KavehLoader and KavehLink"
        description="KavehLoader: ring, wave (the anchor bobbing) and pulse; static under reduced motion and announced politely. KavehLink: arrow, underline (the Horizon fills on hover) and button."
        code={`<KavehLoader variant="wave" label="Loading vessels" />
<KavehLink href="/services">All services</KavehLink>
<KavehLink variant="underline" href="/about">Our story</KavehLink>`}
      >
        {kaveh(
          <div className="flex flex-wrap items-center gap-8">
            <KavehLoader variant="ring" />
            <KavehLoader variant="wave" />
            <KavehLoader variant="pulse" />
            <span className="grid size-16 place-items-center rounded-lg bg-[#0b1f3f]">
              <KavehLoader variant="ring" tone="reversed" size={40} />
            </span>
            <KavehLink href={to("components/kaveh-data")}>All services</KavehLink>
            <KavehLink variant="underline" href={to("components/kaveh-data")}>
              Our story
            </KavehLink>
            <KavehLink variant="button" href={to("components/kaveh-data")}>
              Request a quote
            </KavehLink>
          </div>,
        )}
      </Example>
    </>
  );
}

/* -------------------------------------------------------------- Dashboard */

export function KavehDashboardExamples() {
  const [active, setActive] = useState("home");
  const [tab, setTab] = useState("today");
  return (
    <Example
      title="Kaveh operations dashboard"
      description="The kit together under the kaveh preset: KavehSidebar, KavehPageHeader with a KavehNavMenu, KavehKpiCard, KavehNotice, KavehTable and KavehMenu."
      code={`<ThemeProvider theme="kaveh">
  <KavehSidebar … />
  <main>
    <KavehPageHeader title="Operations" tabs={<KavehNavMenu … />} />
    <KavehKpiCard … />  <KavehTable … />
  </main>
</ThemeProvider>`}
    >
      <ThemeProvider theme="kaveh" mode="light" className="min-h-0! flex h-[760px] w-full overflow-hidden rounded-xl border border-border bg-surface-sunken">
        <KavehSidebar sections={sidebarSections} activeId={active} onNavigate={setActive} footer={userFooter(false)} />
        <main className="flex min-w-0 flex-1 flex-col gap-5 overflow-y-auto p-6">
          <KavehPageHeader headingLevel={2}
            eyebrow="Shahid Rajaee"
            title="Operations"
            titleFa="عملیات بندری"
            actions={
              <>
                <KavehMenu
                  trigger={<Button variant="outline">Export</Button>}
                  items={[
                    { label: "PDF report", icon: <FileText /> },
                    { label: "Excel sheet", icon: <BarChart3 /> },
                  ]}
                />
                <Button>New vessel call</Button>
              </>
            }
            tabs={
              <KavehNavMenu
                label="Period"
                activeId={tab}
                onNavigate={setTab}
                items={[
                  { id: "today", label: "Today" },
                  { id: "week", label: "This week" },
                  { id: "month", label: "This month" },
                ]}
              />
            }
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <KavehKpiCard variant="navy" label="Vessels in port" labelFa="شناورهای در بندر" value="48" delta={12.5} deltaLabel="vs last week" icon={<Ship />} />
            <KavehKpiCard label="Avg. waiting time" value="3.2 h" delta={-8} invertDelta deltaLabel="vs last week" icon={<BarChart3 />} />
            <KavehKpiCard label="Documents cleared" value="1,204" delta={4.1} deltaLabel="this month" icon={<FileText />} />
            <KavehKpiCard label="Bunker deliveries" value="86" delta={-2.3} deltaLabel="vs last week" icon={<Fuel />} />
          </div>
          <KavehNotice variant="warning" title="Strong winds at Bushehr" titleFa="باد شدید در بوشهر">
            Pilotage is suspended until 18:00. Two calls are delayed.
          </KavehNotice>
          <KavehTable<Call> title="Vessel calls today" titleFa="ورود شناورها" searchable pageSize={5} selectable bulkActions={(_, clear) => <Button size="sm" onClick={clear}>Notify agents</Button>} rows={calls} rowKey={(r) => r.id} columns={callColumns} />
        </main>
      </ThemeProvider>
    </Example>
  );
}
