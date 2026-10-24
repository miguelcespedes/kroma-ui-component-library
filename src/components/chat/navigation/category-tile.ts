import type { ChatCategory } from "../core/chat.types";
import { createControlAction, type ChatActionHandler } from "../shared/actions";
import { createIconLabel } from "../shared/icons";

export function createCategoryTile(messageId: string, category: ChatCategory, onAction: ChatActionHandler) {
  const button = createControlAction(messageId, "category-picker", category.id, category.label, category.id, { categoryId: category.id }, onAction, category.label);
  button.classList.add("kroma-chat__category");
  button.disabled = Boolean(category.disabled);
  button.dataset.categoryId = category.id;
  button.replaceChildren(createIconLabel(category.icon, category.label, "kroma-chat__category-label"));
  if (category.description) {
    const description = document.createElement("span");
    description.className = "kroma-chat__category-description";
    description.textContent = category.description;
    button.append(description);
  }
  return button;
}
