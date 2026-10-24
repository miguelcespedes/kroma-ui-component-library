export function createIconLabel(icon: string | undefined, label: string, className: string) {
  const wrapper = document.createElement("span");
  wrapper.className = className;
  if (icon) {
    const iconElement = document.createElement("span");
    iconElement.className = `${className}-icon`;
    iconElement.setAttribute("aria-hidden", "true");
    iconElement.textContent = icon;
    wrapper.append(iconElement);
  }
  const text = document.createElement("span");
  text.textContent = label;
  wrapper.append(text);
  return wrapper;
}
