import type { ChatMessage } from "../core/chat.types";

/** Returns the assistant-facing text and selectable choices for speech output. */
export function getChatMessageSpeechText(message: ChatMessage) {
  let prompt = "";
  if ("text" in message && typeof message.text === "string") prompt = message.text;
  else if ((message.type === "rich" || message.type === "info") && message.description) {
    prompt = ["title" in message ? message.title : "", message.description].filter(Boolean).join(". ");
  } else if ((message.type === "confirmation" || message.type === "confirmation-card") && message.description) {
    prompt = [message.title, message.description].filter(Boolean).join(". ");
  }

  const choices = getChoiceLabels(message);
  if (!choices.length) return prompt;
  const spokenChoices = choices.map((choice) => `${choice.charAt(0).toLocaleLowerCase("es-PE")}${choice.slice(1)}`);
  const choiceList = spokenChoices.length === 1
    ? spokenChoices[0]
    : spokenChoices.length === 2
      ? `${spokenChoices[0]} o ${spokenChoices[1]}`
      : `${spokenChoices.slice(0, -1).join(", ")} o ${spokenChoices.at(-1)}`;
  const choicePrompt = message.type === "category-picker"
    ? `Puedes elegir entre estas categorías: ${choiceList}.`
    : spokenChoices.length === 1
      ? `Puedes elegir esta opción: ${choiceList}.`
      : `Puedes elegir una de estas opciones: ${choiceList}.`;
  const normalizedPrompt = prompt.trim();
  const punctuatedPrompt = normalizedPrompt && !/[.!?…:]$/.test(normalizedPrompt)
    ? `${normalizedPrompt}.`
    : normalizedPrompt;
  return [punctuatedPrompt, choicePrompt].filter(Boolean).join(" ");
}

function getChoiceLabels(message: ChatMessage) {
  switch (message.type) {
    case "journey-menu": return message.items.filter((item) => !item.disabled && item.label.trim()).map((item) => item.label);
    case "category-picker": return message.categories.filter((category) => !category.disabled && category.label?.trim()).map((category) => category.label);
    case "quick-replies": return message.replies.filter((reply) => !reply.disabled && reply.label.trim()).map((reply) => reply.label);
    case "options": return message.options.filter((option) => !option.disabled && option.label.trim()).map((option) => option.label);
    case "choice-list": return message.choices.filter((choice) => !choice.disabled && choice.title.trim()).map((choice) => choice.title);
    default: return [];
  }
}
