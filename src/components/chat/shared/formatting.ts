import type { ChatMoney } from "../core/chat.types";

export function formatMoney(money?: ChatMoney) {
  if (!money) return "";
  if (money.label) return money.label;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: money.currency }).format(money.amount);
  } catch {
    return `${money.amount} ${money.currency}`;
  }
}

export function formatMessageTime(value?: string) {
  const date = new Date();
  return {
    text: value || new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date),
    dateTime: date.toISOString(),
  };
}
