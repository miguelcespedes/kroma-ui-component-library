import type {
  ChatAction,
  ChatActionDetail,
  ChatControlSelection,
  ChatMessage,
  ChatOption,
  ChatOptionSelectEventDetail,
  ChatRichActionDetail,
  ChatQuantityChangeDetail,
  ChatFormSubmitDetail,
} from "./chat.types";
import { renderChatMessage } from "./chat.renderers";
import type { ChatRendererHandlers } from "./chat.renderers";
import { createTypingIndicator } from "./chat.controls.shared";

export type ChatMessageListCallbacks = {
  createMessageId: () => string;
  addUserMessage: (text: string) => void;
  focusComposer: () => void;
  onAction: (detail: ChatActionDetail, userMessage?: string) => void;
  onRichAction: (detail: ChatRichActionDetail, action: ChatAction, userMessage?: string) => void;
  onOptionSelect: (detail: ChatOptionSelectEventDetail) => void;
  onQuantityChange: (detail: ChatQuantityChangeDetail) => void;
  onFormSubmit: (detail: ChatFormSubmitDetail) => void;
};

/** Owns message ordering, grouping, render dispatch, typing state and scroll policy. */
export class ChatMessageList {
  readonly element: HTMLOListElement;
  readonly emptyState: HTMLElement;
  private typingIndicator: HTMLLIElement | null = null;
  private shouldStickToBottom = true;
  private readonly listeners = new AbortController();

  constructor(private readonly callbacks: ChatMessageListCallbacks, emptyLabel: string, messagesLabel: string) {
    this.element = document.createElement("ol");
    this.element.className = "kroma-chat__messages";
    this.element.setAttribute("role", "log");
    this.element.setAttribute("aria-live", "polite");
    this.element.setAttribute("aria-relevant", "additions");
    this.element.setAttribute("aria-label", messagesLabel);
    this.emptyState = document.createElement("p");
    this.emptyState.className = "kroma-chat__empty";
    this.emptyState.textContent = emptyLabel;
    this.emptyState.hidden = false;
    this.element.addEventListener("scroll", () => { this.shouldStickToBottom = this.isAtBottom(); }, { passive: true, signal: this.listeners.signal });
  }

  addMessage(message: ChatMessage, messageId: string): string {
    if (message.type === "typing") {
      this.setTyping(true, message.label || "Assistant is typing", messageId);
      return messageId;
    }

    const stick = this.shouldStickToBottom || this.element.children.length === 0;
    const item = document.createElement("li");
    item.className = `kroma-chat__message kroma-chat__message--${message.author}`;
    item.id = messageId;
    item.dataset.messageId = messageId;
    item.dataset.author = message.author;
    item.dataset.messageType = message.type || "text";
    const previous = this.element.lastElementChild as HTMLLIElement | null;
    if (previous?.dataset.author === message.author && previous.dataset.messageType !== "status" && message.type !== "status") {
      previous.classList.add("kroma-chat__message--grouped");
      item.classList.add("kroma-chat__message--grouped");
    }

    const handlers: ChatRendererHandlers = {
      onAction: (detail, userMessage) => this.emitAction(detail, userMessage),
      onRichAction: (id, action, userMessage) => this.emitRichAction(id, action, userMessage),
      onOptionSelect: (selection, group, button) => this.selectOption(selection, group, button),
      onQuantityChange: this.callbacks.onQuantityChange,
      onFormSubmit: this.callbacks.onFormSubmit,
    };
    renderChatMessage(item, message, handlers);
    this.element.append(item);
    this.emptyState.hidden = true;
    if (stick) this.scrollToBottom();
    return messageId;
  }

  setTyping(active: boolean, label: string, messageId?: string) {
    if (!active) {
      this.typingIndicator?.remove();
      this.typingIndicator = null;
      if (!this.element.children.length) this.emptyState.hidden = false;
      return;
    }
    if (this.typingIndicator?.isConnected) {
      const announcement = this.typingIndicator.querySelector<HTMLElement>(".kroma-chat__sr-only");
      if (announcement) announcement.textContent = label;
      return;
    }
    const stick = this.shouldStickToBottom || this.element.children.length === 0;
    const id = messageId || this.callbacks.createMessageId();
    this.typingIndicator = createTypingIndicator(id, label);
    this.typingIndicator.id = id;
    this.element.append(this.typingIndicator);
    this.emptyState.hidden = true;
    if (stick) this.scrollToBottom();
  }

