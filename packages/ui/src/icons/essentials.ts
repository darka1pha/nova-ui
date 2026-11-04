import { createIcon, dot, radial } from "./create-icon.ts";

/*
 * Essentials: everyday interface icons in the Nova UI style.
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

export const List = createIcon("list", [
  dot(4.5, 6, 1.25),
  dot(4.5, 12, 1.25),
  dot(4.5, 18, 1.25),
  ["path", { d: "M9 6h11M9 18h11" }],
  ["path", { d: "M9 12h11" }, "s"],
]);

export const Sort = createIcon("sort", [
  ["path", { d: "M7 20V4" }],
  ["path", { d: "m3 8 4-4 4 4" }],
  ["path", { d: "M17 4v16" }, "s"],
  ["path", { d: "m13 16 4 4 4-4" }, "s"],
]);

export const MoreHorizontal = createIcon("more-horizontal", [dot(5, 12, 1.25), dot(12, 12, 1.25), dot(19, 12, 1.25)]);
export const MoreVertical = createIcon("more-vertical", [dot(12, 5, 1.25), dot(12, 12, 1.25), dot(12, 19, 1.25)]);

export const GripVertical = createIcon("grip-vertical", [
  dot(9, 5, 1.25),
  dot(15, 5, 1.25),
  dot(9, 12, 1.25),
  dot(15, 12, 1.25),
  dot(9, 19, 1.25),
  dot(15, 19, 1.25),
]);

export const Sidebar = createIcon("sidebar", [
  ["rect", { x: 3, y: 3, width: 18, height: 18, rx: 3.5 }, "f"],
  ["path", { d: "M9 3v18" }, "s"],
]);

export const Maximize = createIcon("maximize", [
  ["path", { d: "M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" }],
]);

export const Minimize = createIcon("minimize", [
  ["path", { d: "M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3" }],
]);

export const ZoomIn = createIcon("zoom-in", [
  ["circle", { cx: 11, cy: 11, r: 8 }, "f"],
  ["path", { d: "m17 17 4 4" }, "s"],
  ["path", { d: "M11 8v6M8 11h6" }],
]);

export const ZoomOut = createIcon("zoom-out", [
  ["circle", { cx: 11, cy: 11, r: 8 }, "f"],
  ["path", { d: "m17 17 4 4" }, "s"],
  ["path", { d: "M8 11h6" }],
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

export const ArrowUp = createIcon("arrow-up", [
  ["path", { d: "M12 20V4" }, "s"],
  ["path", { d: "m6 10 6-6 6 6" }],
]);

export const ArrowDown = createIcon("arrow-down", [
  ["path", { d: "M12 4v16" }, "s"],
  ["path", { d: "m6 14 6 6 6-6" }],
]);

export const ExternalLink = createIcon("external-link", [
  ["path", { d: "M11 4H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-4" }, "s"],
  ["path", { d: "M14 4h6v6" }],
  ["path", { d: "m20 4-9 9" }],
]);

export const Undo = createIcon("undo", [
  ["path", { d: "M9 14 4 9l5-5" }],
  ["path", { d: "M4 9h10.5a5.5 5.5 0 0 1 0 11H11" }, "s"],
]);

export const Redo = createIcon("redo", [
  ["path", { d: "m15 14 5-5-5-5" }],
  ["path", { d: "M20 9H9.5a5.5 5.5 0 0 0 0 11H13" }, "s"],
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

export const Login = createIcon("login", [
  ["path", { d: "M14 3h2a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4h-2" }, "s"],
  ["path", { d: "M4 12h11" }],
  ["path", { d: "m11 8 4 4-4 4" }],
]);

/* ---------------------------------------------------------------- Actions */

export const Plus = createIcon("plus", [
  ["path", { d: "M12 5v14" }],
  ["path", { d: "M5 12h14" }],
]);

export const Minus = createIcon("minus", [["path", { d: "M5 12h14" }]]);

export const Close = createIcon("close", [
  ["path", { d: "m6 6 12 12" }],
  ["path", { d: "m18 6-12 12" }],
]);

export const Check = createIcon("check", [["path", { d: "m5 12.5 4.5 4.5L19 7" }]]);

export const Save = createIcon("save", [
  ["path", { d: "M4 6a2 2 0 0 1 2-2h10.2a2 2 0 0 1 1.4.6l2.8 2.8a2 2 0 0 1 .6 1.4V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" }, "f"],
  ["path", { d: "M8 4v3.5h7V4" }, "s"],
  ["path", { d: "M7.5 20v-5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v5" }],
]);

