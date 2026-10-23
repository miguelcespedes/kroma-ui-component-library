type BootstrapDropdown = {
  Dropdown: {
    getOrCreateInstance(element: HTMLElement): { hide(): void };
  };
};

import { themes } from "./themes-inventary";

const storageKey = "kroma-theme-mode";
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

  const getStoredTheme = () => {
    try {
      const storedTheme = localStorage.getItem(storageKey);
      return availableThemes.some(({ id }) => id === storedTheme) ? storedTheme! : "bootstrap";
    } catch {
      return "bootstrap";
    }
  };

  let selection = 0;
  const setTheme = (theme: string, initial = false) => {
    const selectedTheme = availableThemes.some((item) => item.id === theme) ? theme : "bootstrap";
    const themeStylesheet = document.querySelector<HTMLLinkElement>("#kroma-theme-stylesheet");
    const stylesheet = availableThemes.find((item) => item.id === selectedTheme)?.stylesheet;
    const request = ++selection;
    if (initial && stylesheet) document.documentElement.style.visibility = "hidden";
    document.querySelectorAll<HTMLLinkElement>("[data-pending-kroma-theme]").forEach((link) => link.remove());
    if (stylesheet && themeStylesheet && themeStylesheet.href !== new URL(stylesheet, document.baseURI).href) {
      const pending = document.createElement("link");
      pending.rel = "stylesheet";
      pending.href = stylesheet;
      pending.dataset.pendingKromaTheme = selectedTheme;
      pending.addEventListener("load", () => {
        if (request !== selection) return;
        document.documentElement.setAttribute("data-kroma-theme", selectedTheme);
        themeStylesheet.remove();
        pending.id = "kroma-theme-stylesheet";
        delete pending.dataset.pendingKromaTheme;
        document.documentElement.style.visibility = "";
      }, { once: true });
      pending.addEventListener("error", () => {
        pending.remove();
        document.documentElement.style.visibility = "";
      }, { once: true });
      document.head.append(pending);
    } else {
      document.documentElement.setAttribute("data-kroma-theme", selectedTheme);
      if (!stylesheet) themeStylesheet?.removeAttribute("href");
      if (initial) document.documentElement.style.visibility = "";
    }

    try {
      localStorage.setItem(storageKey, selectedTheme);
    } catch {
      // Continue without persistence when storage is unavailable.
    }

    const themeLabel = availableThemes.find((item) => item.id === selectedTheme)?.label || selectedTheme;
    const themeButton = document.querySelector<HTMLElement>("[data-theme-selector]");
    themeButton?.setAttribute("aria-label", `Theme: ${themeLabel}`);
    const themeLabelElement = document.querySelector<HTMLElement>("#kroma-theme-label");
    if (themeLabelElement) themeLabelElement.textContent = themeLabel;

    document.querySelectorAll<HTMLElement>("[data-theme-value]").forEach((button) => {
      const selected = button.dataset.themeValue === selectedTheme;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-pressed", String(selected));
      button.querySelector(".bi")?.classList.toggle("d-none", !selected);
    });
  };

  setTheme(getStoredTheme(), true);

  document.querySelectorAll<HTMLElement>("[data-theme-value]").forEach((button) => {
    button.addEventListener("click", () => {
      setTheme(button.dataset.themeValue || "bootstrap");
      bootstrap.Dropdown.getOrCreateInstance(button.closest<HTMLElement>(".dropdown")!).hide();
    });
  });
}
