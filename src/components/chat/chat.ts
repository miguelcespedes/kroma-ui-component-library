import {
  createChatBubble,
  createChatMessageTime,
  createCartSummary,
  createCategoryPicker,
  createChoiceList,
  createChatComposer,
  createConfirmation,
  createConversationalForm,
  createJourneyMenu,
  createOrderReview,
  createProductCarousel,
  createProductCard,
  createProductDetail,
  createProductVariantSelector,
  createStandaloneQuantitySelector,
  createQuickReplies,
  createRichMessage,
  createTypingIndicator,
} from "./chat.controls";
import type {
  ChatAction,
  ChatActionDetail,
  ChatActionData,
  ChatQuantityChangeDetail,
  ChatFormSubmitDetail,
  ChatChoiceListMessage,
  ChatControlSelection,
  ChatMessage,
  ChatInfoMessage,
  ChatMessageBase,
  ChatMessageAuthor,
  ChatOption,
  ChatOptionSelectDetail,
  ChatOptionSelectEventDetail,
  ChatOptionsMessage,
  ChatQuickRepliesMessage,
  ChatRichActionDetail,
  ChatRichMessage,
  ChatSendDetail,
  ChatStatusMessage,
  ChatTextMessage,
  JourneyMenuMessage,
  CategoryPickerMessage,
  ProductCardMessage,
  ProductCarouselMessage,
  ProductDetailMessage,
  ProductVariantSelectorMessage,
  QuantitySelectorMessage,
  CartSummaryMessage,
  ConversationalFormMessage,
  OrderReviewMessage,
  ConfirmationMessage,
} from "./chat.types";

export type {
  ChatAction,
  ChatActionControl,
  ChatActionData,
  ChatActionDetail,
  ChatChoice,
  ChatChoiceListMessage,
  ChatCategory,
  ChatCartItem,
  ChatCustomerDetails,
  ChatFormField,
  ChatFormSubmitDetail,
  ChatImage,
  ChatMoney,
  ChatQuantityChangeDetail,
  ChatInfoMessage,
  ChatLink,
  ChatMessage,
  ChatMessageAuthor,
  ChatOption,
  ChatOptionSelectDetail,
  ChatOptionSelectEventDetail,
  ChatOptionsMessage,
  ChatProduct,
  ChatProductVariant,
  ChatQuickRepliesMessage,
  ChatRichActionDetail,
  ChatRichMessage,
  ChatSendDetail,
  ChatStatusMessage,
  ChatTextMessage,
  ChatTypingMessage,
  JourneyMenuItem,
  JourneyMenuMessage,
  CategoryPickerMessage,
  ProductCardMessage,
  ProductCarouselMessage,
  ProductDetailMessage,
  ProductVariantSelectorMessage,
  QuantitySelectorMessage,
  CartSummaryMessage,
  ConversationalFormMessage,
  OrderReviewMessage,
  ConfirmationMessage,
} from "./chat.types";

const tagName = "kroma-chat";
let nextElementId = 0;

/** Native, backend-agnostic conversation element. The host supplies content and handles emitted events. */
export class KromaChatElement extends HTMLElement {
  private readonly instanceId = ++nextElementId;
  private messageSequence = 0;
  private initialized = false;
  private messageList: HTMLOListElement | null = null;
  private emptyState: HTMLElement | null = null;
  private typingIndicator: HTMLLIElement | null = null;
  private composer: HTMLFormElement | null = null;
  private input: HTMLTextAreaElement | null = null;
  private sendButton: HTMLButtonElement | null = null;
  private errorMessage: HTMLElement | null = null;
  private statusElement: HTMLElement | null = null;
  private composerDisabled = false;
  private shouldStickToBottom = true;

