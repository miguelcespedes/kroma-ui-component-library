import type { ChatActionHandler } from "../shared/actions";
import { createControlAction } from "../shared/actions";
import type { ConfirmationMessage } from "../core/chat.types";

export function createConfirmationCard(messageId: string, message: ConfirmationMessage, onAction: ChatActionHandler) {
  const card = document.createElement("section");
  card.className = "kroma-chat__confirmation";
  card.dataset.status = message.status || "neutral";
  const title = document.createElement("h3");
  title.className = "kroma-chat__confirmation-title";
  title.textContent = message.title;
  const description = document.createElement("p");
  description.className = "kroma-chat__confirmation-description";
  description.textContent = message.description;
  card.append(title, description);
  if (message.reference) {
    const reference = document.createElement("p");
    reference.className = "kroma-chat__confirmation-reference";
    reference.textContent = message.reference;
    card.append(reference);
  }
  if (message.summary?.length) {
    const summary = document.createElement("ul");
    summary.className = "kroma-chat__confirmation-summary";
    message.summary.forEach((text) => {
      const item = document.createElement("li");
      item.textContent = text;
      summary.append(item);
    });
    card.append(summary);
  }
  if (message.action) {
    card.append(createControlAction(messageId, "confirmation", message.action.id || `${messageId}-action`, message.action.label, message.action.value, undefined, onAction, message.action.messageText || message.action.label));
  }
  return card;
}
