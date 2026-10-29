import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-ks-mode");
});

// jsdom gaps that Radix primitives rely on.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

const proto = window.HTMLElement.prototype as HTMLElement & {
  hasPointerCapture?: (id: number) => boolean;
  releasePointerCapture?: (id: number) => void;
  setPointerCapture?: (id: number) => void;
  scrollIntoView?: () => void;
};
proto.hasPointerCapture ??= () => false;
proto.releasePointerCapture ??= () => {};
proto.setPointerCapture ??= () => {};
proto.scrollIntoView ??= () => {};
