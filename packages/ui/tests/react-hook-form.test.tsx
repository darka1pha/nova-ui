import { zodResolver } from "@hookform/resolvers/zod";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { Combobox, DatePicker, FormField, Input, PinInput, TagInput, ThemeProvider } from "../src/index.ts";
import {
  Form,
  FormCheckbox,
  FormController,
  FormDatePicker,
  FormError,
  FormErrorSummary,
  FormInput,
  FormNumberInput,
  FormRootError,
  FormSelect,
  FormSubmit,
  FormSuccess,
  FormTagInput,
  formFields,
  isSchemaFieldRequired,
  isSchemaLiteralTrue,
} from "../src/react-hook-form.tsx";
import { axeViolations } from "./axe.ts";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  age: z.number({ error: "Enter your age" }).min(18, "You must be 18 or older"),
  plan: z.enum(["starter", "pro"], { error: "Choose a plan" }),
  birthday: z.date({ error: "Pick a date" }),
  tags: z.array(z.string()).min(1, "Add at least one tag"),
  terms: z.literal(true, { error: "You must accept the terms" }),
  nickname: z.string().optional(),
  address: z.object({ city: z.string().min(1, "City is required"), zip: z.string().optional() }),
});
type Values = z.input<typeof schema>;

const empty = { name: "", email: "", age: null as unknown as number, plan: undefined, birthday: undefined, tags: [], terms: undefined, nickname: "", address: { city: "", zip: "" } } as unknown as Values;

function SignupForm({ onSubmit, mode = "onSubmit", indicate }: { onSubmit: (v: z.output<typeof schema>) => unknown; mode?: "onSubmit" | "onTouched"; indicate?: "required" | "optional" }) {
  const form = useForm<Values, unknown, z.output<typeof schema>>({ resolver: zodResolver(schema), defaultValues: empty, mode });
  return (
    <Form form={form} onSubmit={onSubmit} schema={schema} indicate={indicate}>
      <FormErrorSummary />
      <FormRootError />
      <FormSuccess title="Account created" />
      <FormInput control={form.control} name="name" label="Name" successMessage="Looks good!" />
      <FormInput control={form.control} name="email" label="Email" type="email" />
      <FormNumberInput control={form.control} name="age" label="Age" />
      <FormSelect control={form.control} name="plan" label="Plan" options={[{ value: "starter", label: "Starter" }, { value: "pro", label: "Pro" }]} />
      <FormDatePicker control={form.control} name="birthday" label="Birthday" locale="en-US" />
      <FormTagInput control={form.control} name="tags" label="Tags" />
      <FormInput control={form.control} name="nickname" label="Nickname" />
      <FormInput control={form.control} name="address.city" label="City" />
      <FormCheckbox control={form.control} name="terms" label="I accept the terms" />
      <FormSubmit loadingText="Saving…">Create account</FormSubmit>
    </Form>
  );
}

const wrap = (ui: React.ReactNode) => render(<ThemeProvider>{ui}</ThemeProvider>);
const submit = () => userEvent.click(screen.getByRole("button", { name: "Create account" }));

describe("schema inspection", () => {
  it("derives required fields from a zod schema, including nested paths", () => {
    expect(isSchemaFieldRequired(schema, "name")).toBe(true);
    expect(isSchemaFieldRequired(schema, "nickname")).toBe(false);
    expect(isSchemaFieldRequired(schema, "address.city")).toBe(true);
    expect(isSchemaFieldRequired(schema, "address.zip")).toBe(false);
    expect(isSchemaFieldRequired(schema, "missing")).toBeUndefined();
    expect(isSchemaFieldRequired({}, "name")).toBeUndefined();
    expect(isSchemaLiteralTrue(schema, "terms")).toBe(true);
    expect(isSchemaLiteralTrue(z.object({ news: z.boolean() }), "news")).toBe(false);
  });

  it("marks labels: asterisk for required, or (optional) when indicate='optional'", () => {
    const { unmount } = wrap(<SignupForm onSubmit={() => {}} />);
    expect(screen.getByText("Name").parentElement).toHaveTextContent("Name*");
    expect(screen.getByText("Nickname").parentElement).not.toHaveTextContent("*");
    unmount();
    wrap(<SignupForm onSubmit={() => {}} indicate="optional" />);
    expect(screen.getByText("Nickname").parentElement).toHaveTextContent("Nickname(optional)");
    expect(screen.getByLabelText(/^Name/)).toBeRequired();
  });
});

