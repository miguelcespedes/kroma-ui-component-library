import type { CategoryPickerMessage } from "../core/chat.types";
import type { ChatActionHandler } from "../shared/actions";
import { createCategoryTile } from "./category-tile";

export function createCategoryPicker(messageId: string, message: CategoryPickerMessage, onAction: ChatActionHandler) {
  const group = document.createElement("div");
  group.className = "kroma-chat__category-picker";
  group.setAttribute("role", "group");
  group.setAttribute("aria-labelledby", `${messageId}-content`);
  message.categories.forEach((category) => group.append(createCategoryTile(messageId, category, onAction)));
  return group;
}
