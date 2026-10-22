type BootstrapDropdown = {
  Dropdown: {
    getOrCreateInstance(element: HTMLElement): { hide(): void };
  };
};

const storageKey = "kroma-color-mode";
const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");

export function initializeContrastDropdown(bootstrap: BootstrapDropdown) {
  const getStoredMode = () => {
    try {
      const storedMode = localStorage.getItem(storageKey);
      return storedMode === "light" || storedMode === "dark" || storedMode === "auto" ? storedMode : "auto";
    } catch {
      return "auto";
    }
  };

  const setColorMode = (mode: string) => {
    const selectedMode = mode === "light" || mode === "dark" || mode === "auto" ? mode : "auto";
    const effectiveMode = selectedMode === "auto" ? (colorScheme.matches ? "dark" : "light") : selectedMode;
    document.documentElement.setAttribute("data-bs-theme", effectiveMode);
    try {
      localStorage.setItem(storageKey, selectedMode);
    } catch {
      // Continue without persistence when storage is unavailable.
    }

    const activeButton = document.querySelector<HTMLElement>(`[data-bs-theme-value="${selectedMode}"]`);
    const activeIcon = document.querySelector<SVGUseElement>("#bd-theme .theme-icon-active use");
    const icon = activeButton?.querySelector<SVGUseElement>("use");
    if (activeIcon && icon) activeIcon.setAttribute("href", icon.getAttribute("href") || "");

    document.querySelectorAll<HTMLElement>("[data-bs-theme-value]").forEach((button) => {
      const selected = button.dataset.bsThemeValue === selectedMode;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-pressed", String(selected));
      button.querySelector(".ms-auto")?.classList.toggle("d-none", !selected);
    });
  };

  setColorMode(getStoredMode());

  document.querySelectorAll<HTMLElement>("[data-bs-theme-value]").forEach((button) => {
    button.addEventListener("click", () => {
      setColorMode(button.dataset.bsThemeValue || "auto");
      bootstrap.Dropdown.getOrCreateInstance(document.querySelector<HTMLElement>("#bd-theme")!).hide();
    });
  });

  colorScheme.addEventListener("change", () => {
    if (getStoredMode() === "auto") setColorMode("auto");
  });
}
