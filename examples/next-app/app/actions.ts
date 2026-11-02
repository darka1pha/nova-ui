"use server";

export interface BookingState {
  ok: boolean;
  message: string;
  errors?: Partial<Record<"email" | "when" | "topics" | "signature", string>>;
}

export async function book(_prev: BookingState | null, form: FormData): Promise<BookingState> {
  const email = String(form.get("email") ?? "");
  // DateTimePicker submits local "YYYY-MM-DDTHH:mm", like <input type="datetime-local">.
  const when = String(form.get("when") ?? "");
  // MultiSelect submits one entry per value.
  const topics = form.getAll("topics").map(String);
  // SignaturePad submits a PNG data URL.
  const signature = String(form.get("signature") ?? "");

  const errors: BookingState["errors"] = {};
  if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = "Enter a valid email address.";
  if (!when) errors.when = "Choose a date and time.";
  if (topics.length === 0) errors.topics = "Pick at least one topic.";
  if (!signature.startsWith("data:image/")) errors.signature = "Sign to confirm.";
  if (Object.keys(errors).length > 0) return { ok: false, message: "Check the highlighted fields.", errors };

  await new Promise((r) => setTimeout(r, 400));
  return { ok: true, message: `Booked ${email} for ${when.replace("T", " at ")} (${topics.join(", ")}).` };
}
