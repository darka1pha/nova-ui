import { createIcon, dot, radial } from "./create-icon.ts";

/*
 * Essentials: everyday interface icons in the Kaleido style.
 * 24px grid, 1.5px stroke, 2px safe area, soft corners. The `s` flag marks the
 * secondary part of each glyph (dimmed in duotone), `f` the closed shape that
 * takes a tint in the soft variant.
 */

const gear = (cx: number, cy: number, outer: number, inner: number, teeth: number) => {
  const pts: string[] = [];
  const step = 360 / teeth;
  const at = (deg: number, r: number) => {
    const a = (deg * Math.PI) / 180;
    return `${Math.round((cx + r * Math.cos(a)) * 100) / 100} ${Math.round((cy + r * Math.sin(a)) * 100) / 100}`;
  };
  for (let i = 0; i < teeth; i++) {
    const c = i * step;
    pts.push(at(c - step * 0.32, inner), at(c - step * 0.17, outer), at(c + step * 0.17, outer), at(c + step * 0.32, inner));
  }
  return `M${pts.join("L")}Z`;
};

/* ------------------------------------------------------------- Navigation */

export const Home = createIcon("home", [
  ["path", { d: "M3 10.2c0-.9.4-1.7 1.1-2.3l6-5a3 3 0 0 1 3.8 0l6 5c.7.6 1.1 1.4 1.1 2.3V18a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3Z" }, "f"],
  ["path", { d: "M9.5 21v-4a2.5 2.5 0 0 1 5 0v4" }, "s"],
]);

export const Widget = createIcon("widget", [
  ["rect", { x: 3, y: 3, width: 8, height: 8, rx: 2.5 }, "f"],
  ["rect", { x: 13, y: 3, width: 8, height: 8, rx: 2.5 }, "s"],
  ["rect", { x: 3, y: 13, width: 8, height: 8, rx: 2.5 }, "s"],
  ["rect", { x: 13, y: 13, width: 8, height: 8, rx: 2.5 }, "f"],
]);

export const Menu = createIcon("menu", [
  ["path", { d: "M4 7h16" }],
  ["path", { d: "M4 12h16" }, "s"],
  ["path", { d: "M4 17h16" }],
]);

export const Search = createIcon("search", [
  ["circle", { cx: 11, cy: 11, r: 8 }, "f"],
  ["path", { d: "m17 17 4 4" }, "s"],
]);

export const Settings = createIcon("settings", [
  ["path", { d: gear(12, 12, 10, 7.6, 8) }, "f"],
  ["circle", { cx: 12, cy: 12, r: 3 }, "s"],
]);

export const Filter = createIcon("filter", [
  ["path", { d: "M4.5 4h15a1 1 0 0 1 .8 1.6L15 12.5V19l-6 2v-8.5L3.7 5.6A1 1 0 0 1 4.5 4Z" }, "f"],
  ["path", { d: "M9 12.5h6" }, "s"],
]);

/* ----------------------------------------------------------------- Arrows */

export const ChevronDown = createIcon("chevron-down", [["path", { d: "m19 9-7 6-7-6" }]]);
export const ChevronUp = createIcon("chevron-up", [["path", { d: "m5 15 7-6 7 6" }]]);
export const ChevronLeft = createIcon("chevron-left", [["path", { d: "m15 5-6 7 6 7" }]]);
export const ChevronRight = createIcon("chevron-right", [["path", { d: "m9 5 6 7-6 7" }]]);

export const ArrowRight = createIcon("arrow-right", [
  ["path", { d: "M4 12h16" }, "s"],
  ["path", { d: "m14 6 6 6-6 6" }],
]);

export const ArrowLeft = createIcon("arrow-left", [
  ["path", { d: "M20 12H4" }, "s"],
  ["path", { d: "m10 6-6 6 6 6" }],
]);

export const Refresh = createIcon("refresh", [
  ["path", { d: "M20 12a8 8 0 1 1-2.34-5.66" }],
  ["path", { d: "M20 3.5V8h-4.5" }, "s"],
]);

export const Logout = createIcon("logout", [
  ["path", { d: "M14 3h2a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4h-2" }, "s"],
  ["path", { d: "M15 12H4" }],
  ["path", { d: "m8 8-4 4 4 4" }],
]);

/* ---------------------------------------------------------------- Actions */

export const AddCircle = createIcon("add-circle", [
  ["circle", { cx: 12, cy: 12, r: 10 }, "sf"],
  ["path", { d: "M15 12H9" }],
  ["path", { d: "M12 9v6" }],
]);

export const MinusCircle = createIcon("minus-circle", [
  ["circle", { cx: 12, cy: 12, r: 10 }, "sf"],
  ["path", { d: "M15 12H9" }],
]);

