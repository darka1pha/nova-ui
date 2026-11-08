import { Button, Card, ThemeProvider } from "@darkalpha/nova-ui";
import {
  BilingualHeading,
  HaftSeen,
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
} from "@darkalpha/nova-ui/kaveh";
import { FileText, Fuel, Ship } from "lucide-react";

const nav = (
  <>
    <a href="#/seasonal-pages" aria-current="page">
      Nowruz
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

/** A Nowruz campaign page for Kaveh: the kaveh-nowruz preset in light mode, from header to footer. */
export function NowruzPageBlock() {
  return (
    <ThemeProvider
      theme="kaveh-nowruz"
      mode="light"
      className="min-h-0! bg-background text-foreground"
    >
      <KavehHeader
        variant="light"
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
        {/* Spring blossom across the whole page, kept faint under the content. */}
        <SeasonalPattern
          pattern="blossom"
          color={seasonalColors.blossom}
          opacity={0.3}
          className="-z-10"
        />
        <div className="mx-auto grid max-w-6xl gap-14 px-4 py-8 sm:px-8 sm:py-10">
          <SeasonalGreeting
            season="nowruz"
            layout="banner"
            eyebrow="Nowruz 1406 · ۱ فروردین"
            description="A new year begins with the spring. From all of us at Kaveh: thank you for a year at sea together, and may the new one bring calm water."
            action={<Button>See holiday hours</Button>}
            logo={<KavehLogo size={26} tagline={false} tone="brand" />}
          />

          <KavehNotice
            variant="info"
            title="Nowruz operations"
            titleFa="خدمات در تعطیلات نوروز"
            action={
              <Button size="sm" variant="outline">
                Download the schedule
              </Button>
            }
          >
            From 21 March to 2 April our port desks work reduced hours. Book
            clearance and bunkering before 20 March to avoid holiday delays.
          </KavehNotice>

          <section className="grid gap-6">
            <BilingualHeading
              eyebrow="Tradition"
              title="The Haft-Seen table"
              titleFa="سفرهٔ هفت‌سین"
            />
            <Card
              variant="outline"
              className="relative isolate overflow-hidden p-6"
            >
              <SeasonalPattern
                pattern="girih"
                color={seasonalColors.firouzeh}
                opacity={0.1}
                className="-z-10"
              />
              <HaftSeen labels="both" extras itemSize={56} className="w-full" />
            </Card>
          </section>

          <section className="grid gap-6">
            <BilingualHeading
              eyebrow="New year"
              title="Start the year on schedule"
              titleFa="سال نو را به‌موقع آغاز کنید"
            />
            <div className="grid gap-4 md:grid-cols-3">
              <KavehServiceCard
                icon={<Ship />}
                title="Ship agency"
                titleFa="نمایندگی کشتیرانی"
                description="Port calls and crew change, with a holiday duty team."
                href="#/seasonal-pages"
              />
              <KavehServiceCard
                icon={<FileText />}
                title="Clearance"
                titleFa="ترخیص"
                description="File by 20 March and clear before the new year."
                href="#/seasonal-pages"
                variant="tinted"
              />
              <KavehServiceCard
                icon={<Fuel />}
                title="Bunkering"
                titleFa="سوخت‌رسانی"
                description="Fuel at anchorage through the holiday, booked 72 hours ahead."
                href="#/seasonal-pages"
                variant="navy"
              />
            </div>
          </section>

          <section className="grid items-center gap-8 md:grid-cols-2">
            <div className="grid gap-6">
              <BilingualHeading
                eyebrow="Holiday schedule"
                title="Through the Nowruz holiday"
                titleFa="برنامهٔ تعطیلات نوروز"
              />
              <KavehTimeline
                current={1}
                items={[
                  {
                    year: "20 Mar",
                    yearFa: "۲۹ اسفند",
                    title: "Last bookings",
                    description:
                      "Clearance and bunkering requests before 14:00.",
                  },
                  {
                    year: "21 Mar",
                    yearFa: "۱ فروردین",
                    title: "Nowruz",
                    description:
                      "Reduced hours; the operations line stays open.",
                  },
                  {
                    year: "2 Apr",
                    yearFa: "۱۳ فروردین",
                    title: "Sizdah Bedar",
                    description: "Offices closed; vessel tracking only.",
                  },
                  {
                    year: "3 Apr",
                    yearFa: "۱۴ فروردین",
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
                pattern="tide"
                color={seasonalColors.firouzeh}
                opacity={0.14}
                className="-z-10"
              />
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary-text">
                Saadi
              </p>
              <PersianVerse
                lines={["برخیز که می‌رود زمستان", "بگشای در سرای بستان"]}
                translation="Rise, for winter is leaving: open the door to the garden."
                attribution="Saadi"
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
        legal="© 2027 Kaveh Port & Marine Services · نوروز مبارک"
      />
    </ThemeProvider>
  );
}
