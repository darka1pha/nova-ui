import { Badge, Card, cn, Heading, IconButton, Text, Tooltip } from "@kaleido/ui";
import { Check, Copy } from "lucide-react";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";

/** "primary" → "Primary". */
export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* ----------------------------------------------------------------- Routing */

const subscribe = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};
const getHash = () => window.location.hash.replace(/^#\/?/, "") || "home";

export function useRoute(): string {
  return useSyncExternalStore(subscribe, getHash, () => "home");
}

/* ------------------------------------------------------------- Copy helper */

export function useCopy(): [boolean, (text: string) => void] {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);
  return [
    copied,
    (text: string) => {
      void navigator.clipboard?.writeText(text).then(() => setCopied(true));
    },
  ];
}

export function CopyButton({ text, label = "Copy code" }: { text: string; label?: string }) {
  const [copied, copy] = useCopy();
  return (
    <Tooltip content={copied ? "Copied!" : label}>
      <IconButton aria-label={copied ? "Copied" : label} size="sm" variant="ghost" onClick={() => copy(text)}>
        {copied ? <Check className="text-success-text" /> : <Copy />}
      </IconButton>
    </Tooltip>
  );
}

/* ------------------------------------------------------------- Code blocks */

/** Minimal, dependency-free highlighting for TSX/CSS/bash snippets. */
function highlight(code: string): ReactNode[] {
  const tokens = /(\/\/.*|\/\*[\s\S]*?\*\/|#.*$|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|<\/?[A-Z][\w.]*|<\/?[a-z][\w-]*|\b(?:import|from|export|const|let|function|return|type|interface|extends|default|new|await|async|if|else)\b|\b\d+(?:\.\d+)?\b|--[\w-]+)/gm;
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = tokens.exec(code))) {
    if (m.index > last) out.push(code.slice(last, m.index));
    const t = m[0];
    const cls = t.startsWith("//") || t.startsWith("/*") || t.startsWith("#")
      ? "text-foreground-muted italic"
      : /^["'`]/.test(t)
        ? "text-success-text"
        : t.startsWith("<")
          ? "text-primary-text"
          : t.startsWith("--")
            ? "text-accent-text"
            : /^\d/.test(t)
              ? "text-warning-text"
              : "text-info-text font-semibold";
    out.push(
      <span key={i++} className={cls}>
        {t}
      </span>,
    );
    last = m.index + t.length;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}

export function CodeBlock({ code, language = "tsx", className }: { code: string; language?: string; className?: string }) {
  const trimmed = code.replace(/^\n+|\s+$/g, "");
  return (
    <div className={cn("group relative overflow-hidden rounded-lg border border-border bg-surface-sunken", className)}>
      <div className="flex items-center justify-between border-b border-border px-3 py-1">
        <span className="font-mono text-2xs uppercase tracking-(--ks-tracking-wider) text-foreground-muted">{language}</span>
        <CopyButton text={trimmed} />
      </div>
      {/* Focusable so keyboard users can scroll long lines. */}
      <pre tabIndex={0} className="m-0 overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring" dir="ltr">
        <code>{highlight(trimmed)}</code>
      </pre>
    </div>
  );
}

/* ---------------------------------------------------------------- Examples */

export function Example({ title, description, code, children, className }: { title?: string; description?: ReactNode; code: string; children: ReactNode; className?: string }) {
  const [showCode, setShowCode] = useState(false);
  return (
    <section className="flex flex-col gap-3">
      {title ? (
        <div className="flex flex-col gap-1">
          <Heading level={3} size="sm">
            {title}
          </Heading>
          {description ? <Text tone="muted" size="sm">{description}</Text> : null}
        </div>
      ) : null}
      <Card variant="outline" className="gap-0 overflow-visible p-0">
        <div className={cn("relative flex flex-wrap items-center gap-3 rounded-t-(--ks-card-radius) bg-surface p-6 sm:p-8", className)}>
          <div aria-hidden className="pointer-events-none absolute inset-0 rounded-t-(--ks-card-radius) bg-(image:--ks-gradient-glow) opacity-60" />
          <div className="relative flex w-full flex-wrap items-center gap-3">{children}</div>
        </div>
        <div className="flex items-center justify-between border-t border-border px-3 py-1.5">
          <button
            type="button"
            onClick={() => setShowCode((v) => !v)}
            aria-expanded={showCode}
            className="rounded-sm px-2 py-1 text-xs font-semibold text-foreground-muted hover:bg-surface-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-focus-ring"
          >
            {showCode ? "Hide code" : "Show code"}
          </button>
          <CopyButton text={code.trim()} />
        </div>
        {showCode ? <CodeBlock code={code} className="rounded-none rounded-b-(--ks-card-radius) border-0 border-t" /> : null}
      </Card>
    </section>
  );
}

/* ------------------------------------------------------------- Props table */

export interface PropDoc {
  name: string;
  type: string;
  default?: string;
  description: string;
}

export function PropsTable({ props, title = "Props" }: { props: PropDoc[]; title?: string }) {
  return (
    <section className="flex flex-col gap-3">
      <Heading level={3} size="sm">
        {title}
      </Heading>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[40rem] text-sm">
          <thead className="bg-surface-sunken text-start text-xs uppercase tracking-(--ks-tracking-wide) text-foreground-muted">
            <tr>
              <th scope="col" className="px-4 py-2 text-start font-semibold">Prop</th>
              <th scope="col" className="px-4 py-2 text-start font-semibold">Type</th>
              <th scope="col" className="px-4 py-2 text-start font-semibold">Default</th>
              <th scope="col" className="px-4 py-2 text-start font-semibold">Description</th>
            </tr>
          </thead>
          <tbody>
            {props.map((p) => (
              <tr key={p.name} className="border-t border-border align-top">
                <td className="px-4 py-2.5 font-mono text-[13px] font-semibold text-primary-text">{p.name}</td>
                <td className="px-4 py-2.5 font-mono text-[12px] text-foreground-secondary" dir="ltr">{p.type}</td>
                <td className="px-4 py-2.5 font-mono text-[12px] text-foreground-muted">{p.default ?? "—"}</td>
                <td className="px-4 py-2.5 text-foreground-secondary">{p.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ Page layout */

export function Page({ eyebrow, title, lead, wide, children }: { eyebrow?: string; title: string; lead?: ReactNode; wide?: boolean; children: ReactNode }) {
  return (
    <article className={cn("mx-auto flex w-full flex-col gap-10 px-4 py-10 sm:px-8 lg:py-14", wide ? "max-w-6xl" : "max-w-4xl")}>
      <header className="flex flex-col gap-3">
        {eyebrow ? (
          <Badge variant="primary" className="w-fit">
            {eyebrow}
          </Badge>
        ) : null}
        <Heading level={1} size="xl">
          {title}
        </Heading>
        {lead ? <Text size="lg" tone="secondary" className="max-w-2xl">{lead}</Text> : null}
      </header>
      {children}
    </article>
  );
}

export function Section({ title, id, children }: { title: string; id?: string; children: ReactNode }) {
  return (
    <section id={id} className="flex scroll-mt-20 flex-col gap-4">
      <Heading level={2} size="md">
        {title}
      </Heading>
      {children}
    </section>
  );
}

/** Body prose with consistent rhythm and inline code styling. */
export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="flex max-w-3xl flex-col gap-3 text-md leading-relaxed text-foreground-secondary [&_code]:rounded-sm [&_code]:bg-surface-sunken [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.875em] [&_code]:text-foreground [&_li]:ms-5 [&_li]:list-disc [&_strong]:text-foreground [&_a]:text-primary-text [&_a]:underline">
      {children}
    </div>
  );
}

export function A11yNotes({ items }: { items: ReactNode[] }) {
  return (
    <section className="flex flex-col gap-3">
      <Heading level={3} size="sm">
        Accessibility
      </Heading>
      <ul className="flex flex-col gap-2 rounded-lg border border-info-border bg-info-subtle p-4 text-sm text-info-on-subtle">
        {items.map((item, i) => (
          <li key={i} className="ms-5 list-disc">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
