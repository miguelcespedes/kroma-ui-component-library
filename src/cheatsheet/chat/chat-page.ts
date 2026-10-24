import "../app";
import "./chat-page.scss";

const preview = document.querySelector<HTMLElement>("[data-chat-preview]");
const chat = document.querySelector<HTMLElement>("kroma-chat[data-demo='commerce-journey']");
const lab = document.querySelector<HTMLElement>("[data-chat-lab]");
let viewportFrame = 0;

const syncVisualViewport = () => {
  const viewport = window.visualViewport;
  if (!lab || !viewport) return;

  cancelAnimationFrame(viewportFrame);
  viewportFrame = requestAnimationFrame(() => {
    lab.style.setProperty("--chat-visual-viewport-height", `${viewport.height}px`);
    lab.style.setProperty("--chat-visual-viewport-top", `${viewport.offsetTop}px`);
    const activeElement = document.activeElement;
    const textControlFocused = activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement;
    const layoutHeight = document.documentElement.clientHeight || window.innerHeight;
    const keyboardOpen = window.matchMedia("(pointer: coarse)").matches
      && textControlFocused
      && viewport.height < layoutHeight - 100;
    lab.toggleAttribute("data-chat-keyboard-open", keyboardOpen);
  });
};

const setPreviewWidth = (button: HTMLButtonElement) => {
  const width = button.dataset.chatWidth || "fluid";
  const adaptive = width === "fluid";
  const cssWidth = adaptive ? "100%" : width;

  preview?.style.setProperty("--chat-preview-width", cssWidth);
  chat?.style.setProperty("--kroma-chat-width", cssWidth);
  lab?.toggleAttribute("data-chat-layout-adaptive", adaptive);
  document.body.classList.toggle("kroma-chat-standalone--adaptive", adaptive);
  syncVisualViewport();

  document.querySelectorAll<HTMLButtonElement>("[data-chat-width]").forEach((option) => {
    option.setAttribute("aria-pressed", String(option === button));
  });
};

document.querySelectorAll<HTMLButtonElement>("[data-chat-width]").forEach((button) => {
  button.addEventListener("click", () => setPreviewWidth(button));
});

document.querySelector<HTMLSelectElement>("[data-chat-density]")?.addEventListener("change", (event) => {
  const select = event.currentTarget as HTMLSelectElement;
  chat?.setAttribute("data-density", select.value === "compact" ? "compact" : "comfortable");
});

const initialWidth = document.querySelector<HTMLButtonElement>('[data-chat-width][aria-pressed="true"]');
if (initialWidth) setPreviewWidth(initialWidth);

window.visualViewport?.addEventListener("resize", syncVisualViewport, { passive: true });
window.visualViewport?.addEventListener("scroll", syncVisualViewport, { passive: true });
window.addEventListener("resize", syncVisualViewport, { passive: true });
document.addEventListener("focusin", syncVisualViewport);
document.addEventListener("focusout", syncVisualViewport);
syncVisualViewport();
