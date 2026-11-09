import { Alert, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@darkalpha/nova-ui";
import { CodeBlock, Page, Prose, Section, to } from "../docs/kit.tsx";

export function GettingStartedPage() {
  return (
    <Page eyebrow="Start" title="Getting started" lead="Install the package, import one stylesheet, wrap your app in a ThemeProvider and start building.">
      <Alert variant="primary" title="New here? Follow the step-by-step installation guide.">
        It tailors every command and file to your framework and package manager.{" "}
        <a className="font-medium underline" href={to("installation")}>
          Open the installation guide
        </a>
      </Alert>
      <Section title="1. Install">
        <CodeBlock language="bash" code={`pnpm add @darkalpha/nova-ui\n# or: npm install @darkalpha/nova-ui · yarn add @darkalpha/nova-ui`} />
        <Prose>
          <p>
            <code>react</code> and <code>react-dom</code> 18.2+ or 19 are peer dependencies. <code>@darkalpha/nova-tokens</code> (framework-agnostic tokens and the color
            engine) is installed automatically.
          </p>
        </Prose>
      </Section>

      <Section title="Use it locally, without npm">
        <Prose>
          <p>
            You don't need a registry. From this repository, one command builds the libraries, packs them exactly as they would be published, copies the
            tarballs into your project's <code>vendor/nova-ui/</code> folder and installs them with your project's package manager (npm, pnpm, yarn or bun):
          </p>
        </Prose>
        <CodeBlock language="bash" code={`# from the Nova UI repository
pnpm install:local ../path/to/your-app

# re-run it after changing the library to update the app`} />
        <Prose>
          <p>
            Your project stays self-contained: its <code>package.json</code> points at <code>file:./vendor/nova-ui/*.tgz</code>, so it keeps working if this
            repository moves, and you can commit the vendor folder to share it with teammates. To only produce the tarballs, run <code>pnpm pack:local</code>{" "}
            (written to <code>local-packages/</code>). A ready-made example lives in <code>examples/vite-app</code>.
          </p>
        </Prose>
      </Section>

      <Section title="2. Import the stylesheet once">
        <CodeBlock code={`// main.tsx, app/layout.tsx or your root module\nimport "@darkalpha/nova-ui/styles.css";`} />
        <Prose>
          <p>
            <code>styles.css</code> is precompiled: it contains the tokens, a reset scoped to <code>.nv-theme</code> and every utility the components use. You do
            not need Tailwind. It does not restyle anything outside a <code>ThemeProvider</code>.
          </p>
          <p>
            If your app runs Tailwind CSS v4 itself, import <code>@darkalpha/nova-ui/tailwind.css</code> from your CSS entry instead, as shown under "Using Tailwind in your
            app too?" below. Don't load both.
          </p>
        </Prose>
      </Section>

      <Section title="3. Add the provider and build">
        <CodeBlock
          code={`import { Badge, Button, Card, Input, ThemeProvider } from "@darkalpha/nova-ui";
import "@darkalpha/nova-ui/styles.css";

export function App() {
  return (
    <ThemeProvider theme="vibrant">
      <Card>
        <Badge variant="success">Ready</Badge>
        <h2>Welcome back</h2>
        <Input placeholder="Enter your email" aria-label="Email" />
        <Button variant="primary">Get started</Button>
      </Card>
    </ThemeProvider>
  );
}`}
        />
      </Section>

      <Section title="Make it yours">
        <CodeBlock
          code={`<ThemeProvider
  theme="vibrant"
  brand={{ primary: "#6C5CE7", secondary: "#00C2A8", accent: "#FF6B6B" }}
  radius="lg"
  density="comfortable"
  storageKey="app-color-mode"   // remembers light/dark choice
>
  <App />
</ThemeProvider>`}
        />
        <Alert variant="info" title="Brand colors are contrast-checked">
          If a brand color cannot carry readable text, Nova UI picks the nearest tone in its generated scale that can, and warns in development. Your exact hex is
          kept wherever it passes WCAG AA.
        </Alert>
      </Section>

      <Section title="Framework compatibility">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Framework</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[
              ["Vite / CRA / any React SPA", "Supported", "Import styles.css in your entry."],
              ["Next.js App Router", "Supported", "Components ship with \"use client\" where needed; the provider renders on the server too."],
              ["Next.js Pages Router", "Supported", "Import styles.css in _app.tsx."],
              ["Remix / React Router 7", "Supported", "Link styles.css via links() or import it."],
              ["Astro (React islands)", "Supported", "Wrap each island in ThemeProvider, or theme the page with getThemeCss()."],
              ["Tailwind CSS v4 apps", "First-class", "Import @darkalpha/nova-ui/tailwind.css after tailwindcss, instead of styles.css."],
            ].map(([fw, status, notes]) => (
              <TableRow key={fw}>
                <TableCell className="font-medium">{fw}</TableCell>
                <TableCell>
                  <Badge variant={status === "First-class" ? "primary" : "success"} dot>
                    {status}
                  </Badge>
                </TableCell>
                <TableCell className="text-foreground-secondary">{notes}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Prose>
          <p>
            Browser support: evergreen browsers from 2024 onward (Chrome/Edge 123+, Firefox 120+, Safari 17.5+). Light/dark switching uses the CSS{" "}
            <code>light-dark()</code> function, so it needs no JavaScript.
          </p>
        </Prose>
      </Section>

      <Section title="Next.js App Router (SSR, no flash)">
        <CodeBlock
          code={`// app/layout.tsx
import { ThemeProvider, ThemeScript } from "@darkalpha/nova-ui";
import "@darkalpha/nova-ui/styles.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Applies a stored light/dark choice before first paint */}
        <ThemeScript storageKey="app-color-mode" />
      </head>
      <body>
        <ThemeProvider theme="ocean" storageKey="app-color-mode">{children}</ThemeProvider>
      </body>
    </html>
  );
}`}
        />
        <Prose>
          <p>
            Theme resolution is pure and deterministic, so server and client render identical variables. "System" mode is handled entirely by CSS (
            <code>color-scheme: light dark</code>), which is why it never flashes. <code>suppressHydrationWarning</code> is only needed because the script may set{" "}
            <code>data-nv-mode</code> on <code>&lt;html&gt;</code> before React hydrates.
          </p>
        </Prose>
      </Section>

      <Section title="Using Tailwind in your app too?">
        <CodeBlock
          language="css"
          code={`/* app.css: replaces import "@darkalpha/nova-ui/styles.css" */
