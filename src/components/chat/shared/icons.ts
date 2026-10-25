const iconPaths: Record<string, string> = {
  browse: "M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z",
  search: "M10.8 4.5a6.3 6.3 0 1 0 0 12.6 6.3 6.3 0 0 0 0-12.6z M15.4 15.4 20 20",
  orders: "M7 3.5h8l3 3V20H7z M15 3.5V7h3 M10 11h5 M10 14h5 M10 17h3",
  advisor: "M4 5.5h16v11H11l-4.5 3v-3H4z M8 10h.01 M12 10h.01 M16 10h.01",
  all: "M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z",
  clothing: "M8 4 5 6 2.5 9l3 3L8 9.5V20h8V9.5l2.5 2.5 3-3L19 6l-3-2a4 4 0 0 1-8 0z",
  accessories: "M5 8h14l-1 12H6L5 8z M9 8V6a3 3 0 0 1 6 0v2",
  cart: "M3 4h2l2.2 10.5h10.4L20 7H6 M8 18.5h.01 M17 18.5h.01",
};

export function createIcon(icon: string, className?: string) {
  const iconElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  if (className) iconElement.setAttribute("class", className);
  iconElement.setAttribute("aria-hidden", "true");
  iconElement.setAttribute("focusable", "false");
  iconElement.setAttribute("viewBox", "0 0 24 24");
  iconElement.setAttribute("fill", "none");
  iconElement.setAttribute("stroke", "currentColor");
  iconElement.setAttribute("stroke-width", "1.75");
  iconElement.setAttribute("stroke-linecap", "round");
  iconElement.setAttribute("stroke-linejoin", "round");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", iconPaths[icon] || "M12 4v16 M4 12h16");
  iconElement.append(path);
  return iconElement;
}

export function createChevronIcon(direction: "previous" | "next") {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("fill", "none");
  icon.setAttribute("stroke", "currentColor");
  icon.setAttribute("stroke-width", "1.75");
  icon.setAttribute("stroke-linecap", "round");
  icon.setAttribute("stroke-linejoin", "round");
  icon.setAttribute("aria-hidden", "true");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", direction === "next" ? "m9 5 7 7-7 7" : "m15 5-7 7 7 7");
  icon.append(path);
  return icon;
}

export function createIconLabel(icon: string | undefined, label: string, className: string) {
  const wrapper = document.createElement("span");
  wrapper.className = className;
  if (icon) {
    wrapper.append(createIcon(icon, `${className}-icon`));
  }
  const text = document.createElement("span");
  text.className = `${className}-text`;
  text.textContent = label;
  wrapper.append(text);
  return wrapper;
}
