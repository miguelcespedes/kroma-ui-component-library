import type {
  ChatAction,
  ChatActionDetail,
  ChatChoiceListMessage,
  ChatFormSubmitDetail,
  ChatInfoMessage,
  ChatMessage,
  ChatMessageBase,
  ChatQuantityChangeDetail,
  ChatRichActionDetail,
  ChatRichMessage,
  ChatStatusMessage,
  ChatTextMessage,
  ChatTypingMessage,
  ChatOptionsMessage,
  ChatQuickRepliesMessage,
  JourneyMenuMessage,
  CategoryPickerMessage,
  ProductCardMessage,
  ProductCarouselMessage,
  ProductListMessage,
  ProductDetailMessage,
  ProductVariantSelectorMessage,
  QuantitySelectorMessage,
  CartSummaryMessage,
  ConversationalFormMessage,
  OrderReviewMessage,
  ConfirmationMessage,
} from "./chat.types";
import {
  createCartSummary,
  createCategoryPicker,
  createChoiceList,
  createChatBubble,
  createChatMessageTime,
  createConfirmationCard,
  createConversationalForm,
  createJourneyMenu,
  createOrderReview,
  createProductCard,
  createProductCarousel,
  createProductDetail,
  createProductList,
  createProductVariantSelector,
  createQuickReplies,
  createRichMessage,
  createStandaloneQuantitySelector,
  createTypingIndicator,
  type ChatActionHandler,
  type ChatQuantityHandler,
  type OptionSelectionHandler,
} from "./chat.controls";

export type ChatRendererHandlers = {
  onAction: ChatActionHandler;
  onRichAction: (messageId: string, action: ChatAction, userMessage?: string) => void;
  onOptionSelect: OptionSelectionHandler;
  onQuantityChange: ChatQuantityHandler;
  onFormSubmit: (detail: ChatFormSubmitDetail) => void;
};

type ChatRenderer = (item: HTMLLIElement, message: ChatMessage, handlers: ChatRendererHandlers) => void;

function appendPrompt(item: HTMLLIElement, message: ChatMessageBase & { text: string }) {
  item.append(createChatBubble(message, item.id));
}

function renderStatus(item: HTMLLIElement, message: ChatStatusMessage) {
  item.classList.add("kroma-chat__message--status");
  item.dataset.status = message.status || "neutral";
  const status = document.createElement("p");
  status.className = "kroma-chat__status-message";
  status.setAttribute("role", "status");
  status.textContent = message.text;
  item.append(status);
}

function renderRich(item: HTMLLIElement, message: ChatInfoMessage | ChatRichMessage, handlers: ChatRendererHandlers) {
  item.append(createRichMessage(message, item.id, (action, userMessage) => handlers.onRichAction(item.id, action, userMessage)));
}

function renderJourneyMenu(item: HTMLLIElement, message: JourneyMenuMessage, handlers: ChatRendererHandlers) {
  appendPrompt(item, message);
  item.append(createJourneyMenu(item.id, message, handlers.onAction), createChatMessageTime(message));
}

function renderCategoryPicker(item: HTMLLIElement, message: CategoryPickerMessage, handlers: ChatRendererHandlers) {
  appendPrompt(item, message);
  item.append(createCategoryPicker(item.id, message, handlers.onAction), createChatMessageTime(message));
}

function renderProductCard(item: HTMLLIElement, message: ProductCardMessage, handlers: ChatRendererHandlers) {
  item.append(createProductCard(item.id, message, handlers.onAction), createChatMessageTime(message));
}

function renderProductList(item: HTMLLIElement, message: ProductListMessage, handlers: ChatRendererHandlers) {
  appendPrompt(item, message);
  item.append(createProductList(item.id, message, handlers.onAction), createChatMessageTime(message));
}

function renderProductCarousel(item: HTMLLIElement, message: ProductCarouselMessage, handlers: ChatRendererHandlers) {
  appendPrompt(item, message);
  item.append(createProductCarousel(item.id, message, handlers.onAction), createChatMessageTime(message));
}

function renderProductDetail(item: HTMLLIElement, message: ProductDetailMessage, handlers: ChatRendererHandlers) {
  item.append(createProductDetail(item.id, message, handlers.onAction, handlers.onQuantityChange), createChatMessageTime(message));
}

function renderProductVariantSelector(item: HTMLLIElement, message: ProductVariantSelectorMessage, handlers: ChatRendererHandlers) {
  item.append(createProductVariantSelector(item.id, message, handlers.onAction), createChatMessageTime(message));
}

