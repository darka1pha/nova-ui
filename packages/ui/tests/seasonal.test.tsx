import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  HaftSeen,
  haftSeenItems,
  HorizonDivider,
  KavehEmblem,
  KavehLogo,
  KavehMark,
  KavehSeal,
  KavehWordmark,
  KmsMonogram,
  PortholeFrame,
  Tideband,
  PersianVerse,
  Pomegranate,
  presets,
  SeasonalGreeting,
  SeasonalPattern,
  seasonalPatternUrl,
  ThemeProvider,
  Watermelon,
  yaldaMotifs,
} from "../src/index.ts";
import { axeViolations } from "./axe.ts";

describe("seasonal presets", () => {
  it("ships Yalda and Nowruz variants of the Kaveh theme", () => {
    expect(presets["kaveh-yalda"].id).toBe("kaveh-yalda");
    expect(presets["kaveh-yalda"].preferredMode).toBe("dark");
    expect(presets["kaveh-nowruz"].id).toBe("kaveh-nowruz");
  });

  it("leads with orange, navy beside it, in every Kaveh preset", () => {
    for (const id of ["kaveh", "kaveh-yalda", "kaveh-nowruz"] as const) {
      expect(presets[id].colors.primary).toBe("#f37537");
      expect(presets[id].colors.secondary).toBe("#295097");
      // Navy text on orange: white on Kaveh orange is only 2.9:1.
      expect(presets[id].overrides?.light?.["primary-on-solid"]).toBe("#0b1f3f");
      expect(presets[id].overrides?.light?.["chart-1"]).toBe("#f37537");
      expect(presets[id].overrides?.light?.["chart-2"]).toBe("#295097");
      // Navy carries text, links and dark fills so it is on screen next to the orange.
      expect(presets[id].overrides?.light?.["primary-text"]).toBe("#295097");
      expect(presets[id].overrides?.light?.["neutral-solid"]).toBe("#295097");
      expect(presets[id].overrides?.dark?.["neutral-solid"]).toBe("#295097");
      // Hover and press brighten the orange rather than darken it, in both modes.
      for (const mode of ["light", "dark"] as const) {
        expect(presets[id].overrides?.[mode]?.["primary-solid-hover"]).toBe("#ff8349");
        expect(presets[id].overrides?.[mode]?.["primary-solid-active"]).toBe("#ff8f5c");
      }
    }
  });
});

