import type { ChatStatusMessage } from "../core/chat.types";

export function createStatusMessage(message: ChatStatusMessage) {
  const status = document.createElement("p");
  status.className = "kroma-chat__status-message";
  status.setAttribute("role", "status");
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("class", "kroma-chat__status-icon");
  icon.setAttribute("viewBox", "0 0 16 16");
  icon.setAttribute("aria-hidden", "true");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", message.status === "success" ? "m3 8 3 3 7-7" : message.status === "warning" ? "M8 2.5v6m0 3v.01" : message.status === "error" ? "m4 4 8 8m0-8-8 8" : "M8 3v5m0 3v.01");
  icon.append(path);
  const text = document.createElement("span");
  text.textContent = message.text;
  status.dataset.status = message.status || "neutral";
  status.append(icon, text);
  return status;
}
