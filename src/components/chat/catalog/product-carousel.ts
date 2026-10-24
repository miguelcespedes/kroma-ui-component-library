import type { ProductCarouselMessage } from "../core/chat.types";
import type { ChatActionHandler } from "../shared/actions";
import { createProductListItem } from "./product-list-item";

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
