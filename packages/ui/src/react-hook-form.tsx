"use client";

/**
 * Optional react-hook-form bindings: `@darkalpha/nova-ui/react-hook-form`.
 *
 * Nothing here is needed to use Nova UI forms — FormField and every control
 * work with plain React state or native <form> posts. Import this entry only
 * if your app uses react-hook-form (any resolver: zod, valibot, yup…).
 */
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type FormHTMLAttributes,
  type ReactNode,
  type RefCallback,
} from "react";
import {
  FormProvider,
  get,
  useController,
  useFormContext,
  useFormState,
  type Control,
  type ControllerFieldState,
  type ControllerRenderProps,
  type FieldError,
  type FieldErrors,
  type FieldPath,
  type FieldPathValue,
  type FieldValues,
  type RegisterOptions,
  type SubmitErrorHandler,
  type UseFormReturn,
} from "react-hook-form";
import { Button, type ButtonProps } from "./components/button.tsx";
import { DatePicker, type DatePickerProps } from "./components/calendar.tsx";
import { Rating, type RatingProps } from "./components/chip.tsx";
import { Combobox, type ComboboxOption, type ComboboxProps } from "./components/command.tsx";
import { Checkbox, Radio, RadioGroup, Slider, Switch, type CheckboxProps, type SliderProps, type SwitchProps } from "./components/controls.tsx";
import { FileDropzone, PinInput, TagInput, type FileDropzoneProps, type PinInputProps, type TagInputProps } from "./components/entry.tsx";
import { Alert, type AlertProps } from "./components/feedback.tsx";
import { FormField, Label, type FormFieldProps } from "./components/field.tsx";
import { Input, NumberInput, Textarea, type InputProps, type NumberInputProps, type TextareaProps } from "./components/input.tsx";
import { PasswordInput, type PasswordInputProps } from "./components/password.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, type SelectTriggerProps } from "./components/select.tsx";
import { cn } from "./utils/cn.ts";

/* ------------------------------------------------------------ Form context */

export interface FormMessages {
  /** Fallback for errors that have no message (e.g. `rules={{ required: true }}`). */
  required: string;
  invalid: string;
  /** Title of the error summary. */
  summaryTitle: (count: number) => string;
  /** Title of the server / root error alert. */
  serverErrorTitle: string;
}

const defaultMessages: FormMessages = {
  required: "This field is required.",
  invalid: "This value is not valid.",
  summaryTitle: (n) => (n === 1 ? "Please fix 1 problem" : `Please fix ${n} problems`),
  serverErrorTitle: "Something went wrong",
};

interface NovaFormContextValue {
  schema: unknown;
  indicate: "required" | "optional";
  messages: FormMessages;
  formatError: ((error: FieldError, name: string) => ReactNode) | undefined;
  /** Field labels by name, so summaries can say "Email: …" instead of "email". */
  labels: Map<string, ReactNode>;
}

const NovaFormContext = createContext<NovaFormContextValue | null>(null);
const useNovaForm = () => useContext(NovaFormContext);

/* ------------------------------------------------------- Schema inspection */

interface SchemaLike {
  shape?: Record<string, unknown> | (() => Record<string, unknown>);
  element?: unknown;
  isOptional?: () => boolean;
  isNullable?: () => boolean;
  unwrap?: () => unknown;
  def?: { innerType?: unknown; in?: unknown; type?: string };
  _def?: { innerType?: unknown; schema?: unknown; typeName?: string };
}

/** Peels wrappers (optional, nullable, default, effects/pipe) off a zod-like schema. */
function unwrapSchema(node: unknown, depth = 0): SchemaLike | undefined {
  const s = node as SchemaLike | undefined;
  if (!s || typeof s !== "object" || depth > 8) return s;
  if (s.shape || s.element) return s;
  const inner = s.def?.innerType ?? s.def?.in ?? s._def?.innerType ?? s._def?.schema;
  return inner ? unwrapSchema(inner, depth + 1) : s;
}

/**
 * Whether a field is required according to a zod (v3 or v4) object schema.
 * Works for nested paths ("address.city") and arrays ("items.0.name").
 * Returns undefined when the schema can't be read, so callers can fall back.
 */
