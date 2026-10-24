import type { ChatQuantityChangeDetail } from "../core/chat.events";
import type { QuantitySelectorMessage } from "../core/chat.types";

export type ChatQuantityHandler = (detail: ChatQuantityChangeDetail) => void;

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

export function createStandaloneQuantitySelector(messageId: string, message: QuantitySelectorMessage, onQuantityChange: ChatQuantityHandler) {
  return createQuantitySelector(messageId, message.controlId, message.label, message.value, message.minimum ?? 0, message.maximum ?? 99, message.decreaseLabel || "Decrease quantity", message.increaseLabel || "Increase quantity", message.productId, onQuantityChange);
}
