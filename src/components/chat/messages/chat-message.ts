import { formatMessageTime } from "../shared/formatting";

export function createChatMessageTime(message: { time?: string }) {
  const time = document.createElement("time");
  const formatted = formatMessageTime(message.time);
  time.className = "kroma-chat__time";
  time.textContent = formatted.text;
  time.dateTime = formatted.dateTime;
  return time;
}

export function createChatBubble(message: { text: string; time?: string }, messageId: string) {
  const bubble = document.createElement("div");
  bubble.className = "kroma-chat__bubble";
  const text = document.createElement("span");
  text.id = `${messageId}-content`;
  text.className = "kroma-chat__text";
  text.textContent = message.text;
  bubble.append(text, createChatMessageTime(message));
  return bubble;
}
