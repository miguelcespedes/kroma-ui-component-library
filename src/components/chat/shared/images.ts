import type { ChatImage } from "../core/chat.types";

export function createProductImage(image?: ChatImage, className = "kroma-chat__product-image") {
  if (!image) return null;
  try {
    const url = new URL(image.src, document.baseURI);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
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
