import type {
  CartSummaryMessage,
  ChatCustomerDetails,
  ChatPriceSummary,
  OrderReviewMessage,
} from "../core/chat.types";
import type { ChatActionHandler } from "../shared/actions";
import { createControlAction } from "../shared/actions";
import { createCartLineItem } from "./cart-line-item";
import { createPriceSummary } from "./price-summary";

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

function resolvePriceSummary(message: Pick<CartSummaryMessage, "subtotal" | "subtotalTitle" | "subtotalLabel" | "priceSummary">): ChatPriceSummary | undefined {
  if (message.priceSummary) return message.priceSummary;
  if (!message.subtotalLabel && !message.subtotal) return undefined;
  return {
    entries: [{
      id: "subtotal",
      label: message.subtotalTitle || "Subtotal",
      amount: message.subtotal,
      amountLabel: message.subtotalLabel,
      emphasis: "strong",
    }],
  };
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
  const prices = resolvePriceSummary(message);
  if (prices) summary.append(createPriceSummary(prices));
  if (message.continueLabel) {
    summary.append(createControlAction(messageId, "cart-summary", "continue", message.continueLabel, "continue", undefined, onAction, message.continueLabel));
  }
  return summary;
}

/** Composite review view using the existing customer/cart data without deriving commercial amounts. */
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
