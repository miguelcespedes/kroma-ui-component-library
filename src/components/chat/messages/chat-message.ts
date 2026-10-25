import { formatMessageTime } from "../shared/formatting";

export function createChatMessageTime(message: { time?: string }) {
  const time = document.createElement("time");
  const formatted = formatMessageTime(message.time);
  time.className = "kroma-chat__time";
  time.textContent = formatted.text;
  time.dateTime = formatted.dateTime;
  return time;
}

export function createChatBubble(
  message: { author: "assistant" | "user" | "system"; text: string; time?: string },
  messageId: string,
  onSpeak?: (messageId: string, text: string) => void,
) {
  const bubble = document.createElement("div");
  bubble.className = "kroma-chat__bubble";
  const text = document.createElement("span");
  text.id = `${messageId}-content`;
  text.className = "kroma-chat__text";
  text.textContent = message.text;
  const footer = document.createElement("div");
  footer.className = "kroma-chat__bubble-footer";
  footer.append(createChatMessageTime(message));
  bubble.append(text, footer);

  if (message.author !== "assistant" || !onSpeak || !message.text.trim()) return bubble;

  const row = document.createElement("div");
  row.className = "kroma-chat__bubble-row";
  const speakButton = createSpeakButton(messageId, message.text, onSpeak);
  row.append(bubble, speakButton);
  return row;
}

function createSpeakButton(messageId: string, text: string, onSpeak: (messageId: string, text: string) => void) {
  const button = document.createElement("button");
  button.className = "kroma-chat__speak-button";
  button.type = "button";
  button.dataset.speechMessageId = messageId;
  button.dataset.speechState = "idle";
  button.setAttribute("aria-label", "Escuchar mensaje del asistente");
  button.setAttribute("aria-pressed", "false");
  button.title = "Escuchar mensaje";

  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("aria-hidden", "true");
  icon.setAttribute("focusable", "false");
  icon.setAttribute("fill", "none");
  icon.setAttribute("stroke", "currentColor");
  icon.setAttribute("stroke-width", "1.8");
  icon.setAttribute("stroke-linecap", "round");
  icon.setAttribute("stroke-linejoin", "round");
  const speaker = document.createElementNS("http://www.w3.org/2000/svg", "path");
  speaker.setAttribute("d", "M4 10v4h4l5 4V6l-5 4H4Z");
  const waves = document.createElementNS("http://www.w3.org/2000/svg", "path");
  waves.setAttribute("d", "M16 9a5 5 0 0 1 0 6m3-9a9 9 0 0 1 0 12");
  icon.append(speaker, waves);
  button.append(icon);
  button.addEventListener("click", () => onSpeak(messageId, text));
  return button;
}
