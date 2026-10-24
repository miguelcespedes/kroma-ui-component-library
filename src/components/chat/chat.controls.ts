import type {
  CartSummaryMessage,
  ChatAction,
  ChatActionData,
  ChatActionDetail,
  ChatChoice,
  ChatControlSelection,
  ChatCustomerDetails,
  ChatFormField,
  ChatFormSubmitDetail,
  ChatImage,
  ChatInfoMessage,
  ChatLink,
  ChatMoney,
  ChatOption,
  ProductCarouselMessage,
  ProductDetailMessage,
  ChatRichMessage,
  ChatQuantityChangeDetail,
  ChatTextMessage,
  CategoryPickerMessage,
  ChatProduct,
  ChatProductVariant,
  ConfirmationMessage,
  ConversationalFormMessage,
  JourneyMenuMessage,
  OrderReviewMessage,
  ProductCardMessage,
  ProductVariantSelectorMessage,
  QuantitySelectorMessage,
} from "./chat.types";

type ActionHandler = (detail: ChatActionDetail, userMessage?: string) => void;
type QuantityHandler = (detail: ChatQuantityChangeDetail) => void;
type FormHandler = (detail: ChatFormSubmitDetail) => void;

function formatMoney(money?: ChatMoney) {
  if (!money) return "";
  if (money.label) return money.label;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: money.currency }).format(money.amount);
  } catch {
    return `${money.amount} ${money.currency}`;
  }
}

type ComposerLabels = {
  id: string;
  inputLabel: string;
  placeholder: string;
  sendLabel: string;
};

export type ChatComposerControls = {
  area: HTMLDivElement;
  form: HTMLFormElement;
  input: HTMLTextAreaElement;
  sendButton: HTMLButtonElement;
  errorMessage: HTMLParagraphElement;
};

export function createChatMessageTime(message: { time?: string }) {
  const time = document.createElement("time");
  time.className = "kroma-chat__time";
  time.textContent = message.time || new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date());
  time.dateTime = new Date().toISOString();
  return time;
}

export function createChatBubble(message: ChatTextMessage, messageId: string) {
  const bubble = document.createElement("div");
  bubble.className = "kroma-chat__bubble";

  const text = document.createElement("span");
  text.id = `${messageId}-content`;
  text.className = "kroma-chat__text";
  text.textContent = message.text;

  bubble.append(text, createChatMessageTime(message));
  return bubble;
}

export function createQuickReplies(
  messageId: string,
  replies: ChatOption[],
  onSelect: (selection: ChatControlSelection, group: HTMLDivElement, button: HTMLButtonElement) => void,
) {
  const group = document.createElement("div");
  group.className = "kroma-chat__options kroma-chat__quick-replies";
  group.dataset.messageId = messageId;
  group.dataset.control = "quick-replies";
  group.setAttribute("role", "group");
  group.setAttribute("aria-labelledby", `${messageId}-content`);

  replies.forEach((reply, index) => {
    const optionId = reply.id || `${messageId}-reply-${index + 1}`;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "kroma-chat__option";
    button.dataset.optionId = optionId;
    button.dataset.optionDisabled = String(Boolean(reply.disabled));
    button.textContent = reply.label;
    button.disabled = Boolean(reply.disabled);
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => onSelect({
      messageId,
      optionId,
      value: reply.value ?? reply.label,
      label: reply.label,
      control: "quick-replies",
      option: { ...reply, id: optionId },
    }, group, button));
    group.append(button);
  });

  return group;
}

export function createChoiceList(
  messageId: string,
  choices: ChatChoice[],
  onSelect: (selection: ChatControlSelection, group: HTMLDivElement, button: HTMLButtonElement) => void,
) {
  const group = document.createElement("div");
  group.className = "kroma-chat__options kroma-chat__choice-list";
  group.dataset.messageId = messageId;
  group.dataset.control = "choice-list";
  group.setAttribute("role", "group");
  group.setAttribute("aria-labelledby", `${messageId}-content`);

  choices.forEach((choice, index) => {
    const optionId = choice.id || `${messageId}-choice-${index + 1}`;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "kroma-chat__option kroma-chat__choice";
    button.dataset.optionId = optionId;
    button.dataset.optionDisabled = String(Boolean(choice.disabled));
    button.disabled = Boolean(choice.disabled);
    button.setAttribute("aria-pressed", "false");

    const title = document.createElement("span");
    title.className = "kroma-chat__choice-title";
    title.textContent = choice.title;
    const description = document.createElement("span");
    description.className = "kroma-chat__choice-description";
    description.textContent = choice.description;
    button.append(title, description);
    button.addEventListener("click", () => onSelect({
      messageId,
      optionId,
      value: choice.value ?? choice.title,
      label: choice.title,
      control: "choice-list",
      option: { ...choice, id: optionId },
    }, group, button));
    group.append(button);
  });

  return group;
}

