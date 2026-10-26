import "../app";
import "../chat/chat-page.scss";

const page = document.querySelector<HTMLElement>("[data-chat-layout-adaptive]");
const chat = document.querySelector<HTMLElement>("kroma-chat");

if (page && chat) {
  const viewport = window.visualViewport;
  let frame = 0;

  const updateViewport = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      if (!viewport) return;
      page.style.setProperty("--chat-visual-viewport-height", `${viewport.height}px`);
      page.style.setProperty("--chat-visual-viewport-top", `${viewport.offsetTop}px`);
      const layoutHeight = document.documentElement.clientHeight || window.innerHeight;
      page.toggleAttribute("data-chat-keyboard-open", viewport.height < layoutHeight - 100);
    });
  };

  const options: AddEventListenerOptions = { passive: true };
  viewport?.addEventListener("resize", updateViewport, options);
  viewport?.addEventListener("scroll", updateViewport, options);
  window.addEventListener("resize", updateViewport, options);
  window.addEventListener("pagehide", () => {
    cancelAnimationFrame(frame);
    viewport?.removeEventListener("resize", updateViewport);
    viewport?.removeEventListener("scroll", updateViewport);
    window.removeEventListener("resize", updateViewport);
  }, { once: true });
  updateViewport();
}
