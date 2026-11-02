"use client";

import { SegmentedControl, SegmentedControlItem, useTheme, type ModePreference } from "@darkalpha/nova-ui";

export function ModeToggle() {
  const { mode, setMode } = useTheme();
  return (
    <SegmentedControl aria-label="Color mode" value={mode} onValueChange={(v) => v && setMode(v as ModePreference)}>
      <SegmentedControlItem value="light">Light</SegmentedControlItem>
      <SegmentedControlItem value="dark">Dark</SegmentedControlItem>
      <SegmentedControlItem value="system">System</SegmentedControlItem>
    </SegmentedControl>
  );
}
