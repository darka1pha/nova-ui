import { Avatar, FormField, Text } from "@darkalpha/nova-ui";
import { MentionTextarea, type MentionOption } from "@darkalpha/nova-ui/experimental";
import { Hash } from "lucide-react";
import { useState } from "react";
import { Example } from "../docs/kit.tsx";

const crew = [
  { value: "u1", label: "Sara Ahmadi", description: "Port captain" },
  { value: "u2", label: "Reza Omrani", description: "Director" },
  { value: "u3", label: "Sam Karimi", description: "Customs officer" },
  { value: "u4", label: "Leila Moradi", description: "Berth planner" },
  { value: "u5", label: "Navid Rahimi", description: "Pilot" },
];
const people: MentionOption[] = crew.map((p) => ({ ...p, icon: <Avatar size="xs" name={p.label} /> }));
const tags: MentionOption[] = ["customs", "berthing", "bunkering", "inspection", "weather"].map((t) => ({ value: t, label: t, icon: <Hash /> }));

/** A stand-in for a user search endpoint. */
const searchPeople = (query: string, signal: AbortSignal) =>
  new Promise<MentionOption[]>((resolve, reject) => {
    const timer = setTimeout(() => resolve(people.filter((p) => p.label.toLowerCase().includes(query.toLowerCase()))), 350);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });

export function MentionTextareaExamples() {
  const [text, setText] = useState("Berth 4 is ready. @");
  const [mentioned, setMentioned] = useState<string[]>([]);
  return (
    <>
      <Example
        title="MentionTextarea"
        description="Type a trigger at the start of a word to get suggestions: @ for people, # for tags here. Arrows move, Enter or Tab inserts, Escape closes. Mentions are inserted as plain text; onMention tells you who was picked."
        code={`<MentionTextarea
  triggers={[
    { char: "@", options: people },
    { char: "#", options: tags },
  ]}
  value={text}
  onValueChange={setText}
  onMention={(option) => notify(option.value)}
/>`}
      >
        <div className="flex w-full max-w-md flex-col gap-2">
          <FormField label="Handover note">
            <MentionTextarea
              triggers={[
                { char: "@", options: people },
                { char: "#", options: tags },
              ]}
              value={text}
              onValueChange={setText}
              onMention={(option, trigger) => trigger === "@" && setMentioned((m) => [...new Set([...m, option.label])])}
            />
          </FormField>
          <Text size="sm" tone="muted">
            Will notify: {mentioned.length ? mentioned.join(", ") : "nobody yet"}
          </Text>
        </div>
      </Example>

      <Example
        title="Loading suggestions"
        description="loadOptions(query, signal) fetches suggestions as you type, after debounceMs (200 by default). A newer query aborts the older request through signal."
        code={`<MentionTextarea triggers={[{ char: "@", loadOptions: (query, signal) => api.searchUsers(query, { signal }) }]} />`}
      >
        <div className="w-full max-w-md">
          <FormField label="Comment">
            <MentionTextarea triggers={[{ char: "@", loadOptions: searchPeople }]} placeholder="Type @ and a name" />
          </FormField>
        </div>
      </Example>
    </>
  );
}
