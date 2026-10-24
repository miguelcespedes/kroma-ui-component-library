import type { JourneyMenuMessage } from "../core/chat.types";
import type { ChatActionHandler } from "../shared/actions";
import { createJourneyOption } from "./journey-option";

export function createJourneyMenu(messageId: string, message: JourneyMenuMessage, onAction: ChatActionHandler) {
  const group = document.createElement("div");
  group.className = "kroma-chat__journey-menu";
  group.setAttribute("role", "group");
  group.setAttribute("aria-labelledby", `${messageId}-content`);
  message.items.forEach((item) => group.append(createJourneyOption(messageId, item, onAction)));
  return group;
}
