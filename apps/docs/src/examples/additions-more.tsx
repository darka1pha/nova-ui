import {
  Avatar,
  Button,
  ChatComposer,
  CodeBlock,
  CopyButton,
  Countdown,
  ExpandableText,
  FileUploadList,
  Gauge,
  Message,
  MessageGroup,
  MessageList,
  Popconfirm,
  Slider,
  Stack,
  Text,
  toast,
  TransferList,
  TypingIndicator,
  type UploadItem,
} from "@darkalpha/nova-ui";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Example } from "../docs/kit.tsx";

/* ------------------------------------------------------------------- Forms */

const permissions = [
  { value: "read", label: "Read projects", description: "View every project and file" },
  { value: "write", label: "Edit projects" },
  { value: "comment", label: "Comment" },
  { value: "invite", label: "Invite members" },
  { value: "billing", label: "Manage billing", description: "Owners only", disabled: true },
  { value: "export", label: "Export data" },
  { value: "api", label: "API access" },
];

export function FileUploadListExamples() {
  return (
    <UploadsExample />
  );
}

export function TransferListExamples() {
  const [granted, setGranted] = useState(["read", "comment"]);
  return (
    <Example
      title="TransferList"
      description="Check items and move them across. Each side has check-all, search and a count; moves are announced. Posts the selected values with native forms."
      code={`<TransferList items={permissions} value={granted} onValueChange={setGranted}
  searchable labels={{ available: "Available", selected: "Granted" }} name="permissions" />`}
    >
      <TransferList className="w-full" items={permissions} value={granted} onValueChange={setGranted} searchable listHeight={220} labels={{ available: "Available", selected: "Granted" }} />
    </Example>
  );
}

/** Simulated uploads: one file at a time ticks up to 100%. */
function UploadsExample() {
  const [items, setItems] = useState<UploadItem[]>([
    { id: "a", name: "brand-guidelines.pdf", size: 4_812_000, type: "application/pdf", status: "done" },
    { id: "b", name: "hero-photo.jpg", size: 2_310_000, type: "image/jpeg", status: "uploading", progress: 35 },
    { id: "c", name: "launch-video.mp4", size: 48_200_000, type: "video/mp4", status: "error", error: "Network connection lost" },
    { id: "d", name: "assets.zip", size: 12_400_000, type: "application/zip", status: "queued" },
  ]);
  useEffect(() => {
    const id = setInterval(() => {
      setItems((list) => {
        const busy = list.some((i) => i.status === "uploading");
        let started = busy;
        return list.map((i): UploadItem => {
          if (i.status === "uploading") {
            const progress = Math.min(100, (i.progress ?? 0) + 7);
            return progress >= 100 ? { ...i, status: "done", progress: 100 } : { ...i, progress };
          }
          if (!started && i.status === "queued") {
            started = true;
            return { ...i, status: "uploading", progress: 0 };
          }
          return i;
        });
      });
    }, 400);
    return () => clearInterval(id);
  }, []);
  const patch = (id: string, change: Partial<UploadItem>) => setItems((list) => list.map((i) => (i.id === id ? { ...i, ...change } : i)));
  return (
    <Example
      title="FileUploadList"
      description="Per-file progress to pair with FileDropzone, with cancel, retry and remove. Finished and failed uploads are announced."
      code={`<FileUploadList items={uploads} onCancel={cancel} onRetry={retry} onRemove={remove} />`}
    >
      <Stack gap={3} className="w-full max-w-lg">
        <FileUploadList
          items={items}
          onCancel={(id) => patch(id, { status: "error", error: "Cancelled" })}
          onRetry={(id) => patch(id, { status: "queued", error: undefined, progress: 0 })}
          onRemove={(id) => setItems((list) => list.filter((i) => i.id !== id))}
        />
        <Button
          size="sm"
          variant="outline"
          startIcon={<Plus />}
          className="self-start"
          onClick={() => setItems((list) => [...list, { id: String(Date.now()), name: `report-${list.length + 1}.xlsx`, size: 320_000, type: "application/vnd.ms-excel", status: "queued" }])}
        >
          Add a file
        </Button>
      </Stack>
    </Example>
  );
}

/* ---------------------------------------------------------------- Feedback */

