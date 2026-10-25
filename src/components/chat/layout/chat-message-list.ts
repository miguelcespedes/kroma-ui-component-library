import type {
  ChatActionDetail,
  ChatControlSelection,
  ChatOptionSelectEventDetail,
  ChatRichActionDetail,
  ChatQuantityChangeDetail,
  ChatFormSubmitDetail,
} from "../core/chat.events";
import type { ChatAction, ChatMessage, ChatOption } from "../core/chat.types";
import { renderChatMessage } from "../core/chat.renderers";
import type { ChatRendererHandlers } from "../core/chat.renderers";
import { createTypingIndicator } from "../messages/typing-indicator";

export type ChatMessageListCallbacks = {
  createMessageId: () => string;
  addUserMessage: (text: string) => void;
  consumedActions: Map<string, Set<string>>;
  interactive: boolean;
  focusComposer: () => void;
  onAction: (detail: ChatActionDetail, userMessage?: string) => void;
  onRichAction: (detail: ChatRichActionDetail, action: ChatAction, userMessage?: string) => void;
  onOptionSelect: (detail: ChatOptionSelectEventDetail) => void;
  onQuantityChange: (detail: ChatQuantityChangeDetail) => void;
  onFormInputFocus: (input: HTMLInputElement) => void;
  onFormSubmit: (detail: ChatFormSubmitDetail) => void;
};

type ActionReusePolicy = "message-once" | "action-once" | "line-once" | "repeatable";

const actionReusePolicies: Record<ChatActionDetail["control"], ActionReusePolicy> = {
  header: "repeatable",
  "journey-menu": "action-once",
  "category-picker": "action-once",
  "product-card": "action-once",
  "product-list": "action-once",
  "product-carousel": "action-once",
  "product-detail": "message-once",
  "product-variant-selector": "repeatable",
  "conversational-form": "repeatable",
  "cart-summary": "action-once",
  "order-review": "message-once",
  confirmation: "action-once",
};

