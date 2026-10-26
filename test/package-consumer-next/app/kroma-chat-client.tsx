"use client";

import { useEffect, useRef } from "react";
import type { KromaChat } from "@kroma/ui-component-library/chat";

export default function KromaChatClient() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    let chat: KromaChat | null = null;
    const listeners = new AbortController();

    void import("@kroma/ui-component-library/chat").then(({ KromaChat: ChatElement }) => {
      const host = hostRef.current;
      if (!active || !host) return;

      chat = document.createElement("kroma-chat") as KromaChat;
      chat.className = "kroma-chat--fullscreen";
      chat.setAttribute("chat-title", "Asistente Kroma");
      chat.setAttribute("avatar", "K");
      chat.addEventListener("kroma-chat-option-select", (event) => {
        const detail = (event as CustomEvent).detail;
        const output = document.querySelector<HTMLOutputElement>("#chat-event-output");
        if (output) output.value = `Opción: ${detail.label}`;
      }, { signal: listeners.signal });
      chat.addEventListener("kroma-chat-quantity-change", (event) => {
        const detail = (event as CustomEvent).detail;
        const output = document.querySelector<HTMLOutputElement>("#chat-event-output");
        if (output) output.value = `Cantidad: ${detail.quantity}`;
      }, { signal: listeners.signal });
      chat.addEventListener("kroma-chat-action", (event) => {
        const detail = (event as CustomEvent).detail;
        const output = document.querySelector<HTMLOutputElement>("#chat-event-output");
        if (output) output.value = `Acción: ${detail.actionId}`;
      }, { signal: listeners.signal });
      host.replaceChildren(chat);
      chat.addMessage({ author: "assistant", type: "text", text: "¿Qué te gustaría hacer hoy?" });
      chat.addMessage({
        author: "assistant",
        type: "quick-replies",
        text: "Prueba el evento de selección.",
        replies: [{ id: "browse", label: "Ver productos", value: "browse" }],
      });
      chat.addMessage({
        author: "assistant",
        type: "product-detail",
        product: {
          id: "gas-10kg",
          name: "Gas doméstico 10 kg",
          description: "Producto de prueba para verificar detalle, cantidad y acciones.",
          price: { amount: 55, currency: "PEN" },
        },
        quantity: 1,
        minimumQuantity: 1,
        maximumQuantity: 10,
        addActionLabel: "Agregar al pedido",
      });
      void ChatElement;
    });

    return () => {
      active = false;
      listeners.abort();
      chat?.remove();
    };
  }, []);

  return (
    <>
      <output id="chat-event-output" aria-live="polite" />
      <div ref={hostRef} data-testid="kroma-chat-host" />
    </>
  );
}
