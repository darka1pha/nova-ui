import { createIcon, dot, wave } from "./create-icon.ts";

/*
 * Shipping & marine icons in the Nova UI style: 24px grid, 1.5px stroke,
 * soft corners. Vessels share one hull curve and water uses one wave, so the
 * set reads as a family. `s` = secondary (dimmed in duotone), `f` = tinted in soft.
 */

/** A hull whose deck line sits at `y`, from `x1` to `x2`, 5px deep. */
const hull = (y: number, x1 = 2.5, x2 = 21.5) =>
  `M${x1} ${y}h${x2 - x1}l-1.9 4.4a2.5 2.5 0 0 1-2.3 1.6H6.7a2.5 2.5 0 0 1-2.3-1.6Z`;

/* ------------------------------------------------------------- Vessels */

export const ContainerShip = createIcon("container-ship", [
  ["path", { d: hull(14) }, "f"],
  ["rect", { x: 4.5, y: 10, width: 5, height: 4, rx: 1 }, "s"],
  ["rect", { x: 9.5, y: 10, width: 5, height: 4, rx: 1 }, "s"],
  ["rect", { x: 7, y: 6, width: 5, height: 4, rx: 1 }, "s"],
  ["path", { d: "M16.5 14V8.5a1 1 0 0 1 1-1h1.5a1 1 0 0 1 1 1V14" }],
  ["path", { d: "M18.25 7.5V4.5" }],
]);

export const Tugboat = createIcon("tugboat", [
  ["path", { d: hull(15) }, "f"],
  ["path", { d: "M6 15v-3a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v3" }, "s"],
  ["path", { d: "M8.5 11V8.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V11" }],
  ["path", { d: "M17 15V8" }],
  ["path", { d: "M17 8.5h2" }, "s"],
]);

export const Tanker = createIcon("tanker", [
  ["path", { d: hull(15) }, "f"],
  ["path", { d: "M4.5 15a3 3 0 0 1 6 0" }, "s"],
  ["path", { d: "M10.5 15a3 3 0 0 1 6 0" }, "s"],
  ["path", { d: "M17.5 15V9.5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1V15" }],
]);

export const Ferry = createIcon("ferry", [
  ["path", { d: hull(14) }, "f"],
  ["path", { d: "M5.5 14v-3a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v3" }],
  ["path", { d: "M8 10V7.5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1V10" }, "s"],
  ["path", { d: "M8.5 12h1M11.5 12h1M14.5 12h1" }, "s"],
]);

export const Sailboat = createIcon("sailboat", [
  ["path", { d: hull(16, 4, 20) }, "f"],
  ["path", { d: "M12 16V2.5" }],
  ["path", { d: "M12 3.5 18.5 13.5H12" }, "f"],
  ["path", { d: "M10 6 5 13.5h5Z" }, "sf"],
]);

export const CruiseShip = createIcon("cruise-ship", [
  ["path", { d: hull(15) }, "f"],
  ["path", { d: "M5 15v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" }],
  ["path", { d: "M7 11V8.5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1V11" }, "s"],
  ["path", { d: "m11 7.5.5-3.5H14l-.5 3.5" }, "s"],
  dot(8.5, 13, 0.75),
  dot(12, 13, 0.75),
  dot(15.5, 13, 0.75),
]);

export const FishingBoat = createIcon("fishing-boat", [
  ["path", { d: hull(15) }, "f"],
  ["path", { d: "M5.5 15v-4a1 1 0 0 1 1-1H10a1 1 0 0 1 1 1v4" }],
  ["path", { d: "M15 15V3.5" }],
  ["path", { d: "m15 4.5 5 5.5v2.5" }, "s"],
]);

export const Radar = createIcon("radar", [
  ["circle", { cx: 12, cy: 12, r: 9.5 }, "f"],
  ["circle", { cx: 12, cy: 12, r: 5 }, "s"],
  ["path", { d: "m12 12 6.7-6.7" }],
  dot(15.5, 14.5),
]);

