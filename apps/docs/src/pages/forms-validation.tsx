import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, FormField, Input, Stack, Switch, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Textarea, toast } from "@kaleido/ui";
import {
  Form,
  FormCheckbox,
  FormDatePicker,
  FormError,
  FormErrorSummary,
  FormInput,
  FormNumberInput,
  FormPinInput,
  FormRadioGroup,
  FormReset,
  FormRootError,
  FormSelect,
  FormSubmit,
  FormSuccess,
  FormSwitch,
  FormTagInput,
} from "@kaleido/ui/react-hook-form";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CodeBlock, Page, Prose, Section } from "../docs/kit.tsx";

/* ------------------------------------------------------------ Live: RHF + zod */

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[0-9]/, "Include a number")
    .regex(/[A-Z]/, "Include a capital letter"),
  age: z.number({ error: "Enter your age" }).min(18, "You must be 18 or older"),
  plan: z.enum(["starter", "pro", "team"], { error: "Choose a plan" }),
  start: z.date({ error: "Pick a start date" }),
  skills: z.array(z.string()).min(1, "Add at least one skill").max(5, "Up to 5 skills"),
  billing: z.enum(["monthly", "yearly"], { error: "Choose a billing period" }),
  newsletter: z.boolean(),
  company: z.string().optional(),
  terms: z.literal(true, { error: "You must accept the terms to continue" }),
});
type SignupInput = z.input<typeof signupSchema>;
type Signup = z.output<typeof signupSchema>;

function LiveSignupForm() {
  const [failServer, setFailServer] = useState(false);
  const form = useForm<SignupInput, unknown, Signup>({
    resolver: zodResolver(signupSchema),
    mode: "onTouched",
    criteriaMode: "all",
    defaultValues: { name: "", email: "", password: "", skills: [], newsletter: true, company: "" } as Partial<SignupInput> as SignupInput,
  });
  const { control } = form;

  return (
    <Card variant="outline" className="gap-0 p-0">
      <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-3">
        <span className="text-sm font-semibold">Live example — react-hook-form + zod</span>
        <FormField label="Simulate server error" inline className="items-center">
          <Switch checked={failServer} onCheckedChange={setFailServer} size="sm" />
        </FormField>
      </div>
      <Form
        form={form}
        schema={signupSchema}
        className="p-6"
        onSubmit={async (values) => {
          await new Promise((r) => setTimeout(r, 900));
          if (failServer) {
            throw new FormError("We couldn't create your account.", { fieldErrors: { email: "This email is already registered" } });
          }
          toast.success("Account created", { description: `Welcome, ${values.name}!` });
        }}
      >
        <FormErrorSummary />
        <FormRootError />
        <FormSuccess title="Account created">You can now sign in. Edit any field to submit again.</FormSuccess>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormInput control={control} name="name" label="Full name" autoComplete="name" successMessage="Looks good!" />
          <FormInput control={control} name="email" label="Email" type="email" autoComplete="email" description="We'll send a confirmation link." />
          <FormInput control={control} name="password" label="Password" type="password" autoComplete="new-password" description="Every failed rule is listed (criteriaMode: all)." />
          <FormNumberInput control={control} name="age" label="Age" min={0} max={120} />
          <FormSelect
            control={control}
            name="plan"
            label="Plan"
            options={[
              { value: "starter", label: "Starter" },
              { value: "pro", label: "Pro" },
              { value: "team", label: "Team" },
            ]}
          />
          <FormDatePicker control={control} name="start" label="Start date" min={new Date()} clearable />
          <FormTagInput control={control} name="skills" label="Skills" placeholder="Type and press Enter" className="sm:col-span-2" />
          <FormInput control={control} name="company" label="Company" />
          <FormRadioGroup
            control={control}
            name="billing"
            label="Billing"
            orientation="horizontal"
            options={[
              { value: "monthly", label: "Monthly" },
              { value: "yearly", label: "Yearly", description: "2 months free" },
            ]}
          />
        </div>
        <FormSwitch control={control} name="newsletter" label="Product updates" description="About once a month." />
        <FormCheckbox control={control} name="terms" label="I accept the terms and privacy policy" />
        <div className="flex flex-wrap gap-2">
          <FormSubmit loadingText="Creating account…">Create account</FormSubmit>
          <FormReset />
        </div>
      </Form>
    </Card>
  );
}

/* --------------------------------------------------------- Live: no library */