export function GaugeExamples() {
  const [load, setLoad] = useState(72);
  return (
    <Example
      title="Gauge"
      description="A dial for one value in a range, with optional color bands. It's a meter for assistive tech and always prints the value."
      code={`<Gauge aria-label="CPU usage" value={72} label="CPU"
  bands={[{ upTo: 60, tone: "success" }, { upTo: 85, tone: "warning" }, { upTo: 100, tone: "danger" }]} />`}
    >
      <Stack gap={4} className="items-center">
        <div className="flex flex-wrap items-end gap-6">
          <Gauge
            aria-label="CPU usage"
            value={load}
            label="CPU"
            bands={[
              { upTo: 60, tone: "success" },
              { upTo: 85, tone: "warning" },
              { upTo: 100, tone: "danger" },
            ]}
          />
          <Gauge aria-label="Storage used" value={38.4} max={50} size={120} thickness={10} label="of 50 GB" formatValue={(v) => `${v.toFixed(1)} GB`} />
        </div>
        <Slider className="w-56" value={[load]} onValueChange={([v]) => setLoad(v ?? 0)} thumbLabels={["CPU usage"]} />
      </Stack>
    </Example>
  );
}

export function CountdownExamples() {
  const [launch] = useState(() => Date.now() + ((3 * 24 + 5) * 60 + 42) * 60_000 + 18_000);
  const [soon] = useState(() => Date.now() + 12_000);
  const [fired, setFired] = useState(false);
  return (
    <Example
      title="Countdown"
      description="Time left until a moment, with localized unit labels. The screen-reader label updates once a minute so it isn't noisy."
      code={`<Countdown to={launchDate} onComplete={() => setLive(true)} completed="We're live!" />
<Countdown to={launchDate} variant="inline" showSeconds={false} />
<Countdown
  to={launchDate}
  format={({ days, hours, minutes, seconds, placeholder }) =>
    placeholder ? "--:--:--" : [days * 24 + hours, minutes, seconds].map((n) => String(n).padStart(2, "0")).join(":")
  }
/>
<Countdown as="div" to={launchDate} className="grid grid-cols-4" />`}
    >
      <Stack gap={4}>
        <Countdown to={launch} />
        <Text size="sm">
          Sale ends in <Countdown to={launch} variant="inline" showSeconds={false} />
        </Text>
        <Text size="sm">
          Short one: <Countdown to={soon} variant="inline" completed="Done!" onComplete={() => setFired(true)} />
          {fired ? <span className="text-foreground-muted"> · onComplete fired</span> : null}
        </Text>
        <Countdown to={launch} locale="fa-IR" />
        <Text size="sm">
          Custom format:{" "}
          <Countdown
            to={launch}
            className="font-mono font-semibold"
            format={({ days, hours, minutes, seconds, placeholder }) =>
              placeholder ? "--:--:--" : [days * 24 + hours, minutes, seconds].map((n) => String(n).padStart(2, "0")).join(":")
            }
          />
        </Text>
      </Stack>
    </Example>
  );
}

/* -------------------------------------------------------------------- Data */

const snippet = `import { ThemeProvider, Button } from "@darkalpha/nova-ui";
import "@darkalpha/nova-ui/styles.css";

export function App() {
  return (
    <ThemeProvider theme="vibrant" brand={{ primary: "#6C5CE7" }}>
      <Button variant="primary">Get started</Button>
    </ThemeProvider>
  );
}`;

export function CodeBlockExamples() {
  return (
    <Example
      title="CodeBlock"
      description="Header, copy button, line numbers and highlighted lines. No highlighter bundled: pass renderLine to plug in Shiki or Prism."
      code={`<CodeBlock code={source} language="tsx" filename="App.tsx" showLineNumbers highlightLines="5-7" />`}
    >
      <CodeBlock className="w-full" code={snippet} language="tsx" filename="App.tsx" showLineNumbers highlightLines="5-7" />
    </Example>
  );
}

export function ExpandableTextExamples() {
  return (
    <Example title="ExpandableText" description="Clamped to a few lines; the toggle appears only when the text actually overflows." code={`<ExpandableText lines={2}>{review}</ExpandableText>`}>
      <ExpandableText lines={2} className="max-w-md text-sm">
        Nova UI turned our brand color into a full light and dark theme in an afternoon. Every component picked it up, contrast was already checked, and the motion
        settings let us calm things down for the admin area while keeping the marketing pages lively. The forms work with react-hook-form out of the box, and the docs
        show the accessibility notes right next to each example, which made reviews much faster.
      </ExpandableText>
    </Example>
  );
}

export function ChatExamples() {
  return (
    <ChatExample />
  );
}

const reply =
  "Sure! Your October invoice was sent to billing@kaveh-marine.com on the 3rd. I've just re-sent it, and you can download it any time from Settings → Billing → Invoices.";

type ChatMessage = { id: number; from: "me" | "agent"; text: string };

