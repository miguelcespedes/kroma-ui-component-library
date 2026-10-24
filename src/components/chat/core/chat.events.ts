import type { ChatChoice, ChatOption } from "./chat.types";

export const CHAT_EVENTS = {
  send: "kroma-chat-send",
  optionSelect: "kroma-chat-option-select",
  action: "kroma-chat-action",
  richAction: "kroma-chat-rich-action",
  quantityChange: "kroma-chat-quantity-change",
  formSubmit: "kroma-chat-form-submit",
} as const;

export type ChatSendDetail = {
  message: string;
  source?: "composer";
};

export type ChatOptionSelectDetail = {
  message: string;
  option: ChatOption;
  messageId?: string;
  optionId?: string;
  value?: string;
  label?: string;
  control?: "quick-replies" | "choice-list";
};

export type ChatOptionSelectEventDetail = ChatOptionSelectDetail & {
  messageId: string;
  optionId: string;
  value: string;
  label: string;
  control: "quick-replies" | "choice-list";
};

export type ChatRichActionDetail = {
  messageId: string;
  actionId: string;
  value?: string;
};

export type ChatActionControl =
  | "header"
  | "journey-menu"
  | "category-picker"
  | "product-card"
  | "product-list"
  | "product-carousel"
  | "product-detail"
  | "product-variant-selector"
  | "conversational-form"
  | "cart-summary"
  | "order-review"
  | "confirmation";

export type ChatActionData = {
  productId?: string;
  categoryId?: string;
  variantId?: string;
  quantity?: number;
  lineId?: string;
};

export type ChatActionDetail = {
  messageId: string;
  control: ChatActionControl;
  actionId: string;
  label: string;
  value?: string;
  data?: ChatActionData;
};

export type ChatQuantityChangeDetail = {
  messageId: string;
  controlId: string;
  productId?: string;
  quantity: number;
};

export type ChatFormSubmitDetail = {
  messageId: string;
  values: Record<string, string>;
};

export type ChatControlSelection = {
  messageId: string;
  optionId: string;
  value: string;
  label: string;
  control: "quick-replies" | "choice-list";
  option: ChatOption | ChatChoice;
};

export type KromaChatEventMap = {
  "kroma-chat-send": ChatSendDetail;
  "kroma-chat-option-select": ChatOptionSelectEventDetail;
  "kroma-chat-action": ChatActionDetail;
  "kroma-chat-rich-action": ChatRichActionDetail;
  "kroma-chat-quantity-change": ChatQuantityChangeDetail;
  "kroma-chat-form-submit": ChatFormSubmitDetail;
};

/** Dispatches a typed, bubbling event across the Custom Element boundary. */
export function emitKromaChatEvent<Name extends keyof KromaChatEventMap>(target: EventTarget, name: Name, detail: KromaChatEventMap[Name]) {
  target.dispatchEvent(new CustomEvent<KromaChatEventMap[Name]>(name, { bubbles: true, composed: true, detail }));
}
