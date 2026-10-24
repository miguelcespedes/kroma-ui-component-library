import type { ChatControlSelection } from "../core/chat.events";
import type { ChatChoice } from "../core/chat.types";

export type ChoiceSelectionHandler = (selection: ChatControlSelection, group: HTMLDivElement, button: HTMLButtonElement) => void;

export function createChoiceList(messageId: string, choices: ChatChoice[], onSelect: ChoiceSelectionHandler) {
  const group = document.createElement("div");
  group.className = "kroma-chat__options kroma-chat__choice-list";
  group.dataset.messageId = messageId;
  group.dataset.control = "choice-list";
  group.setAttribute("role", "group");
  group.setAttribute("aria-labelledby", `${messageId}-content`);
  choices.forEach((choice, index) => {
    const optionId = choice.id || `${messageId}-choice-${index + 1}`;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "kroma-chat__option kroma-chat__choice";
    button.dataset.optionId = optionId;
    button.dataset.optionDisabled = String(Boolean(choice.disabled));
    button.disabled = Boolean(choice.disabled);
    button.setAttribute("aria-pressed", "false");
    const title = document.createElement("span");
    title.className = "kroma-chat__choice-title";
    title.textContent = choice.title;
    const description = document.createElement("span");
    description.className = "kroma-chat__choice-description";
    description.textContent = choice.description;
    button.append(title, description);
    button.addEventListener("click", () => onSelect({
      messageId, optionId, value: choice.value ?? choice.title, label: choice.title,
      control: "choice-list", option: { ...choice, id: optionId },
    }, group, button));
    group.append(button);
  });
  return group;
}
