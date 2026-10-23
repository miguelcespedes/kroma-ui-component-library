import * as bootstrap from "bootstrap";
import "./app.scss";
import { initializeContrastDropdown } from "../components/contrast-dropdown/contrast-dropdown";
import { initializeThemeDropdown } from "../components/theme-dropdown/theme-dropdown";
import { initializeColorTokenPalette } from "../components/color-token-palette/color-token-palette";
import { KromaChatElement } from "../components/chat/chat";
import type { ChatSendDetail } from "../components/chat/chat";

window.bootstrap = bootstrap;

const themeStylesheet = document.createElement("link");
themeStylesheet.id = "kroma-theme-stylesheet";
themeStylesheet.rel = "stylesheet";
document.head.append(themeStylesheet);

document.documentElement.setAttribute("data-kroma-theme", "bootstrap");
document.documentElement.setAttribute("data-bs-theme", "dark");

initializeThemeDropdown(bootstrap);
initializeContrastDropdown(bootstrap);
initializeColorTokenPalette();

document.addEventListener("kroma-chat-send", (event) => {
  const chat = event.target;
  if (!(chat instanceof KromaChatElement)) return;

  const { message } = (event as CustomEvent<ChatSendDetail>).detail;
  window.setTimeout(() => {
    chat.addMessage({ author: "assistant", text: simulatedChatReply(message) });
  }, 650);
});

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

function simulatedChatReply(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("person")) return "I can’t connect you to a person in this demo, but that’s a useful option to explore.";
  if (normalized.includes("example")) return "For example, I can help answer questions, explain a topic, or guide you through a task.";
  if (normalized.includes("help")) return "I can answer questions, share examples, and help you find your next step.";
  return `Thanks for sharing that. This is a simulated reply to “${message}”.`;
}
