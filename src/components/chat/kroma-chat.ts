import { ChatComposer, type ChatInteractionMode } from "./layout/chat-composer";
import { ChatHeader, type ChatHeaderAction } from "./layout/chat-header";
import { ChatMessageList } from "./layout/chat-message-list";
import { getChatMessageSpeechText } from "./messages/speech-text";
import { CHAT_EVENTS, emitKromaChatEvent } from "./core/chat.events";
import type {
  ChatAction,
  ChatMessage,
  ChatMessageAuthor,
  ChatOption,
} from "./core/chat.types";
import type {
  ChatActionDetail,
  ChatFormSubmitDetail,
  ChatOptionSelectEventDetail,
  ChatQuantityChangeDetail,
  ChatRichActionDetail,
  ChatSendDetail,
} from "./core/chat.events";

export type {
  ChatAction,
  ChatCategory,
  ChatCartItem,
  ChatChoice,
  ChatChoiceListMessage,
  ChatCustomerDetails,
  ChatFormField,
  ChatImage,
  ChatInfoMessage,
  ChatLink,
  ChatMessage,
  ChatMessageAuthor,
  ChatMoney,
  ChatOption,
  ChatOptionsMessage,
  ChatPriceEntry,
  ChatPriceSummary,
  ChatProduct,
  ChatProductVariant,
  ChatQuickRepliesMessage,
  ChatRichMessage,
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
} from "./core/chat.types";
export type {
  ChatActionControl,
  ChatActionData,
  ChatActionDetail,
  ChatControlSelection,
  ChatFormSubmitDetail,
  ChatOptionSelectDetail,
  ChatOptionSelectEventDetail,
  ChatQuantityChangeDetail,
  ChatRichActionDetail,
  ChatSendDetail,
  KromaChatEventMap,
} from "./core/chat.events";
export type { ChatHeaderAction, ChatHeaderOptions } from "./layout/chat-header";
export type { ChatInteractionMode } from "./layout/chat-composer";
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
  private consumedActions = new Map<string, Set<string>>();
  private typing: { active: boolean; label: string; messageId?: string } = { active: false, label: "" };
  private status: string | null = null;
  private error: string | null = null;
  private composerDisabled = false;
  private interactionModeValue: ChatInteractionMode = "guided";
  private headerActions: ChatHeaderAction[] = [];
  private autoReadEnabled = true;
  private header: ChatHeader | null = null;
  private messageList: ChatMessageList | null = null;
  private composer: ChatComposer | null = null;
  get interactionMode(): ChatInteractionMode {
    return this.composer?.mode || this.interactionModeValue;
  }

  set interactionMode(mode: ChatInteractionMode) {
    if (this.interactionModeValue === mode && this.composer?.mode === mode) return;
    this.interactionModeValue = mode;
    this.composer?.setInteractionMode(mode);
  }

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
    }, (enabled) => {
      this.autoReadEnabled = enabled;
      if (!enabled) this.messageList?.stopSpeech();
    });
    const messageList = new ChatMessageList({
      createMessageId: () => this.createMessageId(),
      consumedActions: this.consumedActions,
      interactive: true,
      addUserMessage: (text) => this.addMessage({ author: "user", type: "text", text }),
      focusComposer: () => this.composer?.focus(),
      onAction: (detail, userMessage) => this.emitAction(detail, userMessage),
      onRichAction: (detail, action, userMessage) => this.emitRichAction(detail, action, userMessage),
      onOptionSelect: (detail) => this.emitOptionSelect(detail),
      onQuantityChange: (detail) => this.emitQuantityChange(detail),
      onFormInputFocus: (input) => this.composer?.setKeyboardTarget(input),
      onFormSubmit: (detail) => this.emitFormSubmit(detail),
    }, this.getAttribute("empty-state") || "Start a conversation", this.getAttribute("messages-label") || "Messages");
    const composer = new ChatComposer({
      id: `kroma-chat-input-${this.instanceId}`,
      inputLabel: this.getAttribute("input-label") || "Write a message",
      placeholder: this.getAttribute("placeholder") || "Message…",
      disabled: this.composerDisabled,
      interactionMode: this.interactionModeValue,
      onInteractionModeChange: (mode) => { this.interactionModeValue = mode; },
      onSend: (message) => this.sendMessage(message),
    });
    this.header = header;
    this.messageList = messageList;
    this.composer = composer;
    this.replaceChildren(
      header.element,
      messageList.element,
      messageList.emptyState,
      composer.element,
      ...(composer.keyboardDock ? [composer.keyboardDock] : []),
    );
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
    if (this.autoReadEnabled && normalized.author === "assistant") {
      const speakableText = getChatMessageSpeechText(normalized);
      if (speakableText) this.messageList?.speakAutomatically(id, speakableText);
    }
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

  disableHistoryControls() {
    this.composer?.setKeyboardTarget(null);
    this.messageList?.disableHistoryControls();
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
    emitKromaChatEvent(this, CHAT_EVENTS.send, { message, source: "composer" });
  }

  private emitOptionSelect(detail: ChatOptionSelectEventDetail) {
    this.speakSelectionAcknowledgement(detail.messageId, detail.label);
    this.selectedOptions.set(detail.messageId, detail.optionId);
    emitKromaChatEvent(this, CHAT_EVENTS.optionSelect, detail);
  }

  private emitRichAction(detail: ChatRichActionDetail, _action: ChatAction, _userMessage?: string) {
    emitKromaChatEvent(this, CHAT_EVENTS.richAction, detail);
  }

  private emitAction(detail: ChatActionDetail, _userMessage?: string) {
    if (detail.control === "journey-menu") this.speakSelectionAcknowledgement(detail.messageId, detail.label);
    emitKromaChatEvent(this, CHAT_EVENTS.action, detail);
  }

  private speakSelectionAcknowledgement(messageId: string, label: string) {
    if (!this.autoReadEnabled || !label.trim()) return;
    this.messageList?.speakAutomatically(`${messageId}-selection`, `Elegiste la opción «${label}».`);
  }

  private emitQuantityChange(detail: ChatQuantityChangeDetail) {
    emitKromaChatEvent(this, CHAT_EVENTS.quantityChange, detail);
  }

  private emitFormSubmit(detail: ChatFormSubmitDetail) {
    emitKromaChatEvent(this, CHAT_EVENTS.formSubmit, detail);
  }

}


/** Backwards-compatible export for hosts using the former class name. */
export { KromaChat as KromaChatElement };

if (!customElements.get(tagName)) customElements.define(tagName, KromaChat);
