import * as bootstrap from "bootstrap";
import "./app.scss";
import { initializeContrastDropdown } from "../components/contrast-dropdown/contrast-dropdown";
import { initializeThemeDropdown } from "../components/theme-dropdown/theme-dropdown";
import { initializeColorTokenPalette } from "../components/color-token-palette/color-token-palette";

window.bootstrap = bootstrap;

const themeStylesheet = document.createElement("style");
themeStylesheet.id = "kroma-theme-stylesheet";
document.head.append(themeStylesheet);

document.documentElement.setAttribute("data-kroma-theme", "bootstrap");
document.documentElement.setAttribute("data-bs-theme", "dark");

initializeThemeDropdown(bootstrap);
initializeContrastDropdown(bootstrap);
initializeColorTokenPalette();

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