export const CloseCircle = createIcon("close-circle", [
  ["circle", { cx: 12, cy: 12, r: 10 }, "sf"],
  ["path", { d: "m14.5 9.5-5 5" }],
  ["path", { d: "m9.5 9.5 5 5" }],
]);

export const CheckCircle = createIcon("check-circle", [
  ["circle", { cx: 12, cy: 12, r: 10 }, "sf"],
  ["path", { d: "m8.5 12.5 2.5 2.5 4.5-5" }],
]);

export const Pen = createIcon("pen", [
  ["path", { d: "M14.6 5.4a2.83 2.83 0 0 1 4 4L8.5 19.5 3 21l1.5-5.5Z" }, "f"],
  ["path", { d: "m13 7 4 4" }, "s"],
  ["path", { d: "M14 21h7" }, "s"],
]);

export const Trash = createIcon("trash", [
  ["path", { d: "M3 6h18" }],
  ["path", { d: "M8.5 6V4.5A1.5 1.5 0 0 1 10 3h4a1.5 1.5 0 0 1 1.5 1.5V6" }, "s"],
  ["path", { d: "m5 6 1 13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-13" }, "f"],
  ["path", { d: "M10 10.5v6" }, "s"],
  ["path", { d: "M14 10.5v6" }, "s"],
]);

export const Copy = createIcon("copy", [
  ["rect", { x: 8, y: 8, width: 13, height: 13, rx: 3 }, "f"],
  ["path", { d: "M16 8V6a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v7a3 3 0 0 0 3 3h2" }, "s"],
]);

export const Download = createIcon("download", [
  ["path", { d: "M3 15v2a4 4 0 0 0 4 4h10a4 4 0 0 0 4-4v-2" }, "s"],
  ["path", { d: "M12 3v12" }],
  ["path", { d: "m7.5 10.5 4.5 4.5 4.5-4.5" }],
]);

export const Upload = createIcon("upload", [
  ["path", { d: "M3 15v2a4 4 0 0 0 4 4h10a4 4 0 0 0 4-4v-2" }, "s"],
  ["path", { d: "M12 15V3" }],
  ["path", { d: "m7.5 7.5 4.5-4.5 4.5 4.5" }],
]);

export const Link = createIcon("link", [
  ["path", { d: "M10 14a4 4 0 0 0 5.66 0l3.5-3.5a4 4 0 0 0-5.66-5.66l-1 1" }],
  ["path", { d: "M14 10a4 4 0 0 0-5.66 0l-3.5 3.5a4 4 0 0 0 5.66 5.66l1-1" }, "s"],
]);

export const Eye = createIcon("eye", [
  ["path", { d: "M2.5 12C4.6 7.8 8 5 12 5s7.4 2.8 9.5 7c-2.1 4.2-5.5 7-9.5 7s-7.4-2.8-9.5-7Z" }, "f"],
  ["circle", { cx: 12, cy: 12, r: 3 }, "s"],
]);

export const Lock = createIcon("lock", [
  ["rect", { x: 4, y: 10, width: 16, height: 12, rx: 3 }, "f"],
  ["path", { d: "M7.5 10V7a4.5 4.5 0 0 1 9 0v3" }, "s"],
  ["path", { d: "M12 14.5v3" }],
]);

/* ---------------------------------------------------------------- Status */

export const InfoCircle = createIcon("info-circle", [
  ["circle", { cx: 12, cy: 12, r: 10 }, "sf"],
  ["path", { d: "M12 17v-6" }],
  dot(12, 7.75),
]);

export const DangerTriangle = createIcon("danger-triangle", [
  ["path", { d: "M10.27 4a2 2 0 0 1 3.46 0l7.79 13.5a2 2 0 0 1-1.73 3H4.21a2 2 0 0 1-1.73-3Z" }, "sf"],
  ["path", { d: "M12 9v4.5" }],
  dot(12, 16.75),
]);

export const Bell = createIcon("bell", [
  ["path", { d: "M18.5 10v.6c0 .9.3 1.8.8 2.5l.7 1c1 1.4.3 3.4-1.4 3.9a29 29 0 0 1-13.2 0c-1.7-.5-2.4-2.5-1.4-3.9l.7-1c.5-.7.8-1.6.8-2.5V10a6.5 6.5 0 0 1 13 0Z" }, "f"],
  ["path", { d: "M9.5 20.5a3 3 0 0 0 5 0" }, "s"],
]);

export const Star = createIcon("star", [["path", { d: radial(12, 12.6, [9.6, 4.4], 5) }, "f"]]);

