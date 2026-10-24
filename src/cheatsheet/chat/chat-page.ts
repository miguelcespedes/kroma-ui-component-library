import "../app";
import "./chat-page.scss";

const preview = document.querySelector<HTMLElement>("[data-chat-preview]");
const chat = document.querySelector<HTMLElement>("kroma-chat[data-demo='commerce-journey']");

document.querySelectorAll<HTMLButtonElement>("[data-chat-width]").forEach((button) => {
  button.addEventListener("click", () => {
    const width = button.dataset.chatWidth || "fluid";
    const cssWidth = width === "fluid" ? "100%" : width;
    preview?.style.setProperty("--chat-preview-width", cssWidth);
    chat?.style.setProperty("--kroma-chat-width", cssWidth);

    document.querySelectorAll<HTMLButtonElement>("[data-chat-width]").forEach((option) => {
      option.setAttribute("aria-pressed", String(option === button));
    });
  });
});

document.querySelector<HTMLSelectElement>("[data-chat-density]")?.addEventListener("change", (event) => {
  const select = event.currentTarget as HTMLSelectElement;
  chat?.setAttribute("data-density", select.value === "compact" ? "compact" : "comfortable");
});

const initialWidth = document.querySelector<HTMLButtonElement>('[data-chat-width][aria-pressed="true"]')?.dataset.chatWidth;
if (initialWidth) {
  const cssWidth = initialWidth === "fluid" ? "100%" : initialWidth;
  preview?.style.setProperty("--chat-preview-width", cssWidth);
  chat?.style.setProperty("--kroma-chat-width", cssWidth);
}