function safeHref(link: ChatLink) {
  try {
    const url = new URL(link.href, document.baseURI);
    return ["http:", "https:", "mailto:", "tel:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export function createRichMessage(
  message: ChatInfoMessage | ChatRichMessage,
  messageId: string,
  onAction: (action: ChatAction, messageText?: string) => void,
) {
  const rich = document.createElement("article");
  rich.className = "kroma-chat__bubble kroma-chat__rich";

  if (message.title) {
    const title = document.createElement("h3");
    title.className = "kroma-chat__rich-title";
    if (message.type === "info") title.classList.add("kroma-chat__info-title");
    title.textContent = message.title;
    rich.append(title);
  }

  const description = document.createElement("p");
  description.id = `${messageId}-content`;
  description.className = "kroma-chat__rich-description";
  if (message.type === "info") description.classList.add("kroma-chat__info-description");
  description.textContent = message.description;
  rich.append(description);

  const actions = document.createElement("div");
  actions.className = "kroma-chat__rich-actions";

  if (message.link) {
    const href = safeHref(message.link);
    if (href) {
      const link = document.createElement("a");
      link.className = "kroma-chat__rich-link";
      link.href = href;
      link.textContent = message.link.label;
      if (new URL(href).origin !== window.location.origin) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }
      actions.append(link);
    }
  }

  if (message.action) {
    const actionId = message.action.id || `${messageId}-action`;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "kroma-chat__rich-action";
    button.dataset.actionId = actionId;
    button.textContent = message.action.label;
    button.addEventListener("click", () => onAction({ ...message.action!, id: actionId }));
    actions.append(button);
  }

  if (actions.childElementCount) rich.append(actions);
  rich.append(createChatMessageTime(message));
  return rich;
}

function createControlAction(
  messageId: string,
  control: ChatActionDetail["control"],
  actionId: string,
  label: string,
  value: string | undefined,
  data: ChatActionData | undefined,
  onAction: ActionHandler,
  messageText?: string,
) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "kroma-chat__journey-action";
  button.dataset.actionId = actionId;
  button.textContent = label;
  button.addEventListener("click", () => onAction({ messageId, control, actionId, label, value, data }, messageText));
  return button;
}

function createIconLabel(icon: string | undefined, label: string, className: string) {
  const wrapper = document.createElement("span");
  wrapper.className = className;
  if (icon) {
    const iconElement = document.createElement("span");
    iconElement.className = `${className}-icon`;
    iconElement.setAttribute("aria-hidden", "true");
    iconElement.textContent = icon;
    wrapper.append(iconElement);
  }
  const text = document.createElement("span");
  text.textContent = label;
  wrapper.append(text);
  return wrapper;
}

export function createJourneyMenu(messageId: string, message: JourneyMenuMessage, onAction: ActionHandler) {
  const group = document.createElement("div");
  group.className = "kroma-chat__journey-menu";
  group.setAttribute("role", "group");
  group.setAttribute("aria-labelledby", `${messageId}-content`);
  message.items.forEach((item) => {
    const button = createControlAction(
      messageId,
      "journey-menu",
      item.id,
      item.label,
      item.value ?? item.id,
      undefined,
      onAction,
      item.label,
    );
    button.classList.add("kroma-chat__journey-item");
    button.disabled = Boolean(item.disabled);
    button.replaceChildren(createIconLabel(item.icon, item.label, "kroma-chat__journey-item-label"));
    if (item.description) {
      const description = document.createElement("span");
      description.className = "kroma-chat__journey-item-description";
      description.textContent = item.description;
      button.append(description);
    }
    button.dataset.itemId = item.id;
    group.append(button);
  });
  return group;
}

