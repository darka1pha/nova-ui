"use client";

import { Label as LabelPrimitive } from "radix-ui";
import {
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useId,
  type ComponentPropsWithoutRef,
  type FieldsetHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "../utils/cn.ts";

/** The validation state a field is in. Drives control styling and the message tone. */
export type FieldStatus = "invalid" | "warning" | "valid";

interface FormFieldContextValue {
  id: string;
  labelId: string | undefined;
  descriptionId: string | undefined;
  /** Id of the live message region (error, warning or success), when it has content. */
  errorId: string | undefined;
  status: FieldStatus | undefined;
  invalid: boolean;
  required: boolean;
  disabled: boolean;
}

const FormFieldContext = createContext<FormFieldContextValue | null>(null);

/** The surrounding FormField's ids and state, for composite controls that need more than useFormField. */
export function useFormFieldContext(): FormFieldContextValue | null {
  return useContext(FormFieldContext);
}

type FieldControlProps = {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false" | "grammar" | "spelling";
  required?: boolean;
  disabled?: boolean;
};

/**
 * Props a control should spread to be wired to its surrounding FormField:
 * id, aria-describedby, aria-invalid, required, disabled and `data-status`
 * (for valid/warning styling). Safe to call outside a field: it then returns
 * exactly what was passed in.
 */
export function useFormField<P extends FieldControlProps>(props: P): P {
  const field = useContext(FormFieldContext);
  if (!field) return props;
  const describedBy = [props["aria-describedby"], field.descriptionId, field.errorId].filter(Boolean).join(" ") || undefined;
  return {
    ...props,
    id: props.id ?? field.id,
    "aria-describedby": describedBy,
    "aria-invalid": props["aria-invalid"] ?? (field.invalid || undefined),
    required: props.required ?? (field.required || undefined),
    disabled: props.disabled ?? (field.disabled || undefined),
    "data-status": field.status,
  };
}

export interface LabelProps extends ComponentPropsWithoutRef<typeof LabelPrimitive.Root> {
  /** Shows a required marker. The control itself should carry `required`. */
  required?: boolean;
  /** Shows an "optional" hint instead (pass text to localize it). */
  optional?: boolean | ReactNode;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(function Label({ className, required, optional, children, ...props }, ref) {
  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn("inline-flex items-center gap-1 text-sm font-medium text-foreground in-data-disabled:opacity-50", className)}
      {...props}
    >
      {children}
      {required ? (
        <span aria-hidden className="text-danger-text">
          *
        </span>
      ) : optional ? (
        <span className="text-xs font-normal text-foreground-muted">{optional === true ? "(optional)" : optional}</span>
      ) : null}
    </LabelPrimitive.Root>
  );
});

const icons: Record<FieldStatus, ReactNode> = {
  invalid: <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm-.75 3.5h1.5v4.75h-1.5V4.5Zm.75 7.25a.95.95 0 1 1 0-1.9.95.95 0 0 1 0 1.9Z" />,
  warning: <path d="M8.87 1.5a1 1 0 0 0-1.74 0L.63 13a1 1 0 0 0 .87 1.5h13a1 1 0 0 0 .87-1.5L8.87 1.5ZM7.25 5.5h1.5v4.25h-1.5V5.5ZM8 12.6a.9.9 0 1 1 0-1.8.9.9 0 0 1 0 1.8Z" />,
  valid: <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm3.53 5.28-4.25 4.5a.75.75 0 0 1-1.08.01l-1.75-1.75 1.06-1.06 1.2 1.2 3.72-3.93 1.1 1.03Z" />,
};

const tone: Record<FieldStatus, string> = {
  invalid: "text-danger-text",
  warning: "text-warning-text",
  valid: "text-success-text",
};

/** Normalizes a message (string, node, or list of them) into an array without empties. */
function toList(message: ReactNode | ReactNode[] | undefined): ReactNode[] {
  if (message === undefined || message === null || message === false || message === "") return [];
  return (Array.isArray(message) ? message : [message]).filter((m) => m !== undefined && m !== null && m !== false && m !== "");
}

const keyOf = (node: ReactNode, i: number) => (typeof node === "string" || typeof node === "number" ? `${node}` : isValidElement(node) && node.key != null ? String(node.key) : String(i));

export interface FieldMessageProps extends HTMLAttributes<HTMLDivElement> {
  status: FieldStatus;
  /** One message or several (e.g. every failed rule with `criteriaMode: "all"`). */
  messages: ReactNode[];
}

/** The animated, iconified message list under a field. Exported for custom layouts. */
export function FieldMessage({ status, messages, className, ...props }: FieldMessageProps) {
  if (!messages.length) return null;
  const single = messages.length === 1;
  const Item = single ? "p" : "li";
  const items = messages.map((m, i) => (
    // Keyed by text so a new message re-runs the entrance animation.
    <Item key={keyOf(m, i)} className="flex items-start gap-1.5 animate-nv-slide-down">
      <svg viewBox="0 0 16 16" aria-hidden className="mt-0.5 size-3.5 shrink-0 fill-current animate-nv-bounce-in">
        {icons[status]}
      </svg>
      <span>{m}</span>
    </Item>
  ));
  return (
    <div data-status={status} className={cn("text-sm font-medium", tone[status], className)} {...props}>
      {single ? items : <ul className="flex flex-col gap-1">{items}</ul>}
    </div>
  );
}