export function isSchemaFieldRequired(schema: unknown, path: string): boolean | undefined {
  const field = schemaNode(schema, path);
  if (!field || typeof field.isOptional !== "function") return undefined;
  return !(field.isOptional() || field.isNullable?.());
}

/** True when the schema demands the literal `true` (e.g. "accept the terms"). */
export function isSchemaLiteralTrue(schema: unknown, path: string): boolean {
  const field = unwrapSchema(schemaNode(schema, path)) as (SchemaLike & { def?: { values?: unknown[] }; _def?: { value?: unknown } }) | undefined;
  const values = field?.def?.values ?? (field?._def && "value" in field._def ? [field._def.value] : undefined);
  return Array.isArray(values) && values.length === 1 && values[0] === true;
}

function schemaNode(schema: unknown, path: string): SchemaLike | undefined {
  let node: unknown = schema;
  for (const segment of path.split(".")) {
    const container = unwrapSchema(node);
    if (!container) return undefined;
    if (/^\d+$/.test(segment) && container.element) {
      node = container.element;
      continue;
    }
    const shape = typeof container.shape === "function" ? container.shape() : container.shape;
    if (!shape || !(segment in shape)) return undefined;
    node = shape[segment];
  }
  return node as SchemaLike | undefined;
}

/* ------------------------------------------------------------------ Errors */

/** Thrown from `onSubmit` to show server-side errors on the form and on fields. */
export class FormError extends Error {
  readonly fieldErrors: Record<string, string>;
  constructor(message: string, options: { fieldErrors?: Record<string, string> } = {}) {
    super(message);
    this.name = "FormError";
    this.fieldErrors = options.fieldErrors ?? {};
  }
}

/** Every message on a field error, including all criteria with `criteriaMode: "all"`. */
export function errorMessages(error: FieldError | undefined, messages: FormMessages = defaultMessages): string[] {
  if (!error) return [];
  const all = error.types
    ? Object.values(error.types).flatMap((v) => (Array.isArray(v) ? v : [v])).filter((v): v is string => typeof v === "string" && v.length > 0)
    : [];
  if (all.length) return [...new Set(all)];
  if (error.message) return [String(error.message)];
  return [error.type === "required" ? messages.required : messages.invalid];
}

interface FlatError {
  name: string;
  messages: string[];
}

/** Flattens nested RHF errors ({ address: { city: … } }) into named entries. */
function flattenErrors(errors: FieldErrors, prefix = "", out: FlatError[] = [], messages = defaultMessages): FlatError[] {
  for (const [key, value] of Object.entries(errors ?? {})) {
    if (!value || key === "root") continue;
    const name = prefix ? `${prefix}.${key}` : key;
    const err = value as FieldError & Record<string, unknown>;
    if (typeof err.type === "string" || typeof err.message === "string") out.push({ name, messages: errorMessages(err, messages) });
    else flattenErrors(value as FieldErrors, name, out, messages);
  }
  return out;
}

/* -------------------------------------------------------------------- Form */

export interface FormProps<T extends FieldValues> extends Omit<FormHTMLAttributes<HTMLFormElement>, "onSubmit" | "onInvalid"> {
  /** The object returned by `useForm()`. */
  form: UseFormReturn<T>;
  /**
   * Called with validated values. May be async. Throw a `FormError` (or any
   * Error) to show server errors: the message appears in `<FormRootError>` and
   * `fieldErrors` attach to individual fields.
   */
  onSubmit: (values: T) => unknown;
  onInvalid?: SubmitErrorHandler<T>;
  /**
   * Your zod object schema (optional). Used only to mark required fields
   * automatically; validation itself happens in your resolver.
   */
  schema?: unknown;
  /** Mark required fields with an asterisk (default) or optional ones with "(optional)". */
  indicate?: "required" | "optional";
  /** Disable every control while submitting (default true). */
  disableWhileSubmitting?: boolean;
  /** Localize built-in texts. */
  messages?: Partial<FormMessages>;
  /** Customize how any field error renders (translation, links…). */
  formatError?: (error: FieldError, name: string) => ReactNode;
}

/**
 * Connects a react-hook-form instance to Nova UI fields: provides context,
 * prevents native validation bubbles, handles async submit + server errors,
 * and disables the form while submitting.
 */