export const Print = createIcon("print", [
  ["path", { d: "M7 9V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v5" }, "s"],
  ["path", { d: "M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" }, "f"],
  ["rect", { x: 7, y: 14, width: 10, height: 7, rx: 1 }],
]);

export const Pin = createIcon("pin", [
  ["path", { d: "M15 3H9l.8 6.4L6.5 13v2h11v-2l-3.3-3.6Z" }, "f"],
  ["path", { d: "M12 15v6" }, "s"],
]);

export const Code = createIcon("code", [
  ["path", { d: "m8 7-5 5 5 5M16 7l5 5-5 5" }],
  ["path", { d: "m13.5 4-3 16" }, "s"],
]);

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

export const Share = createIcon("share", [
  ["circle", { cx: 18, cy: 5, r: 2.5 }, "f"],
  ["circle", { cx: 6, cy: 12, r: 2.5 }, "f"],
  ["circle", { cx: 18, cy: 19, r: 2.5 }, "f"],
  ["path", { d: "m8.16 10.74 7.68-4.48M8.16 13.26l7.68 4.48" }, "s"],
]);

export const Eye = createIcon("eye", [
  ["path", { d: "M2.5 12C4.6 7.8 8 5 12 5s7.4 2.8 9.5 7c-2.1 4.2-5.5 7-9.5 7s-7.4-2.8-9.5-7Z" }, "f"],
  ["circle", { cx: 12, cy: 12, r: 3 }, "s"],
]);

export const EyeOff = createIcon("eye-off", [
  ["path", { d: "M2.5 12C4.6 7.8 8 5 12 5s7.4 2.8 9.5 7c-2.1 4.2-5.5 7-9.5 7s-7.4-2.8-9.5-7Z" }, "sf"],
  ["circle", { cx: 12, cy: 12, r: 3 }, "s"],
  ["path", { d: "m3 3 18 18" }],
]);

export const Lock = createIcon("lock", [
  ["rect", { x: 4, y: 10, width: 16, height: 12, rx: 3 }, "f"],
  ["path", { d: "M7.5 10V7a4.5 4.5 0 0 1 9 0v3" }, "s"],
  ["path", { d: "M12 14.5v3" }],
]);

export const Unlock = createIcon("unlock", [
  ["rect", { x: 4, y: 10, width: 16, height: 12, rx: 3 }, "f"],
  ["path", { d: "M7.5 10V7a4.5 4.5 0 0 1 8.7-1.6" }, "s"],
  ["path", { d: "M12 14.5v3" }],
]);

