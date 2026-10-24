import type { ChatActionData, ChatActionDetail } from "../core/chat.events";

export type ChatActionHandler = (detail: ChatActionDetail, userMessage?: string) => void;

export function createControlAction(
  messageId: string,
  control: ChatActionDetail["control"],
  actionId: string,
  label: string,
  value: string | undefined,
  data: ChatActionData | undefined,
  onAction: ChatActionHandler,
  messageText?: string,
) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "kroma-chat__journey-action";
  button.dataset.actionId = actionId;
  button.textContent = label;
  button.addEventListener("click", () => onAction({ messageId, control, actionId, label, value, data }, messageText));
  return button;
}
