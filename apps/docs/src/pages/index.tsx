import { lazy, type ComponentType, type LazyExoticComponent } from "react";

// Each page loads on demand so the first visit only downloads what it shows.
const page = <M extends Record<string, ComponentType>>(load: () => Promise<M>, name: keyof M & string): LazyExoticComponent<ComponentType> =>
  lazy(() => load().then((m) => ({ default: m[name] as ComponentType })));

const components = () => import("./components.tsx");
const guides = () => import("./guides.tsx");

export const nav: { title: string; items: { id: string; label: string; badge?: string }[] }[] = [
  {
    title: "Start",
    items: [
      { id: "home", label: "Overview" },
      { id: "installation", label: "Installation", badge: "New" },
      { id: "getting-started", label: "Getting started" },
      { id: "playground", label: "Theme playground", badge: "Live" },
      { id: "template", label: "Template preview", badge: "New" },
      { id: "blocks", label: "Blocks", badge: "New" },
    ],
  },
  {
    title: "Foundations",
    items: [
      { id: "theming", label: "Theming & color" },
      { id: "tokens", label: "Token reference" },
      { id: "motion", label: "Motion & interaction", badge: "New" },
      { id: "icons", label: "Icons", badge: "New" },
      { id: "layout", label: "Layout & typography" },
    ],
  },
  {
    title: "Components",
    items: [
      { id: "actions", label: "Actions" },
      { id: "forms", label: "Forms" },
      { id: "forms-validation", label: "Forms & validation", badge: "New" },
      { id: "feedback", label: "Feedback" },
      { id: "overlays", label: "Overlays" },
      { id: "navigation", label: "Navigation" },
      { id: "data", label: "Data display" },
    ],
  },
  {
    title: "Guides",
    items: [
      { id: "accessibility", label: "Accessibility" },
      { id: "i18n", label: "RTL & i18n" },
      { id: "styling", label: "Styling overrides" },
      { id: "custom-components", label: "Custom components" },
      { id: "migration", label: "Upgrading" },
      { id: "troubleshooting", label: "Troubleshooting" },
      { id: "contributing", label: "Contributing" },
    ],
  },
];

export const pages: Record<string, LazyExoticComponent<ComponentType>> & { home: LazyExoticComponent<ComponentType> } = {
  home: page(() => import("./home.tsx"), "HomePage"),
  installation: page(() => import("./installation.tsx"), "InstallationPage"),
  "getting-started": page(() => import("./getting-started.tsx"), "GettingStartedPage"),
  playground: page(() => import("./playground.tsx"), "PlaygroundPage"),
  template: page(() => import("./template.tsx"), "TemplatePage"),
  blocks: page(() => import("./blocks.tsx"), "BlocksPage"),
  theming: page(() => import("./theming.tsx"), "ThemingPage"),
  tokens: page(() => import("./tokens.tsx"), "TokensPage"),
  motion: page(() => import("./motion.tsx"), "MotionPage"),
  icons: page(() => import("./icons.tsx"), "IconsPage"),
  layout: page(components, "LayoutPage"),
  actions: page(components, "ActionsPage"),
  forms: page(components, "FormsPage"),
  "forms-validation": page(() => import("./forms-validation.tsx"), "FormsValidationPage"),
  feedback: page(components, "FeedbackPage"),
  overlays: page(components, "OverlaysPage"),
  navigation: page(components, "NavigationPage"),
  data: page(components, "DataPage"),
  accessibility: page(guides, "AccessibilityPage"),
  i18n: page(guides, "I18nPage"),
  styling: page(guides, "StylingPage"),
  "custom-components": page(guides, "CustomComponentsPage"),
  migration: page(guides, "MigrationPage"),
  troubleshooting: page(guides, "TroubleshootingPage"),
  contributing: page(guides, "ContributingPage"),
};