export const Key = createIcon("key", [
  ["circle", { cx: 7.5, cy: 16.5, r: 4.5 }, "f"],
  ["path", { d: "m10.7 13.3 9.8-9.8" }],
  ["path", { d: "m17 7 2.5 2.5M14.5 9.5l2 2" }, "s"],
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

export const QuestionCircle = createIcon("question-circle", [
  ["circle", { cx: 12, cy: 12, r: 10 }, "sf"],
  ["path", { d: "M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6" }],
  dot(12, 17),
]);

export const Bolt = createIcon("bolt", [["path", { d: "M13 2 4.5 13.5H12L11 22l8.5-11.5H12Z" }, "f"]]);

export const Flag = createIcon("flag", [
  ["path", { d: "M5 22V3.5" }],
  ["path", { d: "M5 4.5c3.5-2 6.5 2 10 0 1.5-.8 3-.8 4-.5v9c-1-.3-2.5-.3-4 .5-3.5 2-6.5-2-10 0" }, "f"],
]);

export const ThumbsUp = createIcon("thumbs-up", [
  ["rect", { x: 3, y: 10, width: 4, height: 11, rx: 1.5 }, "s"],
  ["path", { d: "m7 11 3.6-7.2a1.9 1.9 0 0 1 3.5 1.3L13.3 9h5.2a2 2 0 0 1 2 2.4L19 19a2.5 2.5 0 0 1-2.5 2H7Z" }, "f"],
]);

export const Sparkles = createIcon("sparkles", [
  ["path", { d: "M10 3.5c.6 3.6 2.4 5.4 6 6-3.6.6-5.4 2.4-6 6-.6-3.6-2.4-5.4-6-6 3.6-.6 5.4-2.4 6-6Z" }, "f"],
  ["path", { d: "M18 14c.3 1.4 1 2.1 2.5 2.5-1.4.4-2.1 1.1-2.5 2.5-.4-1.4-1.1-2.1-2.5-2.5 1.4-.4 2.1-1.1 2.5-2.5Z" }, "s"],
  dot(18.5, 5),
]);

export const BellOff = createIcon("bell-off", [
  ["path", { d: "M18.5 10v.6c0 .9.3 1.8.8 2.5l.7 1c1 1.4.3 3.4-1.4 3.9a29 29 0 0 1-13.2 0c-1.7-.5-2.4-2.5-1.4-3.9l.7-1c.5-.7.8-1.6.8-2.5V10a6.5 6.5 0 0 1 13 0Z" }, "sf"],
  ["path", { d: "M9.5 20.5a3 3 0 0 0 5 0" }, "s"],
  ["path", { d: "m3 3 18 18" }],
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

export const Phone = createIcon("phone", [
  ["path", { d: "M5 3h3l1.5 4.5-2.2 1.4a11 11 0 0 0 7.8 7.8l1.4-2.2L21 16v3a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2Z" }, "f"],
  ["path", { d: "M15 3.5a6 6 0 0 1 5.5 5.5" }, "s"],
]);

export const Send = createIcon("send", [
  ["path", { d: "M20.6 3.4 3.5 9.6a.8.8 0 0 0 0 1.5l7 2.4 2.4 7a.8.8 0 0 0 1.5 0Z" }, "f"],
  ["path", { d: "m10.5 13.5 4.5-4.5" }, "s"],
]);

export const Inbox = createIcon("inbox", [
  ["path", { d: "M3 13.5 5.6 5.9A2 2 0 0 1 7.5 4.5h9a2 2 0 0 1 1.9 1.4l2.6 7.6V18a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18Z" }, "f"],
  ["path", { d: "M3 13.5h5l1 2h6l1-2h5" }, "s"],
]);

export const UserPlus = createIcon("user-plus", [
  ["circle", { cx: 10, cy: 6.5, r: 4 }, "f"],
  ["ellipse", { cx: 10, cy: 17.5, rx: 7, ry: 3.5 }, "s"],
  ["path", { d: "M19 7v6M16 10h6" }],
]);

export const Building = createIcon("building", [
  ["path", { d: "M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" }, "f"],
  ["path", { d: "M16 9h2a2 2 0 0 1 2 2v10" }, "s"],
  ["path", { d: "M8 7h4M8 11h4M8 15h4" }, "s"],
  ["path", { d: "M2.5 21h19" }],
]);

export const Headset = createIcon("headset", [
  ["path", { d: "M4 15v-3a8 8 0 0 1 16 0v3" }, "s"],
  ["rect", { x: 3, y: 13, width: 4, height: 6, rx: 1.5 }, "f"],
  ["rect", { x: 17, y: 13, width: 4, height: 6, rx: 1.5 }, "f"],
  ["path", { d: "M19 19c0 1.5-1.5 2.5-3.5 2.5H13" }],
]);

export const Video = createIcon("video", [
  ["rect", { x: 2.5, y: 6, width: 13, height: 12, rx: 3 }, "f"],
  ["path", { d: "m15.5 10.5 4.4-2.6a1 1 0 0 1 1.6.9v6.4a1 1 0 0 1-1.6.9l-4.4-2.6" }, "s"],
]);

export const Mic = createIcon("mic", [
  ["rect", { x: 9, y: 2.5, width: 6, height: 11, rx: 3 }, "f"],
  ["path", { d: "M5.5 11a6.5 6.5 0 0 0 13 0" }, "s"],
  ["path", { d: "M12 17.5v4M9 21.5h6" }],
]);

export const Map = createIcon("map", [
  ["path", { d: "M9 4 3.7 5.8a1 1 0 0 0-.7 1v12.8a1 1 0 0 0 1.3 1L9 19l6 2 5.3-1.8a1 1 0 0 0 .7-1V4.4a1 1 0 0 0-1.3-1L15 5Z" }, "f"],
  ["path", { d: "M9 4v15M15 5v16" }, "s"],
]);

export const Navigation = createIcon("navigation", [["path", { d: "M12 2.5 19.5 20.5 12 16.5 4.5 20.5Z" }, "f"]]);

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

export const Paperclip = createIcon("paperclip", [
  ["path", { d: "m20.5 11.5-8.1 8.1a5 5 0 0 1-7-7l8.5-8.5a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-2.8-2.8l7.8-7.8" }],
]);

export const Image = createIcon("image", [
  ["rect", { x: 3, y: 3, width: 18, height: 18, rx: 3.5 }, "f"],
  ["circle", { cx: 9, cy: 9, r: 1.75 }, "s"],
  ["path", { d: "m21 15.5-4.4-4.4a1.5 1.5 0 0 0-2.1 0L5 20.5" }, "s"],
]);

export const Camera = createIcon("camera", [
  ["path", { d: "M3 9.5A2.5 2.5 0 0 1 5.5 7h1.8l1.5-2.2a1.5 1.5 0 0 1 1.2-.8h4a1.5 1.5 0 0 1 1.2.8L16.7 7h1.8A2.5 2.5 0 0 1 21 9.5v8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5Z" }, "f"],
  ["circle", { cx: 12, cy: 13.5, r: 3.5 }, "s"],
]);

export const Folder = createIcon("folder", [
  ["path", { d: "M2 7a3 3 0 0 1 3-3h3.6a2 2 0 0 1 1.4.6L11.5 6H19a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3Z" }, "f"],
  ["path", { d: "M2 10h20" }, "s"],
]);

export const Archive = createIcon("archive", [
  ["rect", { x: 2.5, y: 3.5, width: 19, height: 5, rx: 1.5 }, "s"],
  ["path", { d: "M4 8.5V18a2.5 2.5 0 0 0 2.5 2.5h11A2.5 2.5 0 0 0 20 18V8.5" }, "f"],
  ["path", { d: "M10 12.5h4" }],
]);

export const Receipt = createIcon("receipt", [
  ["path", { d: "M5 3.5A1.5 1.5 0 0 1 6.5 2h11A1.5 1.5 0 0 1 19 3.5V22l-2.3-1.5-2.4 1.5-2.3-1.5-2.3 1.5-2.4-1.5L5 22Z" }, "f"],
  ["path", { d: "M9 7h6M9 11h6" }, "s"],
  ["path", { d: "M9 15h3" }],
]);

export const Tag = createIcon("tag", [
  ["path", { d: "M3 4.5A1.5 1.5 0 0 1 4.5 3h6.4a2 2 0 0 1 1.4.6l8.6 8.6a2 2 0 0 1 0 2.8l-6.4 6.4a2 2 0 0 1-2.8 0l-8.6-8.6a2 2 0 0 1-.6-1.4Z" }, "f"],
  ["circle", { cx: 7.5, cy: 7.5, r: 1.5 }, "s"],
]);

export const Cart = createIcon("cart", [
  ["path", { d: "M2.5 3h2l1.2 4" }],
  ["path", { d: "M5.7 7h15.1l-1.8 7.5a2 2 0 0 1-1.9 1.5H8.9a2 2 0 0 1-2-1.6Z" }, "f"],
  ["circle", { cx: 9, cy: 20, r: 1.5 }, "s"],
  ["circle", { cx: 17, cy: 20, r: 1.5 }, "s"],
]);

export const Barcode = createIcon("barcode", [
  ["path", { d: "M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" }, "s"],
  ["path", { d: "M7 8v8M13 8v8M17 8v8" }],
  ["path", { d: "M10 8v8" }, "s"],
]);

export const Clipboard = createIcon("clipboard", [
  ["path", { d: "M8 4.5H7A2.5 2.5 0 0 0 4.5 7v12A2.5 2.5 0 0 0 7 21.5h10a2.5 2.5 0 0 0 2.5-2.5V7A2.5 2.5 0 0 0 17 4.5h-1" }, "f"],
  ["rect", { x: 8, y: 2.5, width: 8, height: 4, rx: 1.5 }, "s"],
  ["path", { d: "M8.5 12h7M8.5 16h4" }, "s"],
]);

export const ClipboardCheck = createIcon("clipboard-check", [
  ["path", { d: "M8 4.5H7A2.5 2.5 0 0 0 4.5 7v12A2.5 2.5 0 0 0 7 21.5h10a2.5 2.5 0 0 0 2.5-2.5V7A2.5 2.5 0 0 0 17 4.5h-1" }, "f"],
  ["rect", { x: 8, y: 2.5, width: 8, height: 4, rx: 1.5 }, "s"],
  ["path", { d: "m9 14 2 2 4-4.5" }],
]);

export const Hourglass = createIcon("hourglass", [
  ["path", { d: "M6.5 3h11M6.5 21h11" }],
  ["path", { d: "M7.5 3v2.5a4.5 4.5 0 0 0 2 3.7L12 12l2.5-2.8a4.5 4.5 0 0 0 2-3.7V3" }, "f"],
  ["path", { d: "M7.5 21v-2.5a4.5 4.5 0 0 1 2-3.7L12 12l2.5 2.8a4.5 4.5 0 0 1 2 3.7V21" }, "s"],
]);

export const History = createIcon("history", [
  ["path", { d: "M4 12a8 8 0 1 0 2.34-5.66" }],
  ["path", { d: "M4 3.5V8h4.5" }, "s"],
  ["path", { d: "M12 8v4l2.5 2" }, "s"],
]);

export const Database = createIcon("database", [
  ["ellipse", { cx: 12, cy: 5.5, rx: 8, ry: 3 }, "f"],
  ["path", { d: "M4 5.5v13c0 1.7 3.6 3 8 3s8-1.3 8-3v-13" }],
  ["path", { d: "M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" }, "s"],
]);

export const PieChart = createIcon("pie-chart", [
  ["path", { d: "M12 3a9 9 0 1 0 9 9h-9Z" }, "f"],
  ["path", { d: "M15 2.5A6.5 6.5 0 0 1 21.5 9H15Z" }, "sf"],
]);

export const TrendingUp = createIcon("trending-up", [
  ["path", { d: "m3 17 6-6 4 4 8-8" }],
  ["path", { d: "M15 7h6v6" }, "s"],
]);

export const TrendingDown = createIcon("trending-down", [
  ["path", { d: "m3 7 6 6 4-4 8 8" }],
  ["path", { d: "M15 17h6v-6" }, "s"],
]);

export const Gauge = createIcon("gauge", [
  ["path", { d: "M3.5 17a9 9 0 1 1 17 0" }, "s"],
  ["path", { d: "m12 14 3.5-4.5" }],
  dot(12, 14, 1.5),
]);

export const CreditCard = createIcon("credit-card", [
  ["rect", { x: 2, y: 5, width: 20, height: 14, rx: 3 }, "f"],
  ["path", { d: "M2 10h20" }, "s"],
  ["path", { d: "M6 15h4" }],
]);

export const Wallet = createIcon("wallet", [
  ["path", { d: "M6 6l9.5-2.8a1.5 1.5 0 0 1 1.9 1.4V6" }, "s"],
  ["rect", { x: 3, y: 6, width: 18, height: 14, rx: 3 }, "f"],
  ["path", { d: "M21 11h-4a2 2 0 0 0 0 4h4" }],
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

/** The weather cloud, and a smaller one riding high to leave room for rain or a bolt. */
const cloud = "M7 19a4.5 4.5 0 0 1-.5-9A6 6 0 0 1 18 9.5a4.75 4.75 0 0 1-.5 9.5Z";
const cloudHigh = "M7 14.5a4 4 0 0 1-.5-8 5.5 5.5 0 0 1 10.6.5 3.75 3.75 0 0 1 .4 7.5Z";

export const Moon = createIcon("moon", [["path", { d: "M20.5 13.5A8.5 8.5 0 1 1 10.5 3.5a7.1 7.1 0 0 0 10 10Z" }, "f"]]);

export const Cloud = createIcon("cloud", [["path", { d: cloud }, "f"]]);

export const CloudRain = createIcon("cloud-rain", [
  ["path", { d: cloudHigh }, "f"],
  ["path", { d: "m8.5 17.5-1 2.5M12.5 17.5l-1 2.5M16.5 17.5l-1 2.5" }, "s"],
]);

export const CloudLightning = createIcon("cloud-lightning", [
  ["path", { d: cloudHigh }, "f"],
  ["path", { d: "m12.5 16-2 3h3l-2 3" }, "s"],
]);

export const Snowflake = createIcon("snowflake", [
  ["path", { d: "M12 2v20M3.34 7l17.32 10M3.34 17l17.32-10" }],
  ["path", { d: "m9.5 3.5 2.5 2 2.5-2M9.5 20.5l2.5-2 2.5 2" }, "s"],
]);

export const Thermometer = createIcon("thermometer", [
  ["path", { d: "M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0Z" }, "f"],
  ["path", { d: "M12 11v6.5" }],
  ["path", { d: "M17 6h2M17 9.5h2" }, "s"],
]);

export const Sunrise = createIcon("sunrise", [
  ["path", { d: "M6.5 17a5.5 5.5 0 0 1 11 0" }, "f"],
  ["path", { d: "M12 3v4.5M4.2 9.2 6 11M19.8 9.2 18 11M2 17h2M20 17h2" }, "s"],
  ["path", { d: "m9.5 5.5 2.5-2.5 2.5 2.5" }, "s"],
  ["path", { d: "M2 20.5h20" }],
]);

export const Fog = createIcon("fog", [
  ["path", { d: "M5 8h14M5 16h14" }, "s"],
  ["path", { d: "M3 12h18M8 20h8" }],
]);

export const Umbrella = createIcon("umbrella", [
  ["path", { d: "M12 3a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9Z" }, "f"],
  ["path", { d: "M12 12v6.5a2 2 0 0 1-4 0" }],
  ["path", { d: "M12 2v1" }, "s"],
]);
