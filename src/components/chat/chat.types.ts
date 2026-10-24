export type ChatMessageAuthor = "assistant" | "user" | "system";

export type ChatOption = {
  id?: string;
  label: string;
  value?: string;
  disabled?: boolean;
};

export type ChatChoice = {
  id?: string;
  title: string;
  description: string;
  value?: string;
  disabled?: boolean;
};

export type ChatLink = {
  label: string;
  href: string;
};

export type ChatAction = {
  id?: string;
  label: string;
  value?: string;
  messageText?: string;
};

export type ChatImage = {
  src: string;
  alt: string;
};

export type ChatMoney = {
  amount: number;
  currency: string;
  label?: string;
};

export type JourneyMenuItem = {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  value?: string;
  disabled?: boolean;
};

export type ChatCategory = {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  disabled?: boolean;
};

export type ChatProductVariant = {
  id: string;
  label: string;
  value: string;
  disabled?: boolean;
};

export type ChatProduct = {
  id: string;
  name: string;
  description: string;
  summary?: string;
  image?: ChatImage;
  price?: ChatMoney;
  priceLabel?: string;
  tags?: string[];
  features?: string[];
  variants?: ChatProductVariant[];
};

export type ChatCartItem = {
  id: string;
  product: ChatProduct;
  variantLabel?: string;
  quantity: number;
  actions?: ChatAction[];
  unitPrice?: ChatMoney;
  lineTotal?: ChatMoney;
  unitPriceLabel?: string;
  lineTotalLabel?: string;
};

export type ChatFormField = {
  id: string;
  name: string;
  label: string;
  type: "text" | "email" | "tel" | "number" | "date" | "url" | "search" | "password";
  value?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  autocomplete?: string;
  min?: string | number;
  max?: string | number;
  pattern?: string;
  errorMessage?: string;
};

export type ChatCustomerDetails = Record<string, string>;

export type ChatPriceEntry = {
  id: string;
  label: string;
  amount?: ChatMoney;
  amountLabel?: string;
  emphasis?: "normal" | "strong";
};

export type ChatPriceSummary = {
  entries: ChatPriceEntry[];
};

export type ChatMessageBase = {
  id?: string;
  author: ChatMessageAuthor;
  time?: string;
};

/** Legacy text messages without `type` remain valid. */
export type ChatTextMessage = ChatMessageBase & {
  type?: "text";
  text: string;
};

/** Legacy `options` is retained as a backwards-compatible QuickReplies alias. */
export type ChatOptionsMessage = ChatMessageBase & {
  type: "options";
  text: string;
  options: ChatOption[];
};

export type ChatQuickRepliesMessage = ChatMessageBase & {
  type: "quick-replies";
  text: string;
  replies: ChatOption[];
};

export type ChatChoiceListMessage = ChatMessageBase & {
  type: "choice-list";
  text: string;
  choices: ChatChoice[];
};

/** Legacy `info` remains valid as a RichMessage without optional actions. */
export type ChatInfoMessage = ChatMessageBase & {
  type: "info";
  title: string;
  description: string;
  link?: ChatLink;
  action?: ChatAction;
};

export type ChatRichMessage = ChatMessageBase & {
  type: "rich";
  title?: string;
  description: string;
  link?: ChatLink;
  action?: ChatAction;
};

export type ChatStatusMessage = ChatMessageBase & {
  type: "status";
  text: string;
  status?: "neutral" | "success" | "warning" | "error";
};

export type JourneyMenuMessage = ChatMessageBase & {
  type: "journey-menu";
  text: string;
  items: JourneyMenuItem[];
};

export type CategoryPickerMessage = ChatMessageBase & {
  type: "category-picker";
  text: string;
  categories: ChatCategory[];
};

export type ProductCardMessage = ChatMessageBase & {
  type: "product-card";
  product: ChatProduct;
  actionLabel?: string;
};

export type ProductListMessage = ChatMessageBase & {
  type: "product-list";
  text: string;
  products: ChatProduct[];
  productActionLabel?: string;
};

export type ProductCarouselMessage = ChatMessageBase & {
  type: "product-carousel";
  text: string;
  products: ChatProduct[];
  previousLabel?: string;
  nextLabel?: string;
  productActionLabel?: string;
};

export type ProductDetailMessage = ChatMessageBase & {
  type: "product-detail";
  product: ChatProduct;
  variants?: ChatProductVariant[];
  selectedVariantId?: string;
  variantLabel?: string;
  quantity?: number;
  quantityLabel?: string;
  decreaseQuantityLabel?: string;
  increaseQuantityLabel?: string;
  minimumQuantity?: number;
  maximumQuantity?: number;
  requiresVariant?: boolean;
  addActionLabel?: string;
  backActionLabel?: string;
  actionMessage?: string;
};

export type ProductVariantSelectorMessage = ChatMessageBase & {
  type: "product-variant-selector";
  controlId: string;
  productId?: string;
  label: string;
  variants: ChatProductVariant[];
  selectedVariantId?: string;
};

export type QuantitySelectorMessage = ChatMessageBase & {
  type: "quantity-selector";
  controlId: string;
  productId?: string;
  label: string;
  value: number;
  minimum?: number;
  maximum?: number;
  decreaseLabel?: string;
  increaseLabel?: string;
};

export type CartSummaryMessage = ChatMessageBase & {
  type: "cart-summary";
  text: string;
  items: ChatCartItem[];
  subtotal?: ChatMoney;
  subtotalTitle?: string;
  subtotalLabel?: string;
  priceSummary?: ChatPriceSummary;
  continueLabel?: string;
  emptyLabel?: string;
  removeItemLabel?: string;
};

export type ConversationalFormMessage = ChatMessageBase & {
  type: "conversational-form";
  text: string;
  title?: string;
  fields: ChatFormField[];
  submitLabel: string;
};

export type OrderReviewMessage = ChatMessageBase & {
  type: "order-review";
  text: string;
  customer: ChatCustomerDetails;
  customerLabels?: Partial<Record<keyof ChatCustomerDetails, string>>;
  items: ChatCartItem[];
  subtotal?: ChatMoney;
  subtotalTitle?: string;
  subtotalLabel?: string;
  priceSummary?: ChatPriceSummary;
  removeItemLabel?: string;
  confirmLabel: string;
  editLabel?: string;
};

export type ConfirmationMessage = ChatMessageBase & {
  type: "confirmation" | "confirmation-card";
  status?: "neutral" | "success" | "warning" | "error";
  title: string;
  description: string;
  reference?: string;
  summary?: string[];
  action?: ChatAction;
};

/** Legacy typing messages are interpreted as host-controlled indicator state. */
export type ChatTypingMessage = ChatMessageBase & {
  type: "typing";
  label?: string;
};

export type ChatMessage =
  | ChatTextMessage
  | ChatOptionsMessage
  | ChatQuickRepliesMessage
  | ChatChoiceListMessage
  | ChatInfoMessage
  | ChatRichMessage
  | ChatStatusMessage
  | JourneyMenuMessage
  | CategoryPickerMessage
  | ProductCardMessage
  | ProductListMessage
  | ProductCarouselMessage
  | ProductDetailMessage
  | ProductVariantSelectorMessage
  | QuantitySelectorMessage
  | CartSummaryMessage
  | ConversationalFormMessage
  | OrderReviewMessage
  | ConfirmationMessage
  | ChatTypingMessage;

/** Existing text-send payload remains compatible; source metadata is additive. */
export type ChatSendDetail = {
  message: string;
  source?: "composer";
};

/** Selection is a separate event and never also emits `kroma-chat-send`. */
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
