import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

/*
  Runs before every test file.

  Everything here exists because jsdom is missing a browser API that Chakra v3
  or the app itself calls during render. Each stub is the smallest thing that
  keeps a component mountable — none of them simulate behaviour, and a test
  that needs real behaviour from one of these should say so explicitly rather
  than lean on the stub.
*/

afterEach(() => {
  // Testing Library only auto-cleans when globals are on AND the framework
  // detects a supported test runner. Being explicit costs nothing and stops
  // one test's DOM leaking into the next.
  cleanup();
});

// Chakra reads this on mount for responsive props and colour mode. jsdom has
// no layout engine, so it does not implement it at all.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Used by Chakra's popover/menu positioning and by any virtualised list.
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

globalThis.IntersectionObserver = class {
  root = null;
  rootMargin = "";
  thresholds: readonly number[] = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
} as unknown as typeof IntersectionObserver;

// jsdom implements neither, and Chakra's Dialog calls both.
if (!HTMLElement.prototype.scrollIntoView) {
  HTMLElement.prototype.scrollIntoView = () => {};
}
if (!window.HTMLElement.prototype.releasePointerCapture) {
  window.HTMLElement.prototype.hasPointerCapture = () => false;
  window.HTMLElement.prototype.setPointerCapture = () => {};
  window.HTMLElement.prototype.releasePointerCapture = () => {};
}

/*
  A test that reaches the network is a test that fails on a plane. axios is
  configured with `withCredentials` against VITE_API_URL, so anything
  unmocked would try a real request; failing loudly beats hanging.
*/
globalThis.fetch = vi.fn(() => {
  throw new Error(
    "fetch() was called in a test. Mock the API module you are testing instead.",
  );
}) as unknown as typeof fetch;
