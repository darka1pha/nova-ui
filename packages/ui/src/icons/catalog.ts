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
    [E.List, "List", "items rows bullets view"],
    [E.Sort, "Sort", "order ascending descending arrange"],
    [E.MoreHorizontal, "MoreHorizontal", "ellipsis options overflow actions"],
    [E.MoreVertical, "MoreVertical", "kebab options overflow actions"],
    [E.ArrowUp, "ArrowUp", "up increase top"],
    [E.ArrowDown, "ArrowDown", "down decrease bottom"],
    [E.ExternalLink, "ExternalLink", "open new tab outside"],
    [E.Login, "Login", "sign in enter"],
    [E.Plus, "Plus", "add new create"],
    [E.Minus, "Minus", "remove subtract less"],
    [E.Close, "Close", "x dismiss cancel"],
    [E.Check, "Check", "tick done confirm"],
    [E.Share, "Share", "send network distribute"],
    [E.EyeOff, "EyeOff", "hide hidden invisible"],
    [E.Unlock, "Unlock", "open unsecure access"],
    [E.Key, "Key", "password access credential"],
    [E.GripVertical, "GripVertical", "drag handle reorder move"],
    [E.Sidebar, "Sidebar", "panel layout drawer"],
    [E.Maximize, "Maximize", "fullscreen expand enlarge"],
    [E.Minimize, "Minimize", "exit fullscreen shrink collapse"],
    [E.ZoomIn, "ZoomIn", "magnify enlarge plus"],
    [E.ZoomOut, "ZoomOut", "reduce shrink minus"],
    [E.Undo, "Undo", "back revert history"],
    [E.Redo, "Redo", "forward repeat history"],
    [E.Save, "Save", "floppy disk store keep"],
    [E.Print, "Print", "printer paper hard copy"],
    [E.Pin, "Pin", "pushpin stick keep top"],
    [E.Code, "Code", "developer embed brackets html"],
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
    [E.QuestionCircle, "QuestionCircle", "help faq support unknown"],
    [E.Bolt, "Bolt", "lightning power energy fast"],
    [E.Flag, "Flag", "report mark milestone priority"],
    [E.ThumbsUp, "ThumbsUp", "like approve good feedback"],
    [E.Sparkles, "Sparkles", "ai magic new highlight"],
    [E.BellOff, "BellOff", "mute silent notifications off"],
  ]),
  ...group("communication", [
    [E.User, "User", "person profile account"],
    [E.Users, "Users", "team people crew group"],
    [E.Letter, "Letter", "mail email message envelope"],
    [E.Chat, "Chat", "message conversation comment"],
    [E.Globe, "Globe", "world international language"],
    [E.MapPoint, "MapPoint", "location pin place port"],
    [E.Phone, "Phone", "call telephone contact"],
    [E.Send, "Send", "submit message paper plane"],
    [E.Inbox, "Inbox", "mail tray received"],
    [E.UserPlus, "UserPlus", "invite add member signup"],
    [E.Building, "Building", "office company agency headquarters"],
    [E.Headset, "Headset", "support help desk call center"],
    [E.Video, "Video", "camera meeting call record"],
    [E.Mic, "Mic", "microphone voice audio record"],
    [E.Map, "Map", "chart atlas area region"],
    [E.Navigation, "Navigation", "gps direction pointer locate"],
  ]),
  ...group("files", [
    [E.Calendar, "Calendar", "date schedule booking"],
    [E.Clock, "Clock", "time eta etd hours"],
    [E.Document, "Document", "file paper page"],
    [E.Folder, "Folder", "directory files"],
    [E.Chart, "Chart", "bar analytics report statistics"],
    [E.Paperclip, "Paperclip", "attachment attach file"],
    [E.Image, "Image", "picture photo media"],
    [E.Camera, "Camera", "photo capture inspection"],
    [E.Archive, "Archive", "box store history"],
    [E.Receipt, "Receipt", "invoice bill payment charges"],
    [E.Tag, "Tag", "label price category"],
    [E.Cart, "Cart", "shopping basket order"],
    [E.Barcode, "Barcode", "scan sku label tracking"],
    [E.Clipboard, "Clipboard", "checklist notes task paste"],
    [E.ClipboardCheck, "ClipboardCheck", "inspection checklist complete audit"],
    [E.Hourglass, "Hourglass", "waiting pending demurrage timer"],
    [E.History, "History", "recent log timeline past"],
    [E.Database, "Database", "storage server data records"],
    [E.PieChart, "PieChart", "share breakdown analytics"],
    [E.TrendingUp, "TrendingUp", "growth increase rise market"],
    [E.TrendingDown, "TrendingDown", "decline decrease fall market"],
    [E.Gauge, "Gauge", "speed meter performance dashboard"],
    [E.CreditCard, "CreditCard", "payment card billing"],
    [E.Wallet, "Wallet", "balance funds money account"],
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
    [M.Ferry, "Ferry", "passenger ro-ro roro cruise boat"],
    [M.Sailboat, "Sailboat", "yacht sail boat leisure"],
    [M.CruiseShip, "CruiseShip", "liner passenger cruise vessel"],
    [M.FishingBoat, "FishingBoat", "trawler fishery vessel"],
    [M.Radar, "Radar", "arpa scan detection navigation"],
    [M.Binoculars, "Binoculars", "lookout watch observe bridge"],
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
    [M.Forklift, "Forklift", "lift truck handling yard equipment"],
    [M.Silo, "Silo", "bulk grain storage tank terminal"],
  ]),
  ...group("cargo", [
    [M.Container, "Container", "box shipping teu feu"],
    [M.ContainerStack, "ContainerStack", "yard boxes stacking inventory"],
    [M.ReeferContainer, "ReeferContainer", "refrigerated cold chain frozen"],
    [M.Pallet, "Pallet", "package skid breakbulk parcel"],
    [M.Truck, "Truck", "haulage road transport drayage"],
    [M.Package, "Package", "parcel box carton shipment"],
    [M.Train, "Train", "rail railway intermodal freight"],
    [M.Plane, "Plane", "air freight cargo flight airport"],
    [M.Route, "Route", "voyage path itinerary journey"],
    [M.Weight, "Weight", "vgm weighing tonnage scale"],
    [M.Bunkering, "Bunkering", "fuel oil mgo marine fuel"],
    [M.DangerousGoods, "DangerousGoods", "hazmat imdg hazardous"],
  ]),
  ...group("customs", [
    [M.BillOfLading, "BillOfLading", "bl b/l manifest shipping document"],
    [M.CustomsStamp, "CustomsStamp", "clearance approval stamp"],
    [M.Passport, "Passport", "id identity crew travel immigration"],
    [M.Certificate, "Certificate", "class license award origin"],
    [M.PilotFlag, "PilotFlag", "signal flag code pennant"],
    [M.ShieldCheck, "ShieldCheck", "security isps compliance verified"],
  ]),
  ...group("weather", [
    [M.Waves, "Waves", "sea swell water ocean"],
    [M.Tide, "Tide", "high low water level tidal"],
    [E.Wind, "Wind", "breeze gale"],
    [E.Sun, "Sun", "clear weather day"],
    [E.Moon, "Moon", "night dark mode"],
    [E.Cloud, "Cloud", "overcast cloudy sky"],
    [E.CloudRain, "CloudRain", "rain shower precipitation"],
    [E.CloudLightning, "CloudLightning", "storm thunder squall"],
    [E.Snowflake, "Snowflake", "snow ice freezing cold"],
    [E.Thermometer, "Thermometer", "temperature heat celsius"],
    [E.Sunrise, "Sunrise", "dawn sunset morning horizon"],
    [E.Fog, "Fog", "mist haze visibility"],
    [E.Umbrella, "Umbrella", "rain protection insurance cover"],
  ]),
];
