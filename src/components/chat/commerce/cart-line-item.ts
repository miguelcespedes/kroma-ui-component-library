import type { ChatAction, ChatCartItem } from "../core/chat.types";
import type { ChatActionHandler } from "../shared/actions";
import type { ChatActionDetail } from "../core/chat.events";
import { formatMoney } from "../shared/formatting";
import { createProductImage, createProductImagePlaceholder } from "../shared/images";

export function createCartLineItem(messageId: string, line: ChatCartItem, removeLabel: string, onAction: ChatActionHandler) {
  const row = document.createElement("article");
  row.className = "kroma-chat__cart-item";
  row.setAttribute("role", "listitem");
  row.dataset.lineId = line.id;
  const image = createProductImage(line.product.image, "kroma-chat__cart-image")
    || createProductImagePlaceholder(line.product.name, "kroma-chat__cart-image");
  const product = document.createElement("div");
  product.className = "kroma-chat__cart-product";
  const name = document.createElement("strong");
  name.className = "kroma-chat__cart-name";
  name.textContent = line.product.name;
  const meta = document.createElement("p");
  meta.className = "kroma-chat__cart-meta";
  const price = line.unitPriceLabel || formatMoney(line.unitPrice);
  meta.textContent = [line.variantLabel, `${line.quantity} × ${price}`].filter(Boolean).join(" · ");
  product.append(name, meta);

  const trailing = document.createElement("div");
  trailing.className = "kroma-chat__cart-trailing";
  const totalLabel = line.lineTotalLabel || formatMoney(line.lineTotal);
  if (totalLabel) {
    const total = document.createElement("strong");
    total.className = "kroma-chat__cart-total";
    total.textContent = totalLabel;
    trailing.append(total);
  }
  const actions: ChatAction[] = line.actions?.length ? line.actions : [{ id: "remove-item", label: removeLabel, value: line.id }];
  actions.forEach((action) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "kroma-chat__cart-remove";
    button.dataset.actionId = action.id || "line-action";
    button.dataset.lineId = line.id;
    button.textContent = action.label;
    button.addEventListener("click", () => {
      const detail: ChatActionDetail = {
        messageId,
        control: "cart-summary",
        actionId: action.id || "line-action",
        label: action.label,
        value: action.value ?? line.id,
        data: { lineId: line.id, productId: line.product.id },
      };
      onAction(detail, action.messageText || `${action.label} ${line.product.name}`);
    });
    trailing.append(button);
  });
  row.append(image, product, trailing);
  return row;
}
