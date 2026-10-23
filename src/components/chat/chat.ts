export type ChatMessageAuthor = "assistant" | "user";

export type ChatMessage = {
  author: ChatMessageAuthor;
  text: string;
  time?: string;
};

export type ChatSendDetail = {
  message: string;
};

const tagName = "kroma-chat";
const defaultSuggestions = ["What can you help me with?", "Show me an example", "Talk to a person"];
let nextInputId = 0;

function formatTime(date = new Date()) {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date);
}

function appendMessage(list: HTMLElement, message: ChatMessage) {
  const item = document.createElement("li");
  item.className = `kroma-chat__message kroma-chat__message--${message.author}`;

  const bubble = document.createElement("div");
  bubble.className = "kroma-chat__bubble";
  bubble.textContent = message.text;

  const meta = document.createElement("div");
  meta.className = "kroma-chat__meta";
  meta.textContent = `${message.author === "assistant" ? "Kora" : "You"} · ${message.time || formatTime()}`;

  item.append(bubble, meta);
  list.append(item);
  list.scrollTop = list.scrollHeight;
}

/** A presentation-only chat element. It emits kroma-chat-send and accepts messages through addMessage(). */
export class KromaChatElement extends HTMLElement {
  private initialized = false;
  private messageList: HTMLOListElement | null = null;

  connectedCallback() {
    if (this.initialized) return;
    this.initialized = true;
    this.classList.add("kroma-chat");

    const inputId = `kroma-chat-input-${++nextInputId}`;
    this.innerHTML = `
      <header class="kroma-chat__header">
        <div class="kroma-chat__avatar" aria-hidden="true">K</div>
        <div class="kroma-chat__heading"><h2 class="kroma-chat__title"></h2><p class="kroma-chat__subtitle"></p></div>
        <span class="kroma-chat__presence"><span aria-hidden="true"></span>Online</span>
      </header>
      <ol class="kroma-chat__messages" aria-label="Conversation" aria-live="polite" aria-relevant="additions"></ol>
      <div class="kroma-chat__suggestions" aria-label="Suggested messages"></div>
      <form class="kroma-chat__composer">
        <label class="kroma-chat__sr-only" for="${inputId}">Write a message</label>
        <textarea class="kroma-chat__input" id="${inputId}" name="message" rows="1" maxlength="500" placeholder="Write a message…"></textarea>
        <button class="kroma-chat__send" type="submit" aria-label="Send message"><span aria-hidden="true">↑</span></button>
      </form>
      <p class="kroma-chat__footnote">A friendly demo · Replies are provided by the host</p>`;

    const title = this.querySelector<HTMLElement>(".kroma-chat__title")!;
    const subtitle = this.querySelector<HTMLElement>(".kroma-chat__subtitle")!;
    this.messageList = this.querySelector<HTMLOListElement>(".kroma-chat__messages")!;
    const suggestions = this.querySelector<HTMLElement>(".kroma-chat__suggestions")!;
    const form = this.querySelector<HTMLFormElement>(".kroma-chat__composer")!;
    const input = this.querySelector<HTMLTextAreaElement>(".kroma-chat__input")!;

    title.textContent = this.getAttribute("chat-title") || "Chat with Kora";
    subtitle.textContent = this.getAttribute("subtitle") || "Here to help · Usually replies instantly";

    const greeting = this.getAttribute("greeting");
    if (greeting) this.addMessage({ author: "assistant", text: greeting });

    defaultSuggestions.forEach((suggestion) => {
      const button = document.createElement("button");
      button.className = "kroma-chat__suggestion";
      button.type = "button";
      button.textContent = suggestion;
      button.addEventListener("click", () => this.sendMessage(suggestion, input, suggestions));
      suggestions.append(button);
    });

    input.addEventListener("input", () => {
      input.style.height = "auto";
      input.style.height = `${Math.min(input.scrollHeight, 112)}px`;
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        form.requestSubmit();
      }
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      this.sendMessage(input.value, input, suggestions);
    });
  }

  addMessage(message: ChatMessage) {
    if (!this.messageList) return;
    appendMessage(this.messageList, message);
  }

  private sendMessage(value: string, input: HTMLTextAreaElement, suggestions: HTMLElement) {
    const message = value.trim();
    if (!message) return;

    this.addMessage({ author: "user", text: message });
    input.value = "";
    input.style.height = "auto";
    suggestions.hidden = true;

    this.dispatchEvent(new CustomEvent<ChatSendDetail>("kroma-chat-send", {
      bubbles: true,
      composed: true,
      detail: { message },
    }));
  }
}

if (!customElements.get(tagName)) customElements.define(tagName, KromaChatElement);
