import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  BilingualHeading,
  BrandStat,
  HorizonDivider,
  KavehAppIcon,
  KavehHeader,
  KavehLogo,
  KavehMark,
  KavehSeal,
  KmsMonogram,
  PortholeFrame,
  Tideband,
  VesselStatusBadge,
} from "../src/index.ts";
import { axeViolations } from "./axe.ts";

const pixel = "data:image/gif;base64,R0lGODlhAQABAAAAACw=";

describe("mark and monogram variants", () => {
  it("drops the anchor's inline in the solid variant", () => {
    const { container } = render(
      <>
        <KavehMark tone="brand" size={64} />
        <KavehMark tone="brand" size={64} variant="solid" />
      </>,
    );
    // The engraved mask cuts the inline along the silhouette and rings the large drop; the solid one only cuts the eye and small drop.
    const [engraved, solid] = [...container.querySelectorAll("svg")].map((svg) => svg.querySelectorAll("mask path").length);
    expect(engraved).toBe(4);
    expect(solid).toBe(2);
  });

  it("picks the anchor's detail by size: silhouette, then solid or engraved by screen density, then engraved", () => {
    const { container } = render(
      <>
        <KavehMark size={16} data-testid="glyph" />
        <KavehMark size={32} data-testid="density" />
        <KavehMark size={48} data-testid="engraved" />
        <KavehMark size={16} variant="engraved" data-testid="forced" />
      </>,
    );
    const q = (id: string) => container.querySelector(`[data-testid=${id}]`)!;
    // Under 20px: a plain silhouette, no mask at all.
    expect(q("glyph").querySelectorAll("mask")).toHaveLength(0);
    // 20–44px: engraved on 2x screens, solid on standard ones, switched by CSS.
    expect(q("density").querySelectorAll("mask")).toHaveLength(2);
    expect(q("density").querySelector("g.hidden")).not.toBeNull();
    // From 44px: engraved only.
    expect(q("engraved").querySelectorAll("mask path")).toHaveLength(4);
    // An explicit variant always wins.
    expect(q("forced").querySelectorAll("mask path")).toHaveLength(4);
  });

  it("steps the outlined KMS down to solid letters when it is too small to be crisp", () => {
    const { container } = render(
      <>
        <KmsMonogram size={12} data-testid="small" />
        <KmsMonogram size={24} data-testid="mid" />
        <KmsMonogram size={40} data-testid="large" />
      </>,
    );
    const boxes = (id: string) => [...container.querySelectorAll(`[data-testid=${id}] svg`)].map((svg) => svg.getAttribute("viewBox"));
    expect(boxes("small")).toEqual(["142 1340.75 2083 515.5"]);
    expect(boxes("mid")).toHaveLength(2);
    expect(boxes("large")).toEqual(["5 334 586 145"]);
  });

  it("sizes brand marks in whole pixels", () => {
    const { container } = render(<KavehMark size={25.6} />);
    expect(container.querySelector("svg")).toHaveAttribute("height", "26");
    expect(container.querySelector("svg")).toHaveAttribute("width", "32");
  });

  it("fills the KMS letters in the solid variant", () => {
    const { container } = render(<KmsMonogram variant="solid" />);
    expect(container.querySelector("mask")).toBeNull();
  });
});

describe("logo layouts", () => {
  it("sets the Persian-first lockup right to left", () => {
    render(<KavehLogo layout="persian" />);
    const logo = screen.getByRole("img", { name: "Kaveh Port & Marine Services" });
    expect(logo).toHaveAttribute("dir", "rtl");
    expect(within(logo).getByText("کاوه")).toBeInTheDocument();
    expect(within(logo).getByText("خدمات بندری و دریایی · تأسیس ۱۳۲۷")).toBeInTheDocument();
  });

  it("puts the anchor in a tile in the badge lockup", () => {
    render(<KavehLogo layout="badge" />);
    expect(within(screen.getByRole("img", { name: "Kaveh Port & Marine Services" })).getByText("Since 1948")).toBeInTheDocument();
  });
});

