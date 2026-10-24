import type { ChatPriceSummary } from "../core/chat.types";
import { formatMoney } from "../shared/formatting";

export function createPriceSummary(summary: ChatPriceSummary) {
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
