import {
  BilingualHeading,
  Button,
  Card,
  KavehFooter,
  KavehHeader,
  KavehLogo,
  KavehNotice,
  KavehServiceCard,
  KavehTimeline,
  PersianVerse,
  SeasonalGreeting,
  SeasonalPattern,
  seasonalColors,
  ThemeProvider,
  yaldaMotifs,
} from "@darkalpha/nova-ui";
import { FileText, Fuel, Ship } from "lucide-react";

const nav = (
  <>
    <a href="#/seasonal-pages" aria-current="page">
      Yalda
    </a>
    <a href="#/seasonal-pages">Services</a>
    <a href="#/seasonal-pages">Ports</a>
    <a href="#/seasonal-pages">Contact</a>
  </>
);

const footerColumns = [
  {
    title: "Services",
    links: [
      { label: "Ship agency", href: "#/seasonal-pages" },
      { label: "Clearance", href: "#/seasonal-pages" },
      { label: "Bunkering", href: "#/seasonal-pages" },
    ],
  },
  {
    title: "Ports",
    links: [
      { label: "Shahid Rajaee", href: "#/seasonal-pages" },
      { label: "Bushehr", href: "#/seasonal-pages" },
      { label: "Chabahar", href: "#/seasonal-pages" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#/seasonal-pages" },
      { label: "Careers", href: "#/seasonal-pages" },
      { label: "Contact", href: "#/seasonal-pages" },
    ],
  },
];

/** A Yalda campaign page for Kaveh: the kaveh-yalda preset in dark mode, from header to footer. */
export function YaldaPageBlock() {
  return (
    <ThemeProvider
      theme="kaveh-yalda"
      mode="dark"
      className="min-h-0! bg-background text-foreground"
    >
      <KavehHeader
        variant="navy"
        nav={nav}
        actions={
          <>
            <Button size="sm" variant="ghost">
              فارسی
            </Button>
            <Button size="sm">Request a quote</Button>
          </>
        }
      />

      <div className="relative isolate">
        {/* The night sky behind the whole page: Yalda stars in candle amber, kept faint under the content. */}
        <SeasonalPattern
          pattern="yalda-stars"
          color={seasonalColors.ember}
          opacity={0.14}
          className="-z-10"
        />
        <div className="mx-auto grid max-w-6xl gap-14 px-4 py-8 sm:px-8 sm:py-10">
          <SeasonalGreeting
            season="yalda"
            layout="banner"
            eyebrow="Yalda 1405 · ۳۰ آذر"
            description="On the longest night of the year, the whole Kaveh crew thanks you for sailing with us. Our operations line stays open through the night."
            action={<Button>See holiday hours</Button>}
            logo={<KavehLogo size={26} tagline={false} tone="reversed" />}
          />

          <KavehNotice
            variant="campaign"
            title="Yalda holiday hours"
            titleFa="ساعات کاری شب یلدا"
            action={
              <Button size="sm" variant="outline">
                Download the schedule
              </Button>
            }
          >
            Bandar Abbas, Bushehr and Chabahar desks close at 18:00 on Monday 21
            December. The 24/7 operations line and vessel tracking stay open.
          </KavehNotice>

          <section className="relative isolate grid gap-6 overflow-hidden rounded-xl border border-border p-6">
            <SeasonalPattern
              pattern="pomegranate-seeds"
              color={seasonalColors.seed}
              opacity={0.12}
              className="-z-10"
            />
            <BilingualHeading
              eyebrow="Tradition"
              title="The Yalda table"
              titleFa="سفرهٔ یلدا"
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {yaldaMotifs.map(
                ({ name, component: Motif, label, labelFa, meaning }) => (
                  <Card key={name} className="flex-row items-center gap-4 p-4">
                    <Motif size={64} className="shrink-0" />
                    <div className="min-w-0">
                      <p className="font-display font-bold">{label}</p>
                      <p className="text-sm text-secondary-text">
                        <span lang="fa" dir="rtl">
                          {labelFa}
                        </span>
                      </p>
                      <p className="mt-1 text-sm text-foreground-muted">
                        {meaning}
                      </p>
                    </div>
                  </Card>
                ),
              )}
            </div>
          </section>

          <section className="grid gap-6">
            <BilingualHeading
              eyebrow="Winter season"
              title="Services through the long nights"
              titleFa="خدمات در شب‌های بلند زمستان"
            />
            <div className="grid gap-4 md:grid-cols-3">
              <KavehServiceCard
                icon={<Ship />}
                title="Ship agency"
                titleFa="نمایندگی کشتیرانی"
                description="Port calls and crew change, staffed through Yalda night."
                href="#/seasonal-pages"
              />
              <KavehServiceCard
                icon={<FileText />}
                title="Clearance"
                titleFa="ترخیص"
                description="File by 20 December and clear before the holiday."
                href="#/seasonal-pages"
                variant="tinted"
              />
              <KavehServiceCard
                icon={<Fuel />}
                title="Bunkering"
                titleFa="سوخت‌رسانی"
                description="Winter fuel at anchorage, booked 48 hours ahead."
                href="#/seasonal-pages"
                variant="navy"
              />
            </div>
          </section>

          <section className="grid items-center gap-8 md:grid-cols-2">
            <div className="grid gap-6">
              <BilingualHeading
                eyebrow="Holiday schedule"
                title="Around Yalda night"
                titleFa="برنامهٔ تعطیلات"
              />
              <KavehTimeline
                current={1}
                items={[
                  {
                    year: "20 Dec",
                    yearFa: "۲۹ آذر",
                    title: "Last bookings",
                    description:
                      "Clearance and bunkering requests before 16:00.",
                  },
                  {
                    year: "21 Dec",
                    yearFa: "۳۰ آذر",
                    title: "Yalda night",
                    description: "Desks close at 18:00; operations line open.",
                  },
                  {
                    year: "22 Dec",
                    yearFa: "۱ دی",
                    title: "Full service",
                    description: "All ports back to normal hours.",
                  },
                ]}
              />
            </div>
            <Card
              variant="outline"
              className="relative isolate gap-4 overflow-hidden p-6"
            >
              <SeasonalPattern
                pattern="girih"
                color={seasonalColors.ember}
                opacity={0.1}
                className="-z-10"
              />
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary-text">
                Fal-e Hafez
              </p>
              <PersianVerse
                lines={[
                  "صبح امید که بُد معتکف پردهٔ غیب",
                  "گو برون آی که کار شب تار آخر شد",
                ]}
                translation="Morning of hope, so long behind the veil: come out, for the dark night is over."
                attribution="Hafez"
              />
            </Card>
          </section>
        </div>
      </div>

      <KavehFooter
        columns={footerColumns}
        contact={
          <>
            Bandar Abbas, Iran
            <br />
            +98 76 0000 0000
          </>
        }
        legal="© 2026 Kaveh Port & Marine Services · یلدا مبارک"
      />
    </ThemeProvider>
  );
}