export const Binoculars = createIcon("binoculars", [
  ["circle", { cx: 6.5, cy: 16, r: 3.5 }, "f"],
  ["circle", { cx: 17.5, cy: 16, r: 3.5 }, "f"],
  ["path", { d: "M3 16 5 6.5a1.5 1.5 0 0 1 1.5-1.2h1A1.5 1.5 0 0 1 9 6.8V12M21 16 19 6.5a1.5 1.5 0 0 0-1.5-1.2h-1A1.5 1.5 0 0 0 15 6.8V12" }, "s"],
  ["path", { d: "M10 13.5h4" }],
]);

export const VesselTracking = createIcon("vessel-tracking", [
  ["path", { d: hull(16, 4, 20) }, "f"],
  ["path", { d: "M8 16v-2.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V16" }],
  ["path", { d: "M8.5 8a5 5 0 0 1 7 0" }, "s"],
  ["path", { d: "M5.6 5.1a9 9 0 0 1 12.8 0" }, "s"],
  dot(12, 10.5),
]);

export const Anchor = createIcon("anchor", [
  ["circle", { cx: 12, cy: 4.5, r: 2 }, "s"],
  ["path", { d: "M12 6.5V21" }],
  ["path", { d: "M8.5 10h7" }, "s"],
  ["path", { d: "M4 13a8 8 0 0 0 16 0" }],
  ["path", { d: "m2.5 14.5 1.5-1.5 1.5 1.5" }],
  ["path", { d: "m18.5 14.5 1.5-1.5 1.5 1.5" }],
]);

export const ShipWheel = createIcon("ship-wheel", [
  ["circle", { cx: 12, cy: 12, r: 7 }, "f"],
  ["circle", { cx: 12, cy: 12, r: 2 }],
  ["path", { d: "M12 2v8M12 14v8M2 12h8M14 12h8M4.9 4.9l5.7 5.7M13.4 13.4l5.7 5.7M19.1 4.9l-5.7 5.7M10.6 13.4l-5.7 5.7" }, "s"],
]);

export const Propeller = createIcon("propeller", [
  ["circle", { cx: 12, cy: 12, r: 2 }],
  ["path", { d: "M12 10C9.6 8.2 9.6 4.6 12 2.5c2.4 2.1 2.4 5.7 0 7.5Z" }, "f"],
  ["path", { d: "M12 10C9.6 8.2 9.6 4.6 12 2.5c2.4 2.1 2.4 5.7 0 7.5Z", transform: "rotate(120 12 12)" }, "sf"],
  ["path", { d: "M12 10C9.6 8.2 9.6 4.6 12 2.5c2.4 2.1 2.4 5.7 0 7.5Z", transform: "rotate(240 12 12)" }, "sf"],
]);

export const LifeBuoy = createIcon("life-buoy", [
  ["circle", { cx: 12, cy: 12, r: 10 }, "f"],
  ["circle", { cx: 12, cy: 12, r: 4 }],
  ["path", { d: "m4.9 4.9 4.3 4.3M14.8 14.8l4.3 4.3M19.1 4.9l-4.3 4.3M9.2 14.8l-4.3 4.3" }, "s"],
]);

export const LifeJacket = createIcon("life-jacket", [
  ["path", { d: "M9 3 4.6 6.3a1.5 1.5 0 0 0-.6 1.2V19a2 2 0 0 0 2 2h4V11a2 2 0 0 0-1-1.7Z" }, "f"],
  ["path", { d: "m15 3 4.4 3.3c.4.3.6.7.6 1.2V19a2 2 0 0 1-2 2h-4V11a2 2 0 0 1 1-1.7Z" }, "f"],
  ["path", { d: "M9 3a3 3 0 0 0 6 0" }, "s"],
  ["path", { d: "M10 14.5h4M10 18h4" }, "s"],
]);

export const Compass = createIcon("compass", [
  ["circle", { cx: 12, cy: 12, r: 10 }, "s"],
  ["path", { d: "m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8Z" }, "f"],
]);

/* -------------------------------------------------------- Port & terminal */

export const PortCrane = createIcon("port-crane", [
  ["path", { d: "M2 7h20" }],
  ["path", { d: "M5 21V7M11 21V7" }],
  ["path", { d: "m5 14 6-4" }, "s"],
  ["rect", { x: 6, y: 3.5, width: 4, height: 3.5, rx: 1 }, "s"],
  ["path", { d: "M3 21h10" }, "s"],
  ["path", { d: "M18 7v4.5" }, "s"],
  ["rect", { x: 15.5, y: 11.5, width: 5, height: 4, rx: 1 }, "f"],
]);