export function createCategoryPicker(messageId: string, message: CategoryPickerMessage, onAction: ActionHandler) {
  const group = document.createElement("div");
  group.className = "kroma-chat__category-picker";
  group.setAttribute("role", "group");
  group.setAttribute("aria-labelledby", `${messageId}-content`);
  message.categories.forEach((category) => {
    const button = createControlAction(
      messageId,
      "category-picker",
      category.id,
      category.label,
      category.id,
      { categoryId: category.id },
      onAction,
      category.label,
    );
    button.classList.add("kroma-chat__category");
    button.disabled = Boolean(category.disabled);
    button.dataset.categoryId = category.id;
    button.replaceChildren(createIconLabel(category.icon, category.label, "kroma-chat__category-label"));
    if (category.description) {
      const description = document.createElement("span");
      description.className = "kroma-chat__category-description";
      description.textContent = category.description;
      button.append(description);
    }
    group.append(button);
  });
  return group;
}

function safeImage(image: ChatImage) {
  try {
    const url = new URL(image.src, document.baseURI);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function createProductImage(image?: ChatImage, className = "kroma-chat__product-image") {
  if (!image) return null;
  const src = safeImage(image);
  if (!src) return null;
  const element = document.createElement("img");
  element.className = className;
  element.src = src;
  element.alt = image.alt;
  element.loading = "lazy";
  element.decoding = "async";
  return element;
}

function createProductCardButton(
  messageId: string,
  product: ChatProduct,
  control: "product-card" | "product-carousel",
  onAction: ActionHandler,
  actionLabel = "View product",
) {
  const button = createControlAction(
    messageId,
    control,
    `product-${product.id}`,
    actionLabel,
    product.id,
    { productId: product.id },
    onAction,
    product.name,
  );
  button.classList.add("kroma-chat__product-card");
  button.dataset.productId = product.id;

  const image = createProductImage(product.image);
  if (image) button.append(image);
  const content = document.createElement("span");
  content.className = "kroma-chat__product-content";
  const name = document.createElement("strong");
  name.className = "kroma-chat__product-name";
  name.textContent = product.name;
  const description = document.createElement("span");
  description.className = "kroma-chat__product-description";
  description.textContent = product.summary || product.description;
  content.append(name, description);
  const productPrice = product.priceLabel || formatMoney(product.price);
  if (productPrice) {
    const price = document.createElement("span");
    price.className = "kroma-chat__product-price";
    price.textContent = productPrice;
    content.append(price);
  }
  button.append(content);
  return button;
}

export function createProductCarousel(messageId: string, message: ProductCarouselMessage, onAction: ActionHandler) {
  const carousel = document.createElement("div");
  carousel.className = "kroma-chat__product-carousel";
  carousel.setAttribute("role", "region");
  carousel.setAttribute("aria-label", message.text);

  const controls = document.createElement("div");
  controls.className = "kroma-chat__carousel-controls";
  const trackId = `${messageId}-products`;
  const previous = document.createElement("button");
  previous.type = "button";
  previous.className = "kroma-chat__carousel-arrow";
  previous.setAttribute("aria-label", message.previousLabel || "Previous products");
  previous.setAttribute("aria-controls", trackId);
  previous.textContent = "‹";
  const next = document.createElement("button");
  next.type = "button";
  next.className = "kroma-chat__carousel-arrow";
  next.setAttribute("aria-label", message.nextLabel || "Next products");
  next.setAttribute("aria-controls", trackId);
  next.textContent = "›";

  const track = document.createElement("div");
  track.id = trackId;
  track.className = "kroma-chat__product-track";
  track.tabIndex = 0;
  track.setAttribute("aria-label", message.text);
  message.products.forEach((product) => track.append(createProductCardButton(messageId, product, "product-carousel", onAction, message.productActionLabel)));

  const updateArrows = () => {
    previous.disabled = track.scrollLeft <= 1;
    next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
  };
  const scroll = (direction: -1 | 1) => {
    const card = track.querySelector<HTMLElement>(".kroma-chat__product-card");
    const behavior: ScrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    track.scrollBy({ left: direction * (card?.offsetWidth || track.clientWidth), behavior });
  };
  previous.addEventListener("click", () => scroll(-1));
  next.addEventListener("click", () => scroll(1));
  track.addEventListener("scroll", updateArrows, { passive: true });
  controls.append(previous, next);
  carousel.append(controls, track);
  requestAnimationFrame(updateArrows);
  return carousel;
}

function createVariantSelector(
  messageId: string,
  controlId: string,
  labelText: string,
  variants: ChatProductVariant[],
  selectedId: string | undefined,
  productId: string | undefined,
  onAction: ActionHandler,
) {
  const fieldset = document.createElement("fieldset");
  fieldset.className = "kroma-chat__variant-selector";
  fieldset.dataset.controlId = controlId;
  const legend = document.createElement("legend");
  legend.textContent = labelText;
  fieldset.append(legend);

  const list = document.createElement("div");
  list.className = "kroma-chat__variant-list";
  variants.forEach((variant, index) => {
    const inputId = `${controlId}-${index + 1}`;
    const label = document.createElement("label");
    label.className = "kroma-chat__variant";
    const input = document.createElement("input");
    input.type = "radio";
    input.name = controlId;
    input.id = inputId;
    input.value = variant.value;
    input.dataset.variantId = variant.id;
    input.checked = variant.id === selectedId;
    input.disabled = Boolean(variant.disabled);
    input.addEventListener("change", () => {
      if (!input.checked) return;
      onAction({
        messageId,
        control: "product-variant-selector",
        actionId: "select-variant",
        label: variant.label,
        value: variant.value,
        data: { productId, variantId: variant.id },
      });
    });
    const text = document.createElement("span");
    text.textContent = variant.label;
    label.htmlFor = inputId;
    label.append(input, text);
    list.append(label);
  });
  fieldset.append(list);
  return fieldset;
}

function createQuantitySelector(
  messageId: string,
  controlId: string,
  labelText: string,
  value: number,
  minimum: number,
  maximum: number,
  decreaseLabel: string,
  increaseLabel: string,
  productId: string | undefined,
  onQuantityChange: (detail: ChatQuantityChangeDetail) => void,
) {
  const control = document.createElement("div");
  control.className = "kroma-chat__quantity-selector";
  control.dataset.controlId = controlId;
  const label = document.createElement("span");
  label.className = "kroma-chat__quantity-label";
  label.textContent = labelText;

  const minus = document.createElement("button");
  minus.type = "button";
  minus.className = "kroma-chat__quantity-button";
  minus.setAttribute("aria-label", decreaseLabel);
  minus.textContent = "−";
  const output = document.createElement("output");
  output.className = "kroma-chat__quantity-value";
  output.setAttribute("aria-live", "polite");
  const minimumValue = Number.isFinite(minimum) ? Math.max(0, Math.floor(minimum)) : 0;
  const maximumValue = Number.isFinite(maximum) ? Math.max(minimumValue, Math.floor(maximum)) : minimumValue;
  const initialValue = Number.isFinite(value) ? Math.floor(value) : minimumValue;
  let quantity = Math.min(maximumValue, Math.max(minimumValue, initialValue));
  const plus = document.createElement("button");
  plus.type = "button";
  plus.className = "kroma-chat__quantity-button";
  plus.setAttribute("aria-label", increaseLabel);
  plus.textContent = "+";

  const update = (nextQuantity: number) => {
    const bounded = Math.min(maximumValue, Math.max(minimumValue, nextQuantity));
    if (bounded === quantity) return;
    quantity = bounded;
    output.value = String(quantity);
    control.dataset.quantityValue = String(quantity);
    minus.disabled = quantity <= minimumValue;
    plus.disabled = quantity >= maximumValue;
    onQuantityChange({ messageId, controlId, productId, quantity });
  };

  minus.addEventListener("click", () => update(quantity - 1));
  plus.addEventListener("click", () => update(quantity + 1));
  output.value = String(quantity);
  control.dataset.quantityValue = String(quantity);
  minus.disabled = quantity <= minimumValue;
  plus.disabled = quantity >= maximumValue;
  control.append(label, minus, output, plus);
  return control;
}

export function createProductDetail(
  messageId: string,
  message: ProductDetailMessage,
  onAction: ActionHandler,
  onQuantityChange: (detail: ChatQuantityChangeDetail) => void,
) {
  const detail = document.createElement("section");
  detail.className = "kroma-chat__product-detail";
  const image = createProductImage(message.product.image, "kroma-chat__product-detail-image");
  if (image) detail.append(image);

  const heading = document.createElement("h3");
  heading.className = "kroma-chat__product-detail-title";
  heading.textContent = message.product.name;
  detail.append(heading);

  const description = document.createElement("p");
  description.className = "kroma-chat__product-detail-description";
  description.textContent = message.product.description;
  detail.append(description);

  if (message.product.features?.length) {
    const featureList = document.createElement("ul");
    featureList.className = "kroma-chat__product-features";
    message.product.features.forEach((feature) => {
      const item = document.createElement("li");
      item.textContent = feature;
      featureList.append(item);
    });
    detail.append(featureList);
  }
  const productPrice = message.product.priceLabel || formatMoney(message.product.price);
  if (productPrice) {
    const price = document.createElement("p");
    price.className = "kroma-chat__product-detail-price";
    price.textContent = productPrice;
    detail.append(price);
  }
  const variants = message.variants || message.product.variants || [];
  const quantityId = `${messageId}-quantity`;
  const quantityControl = createQuantitySelector(
    messageId,
    quantityId,
    message.quantityLabel || "Quantity",
    message.quantity ?? 1,
    message.minimumQuantity ?? 1,
    message.maximumQuantity ?? 20,
    message.decreaseQuantityLabel || "Decrease quantity",
    message.increaseQuantityLabel || "Increase quantity",
    message.product.id,
    onQuantityChange,
  );

  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.className = "kroma-chat__journey-action kroma-chat__product-add";
  addButton.dataset.actionId = "add-to-cart";
  addButton.textContent = message.addActionLabel || "Add to selection";
  let selectedVariantId = message.selectedVariantId;
  addButton.disabled = Boolean(message.requiresVariant && !selectedVariantId);

  if (variants.length) {
    detail.append(createVariantSelector(
      messageId,
      `${messageId}-variants`,
      message.variantLabel || "Choose a variant",
      variants,
      selectedVariantId,
      message.product.id,
      (selection) => {
        selectedVariantId = selection.data?.variantId;
        addButton.disabled = Boolean(message.requiresVariant && !selectedVariantId);
        onAction(selection);
      },
    ));
  }
  detail.append(quantityControl);

  addButton.addEventListener("click", () => {
    const quantity = Number(quantityControl.dataset.quantityValue) || 1;
    onAction({
      messageId,
      control: "product-detail",
      actionId: "add-to-cart",
      label: addButton.textContent || "",
      value: message.product.id,
      data: { productId: message.product.id, quantity, variantId: selectedVariantId },
    }, message.actionMessage || addButton.textContent || message.product.name);
  });
  if (message.backActionLabel) {
    detail.append(createControlAction(messageId, "product-detail", "back-to-products", message.backActionLabel, "back", { productId: message.product.id }, onAction, message.backActionLabel));
  }
  detail.append(addButton);
  return detail;
}

export function createProductVariantSelector(messageId: string, message: ProductVariantSelectorMessage, onAction: ActionHandler) {
  const selector = createVariantSelector(messageId, message.controlId, message.label, message.variants, message.selectedVariantId, message.productId, onAction);
  selector.classList.add("kroma-chat__standalone-variant-selector");
  return selector;
}

export function createStandaloneQuantitySelector(messageId: string, message: QuantitySelectorMessage, onQuantityChange: (detail: ChatQuantityChangeDetail) => void) {
  return createQuantitySelector(messageId, message.controlId, message.label, message.value, message.minimum ?? 0, message.maximum ?? 99, message.decreaseLabel || "Decrease quantity", message.increaseLabel || "Increase quantity", message.productId, onQuantityChange);
}

export function createProductCard(messageId: string, message: ProductCardMessage, onAction: ActionHandler) {
  const card = document.createElement("div");
  card.className = "kroma-chat__product-card-message";
  card.append(createProductCardButton(messageId, message.product, "product-card", onAction, message.actionLabel));
  return card;
}

export function createCartSummary(messageId: string, message: CartSummaryMessage, onAction: ActionHandler) {
  const summary = document.createElement("section");
  summary.className = "kroma-chat__cart-summary";
  if (!message.items.length) {
    const empty = document.createElement("p");
    empty.className = "kroma-chat__cart-empty";
    empty.textContent = message.emptyLabel || "Your selection is empty.";
    summary.append(empty);
    return summary;
  }

  const list = document.createElement("div");
  list.className = "kroma-chat__cart-items";
  list.setAttribute("role", "list");
  message.items.forEach((line) => {
    const row = document.createElement("article");
    row.className = "kroma-chat__cart-item";
    row.setAttribute("role", "listitem");
    const product = document.createElement("div");
    product.className = "kroma-chat__cart-product";
    const name = document.createElement("strong");
    name.className = "kroma-chat__cart-name";
    name.textContent = line.product.name;
    const meta = document.createElement("p");
    meta.className = "kroma-chat__cart-meta";
    meta.textContent = [line.variantLabel, `${line.quantity} × ${line.unitPriceLabel || formatMoney(line.unitPrice)}`].filter(Boolean).join(" · ");
    product.append(name, meta);

    const trailing = document.createElement("div");
    trailing.className = "kroma-chat__cart-trailing";
    const total = document.createElement("strong");
    total.className = "kroma-chat__cart-total";
    total.textContent = line.lineTotalLabel || formatMoney(line.lineTotal);
    trailing.append(total);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "kroma-chat__cart-remove";
    remove.dataset.actionId = "remove-item";
    remove.dataset.lineId = line.id;
    remove.textContent = message.removeItemLabel || "Remove";
    remove.addEventListener("click", () => onAction({
      messageId,
      control: "cart-summary",
      actionId: "remove-item",
      label: remove.textContent || "Remove",
      value: line.id,
      data: { lineId: line.id, productId: line.product.id },
    }, `${message.removeItemLabel || "Remove"} ${line.product.name}`));
    trailing.append(remove);
    row.append(product, trailing);
    list.append(row);
  });
  summary.append(list);

  if (message.subtotalLabel || message.subtotal) {
    const subtotal = document.createElement("div");
    subtotal.className = "kroma-chat__cart-subtotal";
    const label = document.createElement("span");
    label.textContent = message.subtotalTitle || "Subtotal";
    const amount = document.createElement("strong");
    amount.textContent = message.subtotalLabel || formatMoney(message.subtotal);
    subtotal.append(label, amount);
    summary.append(subtotal);
  }

  if (message.continueLabel) {
    summary.append(createControlAction(messageId, "cart-summary", "continue", message.continueLabel, "continue", undefined, onAction, message.continueLabel));
  }
  return summary;
}

export function createConversationalForm(messageId: string, message: ConversationalFormMessage, onSubmit: FormHandler) {
  const wrapper = document.createElement("section");
  wrapper.className = "kroma-chat__conversational-form";
  if (message.title) {
    const title = document.createElement("h3");
    title.className = "kroma-chat__form-title";
    title.textContent = message.title;
    wrapper.append(title);
  }

  const form = document.createElement("form");
  form.className = "kroma-chat__form-fields";
  const controls = new Map<string, HTMLInputElement>();
  message.fields.forEach((field) => {
    const inputId = `${messageId}-field-${field.id}`;
    const group = document.createElement("div");
    group.className = "kroma-chat__form-field";
    const label = document.createElement("label");
    label.htmlFor = inputId;
    label.textContent = field.label;
    const input = document.createElement("input");
    input.id = inputId;
    input.name = field.name;
    input.type = field.type;
    input.required = Boolean(field.required);
    input.value = field.value || "";
    input.placeholder = field.placeholder || "";
    if (field.autocomplete) input.setAttribute("autocomplete", field.autocomplete);
    input.className = "kroma-chat__form-input";
    controls.set(field.name, input);
    group.append(label, input);
    form.append(group);
  });

  const submit = document.createElement("button");
  submit.type = "submit";
  submit.className = "kroma-chat__journey-action kroma-chat__form-submit";
  submit.textContent = message.submitLabel;
  form.append(submit);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const values: Record<string, string> = {};
    controls.forEach((input, name) => { values[name] = input.value.trim(); });
    onSubmit({ messageId, values });
  });
  wrapper.append(form);
  return wrapper;
}

