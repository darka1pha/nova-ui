import { lazy, type ComponentType, type LazyExoticComponent } from "react";

/**
 * Every component page in the docs: its route id, the exports whose props the
 * API reference shows, where its examples live and its accessibility notes.
 * Props come from the TypeScript source (see scripts/api-extractor.ts), so a
 * new component only needs an entry here and an `<Name>Examples` function.
 */

export type CategoryId = "layout" | "actions" | "forms" | "feedback" | "overlays" | "navigation" | "data" | "animation";

export interface Category {
  id: CategoryId;
  label: string;
  lead: string;
}

export const categories: Category[] = [
  { id: "layout", label: "Layout", lead: "Primitives for consistent spacing, responsive grids and a type scale with expressive display sizes." },
  { id: "actions", label: "Actions", lead: "Buttons, toggles and menus. Variants express intent; the active theme decides how they look." },
  { id: "forms", label: "Forms", lead: "Inputs and controls that wire up labels, descriptions and errors automatically through FormField." },
  { id: "feedback", label: "Feedback", lead: "Status, messages and progress. Every status pairs color with an icon or text, so meaning never depends on color alone." },
  { id: "overlays", label: "Overlays", lead: "Dialogs, sheets, popovers, tooltips and the command palette. All trap or manage focus correctly and inherit the theme they open from." },
  { id: "navigation", label: "Navigation", lead: "Tabs, accordions, breadcrumbs, pagination, menus and sidebars." },
  { id: "data", label: "Data display", lead: "Cards, avatars, tables, charts and lists for real product screens." },
  { id: "animation", label: "Animation", lead: "Scroll reveals, counting numbers and decorative effects, all reduced-motion aware." },
];

export interface ComponentEntry {
  /** Route: `#/components/<id>`. */
  id: string;
  name: string;
  /** One line: what it's for. The page lead and the category card text. */
  summary: string;
  category: CategoryId;
  /** Exports documented in the API reference, main component first. */
  parts: string[];
  examples: LazyExoticComponent<ComponentType>;
  a11y?: string[];
}

type Loader = () => Promise<Record<string, unknown>>;
const examples = (load: Loader, name: string) => lazy(() => load().then((m) => ({ default: m[name] as ComponentType })));

const core: Loader = () => import("../examples/core.tsx");
const extras: Loader = () => import("../examples/extras.tsx");
const additions: Loader = () => import("../examples/additions.tsx");
const additionsMore: Loader = () => import("../examples/additions-more.tsx");
const motion: Loader = () => import("../examples/motion.tsx");

