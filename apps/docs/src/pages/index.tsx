import { createElement, lazy, type ComponentType, type LazyExoticComponent, type ReactElement } from "react";
import { categories, componentById, components, type CategoryId } from "../docs/registry.ts";

// Each page loads on demand so the first visit only downloads what it shows.
const page = <M extends Record<string, ComponentType>>(load: () => Promise<M>, name: keyof M & string): LazyExoticComponent<ComponentType> =>
  lazy(() => load().then((m) => ({ default: m[name] as ComponentType })));

const guides = () => import("./guides.tsx");
const componentPages = () => import("./component.tsx");
const ComponentPage = lazy(() => componentPages().then((m) => ({ default: m.ComponentPage })));
const CategoryPage = lazy(() => componentPages().then((m) => ({ default: m.CategoryPage })));

export interface NavItem {
  id: string;
  label: string;
  badge?: string;
  /** Shown nested under this item while it, or one of them, is the current page. */
  children?: NavItem[];
  /** Extra words the component filter matches, e.g. the exports a page documents. */
  keywords?: string;
}

export const nav: { title: string; items: NavItem[] }[] = [
  {
    title: "Start",
    items: [
      { id: "home", label: "Overview" },
      { id: "installation", label: "Installation", badge: "New" },
      { id: "getting-started", label: "Getting started" },
      { id: "playground", label: "Theme playground", badge: "Live" },
      { id: "template", label: "Template preview", badge: "New" },
      { id: "blocks", label: "Blocks", badge: "New" },
      { id: "seasonal-pages", label: "Seasonal pages", badge: "New", keywords: "Yalda Nowruz kaveh-yalda kaveh-nowruz campaign" },
    ],
  },
  {
    title: "Foundations",
    items: [
      { id: "theming", label: "Theming & color" },
      { id: "tokens", label: "Token reference" },
      { id: "motion", label: "Motion & interaction", badge: "New" },
      { id: "icons", label: "Icons", badge: "New" },
    ],
  },
  {
    title: "Components",
    items: categories.map((c) => ({
      id: c.id,
      label: c.label,
      children: components.filter((x) => x.category === c.id).map((x) => ({ id: `components/${x.id}`, label: x.name, keywords: x.parts.join(" ") })),
    })),
  },
  {
    title: "Guides",
    items: [
      { id: "forms-validation", label: "Forms & validation", badge: "New" },
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

export const pages: Record<string, LazyExoticComponent<ComponentType>> = {
  home: page(() => import("./home.tsx"), "HomePage"),
  installation: page(() => import("./installation.tsx"), "InstallationPage"),
  "getting-started": page(() => import("./getting-started.tsx"), "GettingStartedPage"),
  playground: page(() => import("./playground.tsx"), "PlaygroundPage"),
  template: page(() => import("./template.tsx"), "TemplatePage"),
  blocks: page(() => import("./blocks.tsx"), "BlocksPage"),
  "seasonal-pages": page(() => import("./seasonal-pages.tsx"), "SeasonalPagesPage"),
  theming: page(() => import("./theming.tsx"), "ThemingPage"),
  tokens: page(() => import("./tokens.tsx"), "TokensPage"),
  motion: page(() => import("./motion.tsx"), "MotionPage"),
  icons: page(() => import("./icons.tsx"), "IconsPage"),
  "forms-validation": page(() => import("./forms-validation.tsx"), "FormsValidationPage"),
  accessibility: page(guides, "AccessibilityPage"),
  i18n: page(guides, "I18nPage"),
  styling: page(guides, "StylingPage"),
  "custom-components": page(guides, "CustomComponentsPage"),
  migration: page(guides, "MigrationPage"),
  troubleshooting: page(guides, "TroubleshootingPage"),
  contributing: page(guides, "ContributingPage"),
};

const categoryIds = new Set<string>(categories.map((c) => c.id));
// A category id that is also a page id would hide that page.
for (const id of categoryIds) if (id in pages) throw new Error(`Category "${id}" collides with the page of the same name.`);

/** The page for a route, or null when there isn't one. */
export function resolveRoute(route: string): ReactElement | null {
  if (route.startsWith("components/")) {
    const id = route.slice("components/".length);
    return componentById.has(id) ? createElement(ComponentPage, { id, key: id }) : null;
  }
  if (categoryIds.has(route)) return createElement(CategoryPage, { id: route as CategoryId, key: route });
  const Page = pages[route];
  return Page ? createElement(Page) : null;
}

/** The nav label for a route, for the document title. */
export function routeLabel(route: string): string | undefined {
  for (const group of nav) {
    for (const item of group.items) {
      if (item.id === route) return item.label;
      const child = item.children?.find((c) => c.id === route);
      if (child) return child.label;
    }
  }
  return undefined;
}