export interface FormFieldProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  label?: ReactNode;
  /** Helper text shown under the control and linked with aria-describedby. */
  description?: ReactNode;
  /**
   * Error message(s). Marks the control invalid and announces the message.
   * Pass an array to show several (react-hook-form `criteriaMode: "all"`).
   */
  error?: ReactNode | ReactNode[];
  /** A non-blocking caution, e.g. "This email is already subscribed". */
  warning?: ReactNode | ReactNode[];
  /** Positive confirmation, e.g. "Username is available". */
  success?: ReactNode | ReactNode[];
  required?: boolean;
  /** Show an "(optional)" hint next to the label (or pass localized text). */
  optional?: boolean | ReactNode;
  disabled?: boolean;
  /** Explicit control id; generated otherwise. */
  id?: string;
  /** Put label and control on one row (for checkboxes and switches). */
  inline?: boolean;
  children: ReactNode;
}

/**
 * Wraps a control with its label, description and messages, wiring up ids and
 * ARIA so every form is accessible by default. Works with any state source:
 * plain React state, native forms, or react-hook-form (see
 * `@darkalpha/nova-ui/react-hook-form`). Error beats warning beats success.
 */
export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(function FormField(
  { label, description, error, warning, success, required = false, optional, disabled = false, id, inline = false, className, children, ...props },
  ref,
) {
  const auto = useId();
  const controlId = id ?? `nv-field-${auto}`;
  const errors = toList(error);
  const warnings = toList(warning);
  const successes = toList(success);
  const status: FieldStatus | undefined = errors.length ? "invalid" : warnings.length ? "warning" : successes.length ? "valid" : undefined;
  const messages = status === "invalid" ? errors : status === "warning" ? warnings : successes;
  const descriptionId = description ? `${controlId}-description` : undefined;
  const messageId = `${controlId}-message`;
  const labelNode = label ? (
    <Label id={`${controlId}-label`} htmlFor={controlId} required={required} optional={required ? undefined : optional}>
      {label}
    </Label>
  ) : null;
  const descriptionNode = description ? (
    <p id={descriptionId} className="text-sm text-foreground-muted">
      {description}
    </p>
  ) : null;

  return (
    <FormFieldContext.Provider
      value={{
        id: controlId,
        labelId: label ? `${controlId}-label` : undefined,
        descriptionId,
        errorId: status ? messageId : undefined,
        status,
        invalid: status === "invalid",
        required,
        disabled,
      }}
    >
      <div
        ref={ref}
        data-invalid={status === "invalid" ? "" : undefined}
        data-status={status}
        data-disabled={disabled ? "" : undefined}
        className={cn(inline ? "grid grid-cols-[auto_1fr] items-start gap-x-3 gap-y-1" : "flex flex-col gap-1.5", className)}
        {...props}
      >
        {inline ? (
          <>
            <div className="flex min-h-6 items-center">{children}</div>
            <div className="flex flex-col gap-0.5 pt-0.5">
              {labelNode}
              {descriptionNode}
            </div>
          </>
        ) : (
          <>
            {labelNode}
            {children}
            {descriptionNode}
          </>
        )}
        {/* Always rendered so screen readers reliably announce messages as they appear. */}
        <div id={messageId} aria-live="polite" className={cn(inline && "col-start-2", !status && "sr-only")}>
          {status ? <FieldMessage status={status} messages={messages} /> : null}
        </div>
      </div>
    </FormFieldContext.Provider>
  );
});

export interface FieldsetProps extends FieldsetHTMLAttributes<HTMLFieldSetElement> {
  /** Names the group; read out before each control in it. */
  legend: ReactNode;
  description?: ReactNode;
  /** Group-level error (e.g. "Choose at least one"). Announced politely. */
  error?: ReactNode | ReactNode[];
}

/** Groups related fields under a legend (e.g. "Shipping address"). */
export const Fieldset = forwardRef<HTMLFieldSetElement, FieldsetProps>(function Fieldset({ legend, description, error, className, children, ...props }, ref) {
  const errors = toList(error);
  const auto = useId();
  const errorId = `nv-fieldset-${auto}-error`;
  const descriptionId = `nv-fieldset-${auto}-description`;
  const describedBy = [props["aria-describedby"], description ? descriptionId : undefined, errors.length ? errorId : undefined].filter(Boolean).join(" ") || undefined;
  return (
    <fieldset
      ref={ref}
      data-invalid={errors.length ? "" : undefined}
      {...props}
      aria-describedby={describedBy}
      className={cn("m-0 flex min-w-0 flex-col gap-4 p-0 disabled:opacity-60", className)}
    >
      {/* legend must be the fieldset's first child to name the group */}
      <legend className="float-left w-full p-0 text-md font-semibold text-foreground">{legend}</legend>
      {description ? <p id={descriptionId} className="-mt-3 text-sm text-foreground-muted">{description}</p> : null}
      {children}
      <div id={errorId} aria-live="polite" className={errors.length ? undefined : "sr-only"}>
        <FieldMessage status="invalid" messages={errors} />
      </div>
    </fieldset>
  );
});
