import type { ChatProduct } from "../core/chat.types";
import { createControlAction, type ChatActionHandler } from "../shared/actions";
import { formatMoney } from "../shared/formatting";
import { createProductImage } from "../shared/images";

export type ProductListItemAction = "product-card" | "product-list" | "product-carousel";

export function createProductListItem(messageId: string, product: ChatProduct, control: ProductListItemAction, actionLabel: string, onAction: ChatActionHandler) {
  const button = createControlAction(messageId, control, `product-${product.id}`, actionLabel, product.id, { productId: product.id }, onAction, product.name);
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
  const priceLabel = product.priceLabel || formatMoney(product.price);
  if (priceLabel) {
    const price = document.createElement("span");
    price.className = "kroma-chat__product-price";
    price.textContent = priceLabel;
    content.append(price);
  }
  button.append(content);
  return button;
}
