export function createTypingIndicator(messageId: string, label: string) {
  const item = document.createElement("li");
  item.className = "kroma-chat__message kroma-chat__message--assistant kroma-chat__message--typing";
  item.dataset.messageId = messageId;
  item.dataset.messageType = "typing";
  item.setAttribute("role", "status");
  const bubble = document.createElement("div");
  bubble.className = "kroma-chat__bubble kroma-chat__typing-bubble";
  const announcement = document.createElement("span");
  announcement.className = "kroma-chat__sr-only";
  announcement.textContent = label;
  const dots = document.createElement("span");
  dots.className = "kroma-chat__typing-dots";
  dots.setAttribute("aria-hidden", "true");
  dots.append(document.createElement("span"), document.createElement("span"), document.createElement("span"));
  bubble.append(announcement, dots);
  item.append(bubble);
  return item;
}
