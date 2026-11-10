import { Text, ThemeProvider, toast } from "@darkalpha/nova-ui";
import { Scheduler, type SchedulerEvent } from "@darkalpha/nova-ui/experimental";
import { useState } from "react";
import { Example } from "../docs/kit.tsx";

/** Sample events around today, so the demo is never empty. */
function sampleEvents(): SchedulerEvent[] {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  const at = (dayOffset: number, h: number, m = 0) => {
    const d = new Date(base);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(h, m);
    return d;
  };
  return [
    { id: "1", title: "Damavand Star berthing", start: at(0, 9), end: at(0, 11, 30) },
    { id: "2", title: "Customs inspection", start: at(0, 10), end: at(0, 12) },
    { id: "3", title: "Pilot briefing", start: at(0, 14), end: at(0, 15) },
    { id: "4", title: "Crew change", start: at(0, 16), end: at(0, 17) },
    { id: "5", title: "Bunkering, Zagros Pioneer", start: at(1, 8), end: at(1, 10) },
    { id: "6", title: "Berth 4 maintenance", start: at(2, 0), end: at(4, 0), allDay: true },
    { id: "7", title: "Alvand Voyager arrival", start: at(3, 6, 30), end: at(3, 8) },
    { id: "8", title: "Safety drill", start: at(-2, 11), end: at(-2, 12) },
    { id: "9", title: "Port authority meeting", start: at(6, 13), end: at(6, 14, 30) },
  ];
}

export function SchedulerExamples() {
  const [events] = useState(sampleEvents);
  const [picked, setPicked] = useState<string>("nothing yet");
  return (
    <>
      <Example
        title="Scheduler"
        description="Month, week and day views of the same events. In month view, arrows move between days (PageUp/PageDown change month), Enter picks the day, and Tab reaches its events. Week and day views place events on an hour grid, side by side when they overlap, with all-day events on top."
        code={`<Scheduler
  label="Berth schedule"
  events={events}            // { id, title, start, end, allDay?, color? }
  onEventClick={(event) => open(event.id)}
  onSlotClick={(start) => create(start)}
/>`}
      >
        <div className="flex w-full flex-col gap-2">
          <Scheduler
            label="Berth schedule"
            events={events}
            onEventClick={(event) => setPicked(event.title)}
            onSlotClick={(start) => setPicked(start.toLocaleString())}
          />
          <Text size="sm" tone="muted">
            Picked: {picked}
          </Text>
        </div>
      </Example>

      <Example
        title="Persian calendar"
        description="Under a fa-IR ThemeProvider the scheduler uses the Jalali calendar, a Saturday week start, the Friday weekend and Persian digits. Pass labels for the toolbar text."
        code={`<ThemeProvider locale="fa-IR" dir="rtl">
  <Scheduler label="برنامه اسکله" events={events} labels={{ today: "امروز", month: "ماه", week: "هفته", day: "روز" }} />
</ThemeProvider>`}
      >
        <ThemeProvider locale="fa-IR" dir="rtl" className="w-full">
          <Scheduler
            label="برنامه اسکله"
            events={events}
            defaultView="week"
            onEventClick={(event) => toast(event.title)}
            labels={{ today: "امروز", previous: "قبلی", next: "بعدی", view: "نما", month: "ماه", week: "هفته", day: "روز", allDay: "تمام روز", more: (n) => `+${n.toLocaleString("fa")} مورد دیگر`, events: (n) => `${n.toLocaleString("fa")} رویداد` }}
          />
        </ThemeProvider>
      </Example>
    </>
  );
}