function actionStateKey(actionId: string, lineId?: string) {
  return lineId ? `${actionId}\u001f${lineId}` : actionId;
}

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
    if (message.type === "typing" && this.callbacks.interactive) {
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
    if (message.author === "assistant") {
      const avatar = document.createElement("span");
      avatar.className = "kroma-chat__message-avatar";
      avatar.setAttribute("aria-hidden", "true");
      avatar.textContent = "K";
      item.append(avatar);
    }
    const previous = this.element.lastElementChild as HTMLLIElement | null;
    if (previous?.dataset.author === message.author && previous.dataset.messageType !== "status" && message.type !== "status") {
      previous.classList.add("kroma-chat__message--grouped");
      item.classList.add("kroma-chat__message--grouped");
      item.classList.add("kroma-chat__message--group-continuation");
    }

    const handlers: ChatRendererHandlers = {
      onAction: (detail, userMessage) => this.emitAction(detail, userMessage),
      onRichAction: (id, action, userMessage) => this.emitRichAction(id, action, userMessage),
      onOptionSelect: (selection, group, button) => this.selectOption(selection, group, button),
      onQuantityChange: this.callbacks.onQuantityChange,
      onFormInputFocus: (input) => { if (this.callbacks.interactive) this.callbacks.onFormInputFocus(input); },
      onFormSubmit: this.callbacks.onFormSubmit,
    };
    renderChatMessage(item, message, handlers);
    this.element.append(item);
    this.restoreConsumedActions(messageId);
    this.emptyState.hidden = true;
    if (stick) this.scrollToMessage(item);
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

  disableHistoryControls() {
    this.element.querySelectorAll<HTMLLIElement>("li[data-message-id]").forEach((message) => {
      const controls = message.querySelectorAll<HTMLButtonElement | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("button, input, select, textarea");
      if (!controls.length) return;
      message.dataset.controlsDisabled = "true";
      message.setAttribute("aria-disabled", "true");
      controls.forEach((control) => { control.disabled = true; });
      message.querySelectorAll<HTMLElement>(".kroma-chat__options").forEach((group) => {
        group.dataset.hostDisabled = "true";
        group.classList.add("kroma-chat__options--inactive");
      });
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

  private restoreConsumedActions(messageId: string) {
    const consumed = this.callbacks.consumedActions.get(messageId);
    if (!consumed) return;
    this.findMessage(messageId)?.querySelectorAll<HTMLButtonElement>("button[data-action-id]").forEach((button) => {
      const key = actionStateKey(button.dataset.actionId || "", button.dataset.lineId);
      if (consumed.has(key)) {
        button.disabled = true;
        button.dataset.consumed = String(consumed.has(`selected:${key}`));
      }
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
    if (!this.callbacks.interactive) return;
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
    if (!this.callbacks.interactive) return;
    const actionId = action.id || `${messageId}-action`;
    const button = this.findMessage(messageId)?.querySelector<HTMLButtonElement>(`.kroma-chat__rich-action[data-action-id="${CSS.escape(actionId)}"]`);
    if (button && !this.consumeButton(messageId, button, true)) return;
    if (userMessage) {
      this.callbacks.addUserMessage(userMessage);
      this.scrollToBottom();
      this.callbacks.focusComposer();
    }
    this.callbacks.onRichAction({ messageId, actionId, value: action.value }, action, userMessage);
  }

  private emitAction(detail: ChatActionDetail, userMessage?: string) {
    if (!this.callbacks.interactive) return;
    if (!this.consumeAction(detail)) return;
    if (userMessage) {
      this.callbacks.addUserMessage(userMessage);
      this.scrollToBottom();
      this.callbacks.focusComposer();
    }
    this.callbacks.onAction(detail, userMessage);
  }

  private consumeAction(detail: ChatActionDetail) {
    const policy = detail.control === "cart-summary" && (detail.actionId === "remove-item" || detail.actionId === "edit-quantity")
      ? "line-once"
      : actionReusePolicies[detail.control];
    if (policy === "repeatable") return true;
    const sourceMessage = this.findMessage(detail.messageId);
    const buttons = [...(sourceMessage?.querySelectorAll<HTMLButtonElement>("button[data-action-id]") || [])];
    const target = buttons.find((button) => button.dataset.actionId === detail.actionId
      && (policy !== "line-once" || button.dataset.lineId === detail.data?.lineId));
    if (!target) return true;

    if (policy === "message-once") {
      if (buttons.some((button) => this.isConsumed(detail.messageId, button))) return false;
      buttons.forEach((button) => this.consumeButton(detail.messageId, button, button === target));
      return true;
    }
    return this.consumeButton(detail.messageId, target, true);
  }

  private isConsumed(messageId: string, button: HTMLButtonElement) {
    return Boolean(this.callbacks.consumedActions.get(messageId)?.has(actionStateKey(button.dataset.actionId || "", button.dataset.lineId)));
  }

  private consumeButton(messageId: string, button: HTMLButtonElement, selected: boolean) {
    if (this.isConsumed(messageId, button)) return false;
    const consumed = this.callbacks.consumedActions.get(messageId) || new Set<string>();
    const key = actionStateKey(button.dataset.actionId || "", button.dataset.lineId);
    consumed.add(key);
    if (selected) consumed.add(`selected:${key}`);
    this.callbacks.consumedActions.set(messageId, consumed);
    button.disabled = true;
    button.dataset.consumed = String(selected);
    return true;
  }

  private isAtBottom() {
    return this.element.scrollHeight - this.element.scrollTop - this.element.clientHeight < 56;
  }

  private scrollToMessage(message: HTMLLIElement) {
    requestAnimationFrame(() => {
      if (!message.isConnected) return;
      this.element.scrollTop = this.element.scrollHeight;
    });
  }

}
