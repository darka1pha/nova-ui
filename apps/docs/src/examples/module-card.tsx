import { ModuleCard, ThemeProvider, type ModuleCardTone } from "@darkalpha/nova-ui";
import { BillOfLading, Chart, Container, ContainerShip, Download, Settings } from "@darkalpha/nova-ui/icons";
import type { ReactNode } from "react";
import { Example } from "../docs/kit.tsx";

const modules = [
  { title: "واردات", description: "مدیریت عملیات واردات", tone: "teal", icon: <Download variant="soft" /> },
  { title: "صادرات", description: "مدیریت عملیات صادرات", tone: "blue", icon: <ContainerShip variant="soft" /> },
  { title: "کانتینر خالی", description: "مدیریت و تخصیص کانتینرهای خالی", tone: "violet", icon: <Container variant="soft" /> },
  { title: "تنظیمات و تعاریف", description: "مدیریت اطلاعات پایه و تنظیمات", tone: "sky", icon: <Settings variant="soft" /> },
  { title: "گزارش‌ها", description: "گزارش‌گیری و تحلیل داده‌ها", tone: "cyan", icon: <Chart variant="soft" /> },
  { title: "اسناد و مدارک", description: "مدیریت اسناد و مکاتبات", tone: "orange", icon: <BillOfLading variant="soft" /> },
] satisfies { title: string; description: string; tone: ModuleCardTone; icon: ReactNode }[];

const tones: ModuleCardTone[] = ["primary", "violet", "blue", "sky", "cyan", "teal", "mint", "green", "amber", "orange", "coral", "pink", "magenta"];

export function ModuleCardExamples() {
  return (
    <>
      <Example
        title="Module launcher"
        description="A grid of modules on a home screen. Each card is a link with its own tone; in right-to-left layouts the icon, wave and arrow mirror on their own."
        code={`<div dir="rtl" className="grid gap-4 md:grid-cols-3">
  <ModuleCard href="/imports" tone="teal" icon={<Download variant="soft" />} title="واردات" description="مدیریت عملیات واردات" />
  <ModuleCard href="/exports" tone="blue" icon={<ContainerShip variant="soft" />} title="صادرات" description="مدیریت عملیات صادرات" />
  …
</div>`}
      >
        <div dir="rtl" lang="fa" className="grid w-full gap-4 rounded-xl bg-[light-dark(#eef2fb,transparent)] p-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => (
            <ModuleCard key={m.title} href="#/components/module-card" tone={m.tone} icon={m.icon} title={m.title} description={m.description} />
          ))}
        </div>
      </Example>

      <Example
        title="Tones"
        description="primary follows the theme; the others are fixed palette hues, so a set of modules keeps its colors under any theme. Tint, wave and arrow all come from the tone and deepen in dark mode."
        code={`<ModuleCard tone="violet" icon={<Container variant="soft" />} title="Empty containers" description="Track and assign empty boxes" />`}
      >
        <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tones.map((tone) => (
            <ModuleCard key={tone} tone={tone} href="#/components/module-card" icon={<Container variant="soft" />} title={tone} description="Track and assign empty boxes" />
          ))}
        </div>
      </Example>

      <Example
        title="Waves"
        description="Each card draws its own corner wave: two layers of one or two hills that rise from the icon's side and come down onto the bottom part-way across. The shape is seeded by the title, so every module differs but never changes between renders. Pass wave a number or string to choose one, or wave={false} for none."
        code={`<ModuleCard title="Imports" />        // seeded by the title
<ModuleCard title="Imports" wave={3} /> // pick another wave
<ModuleCard title="Imports" wave={false} />`}
      >
        <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5].map((seed) => (
            <ModuleCard key={seed} tone="blue" wave={seed} icon={<ContainerShip variant="soft" />} title={`wave={${seed}}`} description="Same card, another seed" />
          ))}
          <ModuleCard tone="blue" wave={false} icon={<ContainerShip variant="soft" />} title="wave={false}" description="No wave" />
        </div>
      </Example>

      <Example
        title="Badge, size and state"
        description="badge puts a count or label in the corner. size=&quot;lg&quot; is for a hero row. Without href or onClick the card is static and drops the arrow; disabled dims it and blocks the link."
        code={`<ModuleCard href="/documents" tone="orange" badge="12" icon={<BillOfLading variant="soft" />} title="Documents" description="Bills of lading awaiting review" />
<ModuleCard size="lg" onClick={openReports} tone="cyan" icon={<Chart variant="soft" />} title="Reports" description="Throughput and dwell time" />
<ModuleCard tone="sky" icon={<Settings variant="soft" />} title="Settings" description="Static, no arrow" />
<ModuleCard href="/customs" disabled tone="green" icon={<Download variant="soft" />} title="Customs" description="Coming soon" />`}
      >
        <div className="grid w-full gap-4 md:grid-cols-2">
          <ModuleCard href="#/components/module-card" tone="orange" badge="12" icon={<BillOfLading variant="soft" />} title="Documents" description="Bills of lading awaiting review" />
          <ModuleCard size="lg" onClick={() => undefined} tone="cyan" icon={<Chart variant="soft" />} title="Reports" description="Throughput and dwell time" />
          <ModuleCard tone="sky" icon={<Settings variant="soft" />} title="Settings" description="Static, no arrow" />
          <ModuleCard href="#/components/module-card" disabled tone="green" badge="Soon" icon={<Download variant="soft" />} title="Customs" description="Coming soon" />
        </div>
      </Example>

      <Example
        title="Dark mode"
        description="In dark mode the tint mixes into the surface rather than glowing, so text keeps its contrast."
        code={`<ThemeProvider mode="dark">…</ThemeProvider>`}
      >
        <ThemeProvider mode="dark" className="min-h-0! w-full rounded-xl bg-background p-4">
          <div dir="rtl" lang="fa" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modules.slice(0, 3).map((m) => (
              <ModuleCard key={m.title} href="#/components/module-card" tone={m.tone} icon={m.icon} title={m.title} description={m.description} />
            ))}
          </div>
        </ThemeProvider>
      </Example>
    </>
  );
}
