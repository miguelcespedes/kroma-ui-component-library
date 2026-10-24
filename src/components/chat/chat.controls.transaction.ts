import type {
  CartSummaryMessage,
  ChatAction,
  ChatCartItem,
  ChatFormSubmitDetail,
  ChatPriceSummary,
  ChatCustomerDetails,
  ChatFormField,
  ChatMessageAuthor,
  ConfirmationMessage,
  ConversationalFormMessage,
  OrderReviewMessage,
} from "./chat.types";
import {
  createControlAction,
  formatMoney,
  type ChatActionHandler,
} from "./chat.controls.shared";

type FormHandler = (detail: ChatFormSubmitDetail) => void;

function createPriceSummary(summary: ChatPriceSummary) {
  const section = document.createElement("section");
  section.className = "kroma-chat__price-summary";
  summary.entries.forEach((entry) => {
    const row = document.createElement("div");
    row.className = "kroma-chat__cart-subtotal";
    row.dataset.priceId = entry.id;
    const label = document.createElement("span");
    label.textContent = entry.label;
    const amount = document.createElement("strong");
    amount.textContent = entry.amountLabel || formatMoney(entry.amount);
    if (entry.emphasis === "strong") row.classList.add("kroma-chat__price-entry--strong");
    row.append(label, amount);
    section.append(row);
  });
  return section;
}

export function createCartLineItem(messageId: string, line: ChatCartItem, removeLabel: string, onAction: ChatActionHandler) {
  const row = document.createElement("article");
  row.className = "kroma-chat__cart-item";
  row.setAttribute("role", "listitem");
  row.dataset.lineId = line.id;
  const product = document.createElement("div");
  product.className = "kroma-chat__cart-product";
  const name = document.createElement("strong");
  name.className = "kroma-chat__cart-name";
  name.textContent = line.product.name;
  const meta = document.createElement("p");
  meta.className = "kroma-chat__cart-meta";
  const price = line.unitPriceLabel || formatMoney(line.unitPrice);
  meta.textContent = [line.variantLabel, `${line.quantity} × ${price}`].filter(Boolean).join(" · ");
  product.append(name, meta);

  const trailing = document.createElement("div");
  trailing.className = "kroma-chat__cart-trailing";
  const totalLabel = line.lineTotalLabel || formatMoney(line.lineTotal);
  if (totalLabel) {
    const total = document.createElement("strong");
    total.className = "kroma-chat__cart-total";
    total.textContent = totalLabel;
    trailing.append(total);
  }
  const actions = line.actions?.length ? line.actions : [{ id: "remove-item", label: removeLabel, value: line.id } satisfies ChatAction];
  actions.forEach((action) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "kroma-chat__cart-remove";
    button.dataset.actionId = action.id || "line-action";
    button.dataset.lineId = line.id;
    button.textContent = action.label;
    button.addEventListener("click", () => onAction({
      messageId,
      control: "cart-summary",
      actionId: action.id || "line-action",
      label: action.label,
      value: action.value ?? line.id,
      data: { lineId: line.id, productId: line.product.id },
    }, action.messageText || `${action.label} ${line.product.name}`));
    trailing.append(button);
  });
  row.append(product, trailing);
  return row;
}

export function createCartSummary(messageId: string, message: CartSummaryMessage, onAction: ChatActionHandler) {
  const summary = document.createElement("section");
  summary.className = "kroma-chat__cart-summary";
  if (!message.items.length) {
    const empty = document.createElement("p");
    empty.className = "kroma-chat__cart-empty";
    empty.textContent = message.emptyLabel || "Your selection is empty.";
    summary.append(empty);
    return summary;
  }
  const list = document.createElement("div");
  list.className = "kroma-chat__cart-items";
  list.setAttribute("role", "list");
  message.items.forEach((line) => list.append(createCartLineItem(messageId, line, message.removeItemLabel || "Remove", onAction)));
  summary.append(list);
  if (message.priceSummary) summary.append(createPriceSummary(message.priceSummary));
  else if (message.subtotalLabel || message.subtotal) {
    summary.append(createPriceSummary({ entries: [{ id: "subtotal", label: message.subtotalTitle || "Subtotal", amount: message.subtotal, amountLabel: message.subtotalLabel, emphasis: "strong" }] }));
  }
  if (message.continueLabel) {
    summary.append(createControlAction(messageId, "cart-summary", "continue", message.continueLabel, "continue", undefined, onAction, message.continueLabel));
  }
  return summary;
}

