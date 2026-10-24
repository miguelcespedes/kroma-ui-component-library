import { ChatComposer } from "./chat-composer";
import { ChatHeader, type ChatHeaderAction } from "./chat-header";
import { ChatMessageList } from "./chat-message-list";
import type {
  ChatAction,
  ChatActionDetail,
  ChatFormSubmitDetail,
  ChatMessage,
  ChatMessageAuthor,
  ChatOption,
  ChatOptionSelectEventDetail,
  ChatQuantityChangeDetail,
  ChatRichActionDetail,
  ChatSendDetail,
} from "./chat.types";

export type {
  ChatAction,
  ChatActionControl,
  ChatActionData,
  ChatActionDetail,
  ChatCategory,
  ChatCartItem,
  ChatChoice,
  ChatChoiceListMessage,
  ChatCustomerDetails,
  ChatFormField,
  ChatFormSubmitDetail,
  ChatImage,
  ChatInfoMessage,
  ChatLink,
  ChatMessage,
  ChatMessageAuthor,
  ChatMoney,
  ChatOption,
  ChatOptionSelectDetail,
  ChatOptionSelectEventDetail,
  ChatOptionsMessage,
  ChatQuantityChangeDetail,
  ChatPriceEntry,
  ChatPriceSummary,
  ChatProduct,
  ChatProductVariant,
  ChatQuickRepliesMessage,
  ChatRichActionDetail,
  ChatRichMessage,
  ChatSendDetail,
  ChatStatusMessage,
  ChatTextMessage,
  ChatTypingMessage,
  CategoryPickerMessage,
  ConfirmationMessage,
  ConversationalFormMessage,
  JourneyMenuItem,
  JourneyMenuMessage,
  OrderReviewMessage,
  ProductCardMessage,
  ProductCarouselMessage,
  ProductDetailMessage,
  ProductListMessage,
  ProductVariantSelectorMessage,
  QuantitySelectorMessage,
} from "./chat.types";
export type { ChatHeaderAction, ChatHeaderOptions } from "./chat-header";

const tagName = "kroma-chat";
let nextElementId = 0;
type StoredMessage = { id: string; message: ChatMessage };

/** Public, presentation-only conversation element. The host owns all business state and integrations. */
export class KromaChat extends HTMLElement {
  private readonly instanceId = ++nextElementId;
  private messageSequence = 0;
  private initialized = false;
  private history: StoredMessage[] = [];
  private selectedOptions = new Map<string, string>();
  private disabledOptions = new Map<string, boolean>();
  private typing: { active: boolean; label: string; messageId?: string } = { active: false, label: "" };
  private status: string | null = null;
  private error: string | null = null;
  private composerDisabled = false;
  private headerActions: ChatHeaderAction[] = [];
  private header: ChatHeader | null = null;
  private messageList: ChatMessageList | null = null;
  private composer: ChatComposer | null = null;

  connectedCallback() {
    if (this.initialized) return;
    this.initialized = true;
    this.classList.add("kroma-chat");
    const title = this.getAttribute("chat-title") || "Assistant";
    if (!this.hasAttribute("role")) this.setAttribute("role", "region");
    if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", title);

    const header = new ChatHeader({
      title,
      avatar: this.getAttribute("avatar"),
      subtitle: this.getAttribute("subtitle"),
      status: this.status ?? this.getAttribute("status"),
    });
    const messageList = new ChatMessageList({
      createMessageId: () => this.createMessageId(),
      addUserMessage: (text) => this.addMessage({ author: "user", type: "text", text }),
      focusComposer: () => this.composer?.focus(),
      onAction: (detail, userMessage) => this.emitAction(detail, userMessage),
      onRichAction: (detail, action, userMessage) => this.emitRichAction(detail, action, userMessage),
      onOptionSelect: (detail) => this.emitOptionSelect(detail),
      onQuantityChange: (detail) => this.emitQuantityChange(detail),
      onFormSubmit: (detail) => this.emitFormSubmit(detail),
    }, this.getAttribute("empty-state") || "Start a conversation", this.getAttribute("messages-label") || "Messages");
    const composer = new ChatComposer({
      id: `kroma-chat-input-${this.instanceId}`,
      inputLabel: this.getAttribute("input-label") || "Write a message",
      placeholder: this.getAttribute("placeholder") || "Message…",
      sendLabel: this.getAttribute("send-label") || "Send message",
      disabled: this.composerDisabled,
      onSend: (message) => this.sendMessage(message),
    });
    this.header = header;
    this.messageList = messageList;
    this.composer = composer;
    this.replaceChildren(header.element, messageList.element, messageList.emptyState, composer.element);
    if (this.headerActions.length) this.setHeaderActions(this.headerActions);
    if (this.error) composer.setError(this.error);
    this.history.forEach(({ id, message }) => messageList.addMessage(message, id));
    this.selectedOptions.forEach((optionId, messageId) => messageList.restoreOptionSelection(messageId, optionId));
    this.disabledOptions.forEach((disabled, messageId) => messageList.setOptionsDisabled(messageId, disabled));
    if (this.typing.active) messageList.setTyping(true, this.typing.label, this.typing.messageId);
  }