@import "tailwindcss";
@import "@darkalpha/nova-ui/tailwind.css";   /* tokens, scoped base, and @source for the components */`}
        />
        <Prose>
          <p>
            <code>tailwind.css</code> is Nova UI as source rather than precompiled CSS: the tokens, the scoped base, interactions, materials, the token
            utilities (<code>bg-primary</code>, <code>text-foreground-muted</code>, <code>rounded-lg</code>, <code>animate-nv-*</code>, <code>dark:</code>,{" "}
            <code>rtl:</code>) and an <code>@source</code> that points your build at the components. Your Tailwind then generates the components'
            utilities along with yours, and your own UI resolves to the same tokens and follows theme changes.
          </p>
          <p>
            Use it <strong>instead of</strong> <code>styles.css</code>, not as well. Two Tailwind builds each sort their own <code>utilities</code> layer,
            so your sheet's <code>.flex-col</code> can land after the library's <code>sm:flex-row</code> and win at every width: dialog footers stay
            stacked, containers and headings keep their phone sizes. One build orders every utility once, so breakpoint and container-query overrides
            always apply.
          </p>
          <p>
            Your theme's breakpoints and spacing apply to the components too. If you use a class prefix (<code>@import "tailwindcss" prefix(tw)</code>),
            the component classes won't match it: import <code>styles.css</code> instead. Prefixed utilities can't collide with Nova UI's, so the two
            sheets coexist.
          </p>
        </Prose>
      </Section>
    </Page>
  );
}