function createFormField(messageId: string, field: ChatFormField) {
  const inputId = `${messageId}-field-${field.id}`;
  const group = document.createElement("div");
  group.className = "kroma-chat__form-field";
  const label = document.createElement("label");
  label.htmlFor = inputId;
  label.textContent = field.label;
  const input = document.createElement("input");
  input.id = inputId;
  input.name = field.name;
  input.type = field.type;
  input.required = Boolean(field.required);
  input.disabled = Boolean(field.disabled);
  input.value = field.value || "";
  input.placeholder = field.placeholder || "";
  if (field.autocomplete) input.setAttribute("autocomplete", field.autocomplete);
  if (field.min !== undefined) input.min = String(field.min);
  if (field.max !== undefined) input.max = String(field.max);
  if (field.pattern) input.pattern = field.pattern;
  input.className = "kroma-chat__form-input";
  if (field.errorMessage) {
    input.setCustomValidity(field.errorMessage);
    input.addEventListener("input", () => input.setCustomValidity(""));
  }
  group.append(label, input);
  return input;
}

export function createConversationalForm(messageId: string, message: ConversationalFormMessage, onSubmit: FormHandler) {
  const wrapper = document.createElement("section");
  wrapper.className = "kroma-chat__conversational-form";
  if (message.title) {
    const title = document.createElement("h3");
    title.className = "kroma-chat__form-title";
    title.textContent = message.title;
    wrapper.append(title);
  }
  const form = document.createElement("form");
  form.className = "kroma-chat__form-fields";
  const controls = new Map<string, HTMLInputElement>();
  message.fields.forEach((field) => {
    const input = createFormField(messageId, field);
    controls.set(field.name, input);
    form.append(input.closest(".kroma-chat__form-field")!);
  });
  const submit = document.createElement("button");
  submit.type = "submit";
  submit.className = "kroma-chat__journey-action kroma-chat__form-submit";
  submit.textContent = message.submitLabel;
  form.append(submit);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const values: Record<string, string> = {};
    controls.forEach((input, name) => { values[name] = input.value.trim(); });
    onSubmit({ messageId, values });
  });
  wrapper.append(form);
  return wrapper;
}

function renderCustomerDetails(customer: ChatCustomerDetails, labels: OrderReviewMessage["customerLabels"]) {
  const details = document.createElement("dl");
  details.className = "kroma-chat__customer-details";
  Object.entries(customer).forEach(([key, text]) => {
    const row = document.createElement("div");
    row.className = "kroma-chat__customer-row";
    const term = document.createElement("dt");
    term.textContent = labels?.[key] || key;
    const value = document.createElement("dd");
    value.textContent = text;
    row.append(term, value);
    details.append(row);
  });
  return details;
}

export function createOrderReview(messageId: string, message: OrderReviewMessage, onAction: ChatActionHandler) {
  const review = document.createElement("section");
  review.className = "kroma-chat__order-review";
  review.append(renderCustomerDetails(message.customer, message.customerLabels));
  review.append(createCartSummary(messageId, {
    author: message.author,
    type: "cart-summary",
    text: message.text,
    items: message.items,
    subtotal: message.subtotal,
    subtotalTitle: message.subtotalTitle,
    subtotalLabel: message.subtotalLabel,
    priceSummary: message.priceSummary,
    removeItemLabel: message.removeItemLabel,
  }, onAction));
  const actions = document.createElement("div");
  actions.className = "kroma-chat__review-actions";
  actions.append(createControlAction(messageId, "order-review", "confirm", message.confirmLabel, "confirm", undefined, onAction, message.confirmLabel));
  if (message.editLabel) actions.append(createControlAction(messageId, "order-review", "edit", message.editLabel, "edit", undefined, onAction, message.editLabel));
  review.append(actions);
  return review;
}

export function createConfirmationCard(messageId: string, message: ConfirmationMessage, onAction: ChatActionHandler) {
  const card = document.createElement("section");
  card.className = "kroma-chat__confirmation";
  card.dataset.status = message.status || "neutral";
  const title = document.createElement("h3");
  title.className = "kroma-chat__confirmation-title";
  title.textContent = message.title;
  const description = document.createElement("p");
  description.className = "kroma-chat__confirmation-description";
  description.textContent = message.description;
  card.append(title, description);
  if (message.reference) {
    const reference = document.createElement("p");
    reference.className = "kroma-chat__confirmation-reference";
    reference.textContent = message.reference;
    card.append(reference);
  }
  if (message.summary?.length) {
    const summary = document.createElement("ul");
    summary.className = "kroma-chat__confirmation-summary";
    message.summary.forEach((text) => {
      const item = document.createElement("li");
      item.textContent = text;
      summary.append(item);
    });
    card.append(summary);
  }
  if (message.action) {
    card.append(createControlAction(messageId, "confirmation", message.action.id || `${messageId}-action`, message.action.label, message.action.value, undefined, onAction, message.action.messageText || message.action.label));
  }
  return card;
}
