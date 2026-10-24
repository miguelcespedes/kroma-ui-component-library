import type {
  ChatProduct,
  ProductCardMessage,
  ProductCarouselMessage,
  ProductDetailMessage,
  ProductListMessage,
  ProductVariantSelectorMessage,
  QuantitySelectorMessage,
} from "./chat.types";
import {
  createControlAction,
  createProductImage,
  createQuantitySelector,
  createVariantSelector,
  formatMoney,
  type ChatActionHandler,
  type ChatQuantityHandler,
} from "./chat.controls.shared";

function createProductListItem(messageId: string, product: ChatProduct, control: "product-card" | "product-list" | "product-carousel", actionLabel: string, onAction: ChatActionHandler) {
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

export function createProductCard(messageId: string, message: ProductCardMessage, onAction: ChatActionHandler) {
  const card = document.createElement("div");
  card.className = "kroma-chat__product-card-message";
  card.append(createProductListItem(messageId, message.product, "product-card", message.actionLabel || "View product", onAction));
  return card;
}

export function createProductList(messageId: string, message: ProductListMessage, onAction: ChatActionHandler) {
  const list = document.createElement("section");
  list.className = "kroma-chat__product-list";
  list.setAttribute("aria-label", message.text);
  message.products.forEach((product) => list.append(createProductListItem(messageId, product, "product-list", message.productActionLabel || "View product", onAction)));
  return list;
}

export function createProductCarousel(messageId: string, message: ProductCarouselMessage, onAction: ChatActionHandler) {
  const carousel = document.createElement("div");
  carousel.className = "kroma-chat__product-carousel";
  carousel.setAttribute("role", "region");
  carousel.setAttribute("aria-label", message.text);
  const controls = document.createElement("div");
  controls.className = "kroma-chat__carousel-controls";
  const trackId = `${messageId}-products`;
  const track = document.createElement("div");
  track.id = trackId;
  track.className = "kroma-chat__product-track";
  track.tabIndex = 0;
  track.setAttribute("aria-label", message.text);
  message.products.forEach((product) => track.append(createProductListItem(messageId, product, "product-carousel", message.productActionLabel || "View product", onAction)));

  const createArrow = (direction: -1 | 1, label: string) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "kroma-chat__carousel-arrow";
    button.setAttribute("aria-label", label);
    button.setAttribute("aria-controls", trackId);
    button.textContent = direction < 0 ? "‹" : "›";
    button.addEventListener("click", () => {
      const card = track.querySelector<HTMLElement>(".kroma-chat__product-card");
      const behavior: ScrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
      track.scrollBy({ left: direction * (card?.offsetWidth || track.clientWidth), behavior });
    });
    return button;
  };
  const previous = createArrow(-1, message.previousLabel || "Previous products");
  const next = createArrow(1, message.nextLabel || "Next products");
  const updateArrows = () => {
    previous.disabled = track.scrollLeft <= 1;
    next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
  };
  previous.addEventListener("click", () => requestAnimationFrame(updateArrows));
  next.addEventListener("click", () => requestAnimationFrame(updateArrows));
  track.addEventListener("scroll", updateArrows, { passive: true });
  controls.append(previous, next);
  carousel.append(controls, track);
  requestAnimationFrame(updateArrows);
  return carousel;
}

function createFeatureList(features: string[]) {
  const list = document.createElement("ul");
  list.className = "kroma-chat__product-features";
  features.forEach((feature) => {
    const item = document.createElement("li");
    item.textContent = feature;
    list.append(item);
  });
  return list;
}

export function createProductDetail(
  messageId: string,
  message: ProductDetailMessage,
  onAction: ChatActionHandler,
  onQuantityChange: ChatQuantityHandler,
) {
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

export function createProductVariantSelector(messageId: string, message: ProductVariantSelectorMessage, onAction: ChatActionHandler) {
  const selector = createVariantSelector(messageId, message.controlId, message.label, message.variants, message.selectedVariantId, message.productId, onAction);
  selector.classList.add("kroma-chat__standalone-variant-selector");
  return selector;
}

export function createStandaloneQuantitySelector(messageId: string, message: QuantitySelectorMessage, onQuantityChange: ChatQuantityHandler) {
  return createQuantitySelector(messageId, message.controlId, message.label, message.value, message.minimum ?? 0, message.maximum ?? 99, message.decreaseLabel || "Decrease quantity", message.increaseLabel || "Increase quantity", message.productId, onQuantityChange);
}