export function createOrderReview(messageId: string, message: OrderReviewMessage, onAction: ActionHandler) {
  const review = document.createElement("section");
  review.className = "kroma-chat__order-review";
  const customer = document.createElement("dl");
  customer.className = "kroma-chat__customer-details";
  const customerLabels = message.customerLabels || {};
  (Object.keys(message.customer) as (keyof typeof message.customer)[]).forEach((field) => {
    const row = document.createElement("div");
    row.className = "kroma-chat__customer-row";
    const term = document.createElement("dt");
    term.textContent = customerLabels[field] || field;
    const value = document.createElement("dd");
    value.textContent = message.customer[field];
    row.append(term, value);
    customer.append(row);
  });

  const cart = createCartSummary(messageId, {
    author: message.author,
    type: "cart-summary",
    text: message.text,
    items: message.items,
    subtotal: message.subtotal,
    subtotalTitle: message.subtotalTitle,
    subtotalLabel: message.subtotalLabel,
    removeItemLabel: message.removeItemLabel,
  }, onAction);
  review.append(customer, cart);

  const actions = document.createElement("div");
  actions.className = "kroma-chat__review-actions";
  actions.append(createControlAction(messageId, "order-review", "confirm", message.confirmLabel, "confirm", undefined, onAction, message.confirmLabel));
  if (message.editLabel) {
    actions.append(createControlAction(messageId, "order-review", "edit", message.editLabel, "edit", undefined, onAction, message.editLabel));
  }
  review.append(actions);
  return review;
}

