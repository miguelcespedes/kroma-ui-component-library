import type {
  ChatAction,
  ChatChoiceListMessage,
  ChatInfoMessage,
  ChatMessage,
  ChatMessageBase,
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
import type {
  ChatActionDetail,
  ChatControlSelection,
  ChatFormSubmitDetail,
  ChatQuantityChangeDetail,
  ChatRichActionDetail,
} from "./chat.events";
import type { ChatActionHandler } from "../shared/actions";
import type { ChatQuantityHandler } from "../catalog/quantity-selector";
import { createCartSummary, createOrderReview } from "../commerce/cart-summary";
import { createConfirmationCard } from "../feedback/confirmation-card";
import { createStatusMessage } from "../feedback/status-message";
import { createConversationalForm } from "../forms/conversational-form";
import { createChatBubble, createChatMessageTime } from "../messages/chat-message";
import { createChoiceList } from "../messages/choice-list";
import { createQuickReplies } from "../messages/quick-replies";
import { createRichMessage } from "../messages/rich-message";
import { createTypingIndicator } from "../messages/typing-indicator";
import { createCategoryPicker } from "../navigation/category-picker";
import { createJourneyMenu } from "../navigation/journey-menu";
import { createProductCard } from "../catalog/product-card";
import { createProductCarousel } from "../catalog/product-carousel";
import { createProductDetail } from "../catalog/product-detail";
import { createProductList } from "../catalog/product-list";
import { createProductVariantSelector } from "../catalog/product-variant-selector";
import { createStandaloneQuantitySelector } from "../catalog/quantity-selector";

export type ChatRendererHandlers = {
  onAction: ChatActionHandler;
  onRichAction: (messageId: string, action: ChatAction, userMessage?: string) => void;
  onOptionSelect: (selection: ChatControlSelection, group: HTMLDivElement, button: HTMLButtonElement) => void;
  onQuantityChange: ChatQuantityHandler;
  onFormSubmit: (detail: ChatFormSubmitDetail) => void;
};

type ChatRenderer<Message extends ChatMessage> = (item: HTMLLIElement, message: Message, handlers: ChatRendererHandlers) => void;
type ChatRendererMap = {
  text: ChatRenderer<ChatTextMessage>;
  status: ChatRenderer<ChatStatusMessage>;
  info: ChatRenderer<ChatInfoMessage>;
  rich: ChatRenderer<ChatRichMessage>;
  "journey-menu": ChatRenderer<JourneyMenuMessage>;
  "category-picker": ChatRenderer<CategoryPickerMessage>;
  "product-card": ChatRenderer<ProductCardMessage>;
  "product-list": ChatRenderer<ProductListMessage>;
  "product-carousel": ChatRenderer<ProductCarouselMessage>;
  "product-detail": ChatRenderer<ProductDetailMessage>;
  "product-variant-selector": ChatRenderer<ProductVariantSelectorMessage>;
  "quantity-selector": ChatRenderer<QuantitySelectorMessage>;
  "cart-summary": ChatRenderer<CartSummaryMessage>;
  "conversational-form": ChatRenderer<ConversationalFormMessage>;
  "order-review": ChatRenderer<OrderReviewMessage>;
  confirmation: ChatRenderer<ConfirmationMessage>;
  "confirmation-card": ChatRenderer<ConfirmationMessage>;
  "quick-replies": ChatRenderer<ChatQuickRepliesMessage>;
  options: ChatRenderer<ChatOptionsMessage>;
  "choice-list": ChatRenderer<ChatChoiceListMessage>;
  typing: ChatRenderer<ChatTypingMessage>;
};

function appendPrompt(item: HTMLLIElement, message: ChatMessageBase & { text: string }) {
  item.append(createChatBubble(message, item.id));
}

function renderStatus(item: HTMLLIElement, message: ChatStatusMessage) {
  item.classList.add("kroma-chat__message--status");
  item.dataset.status = message.status || "neutral";
  item.append(createStatusMessage(message));
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

const renderers = {
  status: (item, message, _handlers) => renderStatus(item, message),
  info: (item, message, handlers) => renderRich(item, message, handlers),
  rich: (item, message, handlers) => renderRich(item, message, handlers),
  "journey-menu": (item, message, handlers) => renderJourneyMenu(item, message, handlers),
  "category-picker": (item, message, handlers) => renderCategoryPicker(item, message, handlers),
  "product-card": (item, message, handlers) => renderProductCard(item, message, handlers),
  "product-list": (item, message, handlers) => renderProductList(item, message, handlers),
  "product-carousel": (item, message, handlers) => renderProductCarousel(item, message, handlers),
  "product-detail": (item, message, handlers) => renderProductDetail(item, message, handlers),
  "product-variant-selector": (item, message, handlers) => renderProductVariantSelector(item, message, handlers),
  "quantity-selector": (item, message, handlers) => renderQuantitySelector(item, message, handlers),
  "cart-summary": (item, message, handlers) => renderCartSummary(item, message, handlers),
  "conversational-form": (item, message, handlers) => renderForm(item, message, handlers),
  "order-review": (item, message, handlers) => renderOrderReview(item, message, handlers),
  confirmation: (item, message, handlers) => renderConfirmation(item, message, handlers),
  "confirmation-card": (item, message, handlers) => renderConfirmation(item, message, handlers),
  "quick-replies": (item, message, handlers) => renderQuickReplies(item, message, handlers),
  options: (item, message, handlers) => renderQuickReplies(item, message, handlers),
  "choice-list": (item, message, handlers) => renderChoiceList(item, message, handlers),
  text: (item, message) => renderText(item, message),
  typing: (item, message) => renderTyping(item, message),
} satisfies ChatRendererMap;

/** Resolves a typed content payload to its focused renderer without embedding control logic in KromaChat. */
export function renderChatMessage(item: HTMLLIElement, message: ChatMessage, handlers: ChatRendererHandlers) {
  const type = message.type || "text";
  // The runtime discriminant selects the matching map entry; TypeScript loses that relation after indexed lookup.
  renderers[type](item, message as never, handlers);
}
