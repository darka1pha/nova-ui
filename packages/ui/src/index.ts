// Theme
export * from "./theme/index.ts";

// Foundation
export { Box, Stack, Inline, Grid, Container, Separator, Divider, VisuallyHidden } from "./components/layout.tsx";
export type { StackProps, InlineProps, GridProps, ContainerProps, SeparatorProps } from "./components/layout.tsx";
export { Text, Heading, Link, Code, Kbd } from "./components/typography.tsx";
export type { TextProps, HeadingProps, LinkProps } from "./components/typography.tsx";
export { Icon, type IconProps } from "./components/icon.tsx";
export { Spinner, type SpinnerProps } from "./components/spinner.tsx";
export { Skeleton, type SkeletonProps } from "./components/skeleton.tsx";
export { Portal, usePortalContainer, type PortalProps } from "./components/portal.tsx";

// Actions
export {
  Button,
  IconButton,
  ButtonGroup,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
  buttonVariants,
} from "./components/button.tsx";
export type {
  ButtonProps,
  ButtonVariant,
  ButtonSize,
  IconButtonProps,
  ButtonGroupProps,
  ToggleProps,
  ToggleGroupProps,
  ToggleGroupItemProps,
} from "./components/button.tsx";
export * from "./components/menu.tsx";

// Forms
export { FormField, Fieldset, Label, useFormField, useFormFieldContext } from "./components/field.tsx";
export type { FormFieldProps, FieldsetProps, LabelProps } from "./components/field.tsx";
export { Input, Textarea, InputGroup, SearchInput, NumberInput, fieldVariants } from "./components/input.tsx";
export type { InputProps, TextareaProps, InputGroupProps, SearchInputProps, NumberInputProps } from "./components/input.tsx";
export { Checkbox, RadioGroup, Radio, RadioGroupItem, Switch, Slider } from "./components/controls.tsx";
export type { CheckboxProps, RadioGroupProps, RadioProps, SwitchProps, SliderProps } from "./components/controls.tsx";
export * from "./components/select.tsx";
export * from "./components/command.tsx";

// Feedback
export { Alert, Badge, Progress, StatusIndicator, EmptyState, ErrorState, LoadingState } from "./components/feedback.tsx";
export type { AlertProps, BadgeProps, BadgeVariant, ProgressProps, StatusIndicatorProps, StateProps, LoadingStateProps } from "./components/feedback.tsx";
export { toast, Toaster, type ToastOptions, type ToasterProps, type ToastPromiseMessage, type ToastPromiseOptions, type ToastVariant } from "./components/toast.tsx";
export * from "./components/overlay.tsx";

// Surfaces & navigation
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Avatar, AvatarGroup } from "./components/surfaces.tsx";
export type { CardProps, AvatarProps, AvatarGroupProps } from "./components/surfaces.tsx";
export * from "./components/navigation.tsx";
export * from "./components/sidebar.tsx";
export * from "./components/table.tsx";

// Data display & visualization
export { BarList, chartColors, type BarListProps, type BarListItem } from "./components/chart.tsx";
export {
  LineChart,
  AreaChart,
  BarChart,
  DonutChart,
  type ChartSeries,
  type LineChartProps,
  type AreaChartProps,
  type BarChartProps,
  type DonutChartProps,
  type DonutChartDatum,
} from "./components/charts.tsx";
export { CircularProgress, Stepper, Timeline, Sparkline, Stat, Banner, Carousel } from "./components/display.tsx";
export type {
  CircularProgressProps,
  StepperProps,
  StepperStep,
  TimelineProps,
  TimelineItem,
  SparklineProps,
  StatProps,
  BannerProps,
  CarouselProps,
} from "./components/display.tsx";

