import { RadarChart, ScatterChart } from "@darkalpha/nova-ui/experimental";
import { Example } from "../docs/kit.tsx";

const vessels = [
  { name: "Alvand Voyager", draft: 12.5, teu: 8000, dwt: 90_000, line: "Gulf" },
  { name: "Zagros Pioneer", draft: 9.8, teu: 4200, dwt: 51_000, line: "Caspian" },
  { name: "Damavand Star", draft: 14.2, teu: 13_000, dwt: 140_000, line: "Gulf" },
  { name: "Caspian Breeze", draft: 7.4, teu: 1800, dwt: 22_000, line: "Caspian" },
  { name: "Persian Gulf Pride", draft: 13.1, teu: 10_500, dwt: 118_000, line: "Gulf" },
  { name: "Kish Runner", draft: 8.9, teu: 3100, dwt: 38_000, line: "Coastal" },
  { name: "Hormuz Light", draft: 11.2, teu: 6600, dwt: 76_000, line: "Coastal" },
  { name: "Sahand", draft: 10.4, teu: 5200, dwt: 61_000, line: "Caspian" },
];

const terminals = [
  { metric: "Throughput", bandar: 92, bushehr: 61, chabahar: 48 },
  { metric: "Berth depth", bandar: 85, bushehr: 55, chabahar: 90 },
  { metric: "Rail access", bandar: 70, bushehr: 82, chabahar: 35 },
  { metric: "Storage", bandar: 66, bushehr: 74, chabahar: 58 },
  { metric: "Turnaround", bandar: 58, bushehr: 69, chabahar: 77 },
  { metric: "Customs speed", bandar: 81, bushehr: 63, chabahar: 72 },
];

export function ScatterChartExamples() {
  return (
    <>
      <Example
        title="ScatterChart"
        description="Two numbers per item: x and y name the fields. group colors the points and adds a legend; pointLabel names each point in the tooltip and table. Arrow keys step through the points in x order."
        code={`<ScatterChart
  label="Draft and capacity by vessel"
  data={vessels} x="draft" y="teu" group="line" pointLabel="name"
  xLabel="Draft (m)" yLabel="Capacity (TEU)"
/>`}
      >
        <ScatterChart label="Draft and capacity by vessel" data={vessels} x="draft" y="teu" group="line" pointLabel="name" xLabel="Draft (m)" yLabel="Capacity (TEU)" />
      </Example>
      <Example
        title="Bubbles"
        description="size scales each point's area with a third value. Keep bubbles few; overlapping ones get hard to read."
        code={`<ScatterChart label="…" data={vessels} x="draft" y="teu" size="dwt" pointLabel="name" formatSize={(v) => \`\${v / 1000}k t\`} />`}
      >
        <ScatterChart
          label="Draft, capacity and deadweight"
          data={vessels}
          x="draft"
          y="teu"
          size="dwt"
          pointLabel="name"
          xLabel="Draft (m)"
          yLabel="Capacity (TEU)"
          formatSize={(v) => `${(v / 1000).toLocaleString()}k t`}
          labels={{ size: "Deadweight" }}
        />
      </Example>
    </>
  );
}

export function RadarChartExamples() {
  return (
    <Example
      title="RadarChart"
      description="Several measures for a few items at once: one spoke per row (index names it), one polygon per series, all from zero at the center. Use 3–8 spokes on the same scale, and 1–3 series; beyond that, a BarChart reads better."
      code={`<RadarChart
  label="Terminal comparison (score out of 100)"
  data={terminals} index="metric"
  series={[
    { key: "bandar", label: "Bandar Abbas" },
    { key: "bushehr", label: "Bushehr" },
    { key: "chabahar", label: "Chabahar" },
  ]}
/>`}
    >
      <RadarChart
        label="Terminal comparison (score out of 100)"
        data={terminals}
        index="metric"
        series={[
          { key: "bandar", label: "Bandar Abbas" },
          { key: "bushehr", label: "Bushehr" },
          { key: "chabahar", label: "Chabahar" },
        ]}
      />
    </Example>
  );
}
