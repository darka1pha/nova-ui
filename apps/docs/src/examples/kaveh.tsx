import { Button, ThemeProvider } from "@darkalpha/nova-ui";
import {
  BilingualHeading,
  BrandStat,
  HorizonDivider,
  KavehAppIcon,
  KavehEmblem,
  KavehHeader,
  KavehLogo,
  KavehMark,
  KavehSeal,
  KavehWordmark,
  KmsMonogram,
  PortholeFrame,
  Tideband,
  VesselStatusBadge,
} from "@darkalpha/nova-ui/kaveh";
import { Example } from "../docs/kit.tsx";

export function KavehLogoExamples() {
  return (
    <>
      <Example
        title="Heritage logo"
        description="The full logo, redrawn from the original: the engraved anchor over the KMS monogram, Since 1948 and تأسیس ۱۳۲۷, the periwinkle tagline band and the bilingual name. Use it on letterheads, signage and the website footer."
        code={`<KavehLogo layout="heritage" size={48} />`}
      >
        <ThemeProvider theme="kaveh" mode="light" className="min-h-0! w-full overflow-x-auto rounded-lg bg-white p-6">
          <KavehLogo layout="heritage" size={48} />
        </ThemeProvider>
      </Example>
      <Example
        title="Compact lockups"
        description="For headers, app bars and anywhere the heritage logo is too wide. The KAVEH wordmark is drawn, not typeset, so it matches the logo on every device."
        code={`<KavehLogo />
<KavehLogo persian />
<KavehLogo layout="stacked" persian />`}
      >
        <ThemeProvider theme="kaveh" mode="light" className="min-h-0! flex w-full flex-wrap items-center gap-10 rounded-lg bg-surface p-6">
          <KavehLogo />
          <KavehLogo persian size={44} />
          <KavehLogo layout="stacked" persian size={44} />
        </ThemeProvider>
      </Example>
      <Example
        title="Persian-first and badge"
        description="layout=&quot;persian&quot; sets the lockup right to left with «کاوه» and the Persian tagline, for domestic print and Persian-only screens. layout=&quot;badge&quot; puts a solid anchor in a navy tile, for app bars and sign-in screens."
        code={`<KavehLogo layout="persian" size={44} />
<KavehLogo layout="badge" size={40} />
<KavehLogo layout="badge" tone="reversed" size={40} />`}
      >
        <ThemeProvider theme="kaveh" mode="light" className="min-h-0! flex w-full flex-wrap items-center gap-10 rounded-lg bg-white p-6">
          <KavehLogo layout="persian" size={44} />
          <KavehLogo layout="badge" size={40} />
        </ThemeProvider>
        <div className="flex w-full flex-wrap items-center gap-10 rounded-lg p-6" style={{ background: "#0b1f3f" }}>
          <KavehLogo layout="persian" tone="reversed" size={44} />
          <KavehLogo layout="badge" tone="reversed" size={40} />
        </div>
      </Example>
      <Example
        title="Tones"
        description="auto follows the theme's secondary text color, so under the Kaveh presets it is KMS navy in light mode and a light navy in dark. Use reversed on navy, on-orange on Kaveh orange and mono for single-color print."
        code={`<KavehLogo layout="heritage" tone="reversed" />
<KavehLogo tone="on-orange" />
<KavehLogo tone="mono" />`}
      >
        <div className="grid w-full gap-3">
          <div className="overflow-x-auto rounded-lg p-5" style={{ background: "#0b1f3f" }}>
            <KavehLogo layout="heritage" tone="reversed" size={36} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["brand", "#ffffff"],
                ["on-orange", "#f37537"],
                ["mono", "#f6f2ec"],
                ["reversed", "#295097"],
              ] as const
            ).map(([tone, bg]) => (
              <div key={tone} className="flex items-center justify-between gap-4 rounded-lg border border-border p-5" style={{ background: bg, color: "#121826" }}>
                <KavehLogo tone={tone} size={34} persian />
                <span className="text-xs font-semibold" style={{ color: tone === "reversed" ? "#fff" : "#121826" }}>
                  {tone}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Example>
      <Example
        title="Marks"
        description="The pieces on their own. KavehMark is the engraved anchor (its inline is cut out, so it sits on any color), KavehEmblem stacks it over the KMS monogram, and KavehWordmark and KmsMonogram are the two words."
        code={`<KavehMark size={56} />
<KavehEmblem size={110} />
<KmsMonogram size={36} />
<KavehWordmark size={32} />`}
      >
        <div className="flex w-full flex-wrap items-center gap-8 rounded-lg bg-white p-6">
          <KavehMark tone="brand" size={56} />
          <KavehEmblem tone="brand" size={110} />
          <KmsMonogram tone="brand" size={36} />
          <KavehWordmark tone="brand" size={32} />
        </div>
      </Example>
      <Example
        title="Engraved or solid"
        description="The engraved anchor and outlined KMS are the heritage look. Their white inline is thinner than a pixel on a small mark and blurs, so the default variant=&quot;auto&quot; draws the anchor engraved from 44px tall, solid below that and as a plain silhouette under 20px. KMS switches to its solid letters under 16px. Force a look with variant=&quot;engraved&quot; or &quot;solid&quot;."
        code={`<KavehMark />  // auto: engraved from 44px, solid below
<KavehMark variant="engraved" />  <KavehMark variant="solid" />
<KmsMonogram variant="outline" />  <KmsMonogram variant="solid" />`}
      >
        <div className="flex w-full flex-wrap items-end gap-8 rounded-lg bg-white p-6 text-[#121826]">
          {([64, 32, 18] as const).map((size) => (
            <div key={size} className="flex items-end gap-3">
              <KavehMark tone="brand" size={size} variant="engraved" />
              <KavehMark tone="brand" size={size} variant="solid" />
              <KavehMark tone="brand" size={size} />
            </div>
          ))}
          <div className="flex items-end gap-3">
            <KmsMonogram tone="brand" size={30} />
            <KmsMonogram tone="brand" size={30} variant="solid" />
          </div>
        </div>
      </Example>
      <Example
        title="KavehAppIcon"
        description="The anchor over the KMS monogram in a tile for app icons, favicons and avatars: navy, orange, light or the harbour sunset, as a rounded square, square or circle. Below 40px the KMS letters close up, so the icon shows the anchor alone; pass monogram={false} to drop KMS at any size."
        code={`<KavehAppIcon variant="navy" />
<KavehAppIcon variant="sunset" shape="circle" />
<KavehAppIcon variant="orange" size={32} />`}
      >
        <div className="flex w-full flex-col gap-4">
          <div className="flex flex-wrap items-end gap-4">
            {(["navy", "orange", "light", "sunset"] as const).map((variant) => (
              <KavehAppIcon key={variant} variant={variant} size={128} label={`Kaveh ${variant} large`} />
            ))}
            <span className="text-xs text-foreground-muted">128px</span>
          </div>
          {(["rounded", "square", "circle"] as const).map((shape) => (
            <div key={shape} className="flex flex-wrap items-end gap-4">
              {(["navy", "orange", "light", "sunset"] as const).map((variant) => (
                <KavehAppIcon key={variant} variant={variant} shape={shape} label={`Kaveh ${variant} ${shape}`} />
              ))}
              <KavehAppIcon variant="navy" shape={shape} size={40} label="" />
              <KavehAppIcon variant="navy" shape={shape} size={24} label="" />
              <span className="text-xs text-foreground-muted">{shape}</span>
            </div>
          ))}
        </div>
      </Example>
      <Example
        title="KavehSeal"
        description="A round heritage seal, the anchor over KMS, for stamps, certificates and social avatars, in four colorways. outline is one color (currentColor) for rubber stamps and embossing."
        code={`<KavehSeal variant="navy" />
<KavehSeal variant="orange" />
<KavehSeal variant="light" />
<KavehSeal variant="outline" className="text-[#295097]" />`}
      >
        <div className="flex w-full flex-wrap items-center gap-6 rounded-lg bg-white p-6">
          <KavehSeal variant="navy" size={104} />
          <KavehSeal variant="orange" size={104} />
          <KavehSeal variant="light" size={104} />
          <KavehSeal variant="outline" size={104} className="text-[#295097]" />
          <KavehSeal variant="outline" size={104} className="text-[#c44e00]" />
        </div>
      </Example>
    </>
  );
}