// More inputs
export { Chip, CopyButton, Rating, type ChipProps, type CopyButtonProps, type RatingProps } from "./components/chip.tsx";
export { PinInput, TagInput, FileDropzone, type PinInputProps, type TagInputProps, type FileDropzoneProps } from "./components/entry.tsx";
export { TimeInput, type TimeInputProps, type TimeValue } from "./components/time.tsx";
export { CurrencyInput, PhoneInput, phoneCountries, formatPhoneNumber, parsePhoneNumber, type CurrencyInputProps, type PhoneInputProps, type PhoneCountry, type PhoneValueDetails } from "./components/formatted-input.tsx";
export { SegmentedControl, SegmentedControlItem, type SegmentedControlProps, type SegmentedControlItemProps } from "./components/segmented.tsx";
export { InlineEdit, type InlineEditProps } from "./components/inline-edit.tsx";
export { SortableList, type SortableListProps, type SortableItemState, type SortableMessages } from "./components/sortable.tsx";
export { MultiSelect, type MultiSelectProps, type MultiSelectLabels } from "./components/multi-select.tsx";
export { DateTimePicker, type DateTimePickerProps, type DateTimePickerLabels } from "./components/date-time.tsx";
export { SignaturePad, type SignaturePadProps, type SignaturePadApi, type SignaturePadLabels } from "./components/signature-pad.tsx";
export { KanbanBoard, type KanbanBoardProps, type KanbanColumn, type KanbanMove, type KanbanItemState, type KanbanMessages } from "./components/kanban.tsx";
export { Masonry, type MasonryProps, type MasonryColumns } from "./components/masonry.tsx";
export { InfiniteScroll, type InfiniteScrollProps, type InfiniteScrollLabels } from "./components/infinite-scroll.tsx";
// Data display
export { DescriptionList, DescriptionItem, type DescriptionListProps, type DescriptionItemProps } from "./components/description-list.tsx";
export { RelativeTime, formatRelativeTime, type RelativeTimeProps, type RelativeTimeInput } from "./components/relative-time.tsx";
export { VirtualList, type VirtualListProps, type VirtualListApi } from "./components/virtual-list.tsx";
export { VirtualTable, virtualRange, type VirtualTableApi, type VirtualTableColumn, type VirtualTableProps } from "./components/virtual-table.tsx";
export { CalendarHeatmap, type CalendarHeatmapProps, type HeatmapDatum } from "./components/heatmap.tsx";
export { Image, Lightbox, ImageGallery, type ImageProps, type LightboxProps, type LightboxImage, type LightboxLabels, type ImageGalleryProps } from "./components/media.tsx";
export { Tour, type TourProps, type TourStep, type TourLabels } from "./components/tour.tsx";
export { ColorPicker, ColorInput, defaultSwatches, type ColorPickerProps, type ColorInputProps, type ColorPickerLabels } from "./components/color-picker.tsx";
export { CodeBlock, ExpandableText, type CodeBlockProps, type ExpandableTextProps } from "./components/code-block.tsx";
export { Popconfirm, type PopconfirmProps } from "./components/popconfirm.tsx";
export { Countdown, Gauge, splitDuration, type CountdownParts, type CountdownProps, type GaugeProps } from "./components/countdown.tsx";
export { TransferList, type TransferListProps, type TransferItem, type TransferListLabels } from "./components/transfer-list.tsx";
export { FileUploadList, formatFileSize, type FileUploadListProps, type UploadItem, type UploadStatus, type FileUploadListLabels } from "./components/upload-list.tsx";
export {
  FileUploader,
  useFileUploads,
  type FileUploaderProps,
  type FileUploads,
  type UploadContext,
  type UseFileUploadsOptions,
} from "./components/file-uploader.tsx";
// Chat
export {
  MessageList,
  MessageGroup,
  Message,
  TypingIndicator,
  ChatComposer,
  type MessageListProps,
  type MessageListApi,
  type MessageGroupProps,
  type MessageProps,
  type TypingIndicatorProps,
  type ChatComposerProps,
  type ChatComposerLabels,
} from "./components/chat.tsx";
export { PasswordInput, passwordStrength, passwordRequirements, type PasswordInputProps, type PasswordRequirement, type PasswordScore } from "./components/password.tsx";
export { TreeView, type TreeViewProps, type TreeItem } from "./components/tree.tsx";
export { ResizablePanelGroup, ResizablePanel, ResizableHandle, type ResizablePanelGroupProps, type ResizablePanelProps, type ResizableHandleProps } from "./components/resizable.tsx";
export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarLabel,
  MenubarSeparator,
  MenubarGroup,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
  Toolbar,
  ToolbarButton,
  ToolbarLink,
  ToolbarSeparator,
  ToolbarToggleGroup,
  ToolbarToggleItem,
} from "./components/bars.tsx";
export { NotificationCenter, type NotificationCenterProps, type NotificationItem, type NotificationCategory, type NotificationTone } from "./components/notifications.tsx";
export {
  Calendar,
  DatePicker,
  RangeCalendar,
  DateRangePicker,
  defaultDateRangePresets,
  type CalendarProps,
  type DatePickerProps,
  type DateRange,
  type RangeCalendarProps,
  type DateRangePickerProps,
  type DateRangePreset,
  type DateRangePresetLabels,
} from "./components/calendar.tsx";

// Disclosure & containers
export { Collapsible, CollapsibleTrigger, CollapsibleContent, HoverCard, HoverCardTrigger, HoverCardContent, ScrollArea, AspectRatio } from "./components/disclosure.tsx";
export type { ScrollAreaProps } from "./components/disclosure.tsx";

// Motion
export { Reveal, AnimatedNumber, Marquee, GradientText, SpotlightCard, AnimatedBorder } from "./components/motion.tsx";
export type { RevealProps, AnimatedNumberProps, MarqueeProps, GradientTextProps, SpotlightCardProps, AnimatedBorderProps } from "./components/motion.tsx";
export { ModuleCard } from "./components/module-card.tsx";
export type { ModuleCardProps, ModuleCardTone } from "./components/module-card.tsx";
export { useRipple } from "./components/button.tsx";

// Utilities
export { cn } from "./utils/cn.ts";
export { useComposedRefs } from "./utils/compose-refs.ts";
export {
  toJalali,
  fromJalali,
  isJalaliLeapYear,
  jalaliMonthLength,
  toPersianDigits,
  toLatinDigits,
  type JalaliDate,
} from "./utils/jalali.ts";

// The Kaveh brand kit and the Yalda/Nowruz seasonal artwork live in their own
// entry: @darkalpha/nova-ui/kaveh.

// Token engine re-exports, so most apps need a single import.
export {
  presets,
  createTheme,
  registerTheme,
  listThemes,
  getResolvedTheme,
  auditContrast,
  contrastRatio,
  generateScale,
  isHexColor,
  type ThemeDefinition,
  type BrandColors,
  type ColorMode,
  type PresetName,
  type MotionStyle,
  type ResolvedTheme,
  type SemanticColorName,
} from "@darkalpha/nova-tokens";
