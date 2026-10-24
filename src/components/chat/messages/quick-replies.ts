import type { ChatControlSelection } from "../core/chat.events";
import type { ChatOption } from "../core/chat.types";

export type OptionSelectionHandler = (selection: ChatControlSelection, group: HTMLDivElement, button: HTMLButtonElement) => void;

export function createQuickReplies(messageId: string, replies: ChatOption[], onSelect: OptionSelectionHandler) {
  const group = document.createElement("div");
  group.className = "kroma-chat__options kroma-chat__quick-replies";
  group.dataset.messageId = messageId;
  group.dataset.control = "quick-replies";
  group.setAttribute("role", "group");
  group.setAttribute("aria-labelledby", `${messageId}-content`);
  replies.forEach((reply, index) => {
    const optionId = reply.id || `${messageId}-reply-${index + 1}`;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "kroma-chat__option";
    button.dataset.optionId = optionId;
    button.dataset.optionDisabled = String(Boolean(reply.disabled));
    button.textContent = reply.label;
    button.disabled = Boolean(reply.disabled);
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => onSelect({
      messageId, optionId, value: reply.value ?? reply.label, label: reply.label,
      control: "quick-replies", option: { ...reply, id: optionId },
    }, group, button));
    group.append(button);
  });
  return group;
}