export const Berth = createIcon("berth", [
  ["rect", { x: 2, y: 9, width: 20, height: 4, rx: 1.5 }, "f"],
  ["path", { d: "M5 13v4M12 13v4M19 13v4" }, "s"],
  ["path", { d: "M7 9V7M17 9V7" }],
  ["path", { d: wave(20) }, "s"],
]);

export const Bollard = createIcon("bollard", [
  ["ellipse", { cx: 12, cy: 5, rx: 6, ry: 2 }, "f"],
  ["path", { d: "M6 5v2c0 1.1 2.7 2 6 2s6-.9 6-2V5" }],
  ["path", { d: "M9 9v10M15 9v10" }],
  ["path", { d: "M5 21h14" }, "s"],
  ["path", { d: "M9 13.5c-2.6.4-5.1 1.6-7 3.5" }, "s"],
]);

export const TerminalGate = createIcon("terminal-gate", [
  ["rect", { x: 3, y: 9, width: 3.5, height: 12, rx: 1 }, "f"],
  ["path", { d: "M6.5 11h14a1 1 0 0 1 0 2h-14" }],
  ["path", { d: "m11 11-1 2M15.5 11l-1 2" }, "s"],
  ["path", { d: "M2 21h6" }, "s"],
  ["path", { d: "M4.75 9V6.5" }, "s"],
]);

export const CargoHook = createIcon("cargo-hook", [
  ["path", { d: "M12 2v3" }, "s"],
  ["rect", { x: 9, y: 5, width: 6, height: 5, rx: 1.5 }, "f"],
  ["path", { d: "M12 10v6.5a3 3 0 1 1-6 0" }],
  ["path", { d: "m6 16.5 1.5-1.5" }],
]);

export const Lighthouse = createIcon("lighthouse", [
  ["path", { d: "m9 21 1-12h4l1 12Z" }, "f"],
  ["path", { d: "M10 9V6.5h4V9" }],
  ["path", { d: "m10 6.5 2-3 2 3" }],
  ["path", { d: "M9.6 15h4.8" }, "s"],
  ["path", { d: "M6 21h12" }],
  ["path", { d: "m17 6 3-1.5M17 9.5l3 1.5M7 6 4 4.5M7 9.5 4 11" }, "s"],
]);

export const Buoy = createIcon("buoy", [
  ["path", { d: "M8 16 9.5 8.5h5L16 16Z" }, "f"],
  ["path", { d: "M10.5 8.5V6h3v2.5" }],
  ["path", { d: "M12 6V3" }, "s"],
  ["path", { d: "M9 12.25h6" }, "s"],
  ["path", { d: wave(20) }, "s"],
]);

export const Warehouse = createIcon("warehouse", [
  ["path", { d: "M2.5 21V9.6a2 2 0 0 1 1.1-1.8l7.5-3.7a2 2 0 0 1 1.8 0l7.5 3.7a2 2 0 0 1 1.1 1.8V21" }, "f"],
  ["path", { d: "M7 21v-8h10v8" }],
  ["path", { d: "M7 16.5h10" }, "s"],
  ["path", { d: "M1.5 21h21" }, "s"],
]);

export const Forklift = createIcon("forklift", [
  ["path", { d: "M3.5 17V9a1 1 0 0 1 1-1H8a1 1 0 0 1 .9.6L11.5 14v3" }, "f"],
  ["path", { d: "M15 3v16h6" }],
  ["path", { d: "M11.5 14H15" }, "s"],
  ["circle", { cx: 6, cy: 19, r: 2 }, "s"],
  ["circle", { cx: 11.5, cy: 19, r: 2 }, "s"],
]);

export const Silo = createIcon("silo", [
  ["path", { d: "M4 21V8.5a3.5 3.5 0 0 1 7 0V21" }, "f"],
  ["path", { d: "M13 21v-9.5a3.5 3.5 0 0 1 7 0V21" }, "sf"],
  ["path", { d: "M4 12h7M13 15h7" }, "s"],
  ["path", { d: "M2.5 21h19" }],
]);

