import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { Folder, Home, Inbox, Settings, Users } from "lucide-react";
import { describe, expect, it } from "vitest";
import {
  DualSidebar,
  FloatingSidebar,
  ResponsiveSidebar,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarItem,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSection,
  SidebarTrigger,
} from "../src/index.ts";
import { axeViolations } from "./axe.ts";

describe("Sidebar Provider & Core", () => {
  function SidebarTestHarness({ defaultOpen = true }: { defaultOpen?: boolean }) {
    return (
      <SidebarProvider defaultOpen={defaultOpen}>
        <SidebarTrigger data-testid="trigger" />
        <Sidebar label="Test Navigation" data-testid="sidebar">
          <SidebarHeader>
            <span>App Brand</span>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Main</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive tooltip="Home">
                      <Home />
                      <span>Home</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Inbox">
                      <Inbox />
                      <span>Inbox</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <span>User Footer</span>
          </SidebarFooter>
          <SidebarRail data-testid="rail" />
        </Sidebar>
        <SidebarInset data-testid="inset">
          <h1>Main Content</h1>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  it("renders expanded by default with proper landmarks and accessible labels", () => {
    render(<SidebarTestHarness />);
    const sidebar = screen.getByTestId("sidebar");
    expect(sidebar).toHaveAttribute("data-state", "expanded");
    expect(sidebar).toHaveAttribute("aria-label", "Test Navigation");
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Home" })).toHaveAttribute("aria-current", "page");
  });

  it("toggles between expanded and collapsed when the trigger button is clicked", async () => {
    const user = userEvent.setup();
    render(<SidebarTestHarness />);
    const trigger = screen.getByTestId("trigger");
    const sidebar = screen.getByTestId("sidebar");

    expect(sidebar).toHaveAttribute("data-state", "expanded");
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await user.click(trigger);
    expect(sidebar).toHaveAttribute("data-state", "collapsed");
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);
    expect(sidebar).toHaveAttribute("data-state", "expanded");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("toggles state via keyboard shortcut (Ctrl+B)", async () => {
    const user = userEvent.setup();
    render(<SidebarTestHarness />);
    const sidebar = screen.getByTestId("sidebar");

    expect(sidebar).toHaveAttribute("data-state", "expanded");

    await user.keyboard("{Control>}b{/Control}");
    expect(sidebar).toHaveAttribute("data-state", "collapsed");

    await user.keyboard("{Control>}b{/Control}");
    expect(sidebar).toHaveAttribute("data-state", "expanded");
  });

  it("supports rail click to toggle collapse", async () => {
    const user = userEvent.setup();
    render(<SidebarTestHarness />);
    const rail = screen.getByTestId("rail");
    const sidebar = screen.getByTestId("sidebar");

    expect(sidebar).toHaveAttribute("data-state", "expanded");
    await user.click(rail);
    expect(sidebar).toHaveAttribute("data-state", "collapsed");
  });

  it("renders with legacy SidebarSection and SidebarItem compatibility", () => {
    render(
      <Sidebar label="Legacy">
        <SidebarSection title="Workspace">
          <SidebarItem href="#/home" icon={<Home />} active>
            Home
          </SidebarItem>
          <SidebarItem href="#/settings" icon={<Settings />}>
            Settings
          </SidebarItem>
        </SidebarSection>
      </Sidebar>,
    );

    expect(screen.getByText("Workspace")).toBeInTheDocument();
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Home/ })).toHaveAttribute("aria-current", "page");
  });

  it("passes axe accessibility checks", async () => {
    const { container } = render(<SidebarTestHarness />);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("Responsive Sidebar Variants", () => {
  it("renders ResponsiveSidebar with brand, groups, badges, and user profile", async () => {
    const user = userEvent.setup();
    render(
      <SidebarProvider>
        <ResponsiveSidebar
          label="App Sidebar"
          brand={{
            logo: <div data-testid="logo">Logo</div>,
            title: "Nova UI Platform",
            subtitle: "Design System",
          }}
          groups={[
            {
              title: "Overview",
              items: [
                { title: "Dashboard", icon: <Home />, href: "#/dash", isActive: true },
                { title: "Notifications", icon: <Inbox />, href: "#/notifs", badge: "3" },
              ],
            },
            {
              title: "Management",
              items: [
                {
                  title: "Projects",
                  icon: <Folder />,
                  subItems: [
                    { title: "Active", href: "#/active" },
                    { title: "Archived", href: "#/archived" },
                  ],
                },
              ],
            },
          ]}
          footerUser={{
            name: "Jane Doe",
            email: "jane@example.com",
            avatar: <div data-testid="avatar">JD</div>,
          }}
        />
      </SidebarProvider>,
    );

    expect(screen.getByText("Nova UI Platform")).toBeInTheDocument();
    expect(screen.getByText("Design System")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();

    // Sub menus start closed unless something inside is active, and toggle from their parent.
    const projects = screen.getByRole("button", { name: "Projects" });
    expect(projects).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Active")).not.toBeInTheDocument();
    await user.click(projects);
    expect(projects).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Active" })).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
  });

  it("renders DualSidebar (RailSidebar) with primary workspace rail and secondary drill-down", async () => {
    const user = userEvent.setup();
    render(
      <SidebarProvider>
        <DualSidebar
          label="Dual Navigation"
          title="Team Workspace"
          railItems={[
            { id: "ws-1", label: "Core App", icon: <Home data-testid="ws-1" />, isActive: true },
            { id: "ws-2", label: "Analytics", icon: <Users data-testid="ws-2" /> },
          ]}
        >
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton isActive>Channel #general</SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton>Channel #random</SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </DualSidebar>
      </SidebarProvider>,
    );

    expect(screen.getByText("Team Workspace")).toBeInTheDocument();
    expect(screen.getByText("Channel #general")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Core App" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Analytics" })).toBeInTheDocument();

    const analyticsButton = screen.getByRole("button", { name: "Analytics" });
    await user.click(analyticsButton);
    expect(analyticsButton).toHaveAttribute("aria-current", "true");
  });

  it("renders FloatingSidebar with floating variant attributes", () => {
    render(
      <SidebarProvider>
        <FloatingSidebar label="Floating Nav" data-testid="floating-sidebar">
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>Explore</SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </FloatingSidebar>
      </SidebarProvider>,
    );

    const sidebar = screen.getByTestId("floating-sidebar");
    expect(sidebar).toHaveAttribute("data-variant", "floating");
    expect(screen.getByText("Explore")).toBeInTheDocument();
  });
});
