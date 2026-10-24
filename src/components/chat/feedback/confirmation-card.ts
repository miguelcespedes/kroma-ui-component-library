import type { ChatActionHandler } from "../shared/actions";
import { createControlAction } from "../shared/actions";
import type { ConfirmationMessage } from "../core/chat.types";

export function createConfirmationCard(messageId: string, message: ConfirmationMessage, onAction: ChatActionHandler) {
  const card = document.createElement("section");
  card.className = "kroma-chat__confirmation";
  card.dataset.status = message.status || "success";
  const mark = document.createElement("span");
  mark.className = "kroma-chat__confirmation-mark";
  mark.setAttribute("aria-hidden", "true");
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", message.status === "error" ? "M7 7l10 10M17 7 7 17" : message.status === "warning" ? "M12 7v5m0 4h.01" : message.status === "neutral" ? "M12 11v5m0-8h.01" : "m5 12 4.5 4.5L19 7");
  icon.append(path);
  mark.append(icon);
  const title = document.createElement("h3");
  title.className = "kroma-chat__confirmation-title";
  title.textContent = message.title;
  const description = document.createElement("p");
  description.className = "kroma-chat__confirmation-description";
  description.textContent = message.description;
  card.append(mark, title, description);
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
