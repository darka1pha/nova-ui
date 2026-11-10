/**
 * Experimental APIs: `@darkalpha/nova-ui/experimental`.
 *
 * Newer components whose API may still change in a minor release; they are not
 * covered by semver until they move to the main entry. Styles ship in the main
 * styles.css, and they work inside the main entry's ThemeProvider.
 */
export { VirtualTable, virtualRange, type VirtualTableApi, type VirtualTableColumn, type VirtualTableProps } from "./components/virtual-table.tsx";
export {
  FileUploader,
  useFileUploads,
  type FileUploaderProps,
  type FileUploads,
  type UploadContext,
  type UseFileUploadsOptions,
} from "./components/file-uploader.tsx";
export { Scheduler, type SchedulerProps, type SchedulerEvent, type SchedulerView, type SchedulerLabels } from "./components/scheduler.tsx";
export { MentionTextarea, type MentionTextareaProps, type MentionOption, type MentionTrigger, type MentionLabels } from "./components/mention-textarea.tsx";
export { TreeSelect, type TreeSelectProps, type TreeSelectSingleProps, type TreeSelectMultipleProps, type TreeSelectLabels } from "./components/tree-select.tsx";
export { ScatterChart, RadarChart, type ScatterChartProps, type RadarChartProps } from "./components/charts.tsx";
export { Splitter, type SplitterPane, type SplitterProps } from "./components/splitter.tsx";
export { QRCode, type QRCodeProps } from "./components/qr-code.tsx";
export { encodeQR, type EncodeQROptions, type QRErrorCorrection, type QRMatrix } from "./utils/qr.ts";