function ChatExample() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, from: "agent", text: "Hi! I'm the Nova UI assistant. How can I help?" },
    { id: 2, from: "me", text: "I can't find my October invoice." },
  ]);
  const [streaming, setStreaming] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const streamed = useRef("");
  useEffect(() => () => clearInterval(timer.current), []);

  const answer = () => {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      let i = 0;
      streamed.current = "";
      setStreaming("");
      timer.current = setInterval(() => {
        i += 3;
        if (i >= reply.length) {
          clearInterval(timer.current);
          setStreaming(null);
          setMessages((m) => [...m, { id: Date.now(), from: "agent", text: reply }]);
        } else {
          streamed.current = reply.slice(0, i);
          setStreaming(streamed.current);
        }
      }, 30);
    }, 900);
  };
  const stop = () => {
    clearInterval(timer.current);
    setMessages((m) => [...m, { id: Date.now(), from: "agent", text: `${streamed.current}…` }]);
    setStreaming(null);
  };

  // Consecutive messages from one sender share a group.
  const groups: { from: ChatMessage["from"]; items: ChatMessage[] }[] = [];
  for (const m of messages) {
    const last = groups.at(-1);
    if (last?.from === m.from) last.items.push(m);
    else groups.push({ from: m.from, items: [m] });
  }
  const agentAvatar = <Avatar name="Nova UI Assistant" size="sm" />;

  return (
    <Example
      title="Chat"
      description="MessageList, MessageGroup, Message, ChatComposer and TypingIndicator. Send something: the assistant types, then streams a reply you can stop. The log follows new text unless you've scrolled up."
      code={`<MessageList aria-label="Support chat">
  <MessageGroup author="Nova UI assistant" avatar={<Avatar name="Nova UI" />}>
    <Message streaming={isStreaming}>{text}</Message>
  </MessageGroup>
</MessageList>
<ChatComposer onSend={send} generating={isStreaming} onStop={stop} attachments />`}
    >
      <div className="flex h-[28rem] w-full max-w-xl flex-col gap-2 rounded-(--nv-card-radius) border border-border bg-surface p-2">
        <MessageList aria-label="Support chat" className="flex-1">
          {groups.map((g) => (
            <MessageGroup
              key={g.items[0]?.id}
              author={g.from === "me" ? "You" : "Nova UI assistant"}
              side={g.from === "me" ? "end" : "start"}
              hideAuthor={g.from === "me"}
              avatar={g.from === "agent" ? agentAvatar : undefined}
            >
              {g.items.map((m) => (
                <Message key={m.id} actions={g.from === "agent" ? <CopyButton value={m.text} size="xs" variant="ghost" aria-label="Copy message" /> : undefined}>
                  {m.text}
                </Message>
              ))}
            </MessageGroup>
          ))}
          {streaming !== null ? (
            <MessageGroup author="Nova UI assistant" avatar={agentAvatar}>
              <Message streaming>{streaming}</Message>
            </MessageGroup>
          ) : null}
          {typing ? <TypingIndicator label="Nova UI assistant is typing" /> : null}
        </MessageList>
        <ChatComposer
          attachments
          generating={streaming !== null || typing}
          onStop={stop}
          onSend={({ text, files }) => {
            const body = [text, ...files.map((f) => `📎 ${f.name}`)].filter(Boolean).join("\n");
            setMessages((m) => [...m, { id: Date.now(), from: "me", text: body }]);
            answer();
          }}
        />
      </div>
    </Example>
  );
}

/* ---------------------------------------------------------------- Overlays */

export function PopconfirmExamples() {
  const [files, setFiles] = useState(["Q3 report.pdf", "Old logo.svg"]);
  return (
    <Example
      title="Popconfirm"
      description="A quick confirmation next to the action. Destructive ones start focus on Cancel; async confirms show a spinner."
      code={`<Popconfirm title="Delete this file?" description="This can't be undone."
  confirmLabel="Delete" onConfirm={() => api.delete(id)}>
  <Button variant="ghost" startIcon={<Trash2 />}>Delete</Button>
</Popconfirm>`}
    >
      <ul className="flex w-full max-w-sm flex-col gap-2">
        {files.map((f) => (
          <li key={f} className="flex items-center justify-between rounded-(--nv-card-radius) border border-border bg-surface px-3 py-2 text-sm">
            {f}
            <Popconfirm
              title={`Delete “${f}”?`}
              description="This can't be undone."
              confirmLabel="Delete"
              onConfirm={async () => {
                await new Promise((r) => setTimeout(r, 700));
                setFiles((list) => list.filter((x) => x !== f));
                toast.success(`Deleted ${f}`);
              }}
            >
              <Button size="sm" variant="ghost" startIcon={<Trash2 />}>
                Delete
              </Button>
            </Popconfirm>
          </li>
        ))}
        {files.length === 0 ? (
          <Text size="sm" tone="muted">
            All files deleted.
          </Text>
        ) : null}
      </ul>
    </Example>
  );
}
