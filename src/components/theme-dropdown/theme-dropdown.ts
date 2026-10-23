type BootstrapDropdown = {
  Dropdown: {
    getOrCreateInstance(element: HTMLElement): { hide(): void };
  };
};

import { themes } from "./themes-inventary";

const storageKey = "kroma-theme-mode";
const themeAttribute = "data-kroma-theme";

export function initializeThemeDropdown(bootstrap: BootstrapDropdown) {
  const container = document.querySelector<HTMLElement>("[data-theme-dropdown]");
  if (!container) return;

  container.innerHTML = `
    <span class="text-body">Theme</span>
    <button class="btn btn-primary dropdown-toggle" type="button" data-theme-selector data-bs-toggle="dropdown" aria-expanded="false">
      <span id="kroma-theme-label">Theme</span>
    </button>
    <ul class="dropdown-menu dropdown-menu-end"></ul>
  `;

  const menu = container.querySelector<HTMLUListElement>(".dropdown-menu")!;
  const availableThemes = [{ id: "bootstrap", label: "Bootstrap", stylesheet: "" }, ...themes];
  availableThemes.forEach(({ id, label }) => {
    const item = document.createElement("li");
    item.innerHTML = `<button class="dropdown-item d-flex align-items-center" type="button" data-theme-value="${id}" aria-pressed="false">${label}<span class="ms-3"></span><svg class="bi ms-auto d-none" aria-hidden="true"><use href="#check2"></use></svg></button>`;
    menu.append(item);
  });

  const root = document.documentElement;
  const selector = document.querySelector<HTMLElement>("[data-theme-selector]");
  const labelElement = document.querySelector<HTMLElement>("#kroma-theme-label");
  const currentStylesheet = () => document.querySelector<HTMLLinkElement>("#kroma-theme-stylesheet");

  let activeTheme = "bootstrap";
  let selection = 0;
  let pendingLink: HTMLLinkElement | null = null;

  const normalizeTheme = (theme: string | null) => availableThemes.some(({ id }) => id === theme) ? theme! : "bootstrap";

  const getStoredTheme = () => {
    try {
      return normalizeTheme(localStorage.getItem(storageKey));
    } catch {
      return "bootstrap";
    }
  };

  const persistTheme = (theme: string) => {
    try {
      localStorage.setItem(storageKey, theme);
    } catch {
      // Continue without persistence when storage is unavailable.
    }
  };

  const updateControls = (theme: string) => {
    const themeLabel = availableThemes.find((item) => item.id === theme)?.label || theme;
    selector?.setAttribute("aria-label", `Theme: ${themeLabel}`);
    selector?.setAttribute("aria-busy", "false");
    if (labelElement) labelElement.textContent = themeLabel;

    document.querySelectorAll<HTMLElement>("[data-theme-value]").forEach((button) => {
      const selected = button.dataset.themeValue === theme;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-pressed", String(selected));
      button.querySelector(".bi")?.classList.toggle("d-none", !selected);
    });
  };

  const setStatus = (status: "loading" | "ready" | "error") => {
    container.dataset.themeState = status;
  };

  const clearPending = () => {
    pendingLink?.remove();
    pendingLink = null;
  };

  const commitTheme = (theme: string, nextStylesheet?: HTMLLinkElement) => {
    const previousStylesheet = currentStylesheet();
    root.setAttribute(themeAttribute, theme);
    if (nextStylesheet) {
      nextStylesheet.media = "all";
      nextStylesheet.id = "kroma-theme-stylesheet";
      delete nextStylesheet.dataset.pendingKromaTheme;
      if (previousStylesheet && previousStylesheet !== nextStylesheet) previousStylesheet.remove();
    } else if (previousStylesheet) {
      previousStylesheet.removeAttribute("href");
    }
    pendingLink = null;
    activeTheme = theme;
    root.style.visibility = "";
    persistTheme(theme);
    updateControls(theme);
    setStatus("ready");
  };

  const failTheme = (theme: string, error: unknown) => {
    clearPending();
    root.style.visibility = "";
    console.error(`[kroma] Failed to load theme stylesheet "${theme}".`, error);
    persistTheme(activeTheme);
    updateControls(activeTheme);
    setStatus("error");
  };

  const usableStylesheet = (link: HTMLLinkElement) => {
    try {
      return (link.sheet?.cssRules.length ?? 0) > 0;
    } catch {
      return true;
    }
  };

  const setTheme = (theme: string, initial = false) => {
    const selectedTheme = normalizeTheme(theme);
    const request = ++selection;
    const stylesheet = availableThemes.find((item) => item.id === selectedTheme)?.stylesheet;

    if (pendingLink) clearPending();

    if (selectedTheme === activeTheme) {
      root.style.visibility = "";
      persistTheme(activeTheme);
      updateControls(activeTheme);
      setStatus("ready");
      return;
    }

    if (!stylesheet) {
      commitTheme(selectedTheme);
      return;
    }

    if (initial) root.style.visibility = "hidden";
    selector?.setAttribute("aria-busy", "true");
    setStatus("loading");

    const pending = document.createElement("link");
    pending.rel = "stylesheet";
    pending.href = stylesheet;
    pending.media = "print";
    pending.dataset.pendingKromaTheme = selectedTheme;
    pending.addEventListener("load", () => {
      if (request !== selection) {
        pending.remove();
        return;
      }
      if (!usableStylesheet(pending)) {
        failTheme(selectedTheme, new Error("Stylesheet loaded without usable rules"));
        pending.remove();
        return;
      }
      commitTheme(selectedTheme, pending);
    }, { once: true });
    pending.addEventListener("error", () => {
      if (request !== selection) {
        pending.remove();
        return;
      }
      failTheme(selectedTheme, new Error(`HTTP error while loading ${stylesheet}`));
      pending.remove();
    }, { once: true });
    pendingLink = pending;
    document.head.append(pending);
  };

  setTheme(getStoredTheme(), true);

  document.querySelectorAll<HTMLElement>("[data-theme-value]").forEach((button) => {
    button.addEventListener("click", () => {
      setTheme(button.dataset.themeValue || "bootstrap");
      bootstrap.Dropdown.getOrCreateInstance(button.closest<HTMLElement>(".dropdown")!).hide();
    });
  });
}
