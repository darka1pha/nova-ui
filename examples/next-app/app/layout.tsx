import { ThemeProvider, ThemeScript, Toaster } from "@darkalpha/nova-ui";
import "@darkalpha/nova-ui/styles.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Nova UI on Next.js",
  description: "Nova UI components in the Next.js App Router, rendered on the server.",
};

const storageKey = "nova-next-mode";

// A Server Component. ThemeProvider and Toaster are client components ("use client"
// ships in the package), so they can be rendered here directly with plain props.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // ThemeScript sets the stored light/dark mode on <html> before React hydrates.
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript storageKey={storageKey} />
      </head>
      <body style={{ margin: 0 }}>
        <ThemeProvider theme="vibrant" storageKey={storageKey} defaultMode="system" motionStyle="expressive" style={{ minHeight: "100dvh" }}>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