export function createConfirmation(messageId: string, message: ConfirmationMessage, onAction: ActionHandler) {
  const confirmation = document.createElement("section");
  confirmation.className = "kroma-chat__confirmation";
  const title = document.createElement("h3");
  title.className = "kroma-chat__confirmation-title";
  title.textContent = message.title;
  const description = document.createElement("p");
  description.className = "kroma-chat__confirmation-description";
  description.textContent = message.description;
  confirmation.append(title, description);
  if (message.reference) {
    const reference = document.createElement("p");
    reference.className = "kroma-chat__confirmation-reference";
    reference.textContent = message.reference;
    confirmation.append(reference);
  }
  if (message.summary?.length) {
    const summary = document.createElement("ul");
    summary.className = "kroma-chat__confirmation-summary";
    message.summary.forEach((text) => {
      const item = document.createElement("li");
      item.textContent = text;
      summary.append(item);
    });
    confirmation.append(summary);
  }
  if (message.action) {
    confirmation.append(createControlAction(messageId, "confirmation", message.action.id || `${messageId}-action`, message.action.label, message.action.value, undefined, onAction, message.action.messageText || message.action.label));
  }
  return confirmation;
}

export function createTypingIndicator(messageId: string, label: string) {
  const item = document.createElement("li");
  item.className = "kroma-chat__message kroma-chat__message--assistant kroma-chat__message--typing";
  item.dataset.messageId = messageId;
  item.dataset.messageType = "typing";
  item.setAttribute("role", "status");

  const bubble = document.createElement("div");
  bubble.className = "kroma-chat__bubble kroma-chat__typing-bubble";
  const announcement = document.createElement("span");
  announcement.className = "kroma-chat__sr-only";
  announcement.textContent = label;
  const dots = document.createElement("span");
  dots.className = "kroma-chat__typing-dots";
  dots.setAttribute("aria-hidden", "true");
  dots.append(document.createElement("span"), document.createElement("span"), document.createElement("span"));
  bubble.append(announcement, dots);
  item.append(bubble);
  return item;
}