export function Form<T extends FieldValues>({
  form,
  onSubmit,
  onInvalid,
  schema,
  indicate = "required",
  disableWhileSubmitting = true,
  messages,
  formatError,
  className,
  children,
  ...props
}: FormProps<T>) {
  const [labels] = useState(() => new Map<string, ReactNode>());
  const messageKey = JSON.stringify(Object.keys(messages ?? {}));
  const value = useMemo<NovaFormContextValue>(
    () => ({ schema, indicate, messages: { ...defaultMessages, ...messages }, formatError, labels }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [schema, indicate, messageKey, formatError, labels],
  );

  const submit = (event: FormEvent<HTMLFormElement>) => {
    form.clearErrors("root");
    return form.handleSubmit(async (values) => {
      try {
        await onSubmit(values);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        form.setError("root.server", { type: "server", message });
        if (error instanceof FormError) {
          for (const [name, fieldMessage] of Object.entries(error.fieldErrors)) {
            form.setError(name as FieldPath<T>, { type: "server", message: fieldMessage }, { shouldFocus: true });
          }
        }
      }
    }, onInvalid)(event);
  };

  return (
    <FormProvider {...form}>
      <NovaFormContext.Provider value={value}>
        <form noValidate onSubmit={submit} className={cn("flex flex-col gap-5", className)} {...props}>
          {/* display: contents keeps your layout while letting `disabled` cover every control. */}
          <SubmittingFieldset enabled={disableWhileSubmitting}>{children}</SubmittingFieldset>
        </form>
      </NovaFormContext.Provider>
    </FormProvider>
  );
}

function SubmittingFieldset({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const { isSubmitting } = useFormState();
  if (!enabled) return <>{children}</>;
  return (
    <fieldset disabled={isSubmitting} aria-busy={isSubmitting || undefined} className="contents">
      {children}
    </fieldset>
  );
}

/* ---------------------------------------------------------- FormController */

/** Props every bound field accepts, on top of FormField's own. */
/** The FormField props a bound field forwards (layout and messages, not DOM attributes). */
export type FieldLayoutProps = Pick<FormFieldProps, "label" | "description" | "warning" | "success" | "optional" | "inline" | "className" | "disabled">;

export interface BoundFieldProps<T extends FieldValues, N extends FieldPath<T>> extends FieldLayoutProps {
  name: N;
  /** Pass `form.control` to get typed `name` autocompletion; otherwise read from <Form>. */
  control?: Control<T>;
  /** Extra react-hook-form rules (with a resolver you usually don't need these). */
  rules?: Omit<RegisterOptions<T, N>, "valueAsNumber" | "valueAsDate" | "setValueAs" | "disabled">;
  defaultValue?: FieldPathValue<T, N>;
  shouldUnregister?: boolean;
  /** Overrides the required marker (otherwise derived from the schema or rules). */
  required?: boolean;
  /** Shown once the field has been touched and is valid, e.g. "Looks good!". */
  successMessage?: ReactNode;
}

export interface FormControllerRenderProps<T extends FieldValues, N extends FieldPath<T>> {
  field: ControllerRenderProps<T, N>;
  fieldState: ControllerFieldState;
  /**
   * A ref for controls whose root isn't focusable (groups, dropzones): it
   * forwards RHF's focus-on-error to the first focusable element inside.
   */
  focusRef: RefCallback<HTMLElement>;
}

export interface FormControllerProps<T extends FieldValues, N extends FieldPath<T>> extends BoundFieldProps<T, N> {
  render: (props: FormControllerRenderProps<T, N>) => ReactNode;
}

const FOCUSABLE = 'input:not([type="hidden"]):not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"]), select, textarea';

/**
 * Binds any control to a react-hook-form field inside a FormField: label,
 * required marker, description, error/success messages, ARIA and focus.
 * The building block for every `Form*` component — use it for custom controls.
 */
export function FormController<T extends FieldValues = FieldValues, N extends FieldPath<T> = FieldPath<T>>({
  name,
  control,
  rules,
  defaultValue,
  shouldUnregister,
  required,
  successMessage,
  label,
  render,
  ...fieldProps
}: FormControllerProps<T, N>) {
  const ctx = useNovaForm();
  const { field, fieldState } = useController<T, N>({ name, control, rules: rules as RegisterOptions<T, N>, defaultValue, shouldUnregister });

  useEffect(() => {
    if (!ctx || label === undefined) return;
    ctx.labels.set(name, label);
    return () => {
      ctx.labels.delete(name);
    };
  }, [ctx, name, label]);

  const fieldRef = field.ref;
  const focusRef = useCallback<RefCallback<HTMLElement>>(
    (el) => {
      fieldRef(el ? { focus: () => el.querySelector<HTMLElement>(FOCUSABLE)?.focus() } : null);
    },
    [fieldRef],
  );

  const schemaRequired = ctx?.schema ? isSchemaFieldRequired(ctx.schema, name) : undefined;
  const isRequired = required ?? schemaRequired ?? !!rules?.required;
  const messages = ctx?.messages ?? defaultMessages;
  const error = fieldState.error
    ? ctx?.formatError
      ? ctx.formatError(fieldState.error, name)
      : errorMessages(fieldState.error, messages)
    : undefined;
  const showSuccess = !!successMessage && !fieldState.invalid && fieldState.isTouched && fieldState.isDirty;

  return (
    <FormField
      {...fieldProps}
      label={label}
      required={isRequired}
      optional={ctx?.indicate === "optional" && !isRequired ? true : fieldProps.optional}
      error={error}
      success={showSuccess ? successMessage : fieldProps.success}
      disabled={field.disabled || fieldProps.disabled}
      data-name={name}
    >
      {render({ field, fieldState, focusRef })}
    </FormField>
  );
}

/* ------------------------------------------------------- Bound components */

type Bound<T extends FieldValues, N extends FieldPath<T>, P> = BoundFieldProps<T, N> & Omit<P, "name" | "value" | "defaultValue" | "onChange" | "onBlur" | "id" | "required" | "disabled" | "children">;

/** Text input bound to a field. Empty strings stay strings; use FormNumberInput for numbers. */
export function FormInput<T extends FieldValues = FieldValues, N extends FieldPath<T> = FieldPath<T>>({ name, control, rules, defaultValue, shouldUnregister, required, successMessage, label, description, warning, success, optional, inline, className, ...input }: Bound<T, N, InputProps>) {
  return (
    <FormController<T, N>
      {...{ name, control, rules, defaultValue, shouldUnregister, required, successMessage, label, description, warning, success, optional, inline, className }}
      render={({ field }) => <Input {...input} {...field} value={field.value ?? ""} />}
    />
  );
}

export function FormTextarea<T extends FieldValues = FieldValues, N extends FieldPath<T> = FieldPath<T>>({ name, control, rules, defaultValue, shouldUnregister, required, successMessage, label, description, warning, success, optional, inline, className, ...textarea }: Bound<T, N, TextareaProps>) {
  return (
    <FormController<T, N>
      {...{ name, control, rules, defaultValue, shouldUnregister, required, successMessage, label, description, warning, success, optional, inline, className }}
      render={({ field }) => <Textarea {...textarea} {...field} value={field.value ?? ""} />}
    />
  );
}

/** Password field bound to a field. `requirements` is the checklist; validation still belongs in the schema or `rules`. */
export function FormPasswordInput<T extends FieldValues = FieldValues, N extends FieldPath<T> = FieldPath<T>>({ name, control, rules, defaultValue, shouldUnregister, required, successMessage, label, description, warning, success, optional, inline, className, ...input }: Bound<T, N, PasswordInputProps>) {
  return (
    <FormController<T, N>
      {...{ name, control, rules, defaultValue, shouldUnregister, required, successMessage, label, description, warning, success, optional, inline, className }}
      render={({ field }) => <PasswordInput {...input} {...field} value={field.value ?? ""} />}
    />
  );
}

/** Stores `number | null` (never a string), ready for `z.number()`. */
export function FormNumberInput<T extends FieldValues = FieldValues, N extends FieldPath<T> = FieldPath<T>>({ name, control, rules, defaultValue, shouldUnregister, required, successMessage, label, description, warning, success, optional, inline, className, ...input }: Bound<T, N, NumberInputProps>) {
  return (
    <FormController<T, N>
      {...{ name, control, rules, defaultValue, shouldUnregister, required, successMessage, label, description, warning, success, optional, inline, className }}
      render={({ field }) => <NumberInput {...input} ref={field.ref} name={field.name} value={field.value ?? null} onValueChange={field.onChange} onBlur={field.onBlur} />}
    />
  );
}

/** Stores a boolean. Label sits beside the box. */
export function FormCheckbox<T extends FieldValues = FieldValues, N extends FieldPath<T> = FieldPath<T>>({ name, control, rules, defaultValue, shouldUnregister, required: requiredProp, successMessage, label, description, warning, success, optional, inline = true, className, ...checkbox }: Bound<T, N, CheckboxProps>) {
  // A checkbox always has a value, so it's only "required" when it must be ticked.
  const schema = useNovaForm()?.schema;
  const required = requiredProp ?? (schema ? isSchemaLiteralTrue(schema, name) : !!rules?.required);
  return (
    <FormController<T, N>
      {...{ name, control, rules, defaultValue, shouldUnregister, required, successMessage, label, description, warning, success, optional, inline, className }}
      render={({ field }) => (
        <Checkbox {...checkbox} ref={field.ref} name={field.name} checked={!!field.value} onCheckedChange={(v) => field.onChange(v === true)} onBlur={field.onBlur} />
      )}
    />
  );
}

/** Stores a boolean. */
export function FormSwitch<T extends FieldValues = FieldValues, N extends FieldPath<T> = FieldPath<T>>({ name, control, rules, defaultValue, shouldUnregister, required = false, successMessage, label, description, warning, success, optional, inline = true, className, ...sw }: Bound<T, N, SwitchProps>) {
  return (
    <FormController<T, N>
      {...{ name, control, rules, defaultValue, shouldUnregister, required, successMessage, label, description, warning, success, optional, inline, className }}
      render={({ field }) => <Switch {...sw} ref={field.ref} name={field.name} checked={!!field.value} onCheckedChange={field.onChange} onBlur={field.onBlur} />}
    />
  );
}

export interface FormOption {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

/** One choice from a short list, shown as radios. Stores the option's value. */
export function FormRadioGroup<T extends FieldValues = FieldValues, N extends FieldPath<T> = FieldPath<T>>({
  options,
  orientation = "vertical",
  name,
  control,
  rules,
  defaultValue,
  shouldUnregister,
  required,
  successMessage,
  label,
  description,
  warning,
  success,
  optional,
  className,
}: BoundFieldProps<T, N> & { options: FormOption[]; orientation?: "horizontal" | "vertical" }) {
  return (
    <FormController<T, N>
      {...{ name, control, rules, defaultValue, shouldUnregister, required, successMessage, label, description, warning, success, optional, className }}
      render={({ field, focusRef }) => (
        <RadioGroup ref={focusRef} name={field.name} value={field.value ?? ""} onValueChange={field.onChange} onBlur={field.onBlur} orientation={orientation}>
          {options.map((o) => {
            const id = `${field.name}-${o.value}`;
            return (
              <div key={o.value} className="flex items-start gap-2">
                <Radio value={o.value} id={id} disabled={o.disabled} className="mt-px" />
                <div className="flex flex-col">
                  <Label htmlFor={id}>{o.label}</Label>
                  {o.description ? <span className="text-sm text-foreground-muted">{o.description}</span> : null}
                </div>
              </div>
            );
          })}
        </RadioGroup>
      )}
    />
  );
}

/** One choice from a dropdown. Stores the option's value (or "" when unset). */
export function FormSelect<T extends FieldValues = FieldValues, N extends FieldPath<T> = FieldPath<T>>({
  options,
  placeholder = "Select…",
  name,
  control,
  rules,
  defaultValue,
  shouldUnregister,
  required,
  successMessage,
  label,
  description,
  warning,
  success,
  optional,
  className,
  ...trigger
}: BoundFieldProps<T, N> & { options: FormOption[]; placeholder?: string } & Omit<SelectTriggerProps, "name" | "id" | "children" | "disabled">) {
  return (
    <FormController<T, N>
      {...{ name, control, rules, defaultValue, shouldUnregister, required, successMessage, label, description, warning, success, optional, className }}
      render={({ field }) => (
        <Select
          name={field.name}
          value={field.value ?? ""}
          onValueChange={field.onChange}
          onOpenChange={(open) => {
            if (!open) field.onBlur();
          }}
        >
          <SelectTrigger {...trigger} ref={field.ref} onBlur={field.onBlur}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={o.value} value={o.value} disabled={o.disabled}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  );
}

/** Searchable single choice. Stores the option's value or null. */
export function FormCombobox<T extends FieldValues = FieldValues, N extends FieldPath<T> = FieldPath<T>>({ name, control, rules, defaultValue, shouldUnregister, required, successMessage, label, description, warning, success, optional, className, ...combo }: Bound<T, N, ComboboxProps> & { options: ComboboxOption[] }) {
  return (
    <FormController<T, N>
      {...{ name, control, rules, defaultValue, shouldUnregister, required, successMessage, label, description, warning, success, optional, className }}
      render={({ field }) => <Combobox {...combo} ref={field.ref} name={field.name} value={field.value ?? null} onValueChange={field.onChange} onBlur={field.onBlur} />}
    />
  );
}

/** Stores a `Date` or null, ready for `z.date()`. */
export function FormDatePicker<T extends FieldValues = FieldValues, N extends FieldPath<T> = FieldPath<T>>({ name, control, rules, defaultValue, shouldUnregister, required, successMessage, label, description, warning, success, optional, className, ...picker }: Bound<T, N, DatePickerProps>) {
  return (
    <FormController<T, N>
      {...{ name, control, rules, defaultValue, shouldUnregister, required, successMessage, label, description, warning, success, optional, className }}
      render={({ field }) => (
        <DatePicker
          {...picker}
          ref={field.ref}
          name={field.name}
          value={field.value ?? null}
          onValueChange={field.onChange}
          onClear={() => field.onChange(null)}
          onBlur={field.onBlur}
        />
      )}
    />
  );
}

/** Stores a number, or `[min, max]` when `range` is set. */
export function FormSlider<T extends FieldValues = FieldValues, N extends FieldPath<T> = FieldPath<T>>({
  range = false,
  name,
  control,
  rules,
  defaultValue,
  shouldUnregister,
  required,
  successMessage,
  label,
  description,
  warning,
  success,
  optional,
  className,
  ...slider
}: Bound<T, N, SliderProps> & { range?: boolean }) {
  return (
    <FormController<T, N>
      {...{ name, control, rules, defaultValue, shouldUnregister, required, successMessage, label, description, warning, success, optional, className }}
      render={({ field, focusRef }) => (
        <Slider
          {...slider}
          ref={focusRef}
          name={field.name}
          value={range ? (field.value ?? [slider.min ?? 0, slider.max ?? 100]) : [field.value ?? slider.min ?? 0]}
          onValueChange={(v) => field.onChange(range ? v : v[0])}
          onBlur={field.onBlur}
        />
      )}
    />
  );
}

/** Stores the code as a string. */
export function FormPinInput<T extends FieldValues = FieldValues, N extends FieldPath<T> = FieldPath<T>>({ name, control, rules, defaultValue, shouldUnregister, required, successMessage, label, description, warning, success, optional, className, ...pin }: Bound<T, N, PinInputProps>) {
  return (
    <FormController<T, N>
      {...{ name, control, rules, defaultValue, shouldUnregister, required, successMessage, label, description, warning, success, optional, className }}
      render={({ field, focusRef }) => <PinInput {...pin} ref={focusRef} name={field.name} value={field.value ?? ""} onValueChange={field.onChange} onBlur={field.onBlur} />}
    />
  );
}

/** Stores a string array, ready for `z.array(z.string())`. */
export function FormTagInput<T extends FieldValues = FieldValues, N extends FieldPath<T> = FieldPath<T>>({ name, control, rules, defaultValue, shouldUnregister, required, successMessage, label, description, warning, success, optional, className, ...tags }: Bound<T, N, TagInputProps>) {
  return (
    <FormController<T, N>
      {...{ name, control, rules, defaultValue, shouldUnregister, required, successMessage, label, description, warning, success, optional, className }}
      render={({ field, focusRef }) => <TagInput {...tags} ref={focusRef} name={field.name} value={field.value ?? []} onValueChange={field.onChange} onBlur={field.onBlur} />}
    />
  );
}

/** Stores a number (0 = unrated). */
export function FormRating<T extends FieldValues = FieldValues, N extends FieldPath<T> = FieldPath<T>>({ name, control, rules, defaultValue, shouldUnregister, required, successMessage, label, description, warning, success, optional, className, ...rating }: Bound<T, N, RatingProps>) {
  return (
    <FormController<T, N>
      {...{ name, control, rules, defaultValue, shouldUnregister, required, successMessage, label, description, warning, success, optional, className }}
      render={({ field, focusRef }) => (
        <Rating {...rating} ref={focusRef} name={field.name} value={field.value ?? 0} onValueChange={field.onChange} onBlur={field.onBlur} />
      )}
    />
  );
}

/** Stores `File[]`, ready for `z.array(z.instanceof(File))`. */
export function FormFileDropzone<T extends FieldValues = FieldValues, N extends FieldPath<T> = FieldPath<T>>({ name, control, rules, defaultValue, shouldUnregister, required, successMessage, label, description, warning, success, optional, className, ...dropzone }: Bound<T, N, FileDropzoneProps>) {
  return (
    <FormController<T, N>
      {...{ name, control, rules, defaultValue, shouldUnregister, required, successMessage, label, warning, success, optional, className }}
      render={({ field, focusRef }) => (
        <FileDropzone {...dropzone} description={description} ref={focusRef} name={field.name} files={field.value ?? []} onFilesChange={field.onChange} onBlur={field.onBlur} />
      )}
    />
  );
}

/* --------------------------------------------------- Form-level feedback */

export interface FormSubmitProps extends ButtonProps {
  /** Keep the button disabled until something changed. */
  disableUntilDirty?: boolean;
}

/** Submit button that shows a spinner (and `loadingText`) while the form submits. */
export const FormSubmit = forwardRef<HTMLButtonElement, FormSubmitProps>(function FormSubmit({ disableUntilDirty = false, disabled, children, ...props }, ref) {
  const { isSubmitting, isDirty } = useFormState();
  return (
    <Button ref={ref} type="submit" loading={isSubmitting} disabled={disabled || (disableUntilDirty && !isDirty)} {...props}>
      {children ?? "Submit"}
    </Button>
  );
});

/** Resets the form to its default values. */
export const FormReset = forwardRef<HTMLButtonElement, ButtonProps>(function FormReset({ onClick, variant = "ghost", children, ...props }, ref) {
  const { reset } = useFormContext();
  return (
    <Button
      ref={ref}
      type="button"
      variant={variant}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) reset();
      }}
      {...props}
    >
      {children ?? "Reset"}
    </Button>
  );
});

/**
 * Shows server / root errors — anything you `setError("root.*")`, and every
 * error thrown from `onSubmit`. Announced as an alert.
 */
export function FormRootError({ title, ...props }: Omit<AlertProps, "variant" | "children">) {
  const { errors } = useFormState();
  const ctx = useNovaForm();
  const root = errors.root as (Record<string, FieldError> & FieldError) | undefined;
  if (!root) return null;
  const list = [root.message, ...Object.values(root).map((e) => (e && typeof e === "object" && "message" in e ? (e as FieldError).message : undefined))].filter(
    (m): m is string => typeof m === "string" && m.length > 0,
  );
  if (!list.length) return null;
  return (
    <Alert variant="danger" role="alert" title={title ?? ctx?.messages.serverErrorTitle ?? defaultMessages.serverErrorTitle} {...props}>
      {list.length === 1 ? list[0] : (
        <ul className="ms-4 list-disc">
          {[...new Set(list)].map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      )}
    </Alert>
  );
}

/**
 * After a failed submit, lists every invalid field with links that move focus
 * to it — the pattern recommended for long forms (GOV.UK, WCAG 3.3.1).
 */
export function FormErrorSummary({ title, className, ...props }: Omit<AlertProps, "variant" | "children" | "title"> & { title?: (count: number) => ReactNode }) {
  const { errors, submitCount, isSubmitting } = useFormState();
  const { setFocus } = useFormContext();
  const ctx = useNovaForm();
  const messages = ctx?.messages ?? defaultMessages;
  const items = flattenErrors(errors, "", [], messages);
  if (!submitCount || isSubmitting || !items.length) return null;
  return (
    <Alert variant="danger" role="alert" title={(title ?? messages.summaryTitle)(items.length)} className={className} {...props}>
      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const label = ctx?.labels.get(item.name);
          return (
            <li key={item.name}>
              <a
                href={`#${item.name}`}
                onClick={(e) => {
                  e.preventDefault();
                  setFocus(item.name);
                }}
                className="font-medium text-danger-on-subtle underline underline-offset-2 hover:decoration-2"
              >
                {label ? <>{label}: </> : null}
                {item.messages.join(" ")}
              </a>
            </li>
          );
        })}
      </ul>
    </Alert>
  );
}

