import type {
  CategoryPickerMessage,
  ChatAction,
  ChatChoice,
  ChatControlSelection,
  ChatInfoMessage,
  ChatLink,
  ChatOption,
  ChatRichMessage,
  JourneyMenuMessage,
} from "./chat.types";
import {
  createChatMessageTime,
  createControlAction,
  createIconLabel,
  type ChatActionHandler,
} from "./chat.controls.shared";

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

export function createChoiceList(messageId: string, choices: ChatChoice[], onSelect: OptionSelectionHandler) {
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

function safeHref(link: ChatLink) {
  try {
    const url = new URL(link.href, document.baseURI);
    return ["http:", "https:", "mailto:", "tel:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export function createRichMessage(message: ChatInfoMessage | ChatRichMessage, messageId: string, onAction: (action: ChatAction, messageText?: string) => void) {
  const rich = document.createElement("article");
  rich.className = "kroma-chat__bubble kroma-chat__rich";
  if (message.title) {
    const title = document.createElement("h3");
    title.className = "kroma-chat__rich-title";
    if (message.type === "info") title.classList.add("kroma-chat__info-title");
    title.textContent = message.title;
    rich.append(title);
  }
  const description = document.createElement("p");
  description.id = `${messageId}-content`;
  description.className = "kroma-chat__rich-description";
  if (message.type === "info") description.classList.add("kroma-chat__info-description");
  description.textContent = message.description;
  rich.append(description);

  const actions = document.createElement("div");
  actions.className = "kroma-chat__rich-actions";
  if (message.link) {
    const href = safeHref(message.link);
    if (href) {
      const link = document.createElement("a");
      link.className = "kroma-chat__rich-link";
      link.href = href;
      link.textContent = message.link.label;
      if (new URL(href).origin !== window.location.origin) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }
      actions.append(link);
    }
  }
  if (message.action) {
    const actionId = message.action.id || `${messageId}-action`;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "kroma-chat__rich-action";
    button.dataset.actionId = actionId;
    button.textContent = message.action.label;
    button.addEventListener("click", () => onAction({ ...message.action!, id: actionId }));
    actions.append(button);
  }
  if (actions.childElementCount) rich.append(actions);
  rich.append(createChatMessageTime(message));
  return rich;
}

export function createJourneyMenu(messageId: string, message: JourneyMenuMessage, onAction: ChatActionHandler) {
  const group = document.createElement("div");
  group.className = "kroma-chat__journey-menu";
  group.setAttribute("role", "group");
  group.setAttribute("aria-labelledby", `${messageId}-content`);
  message.items.forEach((item) => group.append(createJourneyOption(messageId, item, onAction)));
  return group;
}

function createJourneyOption(messageId: string, item: JourneyMenuMessage["items"][number], onAction: ChatActionHandler) {
  const button = createControlAction(messageId, "journey-menu", item.id, item.label, item.value ?? item.id, undefined, onAction, item.label);
  button.classList.add("kroma-chat__journey-item");
  button.disabled = Boolean(item.disabled);
  button.replaceChildren(createIconLabel(item.icon, item.label, "kroma-chat__journey-item-label"));
  if (item.description) {
    const description = document.createElement("span");
    description.className = "kroma-chat__journey-item-description";
    description.textContent = item.description;
    button.append(description);
  }
  button.dataset.itemId = item.id;
  return button;
}

export function createCategoryPicker(messageId: string, message: CategoryPickerMessage, onAction: ChatActionHandler) {
  const group = document.createElement("div");
  group.className = "kroma-chat__category-picker";
  group.setAttribute("role", "group");
  group.setAttribute("aria-labelledby", `${messageId}-content`);
  message.categories.forEach((category) => group.append(createCategoryTile(messageId, category, onAction)));
  return group;
}

function createCategoryTile(messageId: string, category: CategoryPickerMessage["categories"][number], onAction: ChatActionHandler) {
  const button = createControlAction(messageId, "category-picker", category.id, category.label, category.id, { categoryId: category.id }, onAction, category.label);
  button.classList.add("kroma-chat__category");
  button.disabled = Boolean(category.disabled);
  button.dataset.categoryId = category.id;
  button.replaceChildren(createIconLabel(category.icon, category.label, "kroma-chat__category-label"));
  if (category.description) {
    const description = document.createElement("span");
    description.className = "kroma-chat__category-description";
    description.textContent = category.description;
    button.append(description);
  }
  return button;
}