export const components: ComponentEntry[] = [
  { id: "typography", name: "Typography", summary: "Headings, body text, links, inline code and keyboard keys on the theme's type scale.", category: "layout", parts: ["Heading", "Text", "Link", "Code", "Kbd"], examples: examples(core, "TypographyExamples") },
  { id: "stack", name: "Stack, Inline & Grid", summary: "Flex and grid layouts whose gaps follow the spacing scale.", category: "layout", parts: ["Stack", "Inline", "Grid", "Container", "Box"], examples: examples(core, "StackExamples") },
  { id: "separator", name: "Separator", summary: "A thin rule between groups of content, horizontal or vertical.", category: "layout", parts: ["Separator"], examples: examples(core, "SeparatorExamples") },
  { id: "skeleton", name: "Skeleton", summary: "Placeholder shapes that hold the layout while content loads.", category: "layout", parts: ["Skeleton"], examples: examples(core, "SkeletonExamples") },
  { id: "spinner", name: "Spinner", summary: "An indeterminate loading indicator for short waits.", category: "layout", parts: ["Spinner"], examples: examples(core, "SpinnerExamples") },
  { id: "resizable", name: "Resizable panels", summary: "Split views people resize by dragging or with the keyboard, with saved layouts.", category: "layout", parts: ["ResizablePanelGroup", "ResizablePanel", "ResizableHandle"], examples: examples(core, "ResizableExamples") },
  { id: "scroll-area", name: "ScrollArea", summary: "A scroll container with slim, themed scrollbars.", category: "layout", parts: ["ScrollArea"], examples: examples(extras, "ScrollAreaExamples") },
  { id: "aspect-ratio", name: "AspectRatio", summary: "Keeps media at a fixed width-to-height ratio.", category: "layout", parts: ["AspectRatio"], examples: examples(extras, "AspectRatioExamples") },
  { id: "button", name: "Button", summary: "Triggers an action. Variants express intent, sizes follow the density.", category: "actions", parts: ["Button", "IconButton"], examples: examples(core, "ButtonExamples"), a11y: ["Buttons render a native <button type=\"button\"> so Enter and Space work and forms are not submitted by accident.", "IconButton requires aria-label at the type level.", "Use a link (asChild with <a>) for navigation and a button for actions."] },
  { id: "button-group", name: "ButtonGroup", summary: "Groups related buttons, optionally attached into one control.", category: "actions", parts: ["ButtonGroup"], examples: examples(core, "ButtonGroupExamples") },
  { id: "toggle", name: "Toggle & ToggleGroup", summary: "Buttons that stay pressed, alone or as a single- or multi-select group.", category: "actions", parts: ["Toggle", "ToggleGroup", "ToggleGroupItem"], examples: examples(core, "ToggleExamples") },
  { id: "segmented-control", name: "SegmentedControl", summary: "A compact single choice between a few options, with a gliding indicator.", category: "actions", parts: ["SegmentedControl", "SegmentedControlItem"], examples: examples(additions, "SegmentedControlExamples") },
  { id: "dropdown-menu", name: "DropdownMenu", summary: "A menu of actions opened from a button.", category: "actions", parts: ["DropdownMenu", "DropdownMenuTrigger", "DropdownMenuContent", "DropdownMenuItem", "DropdownMenuCheckboxItem", "DropdownMenuRadioGroup", "DropdownMenuRadioItem", "DropdownMenuLabel", "DropdownMenuSeparator", "DropdownMenuGroup", "DropdownMenuSub", "DropdownMenuSubTrigger", "DropdownMenuSubContent", "MenuShortcut"], examples: examples(core, "DropdownMenuExamples"), a11y: ["Menus support arrow keys, typeahead, Home/End and Escape, and return focus to the trigger."] },
  { id: "context-menu", name: "ContextMenu", summary: "A menu of actions for an area, opened by right-click.", category: "actions", parts: ["ContextMenu", "ContextMenuTrigger", "ContextMenuContent", "ContextMenuItem", "ContextMenuCheckboxItem", "ContextMenuRadioGroup", "ContextMenuRadioItem", "ContextMenuLabel", "ContextMenuSeparator", "ContextMenuGroup", "ContextMenuSub", "ContextMenuSubTrigger", "ContextMenuSubContent"], examples: examples(core, "ContextMenuExamples"), a11y: ["Menus support arrow keys, typeahead, Home/End and Escape, and return focus to the trigger."] },
  { id: "copy-button", name: "CopyButton", summary: "Copies a value to the clipboard and confirms it.", category: "actions", parts: ["CopyButton"], examples: examples(extras, "CopyButtonExamples") },
  { id: "chip", name: "Chip", summary: "Compact, selectable or removable tokens for filters and tags.", category: "actions", parts: ["Chip"], examples: examples(extras, "ChipExamples") },
  { id: "form-field", name: "FormField", summary: "Wires a label, description and error to any control.", category: "forms", parts: ["FormField", "Fieldset", "Label"], examples: examples(core, "FormFieldExamples"), a11y: ["Every control has a visible focus ring with ≥3:1 contrast, and input borders meet 3:1 against their surface.", "Errors use an icon and text, never color alone.", "Use Fieldset with a legend to name groups of radios or checkboxes."] },
  { id: "input", name: "Input", summary: "Single- and multi-line text fields, with groups for icons and add-ons.", category: "forms", parts: ["Input", "Textarea", "InputGroup", "SearchInput"], examples: examples(core, "InputExamples") },
  { id: "number-input", name: "NumberInput", summary: "A numeric field with steppers, keyboard increments and locale formatting.", category: "forms", parts: ["NumberInput"], examples: examples(core, "NumberInputExamples") },
  { id: "currency-input", name: "CurrencyInput", summary: "A money field that formats with Intl and rounds to the currency's minor units.", category: "forms", parts: ["CurrencyInput"], examples: examples(additions, "CurrencyInputExamples") },
  { id: "phone-input", name: "PhoneInput", summary: "A phone field that formats as you type and stores E.164.", category: "forms", parts: ["PhoneInput"], examples: examples(additions, "PhoneInputExamples") },
  { id: "password-input", name: "PasswordInput", summary: "A password field with show/hide, a strength meter and a requirements checklist.", category: "forms", parts: ["PasswordInput"], examples: examples(core, "PasswordInputExamples"), a11y: ["The toggle is a real button whose label flips between \"Show password\" and \"Hide password\".", "Strength changes are announced politely, and the checklist is linked with aria-describedby, each item saying \"met\" or \"not met\" to screen readers."] },
  { id: "checkbox", name: "Checkbox", summary: "An on/off choice that's submitted with a form, with an indeterminate state.", category: "forms", parts: ["Checkbox"], examples: examples(core, "CheckboxExamples") },
  { id: "radio-group", name: "RadioGroup", summary: "One choice from a short list, all visible at once.", category: "forms", parts: ["RadioGroup", "Radio"], examples: examples(core, "RadioGroupExamples"), a11y: ["Arrow keys move the selection; the group is a single tab stop.", "Wrap the group in a Fieldset with a legend so it has a name."] },
  { id: "switch", name: "Switch", summary: "An on/off setting that applies immediately.", category: "forms", parts: ["Switch"], examples: examples(core, "SwitchExamples") },
  { id: "select", name: "Select", summary: "One choice from a list, in a dropdown.", category: "forms", parts: ["Select", "SelectTrigger", "SelectValue", "SelectContent", "SelectItem", "SelectGroup", "SelectLabel", "SelectSeparator"], examples: examples(core, "SelectExamples") },
  { id: "combobox", name: "Combobox", summary: "One choice from a long list, with search.", category: "forms", parts: ["Combobox"], examples: examples(core, "ComboboxExamples") },
  { id: "slider", name: "Slider", summary: "A value, or a range, picked along a track.", category: "forms", parts: ["Slider"], examples: examples(core, "SliderExamples") },
  { id: "date-picker", name: "DatePicker & Calendar", summary: "A date field with a calendar popover; Gregorian or Jalali.", category: "forms", parts: ["DatePicker", "Calendar"], examples: examples(extras, "DatePickerExamples"), a11y: ["Calendar follows the WAI-ARIA date grid pattern: arrows, Home/End, Page Up/Down (Shift for years); arrows mirror in RTL."] },
  { id: "date-range-picker", name: "DateRangePicker", summary: "A start and end date, with presets.", category: "forms", parts: ["DateRangePicker", "RangeCalendar"], examples: examples(extras, "DateRangePickerExamples") },
  { id: "time-input", name: "TimeInput", summary: "A segmented hour and minute field, 12- or 24-hour.", category: "forms", parts: ["TimeInput"], examples: examples(extras, "TimeInputExamples") },
  { id: "pin-input", name: "PinInput", summary: "One box per character, for codes and PINs.", category: "forms", parts: ["PinInput"], examples: examples(extras, "PinInputExamples"), a11y: ["Every box is labelled (\"Character 2 of 6\"), and autocomplete=\"one-time-code\" lets phones fill SMS codes."] },
  { id: "tag-input", name: "TagInput", summary: "Free-form values entered as removable tags.", category: "forms", parts: ["TagInput"], examples: examples(extras, "TagInputExamples") },
  { id: "file-dropzone", name: "FileDropzone", summary: "Drag-and-drop or browse for files, with type and size checks.", category: "forms", parts: ["FileDropzone"], examples: examples(extras, "FileDropzoneExamples") },
  { id: "file-upload-list", name: "FileUploadList", summary: "Upload progress, success and retry for each file.", category: "forms", parts: ["FileUploadList"], examples: examples(additionsMore, "FileUploadListExamples") },
  { id: "rating", name: "Rating", summary: "A star rating to show or pick.", category: "forms", parts: ["Rating"], examples: examples(extras, "RatingExamples") },
  { id: "color-picker", name: "ColorPicker", summary: "Pick a color by area, hue, hex, swatches or the eyedropper, with a contrast check.", category: "forms", parts: ["ColorPicker", "ColorInput"], examples: examples(additions, "ColorPickerExamples") },
  { id: "inline-edit", name: "InlineEdit", summary: "Text that turns into a field when clicked, with async save.", category: "forms", parts: ["InlineEdit"], examples: examples(additions, "InlineEditExamples") },
  { id: "transfer-list", name: "TransferList", summary: "Move items between an available and a selected list.", category: "forms", parts: ["TransferList"], examples: examples(additionsMore, "TransferListExamples") },
  { id: "alert", name: "Alert", summary: "A message about the page or a task, in four tones.", category: "feedback", parts: ["Alert"], examples: examples(core, "AlertExamples"), a11y: ["Danger and warning alerts use role=\"alert\"; others use role=\"status\" (polite)."] },
  { id: "badge", name: "Badge", summary: "A compact label for status, counts and categories.", category: "feedback", parts: ["Badge"], examples: examples(core, "BadgeExamples") },
  { id: "toast", name: "Toast", summary: "Brief, non-blocking notifications that dismiss themselves.", category: "feedback", parts: ["Toaster"], examples: examples(core, "ToastExamples"), a11y: ["Toasts render in a labelled region (F8 jumps to it), pause on hover/focus and can be swiped away. Error toasts are announced assertively."] },
  { id: "progress", name: "Progress", summary: "Progress of a task, determinate or indeterminate.", category: "feedback", parts: ["Progress"], examples: examples(core, "ProgressExamples"), a11y: ["Progress exposes aria-valuenow; give it an aria-label. Omit value for an indeterminate state."] },
  { id: "circular-progress", name: "CircularProgress", summary: "A ring that shows progress or a percentage.", category: "feedback", parts: ["CircularProgress"], examples: examples(extras, "CircularProgressExamples") },
  { id: "status-indicator", name: "StatusIndicator", summary: "A colored dot and a label for live status.", category: "feedback", parts: ["StatusIndicator"], examples: examples(core, "StatusIndicatorExamples") },
  { id: "empty-state", name: "Empty, error & loading states", summary: "What to show when there's nothing yet, something failed, or it's loading.", category: "feedback", parts: ["EmptyState", "ErrorState", "LoadingState"], examples: examples(core, "EmptyStateExamples") },
  { id: "banner", name: "Banner", summary: "A full-width announcement at the top of a page or section.", category: "feedback", parts: ["Banner"], examples: examples(extras, "BannerExamples") },
  { id: "notification-center", name: "NotificationCenter", summary: "An inbox of notifications with filters, read state and arrival announcements.", category: "feedback", parts: ["NotificationCenter"], examples: examples(extras, "NotificationCenterExamples") },
  { id: "gauge", name: "Gauge", summary: "A dial for one value in a range, with color bands.", category: "feedback", parts: ["Gauge"], examples: examples(additionsMore, "GaugeExamples") },
  { id: "countdown", name: "Countdown", summary: "Time left until a moment, ticking and localized.", category: "feedback", parts: ["Countdown"], examples: examples(additionsMore, "CountdownExamples") },
  { id: "dialog", name: "Dialog & AlertDialog", summary: "A modal window for focused tasks and confirmations.", category: "overlays", parts: ["Dialog", "DialogTrigger", "DialogContent", "DialogHeader", "DialogFooter", "DialogTitle", "DialogDescription", "DialogClose", "AlertDialog", "AlertDialogTrigger", "AlertDialogContent", "AlertDialogHeader", "AlertDialogFooter", "AlertDialogTitle", "AlertDialogDescription", "AlertDialogAction", "AlertDialogCancel"], examples: examples(core, "DialogExamples"), a11y: ["Dialogs trap focus, close on Escape, restore focus to the trigger and need a DialogTitle (a dev warning appears if missing).", "AlertDialog does not close on outside click and focuses the least destructive action first.", "Overlays portal into the nearest ThemeProvider, keeping its theme, mode and dir."] },
  { id: "sheet", name: "Sheet & Drawer", summary: "A panel that slides in from an edge.", category: "overlays", parts: ["Sheet", "SheetTrigger", "SheetContent", "SheetHeader", "SheetFooter", "SheetTitle", "SheetDescription", "SheetClose", "Drawer", "DrawerTrigger", "DrawerContent", "DrawerHeader", "DrawerFooter", "DrawerTitle", "DrawerDescription", "DrawerClose"], examples: examples(core, "SheetExamples"), a11y: ["Sheets are dialogs: they trap focus, close on Escape and restore focus to the trigger."] },
  { id: "popover", name: "Popover", summary: "Rich, interactive content anchored to a trigger.", category: "overlays", parts: ["Popover", "PopoverTrigger", "PopoverContent", "PopoverAnchor", "PopoverClose"], examples: examples(core, "PopoverExamples") },
  { id: "tooltip", name: "Tooltip", summary: "A short label shown on hover and focus.", category: "overlays", parts: ["Tooltip", "TooltipProvider", "TooltipRoot", "TooltipTrigger", "TooltipContent"], examples: examples(core, "TooltipExamples"), a11y: ["Tooltips show on hover and keyboard focus. Never put essential content only in a tooltip."] },
  { id: "hover-card", name: "HoverCard", summary: "A preview of a link's target on hover and focus.", category: "overlays", parts: ["HoverCard", "HoverCardTrigger", "HoverCardContent"], examples: examples(extras, "HoverCardExamples") },
  { id: "command-palette", name: "CommandPalette", summary: "Search and run commands from the keyboard.", category: "overlays", parts: ["CommandPalette", "Command", "CommandInput", "CommandList", "CommandEmpty", "CommandGroup", "CommandItem", "CommandSeparator", "CommandShortcut"], examples: examples(core, "CommandPaletteExamples") },
  { id: "popconfirm", name: "Popconfirm", summary: "A small confirmation anchored to the button that needs it.", category: "overlays", parts: ["Popconfirm"], examples: examples(additionsMore, "PopconfirmExamples") },
  { id: "tour", name: "Tour", summary: "Step-by-step onboarding that points at parts of the page.", category: "overlays", parts: ["Tour"], examples: examples(additions, "TourExamples") },
  { id: "tabs", name: "Tabs", summary: "Switches between views in the same place.", category: "navigation", parts: ["Tabs", "TabsList", "TabsTrigger", "TabsContent"], examples: examples(core, "TabsExamples"), a11y: ["Arrow keys move between tabs and reverse automatically in RTL."] },
  { id: "accordion", name: "Accordion", summary: "Sections that expand and collapse.", category: "navigation", parts: ["Accordion", "AccordionItem", "AccordionTrigger", "AccordionContent"], examples: examples(core, "AccordionExamples") },
  { id: "collapsible", name: "Collapsible", summary: "One region that shows and hides.", category: "navigation", parts: ["Collapsible", "CollapsibleTrigger", "CollapsibleContent"], examples: examples(extras, "CollapsibleExamples") },
  { id: "breadcrumbs", name: "Breadcrumbs", summary: "Where the page sits in the hierarchy.", category: "navigation", parts: ["Breadcrumbs", "BreadcrumbItem"], examples: examples(core, "BreadcrumbsExamples"), a11y: ["Renders a labelled <nav> landmark; the current item gets aria-current=\"page\".", "Separators flip in RTL."] },
  { id: "pagination", name: "Pagination", summary: "Moves between pages of results.", category: "navigation", parts: ["Pagination"], examples: examples(core, "PaginationExamples"), a11y: ["Renders a labelled <nav> landmark; the current page gets aria-current=\"page\".", "Labels (\"Page 3\", \"Next page\") are props, so they can be localized."] },
  { id: "navigation-menu", name: "NavigationMenu", summary: "Site navigation with rich dropdown panels.", category: "navigation", parts: ["NavigationMenu", "NavigationMenuList", "NavigationMenuItem", "NavigationMenuTrigger", "NavigationMenuContent", "NavigationMenuLink"], examples: examples(core, "NavigationMenuExamples") },
  { id: "sidebar", name: "Sidebar", summary: "App navigation that collapses to a rail and becomes a drawer on phones.", category: "navigation", parts: ["SidebarProvider", "Sidebar", "ResponsiveSidebar", "DualSidebar", "RailSidebar", "FloatingSidebar", "SidebarTrigger", "SidebarInset", "SidebarItem", "SidebarSection", "SidebarMenuButton"], examples: examples(core, "SidebarExamples"), a11y: ["Sidebars render a labelled <nav> landmark; the current item gets aria-current=\"page\".", "Ctrl/Cmd+B toggles the sidebar, except while typing in a field or rich-text editor."] },
  { id: "menubar", name: "Menubar", summary: "A desktop-style bar of menus.", category: "navigation", parts: ["Menubar", "MenubarMenu", "MenubarTrigger", "MenubarContent", "MenubarItem", "MenubarCheckboxItem", "MenubarRadioGroup", "MenubarRadioItem", "MenubarLabel", "MenubarSeparator", "MenubarGroup", "MenubarSub", "MenubarSubTrigger", "MenubarSubContent"], examples: examples(extras, "MenubarExamples") },
  { id: "toolbar", name: "Toolbar", summary: "A group of controls with a single tab stop.", category: "navigation", parts: ["Toolbar", "ToolbarButton", "ToolbarLink", "ToolbarSeparator", "ToolbarToggleGroup", "ToolbarToggleItem"], examples: examples(extras, "ToolbarExamples"), a11y: ["The toolbar is a single tab stop; arrow keys move between its controls."] },
  { id: "tree-view", name: "TreeView", summary: "Nested items that expand and select, like a file tree.", category: "navigation", parts: ["TreeView"], examples: examples(extras, "TreeViewExamples") },
  { id: "stepper", name: "Stepper", summary: "Progress through a multi-step flow.", category: "navigation", parts: ["Stepper"], examples: examples(extras, "StepperExamples") },
  { id: "card", name: "Card", summary: "A container for related content.", category: "data", parts: ["Card", "CardHeader", "CardTitle", "CardDescription", "CardContent", "CardFooter"], examples: examples(core, "CardExamples") },
  { id: "avatar", name: "Avatar", summary: "A person's image or initials, with status, alone or stacked.", category: "data", parts: ["Avatar", "AvatarGroup"], examples: examples(core, "AvatarExamples"), a11y: ["Avatars without images expose the person's name as role=\"img\"; status dots have an accessible label."] },
  { id: "data-table", name: "DataTable", summary: "Sorting, search, pagination, selection and column visibility for records.", category: "data", parts: ["DataTable", "Table", "TableHeader", "TableBody", "TableFooter", "TableRow", "TableHead", "TableCell", "TableCaption"], examples: examples(core, "DataTableExamples"), a11y: ["Native table semantics, scope=\"col\" headers, aria-sort on sortable columns and labelled checkboxes."] },
  { id: "line-chart", name: "LineChart & AreaChart", summary: "Trends over time, as lines or filled areas.", category: "data", parts: ["LineChart", "AreaChart"], examples: examples(core, "LineChartExamples"), a11y: ["Charts are labelled figures with a data table that is always available to screen readers and one click away for everyone; the plot is focusable and arrow keys announce each point."] },
  { id: "bar-chart", name: "BarChart", summary: "Compare values across categories.", category: "data", parts: ["BarChart"], examples: examples(core, "BarChartExamples"), a11y: ["Charts are labelled figures with a data table that is always available to screen readers and one click away for everyone."] },
  { id: "donut-chart", name: "DonutChart", summary: "Parts of a whole.", category: "data", parts: ["DonutChart"], examples: examples(core, "DonutChartExamples") },
  { id: "bar-list", name: "BarList", summary: "A ranked list with proportional bars.", category: "data", parts: ["BarList"], examples: examples(core, "BarListExamples"), a11y: ["BarList is a list with visible values, so it reads correctly with a screen reader."] },
  { id: "stat", name: "Stat & Sparkline", summary: "A key number with its change and trend.", category: "data", parts: ["Stat", "Sparkline"], examples: examples(extras, "StatExamples") },
  { id: "timeline", name: "Timeline", summary: "Events in order, with times and icons.", category: "data", parts: ["Timeline"], examples: examples(extras, "TimelineExamples") },
  { id: "carousel", name: "Carousel", summary: "Slides that scroll horizontally, with buttons and dots.", category: "data", parts: ["Carousel"], examples: examples(extras, "CarouselExamples"), a11y: ["Autoplay pauses on hover, on focus and under reduced motion."] },
  { id: "description-list", name: "DescriptionList", summary: "Terms and their values, like a record's details.", category: "data", parts: ["DescriptionList", "DescriptionItem"], examples: examples(additions, "DescriptionListExamples") },
  { id: "relative-time", name: "RelativeTime", summary: "\"3 minutes ago\" that keeps itself current.", category: "data", parts: ["RelativeTime"], examples: examples(additions, "RelativeTimeExamples") },
  { id: "sortable-list", name: "SortableList", summary: "Reorder items by dragging or with the keyboard.", category: "data", parts: ["SortableList"], examples: examples(additions, "SortableListExamples") },
  { id: "virtual-list", name: "VirtualList", summary: "Renders only the rows in view, for lists of any length.", category: "data", parts: ["VirtualList"], examples: examples(additions, "VirtualListExamples") },
  { id: "calendar-heatmap", name: "CalendarHeatmap", summary: "Activity per day across a year.", category: "data", parts: ["CalendarHeatmap"], examples: examples(additions, "CalendarHeatmapExamples") },
  { id: "image", name: "Image & ImageGallery", summary: "Images with a placeholder and a full-screen gallery.", category: "data", parts: ["Image", "ImageGallery", "Lightbox"], examples: examples(additions, "ImageExamples") },
  { id: "code-block", name: "CodeBlock", summary: "Highlighted code with line numbers and copy.", category: "data", parts: ["CodeBlock"], examples: examples(additionsMore, "CodeBlockExamples") },
  { id: "expandable-text", name: "ExpandableText", summary: "Long text clamped to a few lines, with Show more.", category: "data", parts: ["ExpandableText"], examples: examples(additionsMore, "ExpandableTextExamples") },
  { id: "chat", name: "Chat", summary: "Messages, typing indicators and a composer for chat interfaces.", category: "data", parts: ["MessageList", "MessageGroup", "Message", "TypingIndicator", "ChatComposer"], examples: examples(additionsMore, "ChatExamples") },
  { id: "reveal", name: "Reveal", summary: "Animates content in as it scrolls into view.", category: "animation", parts: ["Reveal"], examples: examples(motion, "RevealExamples"), a11y: ["Content is visible without JavaScript and under reduced motion; nothing can get stuck hidden."] },
  { id: "animated-number", name: "AnimatedNumber", summary: "Counts smoothly to new values.", category: "animation", parts: ["AnimatedNumber"], examples: examples(motion, "AnimatedNumberExamples"), a11y: ["Screen readers hear only the final number, not every frame."] },
  { id: "marquee", name: "Marquee", summary: "An endless scrolling row, for logos and highlights.", category: "animation", parts: ["Marquee"], examples: examples(motion, "MarqueeExamples"), a11y: ["Pauses on hover and focus, and is static under reduced motion."] },
  { id: "effects", name: "GradientText & effects", summary: "Gradient text, a pointer spotlight and an animated border for featured content.", category: "animation", parts: ["GradientText", "SpotlightCard", "AnimatedBorder"], examples: examples(motion, "EffectsExamples") },
];

export const componentById = new Map(components.map((c) => [c.id, c]));
