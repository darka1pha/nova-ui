import { Button, Card, Checkbox, FormField, Heading, Input, Separator, Text } from "@kaleido/ui";
import { Anchor, KeyRound } from "lucide-react";
import { useState, type FormEvent } from "react";

/** Sign in: email and password, remember me, single sign-on, and a way to recover access. */
export function SignInBlock() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const emailError = submitted && !/^\S+@\S+\.\S+$/.test(email) ? "Enter a valid work email." : undefined;
  const passwordError = submitted && password.length < 8 ? "Passwords have at least 8 characters." : undefined;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="flex min-h-[34rem] w-full items-center justify-center bg-(image:--ks-gradient-subtle) p-6">
      <Card className="w-full max-w-sm gap-6 p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-on-solid shadow-glow-primary">
            <Anchor className="size-5" />
          </span>
          <div className="flex flex-col gap-1">
            <Heading level={2} size="md">
              Sign in to Fleet Portal
            </Heading>
            <Text size="sm" tone="muted">
              Kaveh Marine Services
            </Text>
          </div>
        </div>

        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
          <FormField label="Work email" error={emailError} required>
            <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@kaveh-marine.com" />
          </FormField>
          <FormField label="Password" error={passwordError} required>
            <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </FormField>
          <div className="flex items-center justify-between gap-3">
            <FormField label="Remember me" inline>
              <Checkbox defaultChecked />
            </FormField>
            <Button variant="link" size="sm" type="button">
              Forgot password?
            </Button>
          </div>
          <Button type="submit" fullWidth>
            Sign in
          </Button>
        </form>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <Text size="xs" tone="muted">
            or
          </Text>
          <Separator className="flex-1" />
        </div>
        <Button variant="outline" fullWidth startIcon={<KeyRound />}>
          Continue with company SSO
        </Button>
        <Text size="xs" tone="muted" className="text-center">
          No account? Ask your fleet administrator for an invitation.
        </Text>
      </Card>
    </div>
  );
}