describe("Kaveh logo", () => {
  it("is one named image with an optional Persian name", () => {
    render(<KavehLogo persian />);
    const logo = screen.getByRole("img", { name: "Kaveh Port & Marine Services" });
    expect(logo.querySelector(".nv-kaveh-wordmark")).not.toBeNull();
    expect(within(logo).getByText("خدمات بندری و دریایی کاوه")).toHaveAttribute("dir", "rtl");
    // The inner mark is decorative so the lockup is announced once.
    expect(logo.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("sizes the master-logo anchor by height and colors it by tone, with the white parts cut through a mask", () => {
    const { container } = render(
      <>
        <KavehMark tone="brand" size={44} />
        <KavehMark tone="reversed" size={44} />
      </>,
    );
    const [a, b] = [...container.querySelectorAll("svg")];
    expect(a).toHaveAttribute("height", "44");
    expect(a).toHaveAttribute("width", "55");
    // The silhouette is the first path outside the mask: filled and outlined in the tone's ink, and masked.
    const [pa, pb] = [a, b].map((svg) => svg!.querySelector(":scope > path")!);
    expect(pa).toHaveAttribute("fill", "#04287e");
    expect(pa).toHaveAttribute("stroke", "#04287e");
    expect(pa!.getAttribute("mask")).toMatch(/^url\(#nv-kaveh-anchor-/);
    expect(pb).toHaveAttribute("fill", "#ffffff");
    // Every anchor gets its own mask id.
    expect(a!.querySelector("mask")!.id).not.toBe(b!.querySelector("mask")!.id);
    render(<KavehMark title="Kaveh anchor" />);
    expect(screen.getByRole("img", { name: "Kaveh anchor" })).toBeInTheDocument();
  });

  it("renders the heritage lockup with both founding years and the tagline band", () => {
    render(<KavehLogo layout="heritage" tone="brand" />);
    const logo = screen.getByRole("img", { name: "Kaveh Port & Marine Services" });
    expect(within(logo).getByText("Since 1948")).toBeInTheDocument();
    expect(within(logo).getByText("تأسیس ۱۳۲۷")).toHaveAttribute("dir", "rtl");
    expect(within(logo).getByText("Port and Marine Services")).toBeInTheDocument();
    expect(within(logo).getByText("خدمات بندری و دریایی کاوه")).toBeInTheDocument();
  });

  it("names the monogram, wordmark, emblem and seal", () => {
    render(
      <>
        <KmsMonogram />
        <KavehWordmark />
        <KavehEmblem />
        <KavehSeal />
      </>,
    );
    for (const name of ["Kaveh", "Kaveh Marine Services (KMS)"]) expect(screen.getByRole("img", { name })).toBeInTheDocument();
    // The monogram and the seal are both named "KMS"; the seal no longer carries a founding year.
    expect(screen.getAllByRole("img", { name: "KMS" })).toHaveLength(2);
    expect(document.querySelector(".nv-kaveh-seal text")).toBeNull();
  });
});

describe("Kaveh brand pieces", () => {
  it("renders the porthole, tideband and horizon", () => {
    const { container } = render(
      <>
        <PortholeFrame src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="Harbour pilot" size={120} />
        <Tideband end="خدمات">Port services</Tideband>
        <HorizonDivider drop wave length="8rem" />
      </>,
    );
    expect(screen.getByRole("img", { name: "Harbour pilot" })).toBeInTheDocument();
    expect(screen.getByText("Port services")).toBeInTheDocument();
    expect((container.querySelector(".nv-horizon") as HTMLElement).style.width).toBe("8rem");
  });
});

describe("motifs", () => {
  it("are decorative by default and named when given a title", () => {
    const { container } = render(<Watermelon />);
    const svg = container.querySelector("svg")!;
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveClass("nv-motif-watermelon");

    render(<Pomegranate title="Pomegranate" size={40} />);
    const img = screen.getByRole("img", { name: "Pomegranate" });
    expect(img).toHaveAttribute("width", "40");
  });

  it("list every Yalda motif and the seven S items with Persian names", () => {
    expect(yaldaMotifs.map((m) => m.name)).toEqual(expect.arrayContaining(["pomegranate", "watermelon", "yalda-candle", "divan-of-hafez"]));
    const seven = haftSeenItems.filter((i) => i.seen);
    expect(seven).toHaveLength(7);
    for (const item of seven) expect(item.labelFa.startsWith("س")).toBe(true);
  });
});

describe("SeasonalGreeting", () => {
  it("renders the Yalda defaults with a labelled region", async () => {
    const { container } = render(
      <ThemeProvider theme="kaveh-yalda">
        <SeasonalGreeting season="yalda" description="Open through the longest night." action={<button type="button">Contact us</button>} />
      </ThemeProvider>,
    );
    const region = screen.getByRole("region", { name: "Happy Yalda" });
    expect(region).toHaveAttribute("data-season", "yalda");
    expect(within(region).getByText("یلدا مبارک")).toHaveAttribute("dir", "rtl");
    expect(within(region).getByRole("heading", { name: "Happy Yalda" })).toBeInTheDocument();
    expect(await axeViolations(container)).toEqual([]);
  });

  it("accepts custom copy, hides the English title and renders as a banner", () => {
    render(<SeasonalGreeting season="nowruz" layout="banner" titleFa="سالی نو، افقی تازه" title={null} aria-label="Nowruz campaign" />);
    const region = screen.getByRole("region", { name: "Nowruz campaign" });
    expect(within(region).getByText("سالی نو، افقی تازه")).toBeInTheDocument();
    expect(within(region).queryByRole("heading")).toBeNull();
  });
});

describe("HaftSeen", () => {
  it("shows the seven items, and the extras on request", () => {
    const { rerender } = render(<HaftSeen labels="both" />);
    expect(within(screen.getByRole("list", { name: "Haft-Seen" })).getAllByRole("listitem")).toHaveLength(7);
    expect(screen.getByText("سبزه")).toBeInTheDocument();
    expect(screen.getByText("Sabzeh")).toBeInTheDocument();
    rerender(<HaftSeen extras labels="none" />);
    expect(screen.getAllByRole("listitem")).toHaveLength(10);
    expect(screen.getByRole("img", { name: "Goldfish (ماهی قرمز)" })).toBeInTheDocument();
  });
});

describe("PersianVerse and patterns", () => {
  it("sets the verse right to left with its translation", () => {
    render(<PersianVerse lines={["صبح امید که بُد معتکف پردهٔ غیب", "گو برون آی که کار شب تار آخر شد"]} translation="Come out, the dark night is done." attribution="Hafez" />);
    expect(screen.getByText("گو برون آی که کار شب تار آخر شد").closest("blockquote")).toHaveAttribute("dir", "rtl");
    expect(screen.getByText(/Hafez/)).toBeInTheDocument();
  });

  it("builds pattern tiles as data URIs", () => {
    expect(seasonalPatternUrl("pomegranate-seeds", "#b3122e")).toMatch(/^url\("data:image\/svg\+xml,.*%23b3122e/);
    const { container } = render(<SeasonalPattern pattern="girih" opacity={0.1} />);
    const layer = container.firstElementChild as HTMLElement;
    expect(layer).toHaveAttribute("aria-hidden", "true");
    expect(layer.style.opacity).toBe("0.1");
  });
});
