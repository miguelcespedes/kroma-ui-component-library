export type ChatComposerOptions = {
  id: string;
  inputLabel: string;
  placeholder: string;
  sendLabel: string;
  disabled?: boolean;
  onSend: (message: string) => void;
};

/** Owns composer markup and keyboard/input behavior; message delivery remains with the host. */
export class ChatComposer {
  readonly element: HTMLDivElement;
  readonly form: HTMLFormElement;
  readonly input: HTMLTextAreaElement;
  readonly sendButton: HTMLButtonElement;
  readonly errorMessage: HTMLParagraphElement;
  private readonly listeners = new AbortController();
  private disabled: boolean;

  constructor(options: ChatComposerOptions) {
    this.disabled = Boolean(options.disabled);
    this.element = document.createElement("div");
    this.element.className = "kroma-chat__composer-area";

    this.form = document.createElement("form");
    this.form.className = "kroma-chat__composer";
    const label = document.createElement("label");
    label.className = "kroma-chat__sr-only";
    label.htmlFor = options.id;
    label.textContent = options.inputLabel;

    this.input = document.createElement("textarea");
    this.input.className = "kroma-chat__input";
    this.input.id = options.id;
    this.input.name = "message";
    this.input.rows = 1;
    this.input.maxLength = 2000;
    this.input.placeholder = options.placeholder;
    this.input.disabled = this.disabled;

    this.sendButton = this.createSendButton(options.sendLabel);
    this.form.append(label, this.input, this.sendButton);

    this.errorMessage = document.createElement("p");
    this.errorMessage.className = "kroma-chat__error";
    this.errorMessage.setAttribute("role", "alert");
    this.errorMessage.hidden = true;
    this.element.append(this.form, this.errorMessage);

    const signal = this.listeners.signal;
    this.input.addEventListener("input", () => {
      this.resizeInput();
      this.updateSendButton();
    }, { signal });
    this.input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        this.form.requestSubmit();
      }
    }, { signal });
    this.form.addEventListener("submit", (event) => {
      event.preventDefault();
      const message = this.input.value.trim();
      if (!message || this.disabled) return;
      options.onSend(message);
      this.clear();
    }, { signal });
    this.updateSendButton();
  }

  setDisabled(disabled: boolean) {
    this.disabled = disabled;
    this.input.disabled = disabled;
    this.updateSendButton();
  }

  setError(message: string | null) {
    this.errorMessage.textContent = message || "";
    this.errorMessage.hidden = !message;
    if (message) {
      this.input.setAttribute("aria-invalid", "true");
      this.errorMessage.id = `${this.input.id}-error`;
      this.input.setAttribute("aria-describedby", this.errorMessage.id);
    } else {
      this.input.removeAttribute("aria-invalid");
      this.input.removeAttribute("aria-describedby");
      this.errorMessage.removeAttribute("id");
    }
  }

  focus() {
    this.input.focus();
  }

  clear() {
    this.input.value = "";
    this.input.rows = 1;
    this.setError(null);
    this.updateSendButton();
  }

  destroy() {
    this.listeners.abort();
  }

  private resizeInput() {
    this.input.rows = 1;
    const styles = window.getComputedStyle(this.input);
    const lineHeight = Number.parseFloat(styles.lineHeight) || 21;
    const verticalPadding = Number.parseFloat(styles.paddingTop) + Number.parseFloat(styles.paddingBottom);
    const borderHeight = Number.parseFloat(styles.borderTopWidth) + Number.parseFloat(styles.borderBottomWidth);
    const baselineHeight = Math.max((Number.parseFloat(styles.minHeight) || 0) - borderHeight, lineHeight + verticalPadding);
    const contentLines = Math.ceil(Math.max(0, this.input.scrollHeight - baselineHeight) / lineHeight) + 1;
    this.input.rows = Math.min(6, Math.max(1, contentLines));
  }

  private updateSendButton() {
    this.sendButton.disabled = this.disabled || !this.input.value.trim();
  }

  private createSendButton(sendLabel: string) {
    const button = document.createElement("button");
    button.className = "kroma-chat__send";
    button.type = "submit";
    button.disabled = true;
    const label = document.createElement("span");
    label.className = "kroma-chat__sr-only";
    label.textContent = sendLabel;
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("aria-hidden", "true");
    icon.setAttribute("focusable", "false");
    const outerPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    outerPath.setAttribute("d", "M4.5 12 20 4.5l-4.1 15-3.1-6.1L4.5 12Z");
    const innerPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    innerPath.setAttribute("d", "m12.8 13.4 4.7-4.7");
    icon.append(outerPath, innerPath);
    button.append(label, icon);
    return button;
  }
}