  disconnectedCallback() {
    this.messageList?.destroy();
    this.composer?.destroy();
    this.messageList = null;
    this.composer = null;
    this.header = null;
    this.initialized = false;
  }

  /** Adds a typed message and returns its stable ID. Legacy text and info payloads remain supported. */
  addMessage(message: ChatMessage): string {
    const id = message.id || this.createMessageId();
    const normalized = { ...message, id } as ChatMessage;
    if (normalized.type === "typing") {
      this.setTyping(true, normalized.label, id);
      return id;
    }
    this.history.push({ id, message: normalized });
    this.messageList?.addMessage(normalized, id);
    return id;
  }

  setTyping(active: boolean, label = this.getAttribute("typing-label") || "Assistant is typing", messageId?: string) {
    this.typing = { active, label, messageId };
    this.messageList?.setTyping(active, label, messageId);
  }

  setStatus(status: string | null) {
    this.status = status;
    this.header?.setStatus(status);
  }

  setHeaderActions(actions: ChatHeaderAction[]) {
    this.headerActions = [...actions];
    this.header?.setActions(this.headerActions, (action) => this.emitAction({
      messageId: "header",
      control: "header",
      actionId: action.id,
      label: action.label,
      value: action.value,
    }));
  }

  setComposerDisabled(disabled: boolean) {
    this.composerDisabled = disabled;
    this.composer?.setDisabled(disabled);
  }

  setOptionsDisabled(messageId: string, disabled: boolean) {
    this.disabledOptions.set(messageId, disabled);
    this.messageList?.setOptionsDisabled(messageId, disabled);
  }

  setError(message: string | null) {
    this.error = message;
    this.composer?.setError(message);
  }

  private createMessageId() {
    return `kroma-chat-${this.instanceId}-message-${++this.messageSequence}`;
  }

  private sendMessage(message: string) {
    this.addMessage({ id: this.createMessageId(), author: "user", type: "text", text: message });
    this.setError(null);
    this.dispatchEvent(new CustomEvent<ChatSendDetail>("kroma-chat-send", {
      bubbles: true,
      composed: true,
      detail: { message, source: "composer" },
    }));
  }

  private emitOptionSelect(detail: ChatOptionSelectEventDetail) {
    this.selectedOptions.set(detail.messageId, detail.optionId);
    this.dispatchEvent(new CustomEvent<ChatOptionSelectEventDetail>("kroma-chat-option-select", {
      bubbles: true,
      composed: true,
      detail,
    }));
  }

  private emitRichAction(detail: ChatRichActionDetail, _action: ChatAction, _userMessage?: string) {
    this.dispatchEvent(new CustomEvent<ChatRichActionDetail>("kroma-chat-rich-action", {
      bubbles: true,
      composed: true,
      detail,
    }));
  }

  private emitAction(detail: ChatActionDetail, _userMessage?: string) {
    this.dispatchEvent(new CustomEvent<ChatActionDetail>("kroma-chat-action", {
      bubbles: true,
      composed: true,
      detail,
    }));
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
}

/** Backwards-compatible export for hosts using the former class name. */
export { KromaChat as KromaChatElement };

if (!customElements.get(tagName)) customElements.define(tagName, KromaChat);
