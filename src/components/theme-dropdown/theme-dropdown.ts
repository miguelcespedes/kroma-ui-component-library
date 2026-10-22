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
    <span class="text-white">Theme</span>
    <button class="btn btn-outline-light dropdown-toggle" type="button" data-theme-selector data-bs-toggle="dropdown" aria-expanded="false">
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

  const setTheme = (theme: string) => {
    const selectedTheme = availableThemes.some((item) => item.id === theme) ? theme : "bootstrap";
    document.documentElement.setAttribute("data-kroma-theme", selectedTheme);

    const themeStylesheet = document.querySelector<HTMLStyleElement>("#kroma-theme-stylesheet");
    if (themeStylesheet) themeStylesheet.textContent = availableThemes.find((item) => item.id === selectedTheme)?.stylesheet || "";

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

  setTheme(getStoredTheme());

  document.querySelectorAll<HTMLElement>("[data-theme-value]").forEach((button) => {
    button.addEventListener("click", () => {
      setTheme(button.dataset.themeValue || "bootstrap");
      bootstrap.Dropdown.getOrCreateInstance(button.closest<HTMLElement>(".dropdown")!).hide();
    });
  });
}
