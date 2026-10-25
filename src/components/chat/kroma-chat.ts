import { ChatComposer, type ChatInputMode } from "./layout/chat-composer";
import { ChatHeader, type ChatHeaderAction } from "./layout/chat-header";
import { ChatMessageList } from "./layout/chat-message-list";
import { CHAT_EVENTS, emitKromaChatEvent } from "./core/chat.events";
import type {
  ChatAction,
  ChatMessage,
  ChatMessageAuthor,
  ChatOption,
  ChatMode,
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
  ChatMode,
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
export type { ChatInputMode } from "./layout/chat-composer";

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
  private headerActions: ChatHeaderAction[] = [];
  private header: ChatHeader | null = null;
  private messageList: ChatMessageList | null = null;
  private composer: ChatComposer | null = null;
  private modeRevision = 0;

  static get observedAttributes() {
    return ["mode", "input-mode"];
  }

  get mode(): ChatMode {
    return this.getAttribute("mode") === "kitchen" ? "kitchen" : "default";
  }

  set mode(mode: ChatMode) {
    if (this.mode === mode) return;
    this.setAttribute("mode", mode);
  }

  get composerInputMode(): ChatInputMode {
    return this.getAttribute("input-mode") === "virtual" ? "virtual" : "native";
  }

  set composerInputMode(mode: ChatInputMode) {
    if (this.composerInputMode === mode) return;
    this.setAttribute("input-mode", mode);
  }

  attributeChangedCallback(name: string, previous: string | null, current: string | null) {
    if (name === "mode" && previous !== current && this.initialized) this.reinitializeForMode();
    if (name === "input-mode" && previous !== current) this.composer?.setInputMode(this.composerInputMode);
  }

  connectedCallback() {
    if (this.initialized) return;
    if (this.mode === "kitchen") {
      this.history = [];
      this.selectedOptions.clear();
      this.disabledOptions.clear();
      this.consumedActions.clear();
      this.typing = { active: false, label: "" };
      this.status = null;
      this.error = null;
    }
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
      consumedActions: this.consumedActions,
      interactive: this.mode !== "kitchen",
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
      disabled: this.composerDisabled || this.mode === "kitchen",
      inputMode: this.composerInputMode,
      showKeyboardShowcase: this.mode === "kitchen",
      onInputModeChange: (inputMode) => { this.composerInputMode = inputMode; },
      onSend: (message) => this.sendMessage(message),
    });
    this.header = header;
    this.messageList = messageList;
    this.composer = composer;
    this.replaceChildren(header.element, messageList.element, messageList.emptyState, composer.element);
    if (this.headerActions.length && this.mode !== "kitchen") this.setHeaderActions(this.headerActions);
    if (this.error) composer.setError(this.error);
    this.history.forEach(({ id, message }) => messageList.addMessage(message, id));
    this.selectedOptions.forEach((optionId, messageId) => messageList.restoreOptionSelection(messageId, optionId));
    this.disabledOptions.forEach((disabled, messageId) => messageList.setOptionsDisabled(messageId, disabled));
    if (this.typing.active) messageList.setTyping(true, this.typing.label, this.typing.messageId);
    if (this.mode === "kitchen") this.loadKitchenConversation();
  }

  disconnectedCallback() {
    this.modeRevision++;
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
    if (normalized.type === "typing" && this.mode !== "kitchen") {
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
    this.header?.setActions(this.mode === "kitchen" ? [] : this.headerActions, (action) => this.emitAction({
      messageId: "header",
      control: "header",
      actionId: action.id,
      label: action.label,
      value: action.value,
    }));
  }

  setComposerDisabled(disabled: boolean) {
    this.composerDisabled = disabled;
    this.composer?.setDisabled(disabled || this.mode === "kitchen");
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
    if (this.mode === "kitchen") return;
    this.addMessage({ id: this.createMessageId(), author: "user", type: "text", text: message });
    this.setError(null);
    emitKromaChatEvent(this, CHAT_EVENTS.send, { message, source: "composer" });
  }

  private emitOptionSelect(detail: ChatOptionSelectEventDetail) {
    if (this.mode === "kitchen") return;
    this.selectedOptions.set(detail.messageId, detail.optionId);
    emitKromaChatEvent(this, CHAT_EVENTS.optionSelect, detail);
  }

  private emitRichAction(detail: ChatRichActionDetail, _action: ChatAction, _userMessage?: string) {
    if (this.mode === "kitchen") return;
    emitKromaChatEvent(this, CHAT_EVENTS.richAction, detail);
  }

  private emitAction(detail: ChatActionDetail, _userMessage?: string) {
    if (this.mode === "kitchen") return;
    emitKromaChatEvent(this, CHAT_EVENTS.action, detail);
  }

  private emitQuantityChange(detail: ChatQuantityChangeDetail) {
    if (this.mode === "kitchen") return;
    emitKromaChatEvent(this, CHAT_EVENTS.quantityChange, detail);
  }

  private emitFormSubmit(detail: ChatFormSubmitDetail) {
    if (this.mode === "kitchen") return;
    emitKromaChatEvent(this, CHAT_EVENTS.formSubmit, detail);
  }

  private reinitializeForMode() {
    this.modeRevision++;
    this.messageList?.destroy();
    this.composer?.destroy();
    this.header = null;
    this.messageList = null;
    this.composer = null;
    this.history = [];
    this.selectedOptions.clear();
    this.disabledOptions.clear();
    this.consumedActions.clear();
    this.typing = { active: false, label: "" };
    this.status = null;
    this.error = null;
    this.initialized = false;
    this.connectedCallback();
  }

  private loadKitchenConversation() {
    const revision = ++this.modeRevision;
    void import("./kitchen/kitchen.messages").then(({ createKitchenMessages }) => {
      if (!this.isConnected || this.mode !== "kitchen" || revision !== this.modeRevision) return;
      createKitchenMessages().forEach((message) => this.addMessage(message));
    }).catch((error: unknown) => {
      console.error("[kroma-chat] Kitchen Mode examples could not be loaded.", error);
    });
  }
}

/** Backwards-compatible export for hosts using the former class name. */
export { KromaChat as KromaChatElement };

if (!customElements.get(tagName)) customElements.define(tagName, KromaChat);