describe("seal, divider and band variants", () => {
  it.each(["navy", "orange", "light", "outline"] as const)("renders the %s seal", (variant) => {
    render(<KavehSeal variant={variant} title={`Seal ${variant}`} />);
    expect(screen.getByRole("img", { name: `Seal ${variant}` })).toBeInTheDocument();
  });

  it("draws a second line in the double divider and labels a separator", () => {
    const { container } = render(<HorizonDivider variant="double" />);
    expect(container.querySelectorAll(".nv-horizon span span")).toHaveLength(2);
    render(<HorizonDivider variant="dashed">Since 1948</HorizonDivider>);
    expect(screen.getByRole("separator")).toHaveTextContent("Since 1948");
  });

  it("supports every band tone and size", () => {
    render(
      <>
        <Tideband tone="orange" size="sm">
          Yalda offer
        </Tideband>
        <Tideband tone="solid" size="lg">
          Fleet
        </Tideband>
      </>,
    );
    expect(screen.getByText("Yalda offer").parentElement).toHaveClass("text-[11px]");
    expect(screen.getByText("Fleet").parentElement).toHaveClass("bg-[#295097]");
  });

  it("pins a badge to the porthole and hides bolts in the thin variant", () => {
    const { container } = render(<PortholeFrame variant="thin" src={pixel} alt="Crew" badge={<span>online</span>} />);
    expect(screen.getByText("online")).toBeInTheDocument();
    expect(container.querySelectorAll("span[aria-hidden]")).toHaveLength(0);
  });
});

describe("vessel status", () => {
  it("writes the status out in every badge variant", () => {
    render(
      <>
        <VesselStatusBadge status="berthed" variant="solid" />
        <VesselStatusBadge status="anchored" variant="outline" />
        <VesselStatusBadge status="underway" variant="dot" label="در حرکت" />
      </>,
    );
    for (const text of ["Berthed", "At anchor", "در حرکت"]) expect(screen.getByText(text)).toBeInTheDocument();
  });
});

describe("new brand components", () => {
  it("names the app icon, or hides it when decorative", () => {
    render(
      <>
        <KavehAppIcon variant="sunset" shape="circle" />
        <KavehAppIcon variant="orange" label="" data-testid="decorative" />
      </>,
    );
    expect(screen.getByRole("img", { name: "Kaveh" })).toHaveStyle({ borderRadius: "50%" });
    expect(screen.getByTestId("decorative")).toHaveAttribute("aria-hidden", "true");
  });

  it("shows KMS under the anchor from 40px, and the anchor alone below it", () => {
    const { container } = render(
      <>
        <KavehAppIcon variant="navy" size={64} data-testid="large" />
        <KavehAppIcon variant="navy" size={32} data-testid="small" />
        <KavehAppIcon variant="navy" size={64} monogram={false} data-testid="off" />
      </>,
    );
    expect(container.querySelectorAll("[data-testid=large] .nv-kms-monogram")).toHaveLength(1);
    expect(container.querySelectorAll("[data-testid=small] .nv-kms-monogram")).toHaveLength(0);
    expect(container.querySelectorAll("[data-testid=off] .nv-kms-monogram")).toHaveLength(0);
  });

  it("shows a figure with its English and Persian labels", () => {
    render(<BrandStat value="78" label="years of service" labelFa="سال خدمت" variant="inverse" />);
    expect(screen.getByText("78")).toBeInTheDocument();
    expect(screen.getByText("سال خدمت")).toHaveAttribute("dir", "rtl");
  });

  it("renders a bilingual heading at the requested level", () => {
    render(<BilingualHeading title="Port services" titleFa="خدمات بندری" level={3} variant="split" eyebrow="Services" />);
    expect(screen.getByRole("heading", { level: 3, name: "Port services" })).toBeInTheDocument();
    expect(screen.getByText("خدمات بندری")).toHaveAttribute("lang", "fa");
  });

  it("renders a header with the default logo, navigation and actions", async () => {
    const { container } = render(
      <KavehHeader
        nav={
          <>
            <a href="#services">Services</a>
            <a href="#ports">Ports</a>
          </>
        }
        actions={<button type="button">Request a quote</button>}
      />,
    );
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Kaveh Port & Marine Services" })).toBeInTheDocument();
    expect(screen.getByRole("navigation")).toHaveTextContent("Services");
    expect(await axeViolations(container)).toEqual([]);
  });
});
