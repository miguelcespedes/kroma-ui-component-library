/// <reference types="vite/client" />

declare module "bootstrap" {
  const bootstrap: {
    Tooltip: new (element: Element) => unknown;
    Popover: new (element: Element) => unknown;
    ScrollSpy: {
      getOrCreateInstance(element: Element): unknown;
    };
    Dropdown: {
      getOrCreateInstance(element: Element): { hide(): void };
    };
  };

  export = bootstrap;
}

interface Window {
  bootstrap: typeof import("bootstrap");
}