const harbour =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1f3f"/><stop offset=".6" stop-color="#295097"/><stop offset="1" stop-color="#f37537"/></linearGradient></defs><rect width="200" height="200" fill="url(#s)"/><circle cx="140" cy="128" r="22" fill="#ffb35c"/><g fill="#081430"><rect x="34" y="50" width="6" height="100"/><path d="M37 50h90v6H37z"/><rect x="110" y="56" width="2" height="30"/><rect y="146" width="200" height="54"/></g></svg>`,
  );

export function KavehElementsExamples() {
  return (
    <>
      <Example
        title="HorizonDivider"
        description="The brand's 3px orange rule from the anchor's stock. Put it under a headline, between an image and its caption, or across a footer. Add the drop or a navy wave for hero sections."
        code={`<HorizonDivider length="6rem" />
<HorizonDivider drop length="10rem" />
<HorizonDivider wave />`}
      >
        <div className="flex w-full flex-col gap-6">
          <div>
            <p className="font-display text-2xl font-bold">Trusted at every port.</p>
            <HorizonDivider length="6rem" className="mt-3" />
          </div>
          <HorizonDivider drop length="10rem" />
          <HorizonDivider wave />
        </div>
      </Example>
      <Example
        title="Divider variants"
        description="solid, double (orange over a thin navy line, for footers and certificates), fade (for headings) and dashed (for timelines and routes). Pass children to set a label in the middle."
        code={`<HorizonDivider variant="double" />
<HorizonDivider variant="fade" length="16rem" />
<HorizonDivider variant="dashed" />
<HorizonDivider>Since 1948</HorizonDivider>`}
      >
        <ThemeProvider theme="kaveh" mode="light" className="min-h-0! flex w-full flex-col gap-5 rounded-lg bg-surface p-5">
          {(["solid", "double", "fade", "dashed"] as const).map((variant) => (
            <div key={variant} className="flex items-center gap-4">
              <span className="w-16 shrink-0 text-xs text-foreground-muted">{variant}</span>
              <HorizonDivider variant={variant} />
            </div>
          ))}
          <HorizonDivider>Since 1948</HorizonDivider>
          <HorizonDivider variant="double" lang="fa">
            تأسیس ۱۳۲۷
          </HorizonDivider>
        </ThemeProvider>
      </Example>
      <Example
        title="Tideband"
        description="The periwinkle tagline band from the heritage logo, for section labels and data strips. It fades toward the inline end, so it mirrors in RTL."
        code={`<Tideband end="خدمات بندری">Port services</Tideband>
<Tideband tone="dark">Fleet status · 24/7</Tideband>`}
      >
        <div className="grid w-full gap-3">
          <div className="grid gap-3 rounded-lg bg-white p-4">
            <Tideband
              end={
                <span lang="fa" dir="rtl">
                  خدمات بندری
                </span>
              }
            >
              Port services
            </Tideband>
            <div dir="rtl" lang="fa">
              <Tideband>خدمات بندری و دریایی</Tideband>
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "#0b1f3f" }}>
            <Tideband tone="dark">Fleet status · 24/7</Tideband>
          </div>
        </div>
      </Example>
      <Example
        title="Band tones and sizes"
        description="orange is the campaign band (navy text on a warm fade); solid is a navy strip with an orange edge for table and section headers. Sizes sm, md and lg."
        code={`<Tideband tone="orange" size="sm">Yalda offer</Tideband>
<Tideband tone="solid" size="lg" end="۱۲ شناور">Vessels in port</Tideband>`}
      >
        <div className="grid w-full gap-3 rounded-lg bg-white p-4">
          <Tideband tone="orange" size="sm">
            Yalda offer · until 1 Dey
          </Tideband>
          <Tideband tone="orange">Nowruz holiday hours</Tideband>
          <Tideband tone="solid" size="lg" end={<span lang="fa" dir="rtl">۱۲ شناور</span>}>
            Vessels in port
          </Tideband>
          <Tideband size="sm">Shahid Rajaee · Berth 12</Tideband>
          <Tideband size="lg">Port and Marine Services</Tideband>
        </div>
      </Example>
      <Example
        title="PortholeFrame"
        description="A circular frame from the anchor's ring: a navy rim with four orange bolts, for crew portraits and vessel photos."
        code={`<PortholeFrame src={photo} alt="Shahid Rajaee port at dusk" size={160} />`}
      >
        <PortholeFrame src={harbour} alt="Shahid Rajaee port at dusk" size={160} />
        <PortholeFrame src={harbour} alt="Cranes at dusk" size={96} />
        <PortholeFrame src={harbour} alt="Harbour" size={56} ringColor="#f37537" />
      </Example>
      <Example
        title="Porthole variants"
        description="navy, orange, double (navy rim in an orange ring) and thin (no bolts, for dense lists). badge pins a status dot or flag to the bottom end."
        code={`<PortholeFrame variant="double" src={photo} alt="Captain" />
<PortholeFrame variant="thin" size={48} src={photo} alt="Pilot" badge={<StatusDot />} />`}
      >
        {(["navy", "orange", "double", "thin"] as const).map((variant) => (
          <div key={variant} className="flex flex-col items-center gap-2">
            <PortholeFrame
              variant={variant}
              src={harbour}
              alt={`Harbour, ${variant} frame`}
              size={variant === "thin" ? 72 : 112}
              badge={variant === "thin" ? <span className="block size-4 rounded-full border-2 border-white bg-[#18a5a7]" aria-hidden /> : undefined}
            />
            <span className="text-xs text-foreground-muted">{variant}</span>
          </div>
        ))}
      </Example>
    </>
  );
}