  setOptionsDisabled(messageId: string, disabled: boolean) {
    const group = this.findMessage(messageId)?.querySelector<HTMLElement>(".kroma-chat__options");
    if (!group || group.dataset.selected === "true") return;
    group.dataset.hostDisabled = String(disabled);
    group.classList.toggle("kroma-chat__options--inactive", disabled);
    group.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
      button.disabled = disabled || button.dataset.optionDisabled === "true";
    });
  }

  restoreOptionSelection(messageId: string, optionId: string) {
    const group = this.findMessage(messageId)?.querySelector<HTMLElement>(".kroma-chat__options");
    if (!group) return;
    group.dataset.selected = "true";
    group.classList.add("kroma-chat__options--selected");
    group.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
      button.disabled = true;
      button.setAttribute("aria-pressed", String(button.dataset.optionId === optionId));
    });
  }

  findMessage(messageId: string) {
    return [...this.element.querySelectorAll<HTMLLIElement>("li[data-message-id]")]
      .find((message) => message.dataset.messageId === messageId);
  }

  scrollToBottom() {
    requestAnimationFrame(() => { this.element.scrollTop = this.element.scrollHeight; });
  }

  destroy() {
    this.listeners.abort();
  }

  private selectOption(selection: ChatControlSelection, group: HTMLDivElement, selectedButton: HTMLButtonElement) {
    if (selectedButton.disabled || group.dataset.selected === "true") return;
    group.dataset.selected = "true";
    group.classList.add("kroma-chat__options--selected");
    group.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
      button.disabled = true;
      button.setAttribute("aria-pressed", String(button === selectedButton));
    });
    this.callbacks.addUserMessage(selection.label);
    this.scrollToBottom();
    this.callbacks.focusComposer();
    const option: ChatOption = selection.control === "quick-replies"
      ? selection.option as ChatOption
      : { id: selection.option.id, label: selection.label, value: selection.value, disabled: selection.option.disabled };
    this.callbacks.onOptionSelect({
      message: selection.value,
      messageId: selection.messageId,
      optionId: selection.optionId,
      value: selection.value,
      label: selection.label,
      control: selection.control,
      option,
    });
  }

  private emitRichAction(messageId: string, action: ChatAction, userMessage?: string) {
    this.findMessage(messageId)?.querySelectorAll<HTMLButtonElement>(".kroma-chat__rich-action").forEach((button) => { button.disabled = true; });
    if (userMessage) {
      this.callbacks.addUserMessage(userMessage);
      this.scrollToBottom();
      this.callbacks.focusComposer();
    }
    this.callbacks.onRichAction({ messageId, actionId: action.id || `${messageId}-action`, value: action.value }, action, userMessage);
  }

  private emitAction(detail: ChatActionDetail, userMessage?: string) {
    if (detail.control !== "product-variant-selector") {
      this.findMessage(detail.messageId)?.querySelectorAll<HTMLButtonElement>("button[data-action-id]").forEach((button) => {
        if (detail.control === "product-carousel") {
          if (button.dataset.actionId === detail.actionId) button.disabled = true;
          return;
        }
        if (detail.control === "cart-summary" && detail.actionId === "remove-item") {
          if (button.dataset.actionId === detail.actionId && button.dataset.lineId === detail.data?.lineId) button.disabled = true;
          return;
        }
        button.disabled = true;
      });
    }
    if (userMessage) {
      this.callbacks.addUserMessage(userMessage);
      this.scrollToBottom();
      this.callbacks.focusComposer();
    }
    this.callbacks.onAction(detail, userMessage);
  }

  private isAtBottom() {
    return this.element.scrollHeight - this.element.scrollTop - this.element.clientHeight < 56;
  }

}