function PlainForm() {
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const taken = ["admin", "root", "kaleido"].includes(username.trim().toLowerCase());
  const tooShort = username.length > 0 && username.length < 3;
  return (
    <Card variant="outline" className="gap-0 p-0">
      <div className="border-b border-border px-6 py-3 text-sm font-semibold">Live example — plain React state, no form library</div>
      <form
        className="flex flex-col gap-5 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          const data = Object.fromEntries(new FormData(e.currentTarget));
          toast.info("Submitted with FormData", { description: JSON.stringify(data) });
        }}
      >
        <FormField
          label="Username"
          required
          error={tooShort ? "Use at least 3 characters" : taken ? "That username is taken" : undefined}
          success={username.length >= 3 && !taken ? "Username is available" : undefined}
          description='Try "admin", or anything 3+ characters.'
        >
          <Input name="username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
        </FormField>
        <FormField label="Bio" optional warning={bio.length > 120 ? `Long bios get cut off in previews (${bio.length}/160)` : undefined}>
          <Textarea name="bio" value={bio} maxLength={160} onChange={(e) => setBio(e.target.value)} />
        </FormField>
        <Button type="submit" className="w-fit" disabled={tooShort || taken}>
          Save profile
        </Button>
      </form>
    </Card>
  );
}

/* ---------------------------------------------------- Live: custom control */

const otpSchema = z.object({ code: z.string().length(6, "Enter all 6 digits").regex(/^\d+$/, "Digits only") });

function OtpForm() {
  const form = useForm({ resolver: zodResolver(otpSchema), defaultValues: { code: "" } });
  return (
    <Form form={form} schema={otpSchema} onSubmit={(v) => toast.success(`Verified ${v.code}`)} className="w-fit">
      <FormPinInput control={form.control} name="code" label="Verification code" length={6} description="Paste works too." />
      <FormSubmit size="sm">Verify</FormSubmit>
    </Form>
  );
}

/* ------------------------------------------------------------------- Page */