export const Heart = createIcon("heart", [
  ["path", { d: "M12 20.5S3 15.5 3 9.2A4.7 4.7 0 0 1 12 7a4.7 4.7 0 0 1 9 2.2c0 6.3-9 11.3-9 11.3Z" }, "f"],
]);

export const Bookmark = createIcon("bookmark", [
  ["path", { d: "M7 3h10a2 2 0 0 1 2 2v16l-7-4.5L5 21V5a2 2 0 0 1 2-2Z" }, "f"],
  ["path", { d: "M9.5 8h5" }, "s"],
]);

/* ------------------------------------------------- People & communication */

export const User = createIcon("user", [
  ["circle", { cx: 12, cy: 6.5, r: 4 }, "f"],
  ["ellipse", { cx: 12, cy: 17.5, rx: 7, ry: 3.5 }, "s"],
]);

export const Users = createIcon("users", [
  ["circle", { cx: 9, cy: 7, r: 3.5 }, "f"],
  ["ellipse", { cx: 9, cy: 17, rx: 6, ry: 3.5 }],
  ["path", { d: "M15 3.5a3.5 3.5 0 0 1 0 7" }, "s"],
  ["path", { d: "M18 13.5c2.2.5 4 1.8 4 3.5 0 1.3-.9 2.3-2.4 2.9" }, "s"],
]);

export const Letter = createIcon("letter", [
  ["rect", { x: 2, y: 4.5, width: 20, height: 15, rx: 3.5 }, "f"],
  ["path", { d: "m6 9 4.6 3.4a2.4 2.4 0 0 0 2.8 0L18 9" }, "s"],
]);

export const Chat = createIcon("chat", [
  ["path", { d: "M12 21a9 9 0 1 0-7.9-4.7L3 21l4.7-1.1A9 9 0 0 0 12 21Z" }, "f"],
  dot(8, 12),
  dot(12, 12),
  dot(16, 12),
]);

export const Globe = createIcon("globe", [
  ["circle", { cx: 12, cy: 12, r: 10 }, "f"],
  ["ellipse", { cx: 12, cy: 12, rx: 4, ry: 10 }, "s"],
  ["path", { d: "M2 12h20" }, "s"],
]);

export const MapPoint = createIcon("map-point", [
  ["path", { d: "M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" }, "f"],
  ["circle", { cx: 12, cy: 10, r: 2.5 }, "s"],
]);

/* ---------------------------------------------------------- Time & files */

export const Calendar = createIcon("calendar", [
  ["rect", { x: 3, y: 5, width: 18, height: 16, rx: 3.5 }, "f"],
  ["path", { d: "M3 10h18" }, "s"],
  ["path", { d: "M8 3v4" }],
  ["path", { d: "M16 3v4" }],
  dot(8, 14.5),
  dot(12, 14.5),
  dot(16, 14.5),
]);

export const Clock = createIcon("clock", [
  ["circle", { cx: 12, cy: 12, r: 10 }, "sf"],
  ["path", { d: "M12 7.5V12l3 2" }],
]);

export const Document = createIcon("document", [
  ["path", { d: "M14 2H8a4 4 0 0 0-4 4v12a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4V8Z" }, "f"],
  ["path", { d: "M14 2.5V5a3 3 0 0 0 3 3h2.5" }, "s"],
  ["path", { d: "M8 13h8" }, "s"],
  ["path", { d: "M8 17h5" }, "s"],
]);

export const Folder = createIcon("folder", [
  ["path", { d: "M2 7a3 3 0 0 1 3-3h3.6a2 2 0 0 1 1.4.6L11.5 6H19a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3Z" }, "f"],
  ["path", { d: "M2 10h20" }, "s"],
]);

export const Chart = createIcon("chart", [
  ["rect", { x: 4, y: 12, width: 4, height: 8, rx: 1.5 }, "f"],
  ["rect", { x: 10, y: 4, width: 4, height: 16, rx: 1.5 }, "f"],
  ["rect", { x: 16, y: 8, width: 4, height: 12, rx: 1.5 }, "f"],
  ["path", { d: "M2.5 22h19" }, "s"],
]);

/* -------------------------------------------------------------- Weather */

export const Sun = createIcon("sun", [
  ["circle", { cx: 12, cy: 12, r: 4.5 }, "f"],
  ["path", { d: "M12 2v1.5M12 20.5V22M4.93 4.93 6 6m12 12 1.07 1.07M2 12h1.5m17 0H22M4.93 19.07 6 18M18 6l1.07-1.07" }, "s"],
]);

export const Wind = createIcon("wind", [
  ["path", { d: "M3 8h10a3 3 0 1 0-3-3" }],
  ["path", { d: "M3 12h15a3 3 0 1 1-3 3" }, "s"],
  ["path", { d: "M3 16h7" }],
]);
