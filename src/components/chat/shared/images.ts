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

export function createProductImagePlaceholder(label: string, className = "kroma-chat__product-image") {
  const placeholder = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  placeholder.setAttribute("class", `${className} kroma-chat__product-image--placeholder`);
  placeholder.setAttribute("viewBox", "0 0 64 64");
  placeholder.setAttribute("role", "img");
  placeholder.setAttribute("aria-label", `Imagen no disponible: ${label}`);
  placeholder.setAttribute("fill", "none");
  placeholder.setAttribute("stroke", "currentColor");
  placeholder.setAttribute("stroke-width", "1.5");
  placeholder.setAttribute("stroke-linecap", "round");
  placeholder.setAttribute("stroke-linejoin", "round");
  const backdrop = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  backdrop.setAttribute("x", "1");
  backdrop.setAttribute("y", "1");
  backdrop.setAttribute("width", "62");
  backdrop.setAttribute("height", "62");
  backdrop.setAttribute("rx", "10");
  backdrop.setAttribute("fill", "currentColor");
  backdrop.setAttribute("fill-opacity", ".06");
  backdrop.setAttribute("stroke-opacity", ".18");
  const sun = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  sun.setAttribute("cx", "43");
  sun.setAttribute("cy", "21");
  sun.setAttribute("r", "4");
  sun.setAttribute("stroke-opacity", ".65");
  const landscape = document.createElementNS("http://www.w3.org/2000/svg", "path");
  landscape.setAttribute("d", "m9 48 13-14 9 9 7-7 17 17H9z");
  landscape.setAttribute("stroke-opacity", ".65");
  placeholder.append(backdrop, sun, landscape);
  return placeholder;
}