function renderQuantitySelector(item: HTMLLIElement, message: QuantitySelectorMessage, handlers: ChatRendererHandlers) {
  item.append(createStandaloneQuantitySelector(item.id, message, handlers.onQuantityChange), createChatMessageTime(message));
}

function renderCartSummary(item: HTMLLIElement, message: CartSummaryMessage, handlers: ChatRendererHandlers) {
  appendPrompt(item, message);
  item.append(createCartSummary(item.id, message, handlers.onAction), createChatMessageTime(message));
}

function renderForm(item: HTMLLIElement, message: ConversationalFormMessage, handlers: ChatRendererHandlers) {
  appendPrompt(item, message);
  item.append(createConversationalForm(item.id, message, handlers.onFormSubmit), createChatMessageTime(message));
}

function renderOrderReview(item: HTMLLIElement, message: OrderReviewMessage, handlers: ChatRendererHandlers) {
  appendPrompt(item, message);
  item.append(createOrderReview(item.id, message, handlers.onAction), createChatMessageTime(message));
}

function renderConfirmation(item: HTMLLIElement, message: ConfirmationMessage, handlers: ChatRendererHandlers) {
  item.append(createConfirmationCard(item.id, message, handlers.onAction), createChatMessageTime(message));
}

function renderQuickReplies(item: HTMLLIElement, message: ChatQuickRepliesMessage | ChatOptionsMessage, handlers: ChatRendererHandlers) {
  appendPrompt(item, message);
  const options = message.type === "options" ? message.options : message.replies;
  item.append(createQuickReplies(item.id, options, handlers.onOptionSelect));
}

function renderChoiceList(item: HTMLLIElement, message: ChatChoiceListMessage, handlers: ChatRendererHandlers) {
  appendPrompt(item, message);
  item.append(createChoiceList(item.id, message.choices, handlers.onOptionSelect));
}

function renderText(item: HTMLLIElement, message: ChatTextMessage) {
  item.append(createChatBubble(message, item.id));
}

function renderTyping(item: HTMLLIElement, message: ChatTypingMessage) {
  item.append(createTypingIndicator(item.id, message.label || "Assistant is typing"));
}

const renderers: Record<string, ChatRenderer> = {
  status: (item, message) => renderStatus(item, message as ChatStatusMessage),
  info: (item, message, handlers) => renderRich(item, message as ChatInfoMessage, handlers),
  rich: (item, message, handlers) => renderRich(item, message as ChatRichMessage, handlers),
  "journey-menu": (item, message, handlers) => renderJourneyMenu(item, message as JourneyMenuMessage, handlers),
  "category-picker": (item, message, handlers) => renderCategoryPicker(item, message as CategoryPickerMessage, handlers),
  "product-card": (item, message, handlers) => renderProductCard(item, message as ProductCardMessage, handlers),
  "product-list": (item, message, handlers) => renderProductList(item, message as ProductListMessage, handlers),
  "product-carousel": (item, message, handlers) => renderProductCarousel(item, message as ProductCarouselMessage, handlers),
  "product-detail": (item, message, handlers) => renderProductDetail(item, message as ProductDetailMessage, handlers),
  "product-variant-selector": (item, message, handlers) => renderProductVariantSelector(item, message as ProductVariantSelectorMessage, handlers),
  "quantity-selector": (item, message, handlers) => renderQuantitySelector(item, message as QuantitySelectorMessage, handlers),
  "cart-summary": (item, message, handlers) => renderCartSummary(item, message as CartSummaryMessage, handlers),
  "conversational-form": (item, message, handlers) => renderForm(item, message as ConversationalFormMessage, handlers),
  "order-review": (item, message, handlers) => renderOrderReview(item, message as OrderReviewMessage, handlers),
  confirmation: (item, message, handlers) => renderConfirmation(item, message as ConfirmationMessage, handlers),
  "confirmation-card": (item, message, handlers) => renderConfirmation(item, message as ConfirmationMessage, handlers),
  "quick-replies": (item, message, handlers) => renderQuickReplies(item, message as ChatQuickRepliesMessage, handlers),
  options: (item, message, handlers) => renderQuickReplies(item, message as ChatOptionsMessage, handlers),
  "choice-list": (item, message, handlers) => renderChoiceList(item, message as ChatChoiceListMessage, handlers),
  text: (item, message) => renderText(item, message as ChatTextMessage),
  typing: (item, message) => renderTyping(item, message as ChatTypingMessage),
};

/** Resolves a typed content payload to its focused renderer without embedding control logic in KromaChat. */
export function renderChatMessage(item: HTMLLIElement, message: ChatMessage, handlers: ChatRendererHandlers) {
  renderers[message.type || "text"]?.(item, message, handlers);
}
