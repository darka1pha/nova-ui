import type { IconComponent } from "./create-icon.ts";
import * as E from "./essentials.ts";
import * as M from "./marine.ts";

/*
 * Searchable metadata for the icon pack: name, group and the words people
 * search for. This module references every icon, so import it only where you
 * need the whole set (docs, icon pickers). Apps should import icons directly.
 */

export interface IconCategory {
  id: string;
  label: string;
  description: string;
}

export interface IconEntry {
  /** Export name, e.g. `ContainerShip`. */
  name: string;
  component: IconComponent;
  category: IconCategory["id"];
  /** Extra search words: synonyms and industry terms. */
  tags: string[];
}

export const iconCategories = [
  { id: "interface", label: "Interface", description: "Navigation, arrows and everyday actions." },
  { id: "status", label: "Status & feedback", description: "Confirmation, warnings, ratings and alerts." },
  { id: "communication", label: "People & places", description: "Users, messages, locations." },
  { id: "files", label: "Files & time", description: "Documents, folders, dates and data." },
  { id: "vessels", label: "Vessels & marine", description: "Ships, boats and onboard equipment." },
  { id: "port", label: "Port & terminal", description: "Berths, cranes, gates and aids to navigation." },
  { id: "cargo", label: "Cargo & logistics", description: "Containers, freight and transport." },
  { id: "customs", label: "Documents & customs", description: "Shipping papers, clearance and signals." },
  { id: "weather", label: "Sea & weather", description: "Sea state, tides and conditions." },
] as const satisfies readonly IconCategory[];

type CategoryId = (typeof iconCategories)[number]["id"];
type Row = [component: IconComponent, name: string, tags: string];

const group = (category: CategoryId, rows: Row[]): IconEntry[] =>
  rows.map(([component, name, tags]) => ({ component, name, category, tags: tags.split(" ").filter(Boolean) }));

export const iconCatalog: IconEntry[] = [
  ...group("interface", [
    [E.Home, "Home", "house start main"],
    [E.Widget, "Widget", "dashboard grid apps overview"],
    [E.Menu, "Menu", "hamburger navigation"],
    [E.Search, "Search", "find magnifier lookup"],
    [E.Settings, "Settings", "gear preferences configure"],
    [E.Filter, "Filter", "funnel sort refine"],
    [E.ChevronDown, "ChevronDown", "expand caret"],
    [E.ChevronUp, "ChevronUp", "collapse caret"],
    [E.ChevronLeft, "ChevronLeft", "back previous"],
    [E.ChevronRight, "ChevronRight", "next forward"],
    [E.ArrowRight, "ArrowRight", "continue forward"],
    [E.ArrowLeft, "ArrowLeft", "back return"],
    [E.Refresh, "Refresh", "reload sync update"],
    [E.Logout, "Logout", "sign out exit"],
    [E.AddCircle, "AddCircle", "plus new create"],
    [E.MinusCircle, "MinusCircle", "remove subtract"],
    [E.Pen, "Pen", "edit write"],
    [E.Trash, "Trash", "delete remove bin"],
    [E.Copy, "Copy", "duplicate clipboard"],
    [E.Download, "Download", "export save"],
    [E.Upload, "Upload", "import attach"],
    [E.Link, "Link", "url chain attach"],
    [E.Eye, "Eye", "view show visible"],
    [E.Lock, "Lock", "secure private password"],
  ]),
  ...group("status", [
    [E.CheckCircle, "CheckCircle", "success done approved"],
    [E.CloseCircle, "CloseCircle", "close cancel error"],
    [E.InfoCircle, "InfoCircle", "information help about"],
    [E.DangerTriangle, "DangerTriangle", "warning alert caution"],
    [E.Bell, "Bell", "notification alert reminder"],
    [E.Star, "Star", "favorite rating"],
    [E.Heart, "Heart", "like favorite love"],
    [E.Bookmark, "Bookmark", "save later"],
  ]),
  ...group("communication", [
    [E.User, "User", "person profile account"],
    [E.Users, "Users", "team people crew group"],
    [E.Letter, "Letter", "mail email message envelope"],
    [E.Chat, "Chat", "message conversation comment"],
    [E.Globe, "Globe", "world international language"],
    [E.MapPoint, "MapPoint", "location pin place port"],
  ]),
  ...group("files", [
    [E.Calendar, "Calendar", "date schedule booking"],
    [E.Clock, "Clock", "time eta etd hours"],
    [E.Document, "Document", "file paper page"],
    [E.Folder, "Folder", "directory files"],
    [E.Chart, "Chart", "bar analytics report statistics"],
  ]),
  ...group("vessels", [
    [M.ContainerShip, "ContainerShip", "vessel feeder boxship teu liner cargo ship"],
    [M.Tugboat, "Tugboat", "tug towage harbor assist towing"],
    [M.Tanker, "Tanker", "lng lpg gas carrier oil chemical"],
    [M.VesselTracking, "VesselTracking", "ais position signal live fleet"],
    [M.Anchor, "Anchor", "anchorage moor port marine"],
    [M.ShipWheel, "ShipWheel", "helm steering captain navigation"],
    [M.Propeller, "Propeller", "screw engine propulsion machinery"],
    [M.LifeBuoy, "LifeBuoy", "ring rescue safety help"],
    [M.LifeJacket, "LifeJacket", "safety vest ppe crew solas"],
    [M.Compass, "Compass", "heading bearing course direction"],
  ]),
  ...group("port", [
    [M.PortCrane, "PortCrane", "sts gantry quay crane lifting stevedoring"],
    [M.Berth, "Berth", "pier quay jetty wharf dock"],
    [M.Bollard, "Bollard", "mooring line rope tie up"],
    [M.TerminalGate, "TerminalGate", "barrier entry access checkpoint"],
    [M.CargoHook, "CargoHook", "lift crane rigging load"],
    [M.Lighthouse, "Lighthouse", "beacon light aid navigation coast"],
    [M.Buoy, "Buoy", "marker channel navigation aid"],
    [M.Warehouse, "Warehouse", "storage depot cfs shed"],
  ]),
  ...group("cargo", [
    [M.Container, "Container", "box shipping teu feu"],
    [M.ContainerStack, "ContainerStack", "yard boxes stacking inventory"],
    [M.ReeferContainer, "ReeferContainer", "refrigerated cold chain frozen"],
    [M.Pallet, "Pallet", "package skid breakbulk parcel"],
    [M.Truck, "Truck", "haulage road transport drayage"],
    [M.Route, "Route", "voyage path itinerary journey"],
    [M.Weight, "Weight", "vgm weighing tonnage scale"],
    [M.Bunkering, "Bunkering", "fuel oil mgo marine fuel"],
    [M.DangerousGoods, "DangerousGoods", "hazmat imdg hazardous"],
  ]),
  ...group("customs", [
    [M.BillOfLading, "BillOfLading", "bl b/l manifest shipping document"],
    [M.CustomsStamp, "CustomsStamp", "clearance approval stamp"],
    [M.PilotFlag, "PilotFlag", "signal flag code pennant"],
    [M.ShieldCheck, "ShieldCheck", "security isps compliance verified"],
  ]),
  ...group("weather", [
    [M.Waves, "Waves", "sea swell water ocean"],
    [M.Tide, "Tide", "high low water level tidal"],
    [E.Wind, "Wind", "breeze gale"],
    [E.Sun, "Sun", "clear weather day"],
  ]),
];