/* ------------------------------------------------------ Cargo & logistics */

export const Container = createIcon("container", [
  ["rect", { x: 2, y: 6, width: 20, height: 12, rx: 2 }, "f"],
  ["path", { d: "M6.5 9.5v5M10.5 9.5v5M14.5 9.5v5M18.5 9.5v5" }, "s"],
]);

export const ContainerStack = createIcon("container-stack", [
  ["rect", { x: 2, y: 14, width: 9, height: 6.5, rx: 1.5 }, "f"],
  ["rect", { x: 13, y: 14, width: 9, height: 6.5, rx: 1.5 }, "f"],
  ["rect", { x: 7.5, y: 5.5, width: 9, height: 6.5, rx: 1.5 }, "sf"],
  ["path", { d: "M5.5 16.5v2M8 16.5v2M16.5 16.5v2M19 16.5v2M11 8v2M13.5 8v2" }, "s"],
]);

export const ReeferContainer = createIcon("reefer-container", [
  ["rect", { x: 2, y: 6, width: 20, height: 12, rx: 2 }, "f"],
  ["path", { d: "M6 9.5v5M9.5 9.5v5" }, "s"],
  ["path", { d: "M16.5 9v6M13.9 10.5l5.2 3M13.9 13.5l5.2-3" }],
]);

export const Pallet = createIcon("pallet", [
  ["rect", { x: 5, y: 4, width: 14, height: 10, rx: 2 }, "f"],
  ["path", { d: "M10 4v3h4V4" }, "s"],
  ["path", { d: "M3 17h18M3 20.5h18" }],
  ["path", { d: "M5 17v3.5M12 17v3.5M19 17v3.5" }, "s"],
]);

export const Package = createIcon("package", [
  ["path", { d: "M12 2.5 20.5 7v10L12 21.5 3.5 17V7Z" }, "f"],
  ["path", { d: "M3.5 7 12 11.5 20.5 7M12 11.5v10" }, "s"],
  ["path", { d: "m7.75 4.75 8.5 4.5" }, "s"],
]);

export const Truck = createIcon("truck", [
  ["rect", { x: 2, y: 5, width: 12, height: 11, rx: 2 }, "f"],
  ["path", { d: "M14 9h3.4a2 2 0 0 1 1.7.9l2.4 3.6c.3.4.5.9.5 1.4V16h-8" }],
  ["circle", { cx: 6.5, cy: 18, r: 2 }, "s"],
  ["circle", { cx: 17.5, cy: 18, r: 2 }, "s"],
]);

export const Train = createIcon("train", [
  ["rect", { x: 5, y: 3, width: 14, height: 13, rx: 3 }, "f"],
  ["path", { d: "M5 10h14" }, "s"],
  dot(9, 13),
  dot(15, 13),
  ["path", { d: "m8.5 16-2 4.5M15.5 16l2 4.5" }],
  ["path", { d: "M7.5 18.5h9" }, "s"],
]);

export const Plane = createIcon("plane", [
  ["path", { d: "M12 2.5c.8 0 1.5.7 1.5 1.5v5l7 4.5v2l-7-2v4.5l2.5 2v1.5L12 20.5 8 21.5V20l2.5-2v-4.5l-7 2v-2l7-4.5V4c0-.8.7-1.5 1.5-1.5Z" }, "f"],
]);

export const Route = createIcon("route", [
  ["circle", { cx: 5, cy: 18, r: 2.5 }],
  ["path", { d: "M19 3a3 3 0 0 0-3 3c0 2.2 3 5 3 5s3-2.8 3-5a3 3 0 0 0-3-3Z" }, "f"],
  ["path", { d: "M7.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h4" }, "s"],
]);

export const Weight = createIcon("weight", [
  ["path", { d: "M7 9h10l2.4 9.9A1.7 1.7 0 0 1 17.7 21H6.3a1.7 1.7 0 0 1-1.7-2.1Z" }, "f"],
  ["path", { d: "M9.5 9a2.5 2.5 0 1 1 5 0" }, "s"],
  ["path", { d: "M10 15h4" }, "s"],
]);