  connectedCallback() {
    if (this.initialized) return;
    this.initialized = true;
    this.classList.add("kroma-chat");

    const inputId = `kroma-chat-input-${this.instanceId}`;
    const avatar = this.getAttribute("avatar");
    this.innerHTML = `
      <header class="kroma-chat__header">
        <span class="kroma-chat__avatar" aria-hidden="true" ${avatar ? "" : "hidden"}></span>
        <div class="kroma-chat__heading">
          <h2 class="kroma-chat__title"></h2>
          <p class="kroma-chat__status" hidden></p>
        </div>
        <div class="kroma-chat__actions" data-chat-actions></div>
      </header>
      <ol class="kroma-chat__messages" role="log" aria-live="polite" aria-relevant="additions" aria-label=""></ol>
      <p class="kroma-chat__empty" hidden></p>`;

    const title = this.querySelector<HTMLElement>(".kroma-chat__title")!;
    const avatarElement = this.querySelector<HTMLElement>(".kroma-chat__avatar")!;
    this.statusElement = this.querySelector<HTMLElement>(".kroma-chat__status")!;
    this.messageList = this.querySelector<HTMLOListElement>(".kroma-chat__messages")!;
    this.emptyState = this.querySelector<HTMLElement>(".kroma-chat__empty")!;

    title.textContent = this.getAttribute("chat-title") || "Assistant";
    avatarElement.textContent = avatar || "";
    this.setStatus(this.getAttribute("status"));
    if (!this.hasAttribute("role")) this.setAttribute("role", "region");
    if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", title.textContent || "Assistant");
    this.messageList.setAttribute("aria-label", this.getAttribute("messages-label") || "Messages");
    this.emptyState.textContent = this.getAttribute("empty-state") || "Start a conversation";
    this.emptyState.hidden = false;

    const inputLabel = this.getAttribute("input-label") || "Write a message";
    const composer = createChatComposer({
      id: inputId,
      inputLabel,
      placeholder: this.getAttribute("placeholder") || "Message…",
      sendLabel: this.getAttribute("send-label") || "Send message",
    });
    this.composer = composer.form;
    this.input = composer.input;
    this.sendButton = composer.sendButton;
    this.errorMessage = composer.errorMessage;
    this.input.disabled = this.composerDisabled;
    this.append(composer.area);

    this.messageList.addEventListener("scroll", () => {
      this.shouldStickToBottom = this.isAtBottom();
    }, { passive: true });

    this.input.addEventListener("input", () => {
      this.resizeComposerInput();
      this.updateSendButton();
    });
    this.input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        this.composer!.requestSubmit();
      }
    });
    this.composer.addEventListener("submit", (event) => {
      event.preventDefault();
      this.sendMessage(this.input!.value);
    });

    this.updateSendButton();
  }

  /** Appends host-provided text or structured content and returns its stable message ID. */
  addMessage(message: ChatMessage): string {
    const messageId = message.id || this.createMessageId();
    const normalized = { ...message, id: messageId } as ChatMessage;

    if (normalized.type === "typing") {
      this.setTyping(true, normalized.label, messageId);
      return messageId;
    }
    if (!this.messageList) return messageId;

    const shouldStickToBottom = this.shouldStickToBottom || this.messageList.children.length === 0;
    const item = document.createElement("li");
    item.className = `kroma-chat__message kroma-chat__message--${normalized.author}`;
    item.id = messageId;
    item.dataset.messageId = messageId;
    item.dataset.author = normalized.author;
    item.dataset.messageType = normalized.type || "text";

    const previous = this.messageList.lastElementChild as HTMLLIElement | null;
    if (previous?.dataset.author === normalized.author && previous.dataset.messageType !== "status" && normalized.type !== "status") {
      previous.classList.add("kroma-chat__message--grouped");
      item.classList.add("kroma-chat__message--grouped");
    }

    this.renderMessage(item, normalized);
    this.messageList.append(item);
    if (this.emptyState) this.emptyState.hidden = true;
    if (shouldStickToBottom) this.scrollToBottom();
    return messageId;
  }

  /** Controls the host-owned typing indicator without starting a timer. */
  setTyping(active: boolean, label = this.getAttribute("typing-label") || "Assistant is typing", messageId?: string) {
    if (!this.messageList) return;
    if (!active) {
      this.typingIndicator?.remove();
      this.typingIndicator = null;
      if (!this.messageList.children.length && this.emptyState) this.emptyState.hidden = false;
      return;
    }
    if (this.typingIndicator?.isConnected) {
      const announcement = this.typingIndicator.querySelector<HTMLElement>(".kroma-chat__sr-only");
      if (announcement) announcement.textContent = label;
      return;
    }

    const shouldStickToBottom = this.shouldStickToBottom || this.messageList.children.length === 0;
    const indicatorId = messageId || this.createMessageId();
    this.typingIndicator = createTypingIndicator(indicatorId, label);
    this.messageList.append(this.typingIndicator);
    if (this.emptyState) this.emptyState.hidden = true;
    if (shouldStickToBottom) this.scrollToBottom();
  }

  /** Reflects host-owned connection or presence text; null hides the header status. */
  setStatus(status: string | null) {
    if (!this.statusElement) return;
    this.statusElement.textContent = status || "";
    this.statusElement.hidden = !status;
  }

  /** Disables or enables only the composer at the host's discretion. */
  setComposerDisabled(disabled: boolean) {
    this.composerDisabled = disabled;
    if (this.input) this.input.disabled = disabled;
    this.updateSendButton();
  }

  /** Lets the host deactivate one message's options without affecting other messages. */
  setOptionsDisabled(messageId: string, disabled: boolean) {
    const group = [...(this.messageList?.querySelectorAll<HTMLElement>(".kroma-chat__options") || [])]
      .find((optionGroup) => optionGroup.dataset.messageId === messageId);
    if (!group || group.dataset.selected === "true") return;
    group.dataset.hostDisabled = String(disabled);
    group.classList.toggle("kroma-chat__options--inactive", disabled);
    group.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
      button.disabled = disabled || button.dataset.optionDisabled === "true";
    });
  }

  /** Displays a host-provided, user-facing send error. Pass null to clear it. */
  setError(message: string | null) {
    if (!this.errorMessage || !this.input) return;
    this.errorMessage.textContent = message || "";
    this.errorMessage.hidden = !message;
    if (message) {
      this.input.setAttribute("aria-invalid", "true");
      this.errorMessage.id = `${this.input.id}-error`;
      this.input.setAttribute("aria-describedby", this.errorMessage.id);
    } else {
      this.input.removeAttribute("aria-invalid");
      this.input.removeAttribute("aria-describedby");
      this.errorMessage.removeAttribute("id");
    }
  }

  private createMessageId() {
    return `kroma-chat-${this.instanceId}-message-${++this.messageSequence}`;
  }

  private renderMessage(item: HTMLLIElement, message: ChatMessage) {
    switch (message.type) {
      case "typing":
        return;
      case "status": {
        item.classList.add("kroma-chat__message--status");
        item.dataset.status = message.status || "neutral";
        const status = document.createElement("p");
        status.className = "kroma-chat__status-message";
        status.setAttribute("role", "status");
        status.textContent = message.text;
        item.append(status);
        return;
      }
      case "rich":
      case "info":
        item.append(createRichMessage(message, item.id, (action, userMessage) => this.emitRichAction(item.id, action, userMessage)));
        return;
      case "journey-menu":
        this.appendPrompt(item, message, message.text);
        item.append(createJourneyMenu(item.id, message, (action, userMessage) => this.emitAction(action, userMessage)));
        item.append(createChatMessageTime(message));
        return;
      case "category-picker":
        this.appendPrompt(item, message, message.text);
        item.append(createCategoryPicker(item.id, message, (action, userMessage) => this.emitAction(action, userMessage)));
        item.append(createChatMessageTime(message));
        return;
      case "product-card":
        item.append(createProductCard(item.id, message, (action, userMessage) => this.emitAction(action, userMessage)));
        item.append(createChatMessageTime(message));
        return;
      case "product-carousel":
        this.appendPrompt(item, message, message.text);
        item.append(createProductCarousel(item.id, message, (action, userMessage) => this.emitAction(action, userMessage)));
        item.append(createChatMessageTime(message));
        return;
      case "product-detail":
        item.append(createProductDetail(
          item.id,
          message,
          (action, userMessage) => this.emitAction(action, userMessage),
          (detail) => this.emitQuantityChange(detail),
        ));
        item.append(createChatMessageTime(message));
        return;
      case "product-variant-selector":
        item.append(createProductVariantSelector(item.id, message, (action, userMessage) => this.emitAction(action, userMessage)));
        item.append(createChatMessageTime(message));
        return;
      case "quantity-selector":
        item.append(createStandaloneQuantitySelector(item.id, message, (detail) => this.emitQuantityChange(detail)));
        item.append(createChatMessageTime(message));
        return;
      case "cart-summary":
        this.appendPrompt(item, message, message.text);
        item.append(createCartSummary(item.id, message, (action, userMessage) => this.emitAction(action, userMessage)));
        item.append(createChatMessageTime(message));
        return;
      case "conversational-form":
        this.appendPrompt(item, message, message.text);
        item.append(createConversationalForm(item.id, message, (detail) => this.emitFormSubmit(detail)));
        item.append(createChatMessageTime(message));
        return;
      case "order-review":
        this.appendPrompt(item, message, message.text);
        item.append(createOrderReview(item.id, message, (action, userMessage) => this.emitAction(action, userMessage)));
        item.append(createChatMessageTime(message));
        return;
      case "confirmation":
        item.append(createConfirmation(item.id, message, (action, userMessage) => this.emitAction(action, userMessage)));
        item.append(createChatMessageTime(message));
        return;
      case "quick-replies":
        this.appendPrompt(item, message, message.text);
        item.append(createQuickReplies(item.id, message.replies, (selection, group, button) => this.selectOption(selection, group, button)));
        return;
      case "options":
        this.appendPrompt(item, message, message.text);
        item.append(createQuickReplies(item.id, message.options, (selection, group, button) => this.selectOption(selection, group, button)));
        return;
      default:
        this.appendPrompt(item, message, message.text);
    }
  }

  private appendPrompt(item: HTMLLIElement, message: ChatMessageBase, text: string) {
    const bubble = createChatBubble({ author: message.author, text, time: message.time }, item.id);
    item.append(bubble);
  }

  private selectOption(selection: ChatControlSelection, group: HTMLDivElement, selectedButton: HTMLButtonElement) {
    if (selectedButton.disabled || group.dataset.selected === "true") return;
    group.dataset.selected = "true";
    group.classList.add("kroma-chat__options--selected");
    group.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
      button.disabled = true;
      button.setAttribute("aria-pressed", String(button === selectedButton));
    });

    const userMessageId = this.createMessageId();
    this.addMessage({ id: userMessageId, author: "user", type: "text", text: selection.label });
    this.scrollToBottom();
    this.input?.focus();

    const option: ChatOption = selection.control === "quick-replies"
      ? selection.option as ChatOption
      : {
        id: selection.option.id,
        label: selection.label,
        value: selection.value,
        disabled: selection.option.disabled,
      };
    const detail: ChatOptionSelectEventDetail = {
      message: selection.value,
      messageId: selection.messageId,
      optionId: selection.optionId,
      value: selection.value,
      label: selection.label,
      control: selection.control,
      option,
    };
    this.dispatchEvent(new CustomEvent<ChatOptionSelectEventDetail>("kroma-chat-option-select", {
      bubbles: true,
      composed: true,
      detail,
    }));
  }

  private emitRichAction(messageId: string, action: ChatAction, userMessage?: string) {
    const sourceMessage = this.findMessageElement(messageId);
    sourceMessage?.querySelectorAll<HTMLButtonElement>(".kroma-chat__rich-action").forEach((button) => {
      button.disabled = true;
    });
    if (userMessage) {
      this.addMessage({ author: "user", type: "text", text: userMessage });
      this.scrollToBottom();
      this.input?.focus();
    }
    const detail: ChatRichActionDetail = {
      messageId,
      actionId: action.id || `${messageId}-action`,
      value: action.value,
    };
    this.dispatchEvent(new CustomEvent<ChatRichActionDetail>("kroma-chat-rich-action", {
      bubbles: true,
      composed: true,
      detail,
    }));
  }

  private emitAction(detail: ChatActionDetail, userMessage?: string) {
    if (detail.control !== "product-variant-selector") {
      const sourceMessage = this.findMessageElement(detail.messageId);
      const actionButtons = sourceMessage?.querySelectorAll<HTMLButtonElement>("button[data-action-id]");
      actionButtons?.forEach((button) => {
        if (detail.control === "product-carousel") {
          if (button.dataset.actionId === detail.actionId) button.disabled = true;
          return;
        }
        if (detail.control === "cart-summary" && detail.actionId === "remove-item") {
          if (button.dataset.actionId === detail.actionId && button.dataset.lineId === detail.data?.lineId) {
            button.disabled = true;
          }
          return;
        }
        button.disabled = true;
      });
    }
    if (userMessage) {
      this.addMessage({ author: "user", type: "text", text: userMessage });
      this.scrollToBottom();
      this.input?.focus();
    }
    this.dispatchEvent(new CustomEvent<ChatActionDetail>("kroma-chat-action", {
      bubbles: true,
      composed: true,
      detail,
    }));
  }

  private findMessageElement(messageId: string) {
    return [...(this.messageList?.querySelectorAll<HTMLLIElement>("li[data-message-id]") || [])]
      .find((message) => message.dataset.messageId === messageId);
  }

  private emitQuantityChange(detail: ChatQuantityChangeDetail) {
    this.dispatchEvent(new CustomEvent<ChatQuantityChangeDetail>("kroma-chat-quantity-change", {
      bubbles: true,
      composed: true,
      detail,
    }));
  }

  private emitFormSubmit(detail: ChatFormSubmitDetail) {
    this.dispatchEvent(new CustomEvent<ChatFormSubmitDetail>("kroma-chat-form-submit", {
      bubbles: true,
      composed: true,
      detail,
    }));
  }

  private sendMessage(value: string) {
    const message = value.trim();
    if (!message || this.composerDisabled) return;

    this.addMessage({ id: this.createMessageId(), author: "user", type: "text", text: message });
    this.scrollToBottom();
    if (this.input) {
      this.input.value = "";
      this.input.rows = 1;
    }
    this.setError(null);
    this.updateSendButton();

    this.dispatchEvent(new CustomEvent<ChatSendDetail>("kroma-chat-send", {
      bubbles: true,
      composed: true,
      detail: { message, source: "composer" },
    }));
  }

  private resizeComposerInput() {
    if (!this.input) return;
    this.input.rows = 1;
    const styles = window.getComputedStyle(this.input);
    const lineHeight = Number.parseFloat(styles.lineHeight) || 21;
    const verticalPadding = Number.parseFloat(styles.paddingTop) + Number.parseFloat(styles.paddingBottom);
    const borderHeight = Number.parseFloat(styles.borderTopWidth) + Number.parseFloat(styles.borderBottomWidth);
    const baselineHeight = Math.max((Number.parseFloat(styles.minHeight) || 0) - borderHeight, lineHeight + verticalPadding);
    const contentLines = Math.ceil(Math.max(0, this.input.scrollHeight - baselineHeight) / lineHeight) + 1;
    this.input.rows = Math.min(6, Math.max(1, contentLines));
  }

  private updateSendButton() {
    if (this.sendButton) this.sendButton.disabled = this.composerDisabled || !this.input?.value.trim();
  }

  private isAtBottom() {
    if (!this.messageList) return true;
    return this.messageList.scrollHeight - this.messageList.scrollTop - this.messageList.clientHeight < 56;
  }

  private scrollToBottom() {
    if (!this.messageList) return;
    requestAnimationFrame(() => {
      if (this.messageList) this.messageList.scrollTop = this.messageList.scrollHeight;
    });
  }
}

if (!customElements.get(tagName)) customElements.define(tagName, KromaChatElement);
