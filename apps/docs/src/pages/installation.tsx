import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  Badge,
  Button,
  Card,
  Heading,
  Input,
  SegmentedControl,
  SegmentedControlItem,
  Text,
} from "@darkalpha/nova-ui";
import { ArrowRight, Check } from "lucide-react";
import { useState, type ReactNode } from "react";
import { CodeBlock, Page, Prose, Section } from "../docs/kit.tsx";

/* ------------------------------------------------------------------ Choices */

const frameworks = {
  vite: "Vite",
  "next-app": "Next.js (App Router)",
  "next-pages": "Next.js (Pages Router)",
  "react-router": "React Router 7",
  astro: "Astro",
} as const;
type Framework = keyof typeof frameworks;

const managers = ["pnpm", "npm", "yarn", "bun"] as const;
type Manager = (typeof managers)[number];

/** Remembers the reader's picks across visits; works without storage too. */
function useStoredChoice<T extends string>(key: string, fallback: T, allowed: readonly T[]): [T, (next: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key) as T | null;
      return stored && allowed.includes(stored) ? stored : fallback;
    } catch {
      return fallback;
    }
  });
  return [
    value,
    (next) => {
      setValue(next);
      try {
        localStorage.setItem(key, next);
      } catch {
        // Private mode or blocked storage: the choice just isn't remembered.
      }
    },
  ];
}

const add = (pm: Manager, pkgs: string) => ({ pnpm: `pnpm add ${pkgs}`, npm: `npm install ${pkgs}`, yarn: `yarn add ${pkgs}`, bun: `bun add ${pkgs}` })[pm];

const create: Record<Framework, Record<Manager, string>> = {
  vite: {
    pnpm: "pnpm create vite my-app --template react-ts",
    npm: "npm create vite@latest my-app -- --template react-ts",
    yarn: "yarn create vite my-app --template react-ts",
    bun: "bun create vite my-app --template react-ts",
  },
  "next-app": { pnpm: "pnpm create next-app@latest my-app", npm: "npx create-next-app@latest my-app", yarn: "yarn create next-app my-app", bun: "bun create next-app my-app" },
  "next-pages": { pnpm: "pnpm create next-app@latest my-app", npm: "npx create-next-app@latest my-app", yarn: "yarn create next-app my-app", bun: "bun create next-app my-app" },
  "react-router": {
    pnpm: "pnpm create react-router@latest my-app",
    npm: "npx create-react-router@latest my-app",
    yarn: "yarn create react-router my-app",
    bun: "bun create react-router my-app",
  },
  astro: {
    pnpm: "pnpm create astro@latest my-app\ncd my-app\npnpm astro add react",
    npm: "npm create astro@latest my-app\ncd my-app\nnpx astro add react",
    yarn: "yarn create astro my-app\ncd my-app\nyarn astro add react",
    bun: "bun create astro my-app\ncd my-app\nbunx astro add react",
  },
};

/* ------------------------------------------------------------ Code per stack */

const appCode = `import { Badge, Button, Card, Input } from "@darkalpha/nova-ui";

export function App() {
  return (
    <Card className="mx-auto mt-16 flex max-w-sm flex-col gap-4 p-6">
      <Badge variant="success">Nova UI is working</Badge>
      <h1 className="text-xl font-semibold">Welcome back</h1>
      <Input type="email" placeholder="you@company.com" aria-label="Email" />
      <Button variant="primary">Continue</Button>
    </Card>
  );
}`;

