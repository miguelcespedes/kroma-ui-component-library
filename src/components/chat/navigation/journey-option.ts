import type { JourneyMenuItem } from "../core/chat.types";
import { createControlAction, type ChatActionHandler } from "../shared/actions";
import { createIconLabel } from "../shared/icons";

export function createJourneyOption(messageId: string, item: JourneyMenuItem, onAction: ChatActionHandler) {
  const button = createControlAction(messageId, "journey-menu", item.id, item.label, item.value ?? item.id, undefined, onAction, item.label);
  button.classList.add("kroma-chat__journey-item");
  button.disabled = Boolean(item.disabled);
  button.replaceChildren(createIconLabel(item.icon, item.label, "kroma-chat__journey-item-label"));
  if (item.description) {
    const description = document.createElement("span");
    description.className = "kroma-chat__journey-item-description";
    description.textContent = item.description;
    button.append(description);
  }
  button.dataset.itemId = item.id;
  return button;
}