/** Shows a success alert after a successful submit, until the user edits the form again. */
export function FormSuccess({ title, children, ...props }: Omit<AlertProps, "variant">) {
  const { isSubmitSuccessful, submitCount, errors } = useFormState();
  const { watch } = useFormContext();
  const [editedAfter, setEditedAfter] = useState(-1);
  useEffect(() => {
    // Any edit after this submit hides the confirmation.
    const subscription = watch(() => setEditedAfter(submitCount));
    return () => subscription.unsubscribe();
  }, [watch, submitCount]);
  if (!isSubmitSuccessful || editedAfter === submitCount || get(errors, "root")) return null;
  return (
    <Alert variant="success" role="status" title={title} {...props}>
      {children}
    </Alert>
  );
}

/** The messages for one field, for fully custom layouts. */
export function useFieldMessages(name: string): string[] {
  const { errors } = useFormState({ name });
  const ctx = useNovaForm();
  return errorMessages(get(errors, name) as FieldError | undefined, ctx?.messages);
}

/* -------------------------------------------------------- Typed shortcuts */

/**
 * Returns every bound component pre-typed for your form values, so `name`
 * autocompletes without passing `control`:
 *
 *   const F = formFields<z.infer<typeof schema>>();
 *   <F.Input name="email" />   // "emial" is a type error
 */
