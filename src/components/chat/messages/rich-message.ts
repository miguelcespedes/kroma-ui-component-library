import type { ChatAction, ChatInfoMessage, ChatLink, ChatRichMessage } from "../core/chat.types";
import { createChatMessageTime } from "./chat-message";

function safeHref(link: ChatLink) {
  try {
    const url = new URL(link.href, document.baseURI);
    return ["http:", "https:", "mailto:", "tel:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export function createRichMessage(
  message: ChatInfoMessage | ChatRichMessage,
  messageId: string,
  onAction: (action: ChatAction, messageText?: string) => void,
) {
  const rich = document.createElement("article");
  rich.className = "kroma-chat__bubble kroma-chat__rich";
  if (message.title) {
    const title = document.createElement("h3");
    title.className = "kroma-chat__rich-title";
    if (message.type === "info") title.classList.add("kroma-chat__info-title");
    title.textContent = message.title;
    rich.append(title);
  }
  const description = document.createElement("p");
  description.id = `${messageId}-content`;
  description.className = "kroma-chat__rich-description";
  if (message.type === "info") description.classList.add("kroma-chat__info-description");
  description.textContent = message.description;
  rich.append(description);

  const actions = document.createElement("div");
  actions.className = "kroma-chat__rich-actions";
  if (message.link) {
    const href = safeHref(message.link);
    if (href) {
      const link = document.createElement("a");
      link.className = "kroma-chat__rich-link";
      link.href = href;
      link.textContent = message.link.label;
      if (new URL(href).origin !== window.location.origin) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }
      actions.append(link);
    }
  }
  if (message.action) {
    const actionId = message.action.id || `${messageId}-action`;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "kroma-chat__rich-action";
    button.dataset.actionId = actionId;
    button.textContent = message.action.label;
    button.addEventListener("click", () => onAction({ ...message.action!, id: actionId }));
    actions.append(button);
  }
  if (actions.childElementCount) rich.append(actions);
  rich.append(createChatMessageTime(message));
  return rich;
}
