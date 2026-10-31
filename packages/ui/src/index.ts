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
export { toast, Toaster, type ToastOptions, type ToasterProps, type ToastVariant } from "./components/toast.tsx";
export * from "./components/overlay.tsx";

// Surfaces & navigation
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Avatar, AvatarGroup } from "./components/surfaces.tsx";
export type { CardProps, AvatarProps, AvatarGroupProps } from "./components/surfaces.tsx";
export * from "./components/navigation.tsx";
export * from "./components/sidebar.tsx";
export * from "./components/table.tsx";

// Data display & visualization
export { BarList, chartColors, type BarListProps, type BarListItem } from "./components/chart.tsx";
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
export { Calendar, DatePicker, type CalendarProps, type DatePickerProps } from "./components/calendar.tsx";

// Disclosure & containers
export { Collapsible, CollapsibleTrigger, CollapsibleContent, HoverCard, HoverCardTrigger, HoverCardContent, ScrollArea, AspectRatio } from "./components/disclosure.tsx";
export type { ScrollAreaProps } from "./components/disclosure.tsx";

// Motion
export { Reveal, AnimatedNumber, Marquee, GradientText, SpotlightCard, AnimatedBorder } from "./components/motion.tsx";
export type { RevealProps, AnimatedNumberProps, MarqueeProps, GradientTextProps, SpotlightCardProps, AnimatedBorderProps } from "./components/motion.tsx";
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
} from "@kaleido/tokens";