describe("validation messages from zod", () => {
  it("shows every message, marks fields invalid, focuses the first, and lists them in the summary", async () => {
    const onSubmit = vi.fn();
    wrap(<SignupForm onSubmit={onSubmit} />);
    await submit();
    expect(onSubmit).not.toHaveBeenCalled();

    const name = screen.getByLabelText(/^Name/);
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(name).toHaveAccessibleDescription("Name must be at least 2 characters");
    await waitFor(() => expect(name).toHaveFocus());

    for (const message of ["Enter a valid email", "Enter your age", "Choose a plan", "Pick a date", "Add at least one tag", "City is required", "You must accept the terms"]) {
      expect(screen.getAllByText(message, { exact: false }).length).toBeGreaterThan(0);
    }

    const summary = screen.getByRole("alert", { name: "Please fix 8 problems" });
    const link = within(summary).getByRole("link", { name: "Email: Enter a valid email" });
    await userEvent.click(link);
    expect(screen.getByLabelText(/^Email/)).toHaveFocus();
  });

  it("re-validates as the user fixes a field and clears the message", async () => {
    wrap(<SignupForm onSubmit={() => {}} />);
    await submit();
    const email = screen.getByLabelText(/^Email/);
    await userEvent.type(email, "ada@example.com");
    await waitFor(() => expect(email).not.toHaveAttribute("aria-invalid"));
    expect(screen.queryByText("Enter a valid email", { selector: "span" })).not.toBeInTheDocument();
  });

  it("shows the success message once a touched field is valid", async () => {
    wrap(<SignupForm onSubmit={() => {}} mode="onTouched" />);
    const name = screen.getByLabelText(/^Name/);
    await userEvent.type(name, "Ada");
    await userEvent.tab();
    expect(await screen.findByText("Looks good!")).toBeInTheDocument();
    expect(name).toHaveAttribute("data-status", "valid");
  });

  it("shows all failed rules with criteriaMode 'all'", async () => {
    const password = z.object({
      password: z.string().min(8, "At least 8 characters").regex(/[0-9]/, "Include a number").regex(/[A-Z]/, "Include a capital letter"),
    });
    function PasswordForm() {
      const form = useForm({ resolver: zodResolver(password), criteriaMode: "all", defaultValues: { password: "" } });
      return (
        <Form form={form} onSubmit={() => {}}>
          <FormInput control={form.control} name="password" label="Password" type="password" />
          <FormSubmit>Save</FormSubmit>
        </Form>
      );
    }
    wrap(<PasswordForm />);
    await userEvent.type(screen.getByLabelText(/^Password/), "abc");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    for (const m of ["At least 8 characters", "Include a number", "Include a capital letter"]) expect(await screen.findByText(m)).toBeInTheDocument();
    expect(screen.getByText("Include a number").closest("ul")).not.toBeNull();
  });
});

describe("submitting", () => {
  async function fillValid() {
    await userEvent.type(screen.getByLabelText(/^Name/), "Ada Lovelace");
    await userEvent.type(screen.getByLabelText(/^Email/), "ada@example.com");
    const age = screen.getByLabelText(/^Age/);
    await userEvent.type(age, "36");
    await userEvent.tab();
    await userEvent.click(screen.getByLabelText(/^Plan/));
    await userEvent.click(await screen.findByRole("option", { name: "Pro" }));
    await userEvent.click(screen.getByLabelText(/^Birthday/));
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getAllByRole("button").find((b) => b.getAttribute("aria-label")?.includes(" 15, "))!);
    await userEvent.type(screen.getByRole("textbox", { name: /^Tags/ }), "math{Enter}");
    await userEvent.type(screen.getByLabelText(/^City/), "London");
    await userEvent.click(screen.getByRole("checkbox", { name: "I accept the terms" }));
  }

  it("submits typed values (number, Date, array, boolean) and shows FormSuccess", async () => {
    const onSubmit = vi.fn();
    wrap(<SignupForm onSubmit={onSubmit} />);
    await fillValid();
    await submit();
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const values = onSubmit.mock.calls[0]![0];
    expect(values).toMatchObject({ name: "Ada Lovelace", email: "ada@example.com", age: 36, plan: "pro", tags: ["math"], terms: true, address: { city: "London" } });
    expect(values.birthday).toBeInstanceOf(Date);
    expect(values.birthday.getDate()).toBe(15);
    expect(await screen.findByRole("status", { name: "Account created" })).toBeInTheDocument();
  });

  it("shows a spinner and disables the form while an async submit runs", async () => {
    let resolve!: () => void;
    const onSubmit = vi.fn(() => new Promise<void>((r) => (resolve = r)));
    wrap(<SignupForm onSubmit={onSubmit} />);
    await fillValid();
    await submit();
    const button = await screen.findByRole("button", { name: "Saving…" });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(screen.getByLabelText(/^Name/)).toBeDisabled();
    await act(async () => resolve());
    await waitFor(() => expect(screen.getByLabelText(/^Name/)).toBeEnabled());
  });

  it("turns a thrown FormError into a root alert and field errors", async () => {
    const onSubmit = vi.fn(() => {
      throw new FormError("We couldn't create your account.", { fieldErrors: { email: "This email is already registered" } });
    });
    wrap(<SignupForm onSubmit={onSubmit} />);
    await fillValid();
    await submit();
    const alert = await screen.findByRole("alert", { name: /Something went wrong/ });
    expect(alert).toHaveTextContent("We couldn't create your account.");
    const email = screen.getByLabelText(/^Email/);
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveAccessibleDescription("This email is already registered");
    expect(screen.queryByText("Account created")).not.toBeInTheDocument();
  });
});

