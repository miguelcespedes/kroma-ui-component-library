import type { ChatStatusMessage } from "../core/chat.types";

export function createStatusMessage(message: ChatStatusMessage) {
  const status = document.createElement("p");
  status.className = "kroma-chat__status-message";
  status.setAttribute("role", "status");
  status.textContent = message.text;
  return status;
}
