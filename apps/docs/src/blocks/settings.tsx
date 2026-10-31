import {
  Avatar,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  TimeInput,
  toast,
  ToggleGroup,
  ToggleGroupItem,
} from "@kaleido/ui";
import { useState } from "react";

/** Settings: grouped sections, each with its own save, and a separated danger zone. */
export function SettingsBlock() {
  const [units, setUnits] = useState("teu");
  return (
    <div className="flex w-full flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-xl font-semibold text-foreground">Settings</h2>
        <p className="text-sm text-foreground-muted">Manage your profile, alerts and port preferences.</p>
      </div>

      <Card variant="outline">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>How you appear to other officers.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-[auto_1fr]">
          <Avatar name="Reza Omrani" size="xl" />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Full name">
              <Input defaultValue="Capt. Reza Omrani" autoComplete="name" />
            </FormField>
            <FormField label="Role">
              <Input defaultValue="Fleet Operations Director" />
            </FormField>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button size="sm" onClick={() => toast("Profile saved", { variant: "success" })}>
            Save profile
          </Button>
        </CardFooter>
      </Card>

      <Card variant="outline">
        <CardHeader>
          <CardTitle>Alerts</CardTitle>
          <CardDescription>Choose what reaches you outside the portal.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <FormField label="Vessel arrivals and departures" description="Berthing, unberthing and pilot boarding." inline>
            <Switch defaultChecked />
          </FormField>
          <FormField label="Customs holds" description="As soon as a container is held or released." inline>
            <Switch defaultChecked />
          </FormField>
          <FormField label="Daily summary by email" inline>
            <Switch />
          </FormField>
          <FormField label="Quiet hours start" description="No push alerts until 06:00.">
            <TimeInput defaultValue="22:00" className="w-fit" />
          </FormField>
        </CardContent>
      </Card>

      <Card variant="outline">
        <CardHeader>
          <CardTitle>Port preferences</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField label="Home port">
            <Select defaultValue="bandar-abbas">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bandar-abbas">Bandar Abbas</SelectItem>
                <SelectItem value="bushehr">Bushehr</SelectItem>
                <SelectItem value="chabahar">Chabahar</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Volume unit">
            <ToggleGroup type="single" value={units} onValueChange={(v) => v && setUnits(v)} aria-label="Volume unit" variant="outline" className="w-fit">
              <ToggleGroupItem value="teu" size="sm">
                TEU
              </ToggleGroupItem>
              <ToggleGroupItem value="tonnes" size="sm">
                Tonnes
              </ToggleGroupItem>
            </ToggleGroup>
          </FormField>
        </CardContent>
      </Card>

      <Card variant="outline" className="border-danger-border">
        <CardHeader>
          <CardTitle className="text-danger-text">Danger zone</CardTitle>
          <CardDescription>Leaving the fleet removes your access to its vessels and documents.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="danger" size="sm">
            Leave fleet
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