export const Bunkering = createIcon("bunkering", [
  ["path", { d: "M12 2.5c2.5 3 4.5 5.7 4.5 8.5a4.5 4.5 0 0 1-9 0c0-2.8 2-5.5 4.5-8.5Z" }, "f"],
  ["path", { d: "M10 11.5a2 2 0 0 0 2 2" }, "s"],
  ["path", { d: wave(20) }, "s"],
]);

export const DangerousGoods = createIcon("dangerous-goods", [
  ["path", { d: "M10.59 2.59a2 2 0 0 1 2.82 0l8 8a2 2 0 0 1 0 2.82l-8 8a2 2 0 0 1-2.82 0l-8-8a2 2 0 0 1 0-2.82Z" }, "sf"],
  ["path", { d: "M12 7.5v5" }],
  dot(12, 16),
]);

/* ---------------------------------------------------- Documents & customs */

export const BillOfLading = createIcon("bill-of-lading", [
  ["path", { d: "M14 2H8a4 4 0 0 0-4 4v12a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4V8Z" }, "f"],
  ["path", { d: "M14 2.5V5a3 3 0 0 0 3 3h2.5" }, "s"],
  ["path", { d: "M8 9h3" }, "s"],
  ["path", { d: "M7 15.5h10l-1 2.3a1 1 0 0 1-.9.7H8.9a1 1 0 0 1-.9-.7Z" }],
  ["path", { d: "M9.5 15.5v-2.5h4v2.5" }, "s"],
]);

export const CustomsStamp = createIcon("customs-stamp", [
  ["path", { d: "M4 17a2.5 2.5 0 0 1 2.5-2.5h11A2.5 2.5 0 0 1 20 17v1.5H4Z" }, "f"],
  ["path", { d: "M9.5 14.5v-2a3 3 0 0 0-.8-2 4 4 0 1 1 6.6 0 3 3 0 0 0-.8 2v2" }],
  ["path", { d: "M5 21.5h14" }, "s"],
]);

export const Passport = createIcon("passport", [
  ["rect", { x: 5, y: 2, width: 14, height: 20, rx: 2.5 }, "f"],
  ["circle", { cx: 12, cy: 10, r: 3.5 }, "s"],
  ["path", { d: "M9 17h6" }],
]);

export const Certificate = createIcon("certificate", [
  ["path", { d: "M13 16H5.5A2.5 2.5 0 0 1 3 13.5v-7A2.5 2.5 0 0 1 5.5 4h13A2.5 2.5 0 0 1 21 6.5v4" }, "f"],
  ["path", { d: "M7 8h10M7 11.5h4" }, "s"],
  ["circle", { cx: 17, cy: 14.5, r: 3 }],
  ["path", { d: "m15.5 17-1 4.5 2.5-1.5 2.5 1.5-1-4.5" }, "s"],
]);

export const PilotFlag = createIcon("pilot-flag", [
  ["path", { d: "M5 22V3" }],
  ["path", { d: "M5 4h13.5l-3.5 4.5 3.5 4.5H5" }, "f"],
  ["path", { d: "M11.5 4v9" }, "s"],
]);

export const ShieldCheck = createIcon("shield-check", [
  ["path", { d: "M3.5 7.3c0-.9.6-1.7 1.4-2l6.4-2.4a2 2 0 0 1 1.4 0l6.4 2.4c.8.3 1.4 1.1 1.4 2V12c0 5-4.4 8.4-7.6 9.7a2 2 0 0 1-1.6 0C7.9 20.4 3.5 17 3.5 12Z" }, "sf"],
  ["path", { d: "m9 12 2 2 4-4.5" }],
]);

/* -------------------------------------------------------------- Sea state */

export const Waves = createIcon("waves", [
  ["path", { d: wave(6) }, "s"],
  ["path", { d: wave(12) }],
  ["path", { d: wave(18) }, "s"],
]);

export const Tide = createIcon("tide", [
  ["path", { d: "M8 10V3M5 6l3-3 3 3" }],
  ["path", { d: "M16 3v7M13 7l3 3 3-3" }, "s"],
  ["path", { d: wave(15) }],
  ["path", { d: wave(20) }, "s"],
]);