export function VesselStatusExamples() {
  return (
    <>
      <Example
        title="VesselStatusBadge"
        description="The status on its own, for tables and maps: soft, solid, outline or dot. Always written out, never color alone."
        code={`<VesselStatusBadge status="berthing" />
<VesselStatusBadge status="berthed" variant="solid" />
<VesselStatusBadge status="delayed" variant="outline" />
<VesselStatusBadge status="underway" variant="dot" label="در حرکت" />`}
      >
        <ThemeProvider theme="kaveh" mode="light" className="min-h-0! grid w-full gap-3 rounded-lg bg-surface p-4">
          {(["soft", "solid", "outline", "dot"] as const).map((variant) => (
            <div key={variant} className="flex flex-wrap items-center gap-2">
              <span className="w-14 text-xs text-foreground-muted">{variant}</span>
              {(["underway", "berthing", "berthed", "anchored", "delayed"] as const).map((status) => (
                <VesselStatusBadge key={status} status={status} variant={variant} />
              ))}
            </div>
          ))}
        </ThemeProvider>
      </Example>
    </>
  );
}

export function KavehLayoutExamples() {
  const nav = (
    <>
      <a href="#/components/kaveh-layout" aria-current="page">
        Services
      </a>
      <a href="#/components/kaveh-layout">Ports</a>
      <a href="#/components/kaveh-layout">Fleet</a>
      <a href="#/components/kaveh-layout">About</a>
    </>
  );
  return (
    <>
      <Example
        title="KavehHeader"
        description={`Logo, centered pill navigation and actions, with the orange Horizon glowing along the bottom edge. Mark the current page with aria-current="page". light sits on page backgrounds, navy is the brand bar, glass floats over imagery and transparent goes straight onto a hero photo. On the dark variants, ghost, outline and glass buttons turn white.`}
        code={`<KavehHeader nav={<Links />} actions={<Button size="sm">Track a vessel</Button>} />
<KavehHeader variant="navy" nav={<Links />} />
<KavehHeader variant="glass" nav={<Links />} />
<KavehHeader variant="transparent" />

// Links: <a href="/services" aria-current="page">Services</a> …`}
      >
        <ThemeProvider theme="kaveh" mode="light" className="min-h-0! grid w-full gap-4">
          <KavehHeader
            variant="light"
            nav={nav}
            actions={
              <>
                <Button size="sm" variant="ghost">
                  فارسی
                </Button>
                <Button size="sm">Track a vessel</Button>
              </>
            }
            className="rounded-xl"
          />
          <KavehHeader
            variant="navy"
            nav={nav}
            actions={
              <>
                <Button size="sm" variant="ghost">
                  Sign in
                </Button>
                <Button size="sm">Request a quote</Button>
              </>
            }
            className="rounded-xl"
          />
          <div className="relative overflow-hidden rounded-xl p-3" style={{ background: "radial-gradient(ellipse at top left, #295097, #0b1f3f 70%, #f37537 140%)", minHeight: 150 }}>
            <KavehHeader variant="glass" nav={nav} actions={<Button size="sm" variant="glass">Client portal</Button>} className="rounded-xl" />
          </div>
          <div className="relative overflow-hidden rounded-xl" style={{ background: "linear-gradient(180deg,#295097,#0b1f3f 60%,#f37537 140%)", height: 140 }}>
            <KavehHeader variant="transparent" nav={nav} logo={<KavehLogo layout="badge" tone="reversed" size={30} />} actions={<Button size="sm" variant="outline">Contact</Button>} />
          </div>
          <div dir="rtl" lang="fa">
            <KavehHeader
              logo={<KavehLogo layout="persian" size={30} tagline={false} />}
              nav={
                <>
                  <a href="#/components/kaveh-layout" aria-current="page">
                    خدمات
                  </a>
                  <a href="#/components/kaveh-layout">بنادر</a>
                  <a href="#/components/kaveh-layout">ناوگان</a>
                </>
              }
              actions={<Button size="sm">درخواست قیمت</Button>}
              className="rounded-xl"
            />
          </div>
        </ThemeProvider>
      </Example>
      <Example
        title="BilingualHeading"
        description="A section heading in English and Persian with the Horizon. stacked puts the Persian under the English, split sets them at opposite ends over a fading rule, centered is for landing pages."
        code={`<BilingualHeading eyebrow="Services" title="Port services" titleFa="خدمات بندری" />
<BilingualHeading variant="split" title="Our fleet" titleFa="ناوگان ما" />
<BilingualHeading variant="centered" size="lg" title="Since 1948" titleFa="از سال ۱۳۲۷" />`}
      >
        <ThemeProvider theme="kaveh" mode="light" className="min-h-0! grid w-full gap-8 rounded-lg bg-surface p-6">
          <BilingualHeading eyebrow="Services" title="Port services" titleFa="خدمات بندری" />
          <BilingualHeading variant="split" size="sm" title="Our fleet" titleFa="ناوگان ما" />
          <BilingualHeading variant="centered" size="lg" eyebrow="Kaveh Port & Marine Services" title="Since 1948" titleFa="از سال ۱۳۲۷ در کنار دریا" />
        </ThemeProvider>
      </Example>
      <Example
        title="BrandStat"
        description="Headline figures with the Horizon: navy and orange figures on the page, inverse on a navy panel, tile in a tinted card. Add labelFa for the Persian label."
        code={`<BrandStat value="78" label="years of service" labelFa="سال خدمت" />
<BrandStat variant="orange" value="24/7" label="port operations" />
<BrandStat variant="inverse" value="4" label="major Gulf ports" />
<BrandStat variant="tile" value="1,200+" label="vessel calls a year" />`}
      >
        <ThemeProvider theme="kaveh" mode="light" className="min-h-0! grid w-full gap-6 rounded-lg bg-surface p-6 sm:grid-cols-2 lg:grid-cols-4">
          <BrandStat value="78" label="years of service" labelFa="سال خدمت" />
          <BrandStat variant="orange" value="24/7" label="port operations" labelFa="عملیات شبانه‌روزی" />
          <BrandStat variant="inverse" value="4" label="major Gulf ports" labelFa="بندر اصلی" />
          <BrandStat variant="tile" value="1,200+" label="vessel calls a year" labelFa="پهلوگیری در سال" />
        </ThemeProvider>
        <p className="text-xs text-foreground-muted">Figures are sample copy.</p>
      </Example>
    </>
  );
}
