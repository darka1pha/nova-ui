import { zodResolver } from "@hookform/resolvers/zod";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { FormField, PasswordInput, passwordRequirements, passwordStrength, ThemeProvider } from "../src/index.ts";
import { Form, FormPasswordInput } from "../src/react-hook-form.tsx";
import { axeViolations } from "./axe.ts";

const wrap = (ui: React.ReactNode) => render(<ThemeProvider>{ui}</ThemeProvider>);

describe("passwordStrength", () => {
  it.each([
    ["", 0],
    ["password", 0],
    ["abc", 0],
    ["aB3$xy", 1],
    ["abcdefgh", 1],
    ["Abcdefgh12", 2],
    ["correct horse battery", 3],
    ["Tr0ub4dor&3-staple!", 4],
  ])("scores %j as %i", (pw, score) => {
    expect(passwordStrength(pw)).toBe(score);
  });

  it("penalizes repeated runs and counts non-Latin letters", () => {
    expect(passwordStrength("Aaaa1111!!!!x")).toBeLessThan(passwordStrength("Ab1!Cd2@Ef3#x"));
    expect(passwordStrength("رمزعبور۱۲۳۴!")).toBeGreaterThanOrEqual(2);
  });
});

describe("PasswordInput", () => {
  it("hides the value and toggles visibility with an accessible button", async () => {
    const onVisibleChange = vi.fn();
    wrap(<PasswordInput aria-label="Password" defaultValue="hunter2" onVisibleChange={onVisibleChange} />);
    const input = screen.getByLabelText("Password");
    expect(input).toHaveAttribute("type", "password");
    expect(input).toHaveAttribute("autocomplete", "current-password");
    await userEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(input).toHaveAttribute("type", "text");
    expect(onVisibleChange).toHaveBeenLastCalledWith(true);
    await userEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(input).toHaveAttribute("type", "password");
  });

  it("supports controlled visibility", () => {
    wrap(<PasswordInput aria-label="Password" visible />);
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "text");
  });

  it("shows strength and a live requirement checklist, both described by the input", async () => {
    wrap(
      <FormField label="New password" description="Use a passphrase.">
        <PasswordInput showStrength requirements={[passwordRequirements.minLength(10), passwordRequirements.number()]} />
      </FormField>,
    );
    const input = screen.getByLabelText("New password");
    expect(input).toHaveAttribute("autocomplete", "new-password");
    const describedBy = input.getAttribute("aria-describedby")!.split(" ");
    // FormField's description, the checklist and the strength text.
    expect(describedBy).toHaveLength(3);
    expect(screen.getByText("Use a passphrase.").id).toBeOneOf(describedBy);

    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("At least 10 characters(not met)");

    await userEvent.type(input, "abc");
    expect(screen.getByText("Too weak")).toBeInTheDocument();

    await userEvent.type(input, "defgh12");
    expect(items[0]).toHaveAttribute("data-met");
    expect(items[1]).toHaveTextContent("(met)");
    expect(screen.getByText(/^(Weak|Fair|Good|Strong)$/)).toBeInTheDocument();
  });

  it("warns while Caps Lock is on and clears on blur", () => {
    wrap(<PasswordInput aria-label="Password" />);
    const input = screen.getByLabelText("Password");
    fireEvent.keyDown(input, { key: "A", modifierCapsLock: true });
    expect(screen.getByText("Caps Lock is on")).toBeInTheDocument();
    fireEvent.blur(input);
    expect(screen.queryByText("Caps Lock is on")).not.toBeInTheDocument();
  });

  it("disables the toggle with the field", () => {
    wrap(<PasswordInput aria-label="Password" disabled />);
    expect(screen.getByRole("button", { name: "Show password" })).toBeDisabled();
  });

  it("has no axe violations with meter and checklist", async () => {
    const { container } = wrap(
      <FormField label="Password">
        <PasswordInput showStrength defaultValue="abc12345" requirements={[passwordRequirements.minLength(8), passwordRequirements.symbol()]} />
      </FormField>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("FormPasswordInput", () => {
  const schema = z.object({ password: z.string().min(8, "Use at least 8 characters") });

  function SignUp({ onSubmit }: { onSubmit: (v: z.infer<typeof schema>) => void }) {
    const form = useForm({ resolver: zodResolver(schema), defaultValues: { password: "" } });
    return (
      <Form form={form} schema={schema} onSubmit={onSubmit}>
        <FormPasswordInput control={form.control} name="password" label="Password" showStrength requirements={[passwordRequirements.minLength(8)]} />
        <button type="submit">Create</button>
      </Form>
    );
  }

  it("validates through the schema and submits the string", async () => {
    const onSubmit = vi.fn();
    wrap(<SignUp onSubmit={onSubmit} />);
    const input = screen.getByLabelText(/Password/);
    expect(input).toBeRequired();

    await userEvent.type(input, "short");
    await userEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(await screen.findByText("Use at least 8 characters")).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "true");

    await userEvent.type(input, "-and-longer");
    await userEvent.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]![0]).toEqual({ password: "short-and-longer" });
  });
});
