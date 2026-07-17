import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

const defaultMatchMedia = (query: string): MediaQueryList => ({
  addEventListener: () => undefined,
  addListener: () => undefined,
  dispatchEvent: () => true,
  matches: false,
  media: query,
  onchange: null,
  removeEventListener: () => undefined,
  removeListener: () => undefined,
});

Object.defineProperty(window, "matchMedia", {
  configurable: true,
  value: defaultMatchMedia,
});

Object.defineProperties(HTMLDialogElement.prototype, {
  close: {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.removeAttribute("open");
    },
  },
  showModal: {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.setAttribute("open", "");
    },
  },
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});
