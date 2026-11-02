"use client";

import { Alert, Button, DateTimePicker, FormField, Input, MultiSelect, SignaturePad, toast } from "@darkalpha/nova-ui";
import { useActionState, useEffect } from "react";
import { book } from "./actions";

const topics = [
  { value: "onboarding", label: "Onboarding" },
  { value: "theming", label: "Theming" },
  { value: "a11y", label: "Accessibility" },
  { value: "forms", label: "Forms" },
  { value: "charts", label: "Charts" },
];

export function BookingForm() {
  const [state, action, pending] = useActionState(book, null);

  useEffect(() => {
    if (state?.ok) toast.success(state.message);
  }, [state]);

  return (
    <form action={action} style={{ display: "grid", gap: 16, maxWidth: 520 }} noValidate>
      {state && !state.ok ? <Alert variant="danger">{state.message}</Alert> : null}
      <FormField label="Email" error={state?.errors?.email} required>
        <Input name="email" type="email" autoComplete="email" placeholder="you@example.com" />
      </FormField>
      <FormField label="When" error={state?.errors?.when} required>
        <DateTimePicker name="when" min={new Date()} minuteStep={15} clearable />
      </FormField>
      <FormField label="Topics" description="Pick a few, or type to add your own." error={state?.errors?.topics} required>
        <MultiSelect name="topics" options={topics} max={3} onCreate={(q) => ({ value: q.toLowerCase(), label: q })} />
      </FormField>
      <FormField label="Signature" error={state?.errors?.signature} required>
        <SignaturePad name="signature" height={140} />
      </FormField>
      <Button type="submit" loading={pending} style={{ justifySelf: "start" }}>
        Book session
      </Button>
    </form>
  );
}