export function formFields<T extends FieldValues>() {
  return {
    Controller: FormController as <N extends FieldPath<T>>(p: FormControllerProps<T, N>) => ReactNode,
    Input: FormInput as <N extends FieldPath<T>>(p: Bound<T, N, InputProps>) => ReactNode,
    Textarea: FormTextarea as <N extends FieldPath<T>>(p: Bound<T, N, TextareaProps>) => ReactNode,
    PasswordInput: FormPasswordInput as <N extends FieldPath<T>>(p: Bound<T, N, PasswordInputProps>) => ReactNode,
    NumberInput: FormNumberInput as <N extends FieldPath<T>>(p: Bound<T, N, NumberInputProps>) => ReactNode,
    Checkbox: FormCheckbox as <N extends FieldPath<T>>(p: Bound<T, N, CheckboxProps>) => ReactNode,
    Switch: FormSwitch as <N extends FieldPath<T>>(p: Bound<T, N, SwitchProps>) => ReactNode,
    RadioGroup: FormRadioGroup as <N extends FieldPath<T>>(p: BoundFieldProps<T, N> & { options: FormOption[]; orientation?: "horizontal" | "vertical" }) => ReactNode,
    Select: FormSelect as <N extends FieldPath<T>>(p: BoundFieldProps<T, N> & { options: FormOption[]; placeholder?: string } & Omit<SelectTriggerProps, "name" | "id" | "children" | "disabled">) => ReactNode,
    Combobox: FormCombobox as <N extends FieldPath<T>>(p: Bound<T, N, ComboboxProps> & { options: ComboboxOption[] }) => ReactNode,
    DatePicker: FormDatePicker as <N extends FieldPath<T>>(p: Bound<T, N, DatePickerProps>) => ReactNode,
    Slider: FormSlider as <N extends FieldPath<T>>(p: Bound<T, N, SliderProps> & { range?: boolean }) => ReactNode,
    PinInput: FormPinInput as <N extends FieldPath<T>>(p: Bound<T, N, PinInputProps>) => ReactNode,
    TagInput: FormTagInput as <N extends FieldPath<T>>(p: Bound<T, N, TagInputProps>) => ReactNode,
    Rating: FormRating as <N extends FieldPath<T>>(p: Bound<T, N, RatingProps>) => ReactNode,
    FileDropzone: FormFileDropzone as <N extends FieldPath<T>>(p: Bound<T, N, FileDropzoneProps>) => ReactNode,
  };
}

export type { FieldError, UseFormReturn } from "react-hook-form";
