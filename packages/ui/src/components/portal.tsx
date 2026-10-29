"use client";

import { Portal as PortalPrimitive } from "radix-ui";
import type { ComponentPropsWithoutRef } from "react";
import { useOptionalTheme } from "../theme/theme-provider.tsx";

export type PortalProps = ComponentPropsWithoutRef<typeof PortalPrimitive.Root>;

/**
 * Renders children into the nearest ThemeProvider's portal host, so overlays
 * keep the theme, mode and direction of the place they were opened from.
 */
export function Portal({ container, ...props }: PortalProps) {
  const theme = useOptionalTheme();
  return <PortalPrimitive.Root container={container ?? theme?.portalContainer ?? undefined} {...props} />;
}

/** The container overlay primitives should portal into. */
export function usePortalContainer(): HTMLElement | undefined {
  return useOptionalTheme()?.portalContainer ?? undefined;
}
