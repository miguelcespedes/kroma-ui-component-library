import type { ProductListMessage } from "../core/chat.types";
import type { ChatActionHandler } from "../shared/actions";
import { createProductListItem } from "./product-list-item";

export function createProductList(messageId: string, message: ProductListMessage, onAction: ChatActionHandler) {
  const list = document.createElement("section");
  list.className = "kroma-chat__product-list";
  list.setAttribute("aria-label", message.text);
  message.products.forEach((product) => list.append(createProductListItem(messageId, product, "product-list", message.productActionLabel || "View product", onAction)));
  return list;
}