export function createChatComposer(labels: ComposerLabels): ChatComposerControls {
  const area = document.createElement("div");
  area.className = "kroma-chat__composer-area";

  const form = document.createElement("form");
  form.className = "kroma-chat__composer";

  const label = document.createElement("label");
  label.className = "kroma-chat__sr-only";
  label.htmlFor = labels.id;
  label.textContent = labels.inputLabel;

  const input = document.createElement("textarea");
  input.className = "kroma-chat__input";
  input.id = labels.id;
  input.name = "message";
  input.rows = 1;
  input.maxLength = 2000;
  input.placeholder = labels.placeholder;

  const sendButton = document.createElement("button");
  sendButton.className = "kroma-chat__send";
  sendButton.type = "submit";
  sendButton.disabled = true;
  const sendLabel = document.createElement("span");
  sendLabel.className = "kroma-chat__sr-only";
  sendLabel.textContent = labels.sendLabel;
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("aria-hidden", "true");
  icon.setAttribute("focusable", "false");
  const outerPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  outerPath.setAttribute("d", "M4.5 12 20 4.5l-4.1 15-3.1-6.1L4.5 12Z");
  const innerPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  innerPath.setAttribute("d", "m12.8 13.4 4.7-4.7");
  icon.append(outerPath, innerPath);
  sendButton.append(sendLabel, icon);

  form.append(label, input, sendButton);
  const errorMessage = document.createElement("p");
  errorMessage.className = "kroma-chat__error";
  errorMessage.setAttribute("role", "alert");
  errorMessage.hidden = true;
  area.append(form, errorMessage);

  return { area, form, input, sendButton, errorMessage };
}