const setup: Record<Framework, { file: string; code: string; note?: ReactNode; extra?: { file: string; code: string; language: string } }> = {
  vite: {
    file: "src/main.tsx",
    code: `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@darkalpha/nova-ui";
import "@darkalpha/nova-ui/styles.css";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider theme="vibrant" storageKey="color-mode">
      <App />
    </ThemeProvider>
  </StrictMode>,
);`,
    note: (
      <>
        The Vite template ships <code>index.css</code> and <code>App.css</code> with its own body and button styles. Delete their imports (or the files) so they
        don't fight the theme.
      </>
    ),
  },
  "next-app": {
    file: "app/layout.tsx",
    code: `import { ThemeProvider, ThemeScript } from "@darkalpha/nova-ui";
import "@darkalpha/nova-ui/styles.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Applies the saved light/dark choice before the first paint: no flash. */}
        <ThemeScript storageKey="color-mode" />
      </head>
      <body>
        <ThemeProvider theme="vibrant" storageKey="color-mode">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}`,
    note: (
      <>
        Components that need the browser already carry <code>"use client"</code>, so you can render them from Server Components. If you said yes to Tailwind
        in <code>create-next-app</code>, follow "Your app uses Tailwind CSS v4" below instead of importing <code>styles.css</code>.
      </>
    ),
  },
  "next-pages": {
    file: "pages/_app.tsx",
    code: `import type { AppProps } from "next/app";
import { ThemeProvider } from "@darkalpha/nova-ui";
import "@darkalpha/nova-ui/styles.css";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme="vibrant" storageKey="color-mode">
      <Component {...pageProps} />
    </ThemeProvider>
  );
}`,
    note: (
      <>
        To avoid a light/dark flash on load, render <code>{"<ThemeScript storageKey=\"color-mode\" />"}</code> inside <code>{"<Head>"}</code> in{" "}
        <code>pages/_document.tsx</code>.
      </>
    ),
  },
  "react-router": {
    file: "app/root.tsx",
    code: `import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { ThemeProvider, ThemeScript } from "@darkalpha/nova-ui";
import "@darkalpha/nova-ui/styles.css";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <ThemeScript storageKey="color-mode" />
      </head>
      <body>
        <ThemeProvider theme="vibrant" storageKey="color-mode">{children}</ThemeProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}`,
    note: (
      <>
        The default template uses Tailwind. Keep it and follow "Your app uses Tailwind CSS v4" below, or remove <code>app.css</code> and use{" "}
        <code>styles.css</code> as shown.
      </>
    ),
  },
  astro: {
    file: "src/components/Island.tsx",
    code: `import { ThemeProvider } from "@darkalpha/nova-ui";
import "@darkalpha/nova-ui/styles.css";
import { App } from "./App";

// Each React island needs its own provider.
export default function Island() {
  return (
    <ThemeProvider theme="vibrant">
      <App />
    </ThemeProvider>
  );
}`,
    extra: {
      file: "src/pages/index.astro",
      language: "astro",
      code: `---
import Island from "../components/Island";
---
<Island client:load />`,
    },
    note: (
      <>
        Islands are separate React roots, so wrap each one. To theme the whole page (not only islands), put the output of <code>getThemeCss("vibrant")</code>{" "}
        in a <code>{"<style>"}</code> tag in your layout.
      </>
    ),
  },
};

const appFile: Record<Framework, string> = {
  vite: "src/App.tsx",
  "next-app": "app/page.tsx",
  "next-pages": "pages/index.tsx",
  "react-router": "app/routes/home.tsx",
  astro: "src/components/App.tsx",
};

/* --------------------------------------------------------------------- Page */

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <li className="group/step relative flex gap-4 pb-10 last:pb-0">
      {/* The rail connecting the step numbers. */}
      <span aria-hidden className="absolute start-4 top-10 bottom-0 w-px bg-border group-last/step:hidden" />
      <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-on-solid">
        {n}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-3 pt-0.5">
        <Heading level={3} size="sm">
          <span className="sr-only">Step {n}: </span>
          {title}
        </Heading>
        {children}
      </div>
    </li>
  );
}

function FileLabel({ children }: { children: ReactNode }) {
  return <span className="font-mono text-xs text-foreground-muted">{children}</span>;
}

