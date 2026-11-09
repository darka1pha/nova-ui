import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource-variable/vazirmatn";
import "./index.css";
import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { routeFromPath, setServerRoute, to } from "./docs/kit.tsx";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element");

// Links from before path routing (`/#/components/button`) still work.
if (window.location.hash.startsWith("#/")) {
  window.history.replaceState(null, "", to(window.location.hash.slice(2)));
}

const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

if (root.hasChildNodes()) {
  // A prerendered page (scripts/prerender.ts): keep its HTML and attach to it.
  // Hydration renders the route from the URL, as the prerenderer did.
  setServerRoute(routeFromPath(window.location.pathname));
  hydrateRoot(root, app, {
    // Demos that depend on the clock or the browser (dates, "3 minutes ago",
    // stored preferences) can't match the build-time HTML; React re-renders
    // those parts on the client, which is expected, so it isn't an error.
    onRecoverableError: (error) => {
      if (import.meta.env.DEV) console.warn("Hydration fell back to a client render:", error);
    },
  });
} else {
  createRoot(root).render(app);
}