export function FormsValidationPage() {
  return (
    <Page
      eyebrow="Components"
      title="Forms & validation"
      lead="Every field shows errors, warnings and success the same way — whether the state comes from plain React, a native <form>, or react-hook-form with zod. The library is never required."
    >
      <Section title="Without a form library">
        <Prose>
          <p>
            <code>FormField</code> takes <code>error</code>, <code>warning</code> and <code>success</code> (each a message or a list). It wires ids,{" "}
            <code>aria-invalid</code>, <code>aria-describedby</code> and the required marker to the control, announces messages through a polite live region,
            and colors the control to match. Every control also takes a <code>name</code>, so plain <code>{"<form>"}</code> posts and <code>FormData</code> just
            work — including Combobox, DatePicker (as YYYY-MM-DD), TagInput, PinInput and FileDropzone.
          </p>
        </Prose>
        <PlainForm />
        <CodeBlock
          code={`<FormField
  label="Username"
  required
  error={taken ? "That username is taken" : undefined}
  success={available ? "Username is available" : undefined}
>
  <Input name="username" value={username} onChange={(e) => setUsername(e.target.value)} />
</FormField>`}
        />
      </Section>

      <Section title="With react-hook-form and zod">
        <CodeBlock language="bash" code={`pnpm add react-hook-form @hookform/resolvers zod   # only if you want them`} />
        <Prose>
          <p>
            Import the bindings from <code>@kaleido/ui/react-hook-form</code>. That entry is separate, so apps without react-hook-form never load it. Pass your
            schema to <code>{"<Form schema>"}</code> and required markers come from it automatically; validation stays in your resolver.
          </p>
        </Prose>
        <LiveSignupForm />
        <CodeBlock
          code={`import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormErrorSummary, FormRootError, FormInput, FormSelect,
  FormDatePicker, FormCheckbox, FormSubmit, FormError } from "@kaleido/ui/react-hook-form";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  plan: z.enum(["starter", "pro"], { error: "Choose a plan" }),
  start: z.date({ error: "Pick a start date" }),
  terms: z.literal(true, { error: "You must accept the terms" }),
});

export function Signup() {
  const form = useForm({ resolver: zodResolver(schema), mode: "onTouched" });
  return (
    <Form form={form} schema={schema} onSubmit={async (values) => {
      const res = await api.signup(values);
      if (res.status === 409) throw new FormError("Couldn't sign up", { fieldErrors: { email: "Already registered" } });
    }}>
      <FormErrorSummary />   {/* lists every error after a failed submit, links focus each field */}
      <FormRootError />      {/* server errors thrown from onSubmit */}
      <FormInput control={form.control} name="email" label="Email" type="email" />
      <FormSelect control={form.control} name="plan" label="Plan" options={plans} />
      <FormDatePicker control={form.control} name="start" label="Start date" />
      <FormCheckbox control={form.control} name="terms" label="I accept the terms" />
      <FormSubmit loadingText="Signing up…">Sign up</FormSubmit>
    </Form>
  );
}`}
        />
      </Section>

      <Section title="What the bound fields store">
        <Table density="compact">
          <TableHeader>
            <TableRow>
              <TableHead>Component</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Zod</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[
              ["FormInput / FormTextarea", "string", "z.string()"],
              ["FormNumberInput", "number | null", "z.number()"],
              ["FormCheckbox / FormSwitch", "boolean", "z.boolean() / z.literal(true)"],
              ["FormRadioGroup / FormSelect", "option value", "z.enum([...])"],
              ["FormCombobox", "string | null", "z.string()"],
              ["FormDatePicker", "Date | null", "z.date()"],
              ["FormSlider", "number, or [min, max] with range", "z.number() / z.tuple(...)"],
              ["FormTagInput", "string[]", "z.array(z.string())"],
              ["FormPinInput", "string", "z.string().length(6)"],
              ["FormRating", "number", "z.number().min(1)"],
              ["FormFileDropzone", "File[]", "z.array(z.instanceof(File))"],
              ["FormController", "anything — you render the control", "any"],
            ].map(([a, b, c]) => (
              <TableRow key={a}>
                <TableCell className="font-mono text-xs font-semibold">{a}</TableCell>
                <TableCell className="text-foreground-secondary">{b}</TableCell>
                <TableCell className="font-mono text-xs">{c}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>

      <Section title="Custom controls">
        <Prose>
          <p>
            <code>FormController</code> binds anything. Use <code>focusRef</code> for controls whose root isn't focusable, so focus-on-error still reaches
            the first input inside.
          </p>
        </Prose>
        <Stack gap={4}>
          <OtpForm />
          <CodeBlock
            code={`<FormController control={form.control} name="code" label="Verification code"
  render={({ field, focusRef }) => (
    <PinInput ref={focusRef} length={6} name={field.name}
      value={field.value} onValueChange={field.onChange} onBlur={field.onBlur} />
  )}
/>`}
          />
        </Stack>
      </Section>

      <Section title="Typed names without passing control">
        <CodeBlock
          code={`const F = formFields<z.infer<typeof schema>>();
// inside <Form form={form}>:
<F.Input name="email" label="Email" />     // "emial" is a type error
<F.DatePicker name="start" label="Start" />`}
        />
      </Section>

      <Section title="Localizing messages">
        <CodeBlock
          code={`<Form
  form={form}
  onSubmit={save}
  messages={{
    required: "Ce champ est obligatoire.",
    summaryTitle: (n) => \`Veuillez corriger \${n} erreur(s)\`,
    serverErrorTitle: "Une erreur est survenue",
  }}
  // or translate every error yourself (e.g. from error.type / error.message keys):
  formatError={(error, name) => t(\`errors.\${name}.\${error.type}\`)}
>`}
        />
        <Prose>
          <p>
            Zod messages pass through unchanged, so you can also localize at the schema level (for example with <code>z.config(z.locales.fr())</code>).
          </p>
        </Prose>
      </Section>

      <Section title="Behavior">
        <Prose>
          <ul>
            <li>Field messages appear in a polite live region that exists before the error does, so screen readers announce them without interrupting typing.</li>
            <li>The error summary is an alert named by its title; each entry links to — and focuses — its field.</li>
            <li>react-hook-form's focus-on-error reaches every control, including composite ones (radio groups, PIN boxes, tag inputs, dropzones).</li>
            <li>While an async submit runs, the submit button shows a spinner and every control is disabled (opt out with <code>disableWhileSubmitting=&#123;false&#125;</code>).</li>
            <li>Errors thrown from <code>onSubmit</code> become a root alert; <code>FormError</code> can also attach messages to individual fields.</li>
            <li>Invalid fields shake once (not under reduced motion); valid and warning fields get matching borders and focus rings.</li>
          </ul>
        </Prose>
      </Section>
    </Page>
  );
}
