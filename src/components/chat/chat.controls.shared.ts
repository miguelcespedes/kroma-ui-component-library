import type {
  ChatActionData,
  ChatActionDetail,
  ChatImage,
  ChatMoney,
  ChatProductVariant,
  ChatQuantityChangeDetail,
} from "./chat.types";

export type ChatActionHandler = (detail: ChatActionDetail, userMessage?: string) => void;
export type ChatQuantityHandler = (detail: ChatQuantityChangeDetail) => void;

export function formatMoney(money?: ChatMoney) {
  if (!money) return "";
  if (money.label) return money.label;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: money.currency }).format(money.amount);
  } catch {
    return `${money.amount} ${money.currency}`;
  }
}

export function createChatMessageTime(message: { time?: string }) {
  const time = document.createElement("time");
  const date = new Date();
  time.className = "kroma-chat__time";
  time.textContent = message.time || new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date);
  time.dateTime = date.toISOString();
  return time;
}

export function createChatBubble(message: { text: string; time?: string }, messageId: string) {
  const bubble = document.createElement("div");
  bubble.className = "kroma-chat__bubble";
  const text = document.createElement("span");
  text.id = `${messageId}-content`;
  text.className = "kroma-chat__text";
  text.textContent = message.text;
  bubble.append(text, createChatMessageTime(message));
  return bubble;
}

export function createControlAction(
  messageId: string,
  control: ChatActionDetail["control"],
  actionId: string,
  label: string,
  value: string | undefined,
  data: ChatActionData | undefined,
  onAction: ChatActionHandler,
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

export function createIconLabel(icon: string | undefined, label: string, className: string) {
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

export function createProductImage(image?: ChatImage, className = "kroma-chat__product-image") {
  if (!image) return null;
  try {
    const url = new URL(image.src, document.baseURI);
    if (!(["http:", "https:"].includes(url.protocol))) return null;
    const element = document.createElement("img");
    element.className = className;
    element.src = url.href;
    element.alt = image.alt;
    element.loading = "lazy";
    element.decoding = "async";
    return element;
  } catch {
    return null;
  }
}

export function createVariantSelector(
  messageId: string,
  controlId: string,
  labelText: string,
  variants: ChatProductVariant[],
  selectedId: string | undefined,
  productId: string | undefined,
  onAction: ChatActionHandler,
) {
  const fieldset = document.createElement("fieldset");
  fieldset.className = "kroma-chat__variant-selector";
  fieldset.dataset.controlId = controlId;
  const legend = document.createElement("legend");
  legend.textContent = labelText;
  const list = document.createElement("div");
  list.className = "kroma-chat__variant-list";
  fieldset.append(legend, list);

  variants.forEach((variant, index) => {
    const inputId = `${controlId}-${index + 1}`;
    const label = document.createElement("label");
    label.className = "kroma-chat__variant";
    label.htmlFor = inputId;
    const input = document.createElement("input");
    input.type = "radio";
    input.name = controlId;
    input.id = inputId;
    input.value = variant.value;
    input.dataset.variantId = variant.id;
    input.checked = variant.id === selectedId;
    input.disabled = Boolean(variant.disabled);
    input.addEventListener("change", () => {
      if (input.checked) onAction({
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
    label.append(input, text);
    list.append(label);
  });
  return fieldset;
}

export function createQuantitySelector(
  messageId: string,
  controlId: string,
  labelText: string,
  value: number,
  minimum: number,
  maximum: number,
  decreaseLabel: string,
  increaseLabel: string,
  productId: string | undefined,
  onQuantityChange: ChatQuantityHandler,
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
  const plus = document.createElement("button");
  plus.type = "button";
  plus.className = "kroma-chat__quantity-button";
  plus.setAttribute("aria-label", increaseLabel);
  plus.textContent = "+";

  const minimumValue = Number.isFinite(minimum) ? Math.max(0, Math.floor(minimum)) : 0;
  const maximumValue = Number.isFinite(maximum) ? Math.max(minimumValue, Math.floor(maximum)) : minimumValue;
  let quantity = Number.isFinite(value) ? Math.min(maximumValue, Math.max(minimumValue, Math.floor(value))) : minimumValue;
  const update = (next: number) => {
    const bounded = Math.min(maximumValue, Math.max(minimumValue, next));
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
