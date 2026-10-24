import type { ChatActionHandler } from "../shared/actions";
import type { ChatProductVariant, ProductVariantSelectorMessage } from "../core/chat.types";

export function createVariantSelector(
  messageId: string,
  controlId: string,
  labelText: string,
  variants: ChatProductVariant[],
  selectedId: string | undefined,
  productId: string | undefined,
  onAction: ChatActionHandler,
) {
  const fieldset = document.createElement("fieldset");
  fieldset.className = "kroma-chat__variant-selector";
  fieldset.dataset.controlId = controlId;
  const legend = document.createElement("legend");
  legend.textContent = labelText;
  const list = document.createElement("div");
  list.className = "kroma-chat__variant-list";
  fieldset.append(legend, list);
  variants.forEach((variant, index) => {
    const inputId = `${controlId}-${index + 1}`;
    const label = document.createElement("label");
    label.className = "kroma-chat__variant";
    label.htmlFor = inputId;
    const input = document.createElement("input");
    input.type = "radio";
    input.name = controlId;
    input.id = inputId;
    input.value = variant.value;
    input.dataset.variantId = variant.id;
    input.checked = variant.id === selectedId;
    input.disabled = Boolean(variant.disabled);
    input.addEventListener("change", () => {
      if (!input.checked) return;
      onAction({
        messageId,
        control: "product-variant-selector",
        actionId: "select-variant",
        label: variant.label,
        value: variant.value,
        data: { productId, variantId: variant.id },
      });
    });
    const text = document.createElement("span");
    text.textContent = variant.label;
    label.append(input, text);
    list.append(label);
  });
  return fieldset;
}

export function createProductVariantSelector(messageId: string, message: ProductVariantSelectorMessage, onAction: ChatActionHandler) {
  const selector = createVariantSelector(messageId, message.controlId, message.label, message.variants, message.selectedVariantId, message.productId, onAction);
  selector.classList.add("kroma-chat__standalone-variant-selector");
  return selector;
}
