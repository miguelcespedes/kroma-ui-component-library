import * as bootstrap from "bootstrap";
import "./app.scss";
import { initializeContrastDropdown } from "../components/contrast-dropdown/contrast-dropdown";
import { initializeThemeDropdown } from "../components/theme-dropdown/theme-dropdown";
import { themeTokens } from "../components/theme-dropdown/theme-tokens";

window.bootstrap = bootstrap;

const themeStylesheet = document.createElement("style");
themeStylesheet.id = "kroma-theme-stylesheet";
document.head.append(themeStylesheet);

document.documentElement.setAttribute("data-kroma-theme", "bootstrap");
document.documentElement.setAttribute("data-bs-theme", "dark");

initializeThemeDropdown(bootstrap);
initializeContrastDropdown(bootstrap);

const palette = document.querySelector<HTMLElement>("[data-theme-tokens]");
if (palette) {
  const renderTokens = () => {
    const theme = themeTokens.find((entry) => entry.id === document.documentElement.dataset.kromaTheme);
    palette.innerHTML = theme ? [
      ["Primitive colors", theme.primitive],
      ["Semantic colors", theme.semantic],
    ].map(([title, tokens]) => `
      <div class="col-12"><h4 class="h6 mt-3">${title}</h4></div>
      ${tokens.map((token) => `
      <div class="col-6 col-md-3">
        <div class="bd-color-token" style="--bd-token-color: ${token.value}">
          <span>${token.name}</span>
          <code>${token.value}</code>
        </div>
      </div>`).join("")}`).join("") : "";
  };

  renderTokens();
  new MutationObserver(renderTokens).observe(document.documentElement, { attributes: true, attributeFilter: ["data-kroma-theme"] });
}

document.querySelectorAll<HTMLElement>('[data-bs-toggle="tooltip"]').forEach((element) => new bootstrap.Tooltip(element));
document.querySelectorAll<HTMLElement>('[data-bs-toggle="popover"]').forEach((element) => new bootstrap.Popover(element));
document.querySelectorAll<HTMLElement>(".toast").forEach((element) => {
  element.classList.remove("fade", "hide");
  element.classList.add("show");
});
document.querySelectorAll<HTMLElement>('[data-bs-spy="scroll"]').forEach((element) => bootstrap.ScrollSpy.getOrCreateInstance(element));
document.querySelectorAll<HTMLAnchorElement>('a[href="#"]').forEach((link) => {
  link.addEventListener("click", (event) => event.preventDefault());
});
