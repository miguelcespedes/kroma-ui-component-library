import type { ProductCardMessage } from "../core/chat.types";
import type { ChatActionHandler } from "../shared/actions";
import { createProductListItem } from "./product-list-item";

export function createProductCard(messageId: string, message: ProductCardMessage, onAction: ChatActionHandler) {
  const card = document.createElement("div");
  card.className = "kroma-chat__product-card-message";
  card.append(createProductListItem(messageId, message.product, "product-card", message.actionLabel || "View product", onAction));
  return card;
}