describe("custom controls and typing helpers", () => {
  it("FormController binds any control and formFields() gives typed shortcuts", async () => {
    const s = z.object({ code: z.string().length(4, "Enter the 4-digit code") });
    const onSubmit = vi.fn();
    function CodeForm() {
      const form = useForm({ resolver: zodResolver(s), defaultValues: { code: "" } });
      return (
        <Form form={form} onSubmit={onSubmit} schema={s}>
          <FormController
            control={form.control}
            name="code"
            label="Code"
            render={({ field, focusRef }) => <PinInput ref={focusRef} length={4} name={field.name} value={field.value} onValueChange={field.onChange} onBlur={field.onBlur} />}
          />
          <FormSubmit>Verify</FormSubmit>
        </Form>
      );
    }
    wrap(<CodeForm />);
    await userEvent.click(screen.getByRole("button", { name: "Verify" }));
    expect(await screen.findByText("Enter the 4-digit code")).toBeInTheDocument();
    // Focus-on-error reaches the first box inside the PinInput group.
    await waitFor(() => expect(within(screen.getByRole("group", { name: /^Code/ })).getAllByRole("textbox")[0]).toHaveFocus());
  });

  it("formFields() binds typed shortcuts to the surrounding <Form>", async () => {
    const s = z.object({ city: z.string().min(1, "City is required") });
    const F = formFields<z.infer<typeof s>>();
    function CityForm() {
      const form = useForm({ resolver: zodResolver(s), defaultValues: { city: "" } });
      return (
        <Form form={form} onSubmit={() => {}} schema={s}>
          <F.Input name="city" label="City" />
          <FormSubmit>Go</FormSubmit>
        </Form>
      );
    }
    wrap(<CityForm />);
    expect(screen.getByLabelText(/^City/)).toBeRequired();
    await userEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(await screen.findByText("City is required")).toBeInTheDocument();
  });

  it("an RHF form has no axe violations after a failed submit", async () => {
    const { container } = wrap(<SignupForm onSubmit={() => {}} />);
    await submit();
    await screen.findByRole("alert", { name: /Please fix/ });
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("without react-hook-form", () => {
  it("register()-style spreading works on plain Input", () => {
    const onChange = vi.fn();
    const onBlur = vi.fn();
    const ref = { current: null as HTMLInputElement | null };
    wrap(
      <FormField label="Email">
        <Input name="email" ref={ref} onChange={onChange} onBlur={onBlur} />
      </FormField>,
    );
    const input = screen.getByLabelText("Email");
    fireEvent.change(input, { target: { value: "a@b.co" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalled();
    expect(onBlur).toHaveBeenCalled();
    expect(ref.current).toBe(input);
  });

  it("FormField shows warnings and success, and styles the control", () => {
    wrap(
      <>
        <FormField label="Username" success="Username is available">
          <Input defaultValue="ada" />
        </FormField>
        <FormField label="Email" warning="This email is already subscribed">
          <Input defaultValue="a@b.co" />
        </FormField>
        <FormField label="Password" error={["Too short", "Include a number"]}>
          <Input defaultValue="x" />
        </FormField>
      </>,
    );
    expect(screen.getByLabelText("Username")).toHaveAttribute("data-status", "valid");
    expect(screen.getByLabelText("Username")).not.toHaveAttribute("aria-invalid");
    expect(screen.getByLabelText("Username")).toHaveAccessibleDescription("Username is available");
    expect(screen.getByLabelText("Email")).toHaveAttribute("data-status", "warning");
    expect(screen.getByLabelText("Password")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Password")).toHaveAccessibleDescription("Too short Include a number");
  });

  it("composite controls submit with plain <form> + FormData", async () => {
    const onSubmit = vi.fn((e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const data = new FormData(e.currentTarget);
      return data;
    });
    wrap(
      <form onSubmit={onSubmit} aria-label="native">
        <Combobox name="framework" defaultValue="react" options={[{ value: "react", label: "React" }]} aria-label="Framework" />
        <DatePicker name="start" defaultValue={new Date(2026, 4, 3)} aria-label="Start" />
        <TagInput name="tags" defaultValue={["a", "b"]} aria-label="Tags" />
        <PinInput name="code" defaultValue="1234" length={4} />
        <button type="submit">Send</button>
      </form>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    const data = onSubmit.mock.results[0]!.value as FormData;
    expect(data.get("framework")).toBe("react");
    expect(data.get("start")).toBe("2026-05-03");
    expect(data.getAll("tags")).toEqual(["a", "b"]);
    expect(data.get("code")).toBe("1234");
  });
});
