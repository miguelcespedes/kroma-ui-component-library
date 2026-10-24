import type { ProductDetailMessage } from "../core/chat.types";
import { createControlAction, type ChatActionHandler } from "../shared/actions";
import { formatMoney } from "../shared/formatting";
import { createProductImage } from "../shared/images";
import { createFeatureList } from "./feature-list";
import { createQuantitySelector, type ChatQuantityHandler } from "./quantity-selector";
import { createVariantSelector } from "./product-variant-selector";

export function createProductDetail(messageId: string, message: ProductDetailMessage, onAction: ChatActionHandler, onQuantityChange: ChatQuantityHandler) {
  const detail = document.createElement("section");
  detail.className = "kroma-chat__product-detail";
  const image = createProductImage(message.product.image, "kroma-chat__product-detail-image");
  if (image) detail.append(image);
  const heading = document.createElement("h3");
  heading.className = "kroma-chat__product-detail-title";
  heading.textContent = message.product.name;
  detail.append(heading);
  if (message.product.description) {
    const description = document.createElement("p");
    description.className = "kroma-chat__product-detail-description";
    description.textContent = message.product.description;
    detail.append(description);
  }
  if (message.product.features?.length) detail.append(createFeatureList(message.product.features));
  const priceLabel = message.product.priceLabel || formatMoney(message.product.price);
  if (priceLabel) {
    const price = document.createElement("p");
    price.className = "kroma-chat__product-detail-price";
    price.textContent = priceLabel;
    detail.append(price);
  }

  let selectedVariantId = message.selectedVariantId;
  const variants = message.variants || message.product.variants || [];
  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.className = "kroma-chat__journey-action kroma-chat__product-add";
  addButton.dataset.actionId = "add-to-cart";
  addButton.textContent = message.addActionLabel || "Add to selection";
  addButton.disabled = Boolean(message.requiresVariant && !selectedVariantId);

  if (variants.length) {
    detail.append(createVariantSelector(messageId, `${messageId}-variants`, message.variantLabel || "Choose a variant", variants, selectedVariantId, message.product.id, (selection, userMessage) => {
      selectedVariantId = selection.data?.variantId;
      addButton.disabled = Boolean(message.requiresVariant && !selectedVariantId);
      onAction(selection, userMessage);
    }));
  }

  const showQuantity = message.quantity !== undefined || message.minimumQuantity !== undefined || message.maximumQuantity !== undefined;
  const quantity = showQuantity ? createQuantitySelector(
    messageId,
    `${messageId}-quantity`,
    message.quantityLabel || "Quantity",
    message.quantity ?? message.minimumQuantity ?? 1,
    message.minimumQuantity ?? 1,
    message.maximumQuantity ?? 20,
    message.decreaseQuantityLabel || "Decrease quantity",
    message.increaseQuantityLabel || "Increase quantity",
    message.product.id,
    onQuantityChange,
  ) : null;
  if (quantity) detail.append(quantity);
  addButton.addEventListener("click", () => onAction({
    messageId,
    control: "product-detail",
    actionId: "add-to-cart",
    label: addButton.textContent || "",
    value: message.product.id,
    data: {
      productId: message.product.id,
      quantity: quantity ? Number(quantity.dataset.quantityValue) || 1 : undefined,
      variantId: selectedVariantId,
    },
  }, message.actionMessage || addButton.textContent || message.product.name));
  if (message.backActionLabel) {
    detail.append(createControlAction(messageId, "product-detail", "back-to-products", message.backActionLabel, "back", { productId: message.product.id }, onAction, message.backActionLabel));
  }
  detail.append(addButton);
  return detail;
}
