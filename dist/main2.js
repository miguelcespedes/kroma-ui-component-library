import "./app-BWAIfpnQ.js";
const preview = document.querySelector("[data-chat-preview]");
const chat = document.querySelector("kroma-chat[data-demo='commerce-journey']");
const lab = document.querySelector("[data-chat-lab]");
class FullscreenViewportController {
  constructor(page, chat2) {
    this.page = page;
    this.chat = chat2;
  }
  page;
  chat;
  listeners = null;
  connectionObserver = null;
  frame = 0;
  setEnabled(enabled) {
    if (!enabled) {
      this.stop();
      return;
    }
    if (this.listeners) return;
    const viewport = window.visualViewport;
    if (!viewport) return;
    const listeners = new AbortController();
    this.listeners = listeners;
    const options = { passive: true, signal: listeners.signal };
    this.connectionObserver = new MutationObserver(() => {
      if (!this.page.isConnected || !this.chat.isConnected) this.stop();
    });
    this.connectionObserver.observe(this.page, { childList: true, subtree: true });
    if (this.page.parentElement) this.connectionObserver.observe(this.page.parentElement, { childList: true });
    viewport.addEventListener("resize", this.scheduleUpdate, options);
    viewport.addEventListener("scroll", this.scheduleUpdate, options);
    window.addEventListener("resize", this.scheduleUpdate, options);
    window.addEventListener("pagehide", this.stop, { once: true, signal: listeners.signal });
    this.scheduleUpdate();
  }
  stop = () => {
    this.listeners?.abort();
    this.listeners = null;
    this.connectionObserver?.disconnect();
    this.connectionObserver = null;
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.page.style.removeProperty("--chat-visual-viewport-height");
    this.page.style.removeProperty("--chat-visual-viewport-top");
    this.page.removeAttribute("data-chat-keyboard-open");
  };
  scheduleUpdate = () => {
    const viewport = window.visualViewport;
    if (!viewport || !this.listeners) return;
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => {
      const height = `${viewport.height}px`;
      const top = `${viewport.offsetTop}px`;
      if (this.page.style.getPropertyValue("--chat-visual-viewport-height") !== height) {
        this.page.style.setProperty("--chat-visual-viewport-height", height);
      }
      if (this.page.style.getPropertyValue("--chat-visual-viewport-top") !== top) {
        this.page.style.setProperty("--chat-visual-viewport-top", top);
      }
      const layoutHeight = document.documentElement.clientHeight || window.innerHeight;
      const keyboardOpen = viewport.height < layoutHeight - 100;
      if (this.page.hasAttribute("data-chat-keyboard-open") !== keyboardOpen) {
        this.page.toggleAttribute("data-chat-keyboard-open", keyboardOpen);
      }
    });
  };
}
const fullscreenViewport = lab && chat ? new FullscreenViewportController(lab, chat) : null;
const setPreviewWidth = (button) => {
  const width = button.dataset.chatWidth || "fluid";
  const adaptive = width === "fluid";
  const cssWidth = adaptive ? "100%" : width;
  preview?.style.setProperty("--chat-preview-width", cssWidth);
  chat?.style.setProperty("--kroma-chat-width", cssWidth);
  lab?.toggleAttribute("data-chat-layout-adaptive", adaptive);
  document.body.classList.toggle("kroma-chat-standalone--adaptive", adaptive);
  fullscreenViewport?.setEnabled(adaptive);
  document.querySelectorAll("[data-chat-width]").forEach((option) => {
    option.setAttribute("aria-pressed", String(option === button));
  });
};
document.querySelectorAll("[data-chat-width]").forEach((button) => {
  button.addEventListener("click", () => setPreviewWidth(button));
});
document.querySelector("[data-chat-density]")?.addEventListener("change", (event) => {
  const select = event.currentTarget;
  chat?.setAttribute("data-density", select.value === "compact" ? "compact" : "comfortable");
});
const initialWidth = document.querySelector('[data-chat-width][aria-pressed="true"]');
if (initialWidth) setPreviewWidth(initialWidth);
//# sourceMappingURL=main2.js.map
