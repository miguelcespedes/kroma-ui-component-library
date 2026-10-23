export type ChatMessage = {
  id: string;
  author: "assistant" | "user";
  text: string;
  time: string;
};

export type ChatOptions = {
  title?: string;
  subtitle?: string;
  greeting?: string;
  suggestions?: string[];
  onSend?: (message: string) => void;
};

const defaultSuggestions = ["What can you help me with?", "Show me an example", "Talk to a person"];

function formatTime(date = new Date()) {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date);
}

function appendMessage(list: HTMLElement, author: ChatMessage["author"], text: string, time = formatTime()) {
  const item = document.createElement("li");
  item.className = `kroma-chat__message kroma-chat__message--${author}`;
  const bubble = document.createElement("div");
  bubble.className = "kroma-chat__bubble";
  bubble.textContent = text;
  const meta = document.createElement("div");
  meta.className = "kroma-chat__meta";
  meta.textContent = `${author === "assistant" ? "Kora" : "You"} · ${time}`;
  item.append(bubble, meta);
  list.append(item);
  list.scrollTop = list.scrollHeight;
}

function simulatedReply(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("person")) return "I can’t connect you to a person in this demo, but that’s a useful option to explore.";
  if (normalized.includes("example")) return "For example, I can help answer questions, explain a topic, or guide you through a task.";
  if (normalized.includes("help")) return "I can answer questions, share examples, and help you find your next step.";
  return `Thanks for sharing that. This is a simulated reply to “${message}”.`;
}

/** Mounts a small, front-end-only chat demo into the provided element. */
export function initializeChat(container: HTMLElement, options: ChatOptions = {}) {
  const title = options.title || "Chat with Kora";
  const subtitle = options.subtitle || "Here to help · Usually replies instantly";
  const suggestions = options.suggestions || defaultSuggestions;

  container.classList.add("kroma-chat");
  container.innerHTML = `
    <header class="kroma-chat__header">
      <div class="kroma-chat__avatar" aria-hidden="true">K</div>
      <div class="kroma-chat__heading"><h2 class="kroma-chat__title"></h2><p class="kroma-chat__subtitle"></p></div>
      <span class="kroma-chat__presence"><span aria-hidden="true"></span>Online</span>
    </header>
    <ol class="kroma-chat__messages" aria-label="Conversation" aria-live="polite" aria-relevant="additions"></ol>
    <div class="kroma-chat__suggestions" aria-label="Suggested messages"></div>
    <form class="kroma-chat__composer">
      <label class="kroma-chat__sr-only" for="kroma-chat-input">Write a message</label>
      <textarea class="kroma-chat__input" id="kroma-chat-input" name="message" rows="1" maxlength="500" placeholder="Write a message…"></textarea>
      <button class="kroma-chat__send" type="submit" aria-label="Send message"><span aria-hidden="true">↑</span></button>
    </form>
    <p class="kroma-chat__footnote">A friendly demo · Replies are simulated</p>`;

  const heading = container.querySelector<HTMLElement>(".kroma-chat__title")!;
  const subheading = container.querySelector<HTMLElement>(".kroma-chat__subtitle")!;
  const messages = container.querySelector<HTMLElement>(".kroma-chat__messages")!;
  const suggestionGroup = container.querySelector<HTMLElement>(".kroma-chat__suggestions")!;
  const form = container.querySelector<HTMLFormElement>(".kroma-chat__composer")!;
  const input = container.querySelector<HTMLTextAreaElement>(".kroma-chat__input")!;
  const send = container.querySelector<HTMLButtonElement>(".kroma-chat__send")!;

  heading.textContent = title;
  subheading.textContent = subtitle;
  appendMessage(messages, "assistant", options.greeting || "Hi there! 👋 I’m Kora. What would you like to explore today?");

  const setBusy = (busy: boolean) => {
    send.disabled = busy;
    input.disabled = busy;
    container.setAttribute("aria-busy", String(busy));
  };

  const sendMessage = (value: string) => {
    const text = value.trim();
    if (!text || send.disabled) return;
    appendMessage(messages, "user", text);
    input.value = "";
    input.style.height = "auto";
    suggestionGroup.hidden = true;
    setBusy(true);
    options.onSend?.(text);
    window.setTimeout(() => {
      appendMessage(messages, "assistant", simulatedReply(text));
      setBusy(false);
      input.focus();
    }, 650);
  };

  suggestions.forEach((suggestion) => {
    const button = document.createElement("button");
    button.className = "kroma-chat__suggestion";
    button.type = "button";
    button.textContent = suggestion;
    button.addEventListener("click", () => sendMessage(suggestion));
    suggestionGroup.append(button);
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
    sendMessage(input.value);
  });

  return {
    addMessage(message: ChatMessage) {
      appendMessage(messages, message.author, message.text, message.time);
    },
    destroy() {
      container.replaceChildren();
      container.classList.remove("kroma-chat");
      container.removeAttribute("aria-busy");
    },
  };
}
