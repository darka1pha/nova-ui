import {
  AnimatedBorder,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DatePicker,
  FormField,
  Input,
  Stat,
  ThemeProvider,
  Toaster,
  toast,
} from "@kaleido/ui";
import "@kaleido/ui/styles.css";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";

// This app installs Kaleido from local tarballs (no npm registry):
//   node ../../scripts/install-local.mjs .
function App() {
  const [date, setDate] = useState(null);
  return (
    <ThemeProvider theme="vibrant" brand={{ primary: "#6C5CE7" }} motionStyle="expressive" style={{ minHeight: "100dvh" }}>
      <main style={{ maxWidth: 720, margin: "0 auto", padding: 32, display: "grid", gap: 24 }}>
        <AnimatedBorder style={{ padding: 24 }}>
          <Badge variant="gradient">Installed locally</Badge>
          <h1 style={{ margin: "12px 0 0" }}>Kaleido works without npm</h1>
        </AnimatedBorder>
        <Card>
          <CardHeader>
            <CardTitle>Book a session</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField label="Email">
              <Input type="email" placeholder="you@example.com" />
            </FormField>
            <FormField label="Date">
              <DatePicker value={date} onValueChange={setDate} />
            </FormField>
            <Button ripple onClick={() => toast.success("Booked!")}>
              Book now
            </Button>
          </CardContent>
        </Card>
        <Stat label="Sessions this month" value={128} delta={9.5} trend={[3, 6, 5, 9, 12, 11, 15]} />
      </main>
      <Toaster />
    </ThemeProvider>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
