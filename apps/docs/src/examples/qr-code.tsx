import { Input, Stack, Text } from "@darkalpha/nova-ui";
import { QRCode } from "@darkalpha/nova-ui/experimental";
import { useState } from "react";
import { Example } from "../docs/kit.tsx";

export function QRCodeExamples() {
  const [value, setValue] = useState("https://nova.example/track/KMS-94812");
  return (
    <>
      <Example
        title="QRCode"
        description="Encodes text or a URL with the built-in encoder and draws it as one SVG path, so it's sharp at any size and renders on the server. Give it a label that says where it leads."
        code={`<QRCode value="https://nova.example/track/KMS-94812" label="Track shipment KMS-94812" />`}
      >
        <Stack gap={3} className="w-full max-w-xs items-center">
          <QRCode value={value} label={`QR code for ${value}`} size={176} />
          <Input aria-label="Text to encode" value={value} onChange={(e) => setValue(e.target.value)} />
          <Text size="sm" tone="muted">
            {new TextEncoder().encode(value).length} bytes
          </Text>
        </Stack>
      </Example>

      <Example
        title="Error correction and size"
        description="ecc sets how much of the code can be damaged or covered and still scan: L 7%, M 15% (default), Q 25%, H 30%. Higher levels make a denser code. The quiet zone (margin, 4 modules) is part of the spec; scanners need it."
        code={`<QRCode value={url} label="…" ecc="L" size={96} />
<QRCode value={url} label="…" ecc="H" size={96} />`}
      >
        {(["L", "M", "Q", "H"] as const).map((ecc) => (
          <Stack key={ecc} gap={1} className="items-center">
            <QRCode value="https://nova.example/track/KMS-94812" label={`Tracking link, level ${ecc}`} ecc={ecc} size={96} />
            <Text size="sm" tone="muted">
              {ecc}
            </Text>
          </Stack>
        ))}
      </Example>

      <Example
        title="Colors"
        description="color and background take any CSS color. Keep the modules dark on a light background: many scanners can't read light-on-dark codes, so QRCode doesn't follow dark mode."
        code={`<QRCode value={url} label="…" color="#1e3a8a" background="#eff6ff" />`}
      >
        <QRCode value="https://nova.example" label="Nova site, navy" color="#1e3a8a" background="#eff6ff" size={120} />
        <QRCode value="https://nova.example" label="Nova site, no quiet zone" margin={0} size={120} className="rounded-md" />
      </Example>
    </>
  );
}
