export function createFeatureList(features: string[]) {
  const list = document.createElement("ul");
  list.className = "kroma-chat__product-features";
  features.forEach((feature) => {
    const item = document.createElement("li");
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("class", "kroma-chat__feature-icon");
    icon.setAttribute("viewBox", "0 0 16 16");
    icon.setAttribute("aria-hidden", "true");
    icon.setAttribute("fill", "none");
    icon.setAttribute("stroke", "currentColor");
    icon.setAttribute("stroke-width", "1.8");
    icon.setAttribute("stroke-linecap", "round");
    icon.setAttribute("stroke-linejoin", "round");
    const check = document.createElementNS("http://www.w3.org/2000/svg", "path");
    check.setAttribute("d", "m3 8.5 3.1 3.1L13 4.8");
    icon.append(check);
    const text = document.createElement("span");
    text.textContent = feature;
    item.append(icon, text);
    list.append(item);
  });
  return list;
}
