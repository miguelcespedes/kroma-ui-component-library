const iconPaths: Record<string, string> = {
  browse: "M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z",
  search: "M10.8 4.5a6.3 6.3 0 1 0 0 12.6 6.3 6.3 0 0 0 0-12.6z M15.4 15.4 20 20",
  orders: "M7 3.5h8l3 3V20H7z M15 3.5V7h3 M10 11h5 M10 14h5 M10 17h3",
  advisor: "M4 5.5h16v11H11l-4.5 3v-3H4z M8 10h.01 M12 10h.01 M16 10h.01",
  all: "M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z",
  clothing: "M8 4 5 6 2.5 9l3 3L8 9.5V20h8V9.5l2.5 2.5 3-3L19 6l-3-2a4 4 0 0 1-8 0z",
  accessories: "M5 8h14l-1 12H6L5 8z M9 8V6a3 3 0 0 1 6 0v2",
};

export function createIconLabel(icon: string | undefined, label: string, className: string) {
  const wrapper = document.createElement("span");
  wrapper.className = className;
  if (icon) {
    const iconElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    iconElement.setAttribute("class", `${className}-icon`);
    iconElement.setAttribute("aria-hidden", "true");
    iconElement.setAttribute("viewBox", "0 0 24 24");
    iconElement.setAttribute("fill", "none");
    iconElement.setAttribute("stroke", "currentColor");
    iconElement.setAttribute("stroke-width", "1.7");
    iconElement.setAttribute("stroke-linecap", "round");
    iconElement.setAttribute("stroke-linejoin", "round");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", iconPaths[icon] || "M12 4v16 M4 12h16");
    iconElement.append(path);
    wrapper.append(iconElement);
  }
  const text = document.createElement("span");
  text.textContent = label;
  wrapper.append(text);
  return wrapper;
}