export function InstallationPage() {
  const [framework, setFramework] = useStoredChoice<Framework>("nova-docs-framework", "vite", Object.keys(frameworks) as Framework[]);
  const [pm, setPm] = useStoredChoice<Manager>("nova-docs-pm", "pnpm", managers);
  const stack = setup[framework];

  return (
    <Page
      eyebrow="Start"
      title="Installation"
      lead="From an empty folder to a themed, accessible screen in about five minutes. Pick your setup and every command and file below follows it."
    >
      <Section title="Before you start">
        <ul className="grid gap-2 sm:grid-cols-3">
          {[
            ["React 18.2+ or 19", "Nova UI is a React library; react and react-dom are peer dependencies."],
            ["A current browser", "Chrome/Edge 123+, Firefox 120+, Safari 17.5+. No polyfills needed."],
            ["Node.js LTS", "For your build tool. Tailwind is optional: the stylesheet is precompiled."],
          ].map(([title, body]) => (
            <li key={title} className="flex gap-2.5 rounded-(--nv-card-radius) border border-border bg-surface p-3">
              <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-success-text" />
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{title}</span>
                <span className="text-xs text-foreground-muted">{body}</span>
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Your setup" id="setup">
        <div className="flex flex-col gap-4 rounded-(--nv-card-radius) border border-border bg-surface p-4">
          <div className="flex flex-col gap-2">
            <Text size="sm" className="font-medium" id="framework-label">
              Framework
            </Text>
            <SegmentedControl aria-labelledby="framework-label" value={framework} onValueChange={(v) => setFramework(v as Framework)} className="max-w-full flex-wrap">
              {(Object.keys(frameworks) as Framework[]).map((id) => (
                <SegmentedControlItem key={id} value={id}>
                  {frameworks[id]}
                </SegmentedControlItem>
              ))}
            </SegmentedControl>
          </div>
          <div className="flex flex-col gap-2">
            <Text size="sm" className="font-medium" id="pm-label">
              Package manager
            </Text>
            <SegmentedControl aria-labelledby="pm-label" value={pm} onValueChange={(v) => setPm(v as Manager)}>
              {managers.map((m) => (
                <SegmentedControlItem key={m} value={m}>
                  {m}
                </SegmentedControlItem>
              ))}
            </SegmentedControl>
          </div>
          <Text size="xs" tone="muted">
            Your choice is remembered on this device.
          </Text>
        </div>
      </Section>

      <Section title="Steps" id="steps">
        <ol className="flex flex-col">
          <Step n={1} title={`Create a ${frameworks[framework]} project (or skip if you have one)`}>
            <CodeBlock language="bash" code={create[framework][pm]} />
          </Step>

          <Step n={2} title="Install Nova UI">
            <CodeBlock language="bash" code={add(pm, "@darkalpha/nova-ui")} />
            <Prose>
              <p>
                <code>@darkalpha/nova-tokens</code> (the color engine and design tokens) comes with it. Nothing else is required.
              </p>
            </Prose>
          </Step>

          <Step n={3} title="Import the stylesheet and add the ThemeProvider">
            <FileLabel>{stack.file}</FileLabel>
            <CodeBlock code={stack.code} />
            {stack.extra ? (
              <>
                <FileLabel>{stack.extra.file}</FileLabel>
                <CodeBlock language={stack.extra.language} code={stack.extra.code} />
              </>
            ) : null}
            <Prose>
              <p>
                Import <code>@darkalpha/nova-ui/styles.css</code> <strong>once</strong>, at the root. It only styles what's inside a <code>ThemeProvider</code>, so it won't
                restyle the rest of your app. <code>storageKey</code> remembers each visitor's light/dark choice.
              </p>
              {stack.note ? <p>{stack.note}</p> : null}
            </Prose>
          </Step>

          <Step n={4} title="Render your first components">
            <FileLabel>{appFile[framework]}</FileLabel>
            <CodeBlock code={framework === "next-app" ? appCode.replace("export function App()", "export default function Page()") : framework === "next-pages" || framework === "react-router" ? appCode.replace("export function App()", "export default function Home()") : appCode} />
          </Step>

          <Step n={5} title="Start the dev server and check">
            <CodeBlock language="bash" code={`${pm === "npm" ? "npm run" : pm} dev`} />
            <Text size="sm" tone="secondary">
              You should see this card, with a focus ring when you Tab to the field and a lift when you hover the button:
            </Text>
            <div className="rounded-(--nv-card-radius) border border-dashed border-border p-6">
              <Card className="mx-auto flex max-w-sm flex-col gap-4 p-6">
                <Badge variant="success" className="w-fit">
                  Nova UI is working
                </Badge>
                <Heading level={4} size="sm">
                  Welcome back
                </Heading>
                <Input type="email" placeholder="you@company.com" aria-label="Email (example)" />
                <Button variant="primary">Continue</Button>
              </Card>
            </div>
          </Step>
        </ol>
      </Section>

      <Section title="Optional extras" id="extras">
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="forms">
            <AccordionTrigger>Forms with react-hook-form and zod</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-3">
                <CodeBlock language="bash" code={add(pm, "react-hook-form zod @hookform/resolvers")} />
                <CodeBlock
                  code={`import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormInput, FormSubmit } from "@darkalpha/nova-ui/react-hook-form";

const schema = z.object({ email: z.string().email("Enter a valid email") });

export function SignUp() {
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { email: "" } });
  return (
    <Form form={form} schema={schema} onSubmit={(values) => console.log(values)}>
      <FormInput control={form.control} name="email" label="Email" />
      <FormSubmit>Sign up</FormSubmit>
    </Form>
  );
}`}
                />
                <Prose>
                  <p>
                    The bindings live in a separate entry, <code>@darkalpha/nova-ui/react-hook-form</code>, so apps that don't use it never download it. See{" "}
                    <a href="#/forms-validation">Forms &amp; validation</a>.
                  </p>
                </Prose>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="tailwind">
            <AccordionTrigger>Your app uses Tailwind CSS v4</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-3">
                <CodeBlock
                  language="css"
                  code={`/* your main CSS file, e.g. app/globals.css or src/index.css */
@import "tailwindcss";
@import "@darkalpha/nova-ui/tailwind.css";`}
                />
                <Alert variant="warning" title="Use tailwind.css instead of styles.css, not both">
                  Remove the <code>@darkalpha/nova-ui/styles.css</code> import from step 3. With both, two Tailwind builds compete and responsive classes can stop working.
                  Your own classes like <code>bg-primary</code> now use Nova UI's tokens and follow theme changes.
                </Alert>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="brand">
            <AccordionTrigger>Use your brand colors</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-3">
                <CodeBlock code={`<ThemeProvider theme="vibrant" brand={{ primary: "#6C5CE7", secondary: "#00C2A8" }} radius="lg">`} />
                <Prose>
                  <p>
                    Nova UI builds full light and dark scales from each color and keeps text readable (WCAG AA). Try yours in the{" "}
                    <a href="#/playground">Theme playground</a> and copy the result.
                  </p>
                </Prose>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="local">
            <AccordionTrigger>Install from this repository, without npm</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-3">
                <CodeBlock language="bash" code={`# in the Nova UI repository\npnpm install\npnpm install:local ../path/to/my-app`} />
                <Prose>
                  <p>
                    This builds the packages, copies the tarballs into <code>my-app/vendor/nova-ui/</code> and installs them with your app's package manager. Re-run it
                    after changing the library. <code>examples/vite-app</code> is set up this way.
                  </p>
                </Prose>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Section>

      <Section title="If something looks wrong" id="troubleshooting">
        <ul className="flex flex-col divide-y divide-border rounded-(--nv-card-radius) border border-border bg-surface">
          {[
            ["Components have no styles", "The stylesheet isn't loaded, or the component is outside a ThemeProvider. Check step 3."],
            ["Buttons or fonts look slightly off", "A starter template's CSS (index.css, App.css, globals.css) is overriding the theme. Remove its body and button rules."],
            ["Light/dark flashes on page load", "Add <ThemeScript storageKey=…> to the document head, with the same storageKey as the provider."],
            ["Responsive layouts don't switch at breakpoints", "Both styles.css and tailwind.css are loaded. Keep only one."],
            ["\"Hydration mismatch\" warning on <html>", "Add suppressHydrationWarning to <html>: ThemeScript sets an attribute before React hydrates."],
          ].map(([problem, fix]) => (
            <li key={problem} className="flex flex-col gap-0.5 p-3 sm:flex-row sm:gap-4">
              <span className="text-sm font-medium sm:w-72 sm:shrink-0">{problem}</span>
              <span className="text-sm text-foreground-secondary">{fix}</span>
            </li>
          ))}
        </ul>
        <Text size="sm" tone="secondary">
          More in <a className="text-primary-text underline" href="#/troubleshooting">Troubleshooting</a>.
        </Text>
      </Section>

      <Section title="Next steps">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["#/theming", "Theming & color", "Presets, brand colors, dark mode, density and radius."],
            ["#/forms", "Components", "Every component with live examples and accessibility notes."],
            ["#/playground", "Theme playground", "Design a theme visually and copy the code."],
            ["#/accessibility", "Accessibility", "What Nova UI handles for you, and what's still yours to check."],
          ].map(([href, title, body]) => (
            <a
              key={href}
              href={href}
              className="group/next flex items-start justify-between gap-3 rounded-(--nv-card-radius) border border-border bg-surface p-4 transition-colors hover:border-primary-border hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus-ring"
            >
              <span className="flex flex-col gap-1">
                <span className="text-sm font-semibold">{title}</span>
                <span className="text-sm text-foreground-secondary">{body}</span>
              </span>
              <ArrowRight aria-hidden className="mt-0.5 size-4 shrink-0 text-foreground-muted transition-transform group-hover/next:translate-x-0.5 rtl:rotate-180" />
            </a>
          ))}
        </div>
      </Section>
    </Page>
  );
}
