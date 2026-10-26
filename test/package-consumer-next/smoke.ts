import "@kroma/ui-component-library/chat/styles.css";
import { KromaChat } from "@kroma/ui-component-library/chat";
import type { ChatMessage } from "@kroma/ui-component-library/chat";

const host = document.querySelector<HTMLDivElement>("#chat-host")!;
const output = document.querySelector<HTMLOutputElement>("#chat-event-output")!;
if (customElements.get("kroma-chat") !== KromaChat) throw new Error("The public KromaChat import did not register its custom element.");
const chat = document.createElement("kroma-chat") as KromaChat;
chat.className = "kroma-chat--fullscreen";
chat.addEventListener("kroma-chat-option-select", (event) => {
  output.value = `option:${(event as CustomEvent).detail.value}`;
});
chat.addEventListener("kroma-chat-quantity-change", (event) => {
  output.value = `quantity:${(event as CustomEvent).detail.quantity}`;
});
chat.addEventListener("kroma-chat-action", (event) => {
  output.value = `action:${(event as CustomEvent).detail.actionId}`;
});
host.append(chat);

const messages: ChatMessage[] = [
  { author: "assistant", type: "text", text: "Prueba de instalación como paquete." },
  { author: "assistant", type: "quick-replies", text: "Selecciona una opción.", replies: [{ id: "browse", label: "Ver productos", value: "browse" }] },
  {
    author: "assistant",
    type: "product-detail",
    product: { id: "gas-10kg", name: "Gas doméstico 10 kg", description: "Producto de prueba.", price: { amount: 55, currency: "PEN" } },
    quantity: 1,
    minimumQuantity: 1,
    maximumQuantity: 10,
    addActionLabel: "Agregar al pedido",
  },
];
messages.forEach((message) => chat.addMessage(message));
