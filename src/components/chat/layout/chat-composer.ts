import { VirtualKeyboard } from "../input/virtual-keyboard";
import { VirtualKeyboardController } from "../input/virtual-keyboard-controller";
import { VirtualTextDisplay } from "../input/virtual-text-display";

export type ChatInputMode = "native" | "virtual";

export type ChatComposerOptions = {
  id: string;
  inputLabel: string;
  placeholder: string;
  sendLabel: string;
  disabled?: boolean;
  inputMode?: ChatInputMode;
  showKeyboardShowcase?: boolean;
  onInputModeChange?: (mode: ChatInputMode) => void;
  onSend: (message: string) => void;
};

/** Owns both native and controlled virtual entry; send delivery remains host-owned. */
export class ChatComposer {
  readonly element: HTMLDivElement;
  readonly form: HTMLFormElement;
  readonly input: HTMLTextAreaElement;
  readonly display: VirtualTextDisplay;
  readonly sendButton: HTMLButtonElement;
  readonly errorMessage: HTMLParagraphElement;
  readonly controller: VirtualKeyboardController;
  private readonly listeners = new AbortController();
  private readonly disposers: Array<() => void> = [];
  private readonly actions: HTMLDivElement;
  private readonly modeButton: HTMLButtonElement;
  private readonly keyboardButton: HTMLButtonElement;
  private readonly keyboard: VirtualKeyboard | null;
  private readonly keyboardShowcase: HTMLElement | null;
  private readonly unsubscribeController: () => void;
  private disabled: boolean;
  private inputMode: ChatInputMode;

  constructor(private readonly options: ChatComposerOptions) {
    this.disabled = Boolean(options.disabled);
    this.inputMode = options.inputMode || "native";
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

    this.controller = new VirtualKeyboardController(this.input.maxLength, this.inputMode === "virtual");
    this.display = new VirtualTextDisplay(this.controller, options.inputLabel, options.placeholder);
    this.display.setDisabled(this.disabled);
    this.input.hidden = this.inputMode === "virtual";
    this.display.setVisible(this.inputMode === "virtual");

    this.actions = document.createElement("div");
    this.actions.className = "kroma-chat__composer-actions";
    this.modeButton = this.createModeButton();
    this.keyboardButton = this.createKeyboardButton();
    this.sendButton = this.createSendButton(options.sendLabel);
    this.actions.append(this.keyboardButton, this.modeButton, this.sendButton);
    this.form.append(label, this.input, this.display.element, this.actions);

    this.keyboard = options.showKeyboardShowcase ? null : new VirtualKeyboard({
      controller: this.controller,
      disabled: this.disabled,
      onSend: () => {
        this.form.requestSubmit();
        if (this.inputMode === "virtual" && !this.disabled) this.display.element.focus();
      },
    });
    this.keyboardShowcase = options.showKeyboardShowcase ? this.createKeyboardShowcase() : null;
    if (this.keyboard) this.element.append(this.form, this.keyboard.element);
    else this.element.append(this.form, this.keyboardShowcase as HTMLElement);

    this.errorMessage = document.createElement("p");
    this.errorMessage.className = "kroma-chat__error";
    this.errorMessage.setAttribute("role", "alert");
    this.errorMessage.hidden = true;
    this.element.append(this.errorMessage);

    const signal = this.listeners.signal;
    this.input.addEventListener("input", () => {
      this.syncControllerFromNative();
      this.resizeInput();
      this.updateSendButton();
    }, { signal });
    this.input.addEventListener("select", () => this.syncControllerFromNative(), { signal });
    this.input.addEventListener("keyup", () => this.syncControllerFromNative(), { signal });
    this.input.addEventListener("keydown", (event) => {
      if (event.isComposing) return;
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        this.form.requestSubmit();
      }
    }, { signal });
    this.keyboardButton.addEventListener("click", () => this.toggleVirtualKeyboard(), { signal });
    this.modeButton.addEventListener("click", () => this.toggleInputMode(), { signal });
    this.form.addEventListener("submit", (event) => {
      event.preventDefault();
      const message = this.controller.state.value.trim();
      if (!message || this.disabled) return;
      options.onSend(message);
      this.clear();
    }, { signal });
    this.unsubscribeController = this.controller.subscribe(() => this.updateSendButton());
    this.updateModePresentation();
    this.updateSendButton();
  }

  setInputMode(mode: ChatInputMode) {
    if (this.inputMode === mode) return;
    if (mode === "virtual") {
      this.syncControllerFromNative();
      this.input.blur();
    } else {
      this.input.value = this.controller.state.value;
      this.input.rows = Math.min(6, Math.max(1, this.input.value.split("\n").length));
      this.input.setSelectionRange(this.controller.state.cursor, this.controller.state.cursor);
    }
    this.inputMode = mode;
    this.controller.setOpen(mode === "virtual");
    this.updateModePresentation();
    this.updateSendButton();
  }

  setDisabled(disabled: boolean) {
    this.disabled = disabled;
    this.input.disabled = disabled;
    this.display.setDisabled(disabled);
    this.keyboard?.setDisabled(disabled);
    this.updateSendButton();
  }

  setError(message: string | null) {
    this.errorMessage.textContent = message || "";
    this.errorMessage.hidden = !message;
    if (message) {
      this.input.setAttribute("aria-invalid", "true");
      this.display.element.setAttribute("aria-invalid", "true");
      this.errorMessage.id = `${this.input.id}-error`;
      this.input.setAttribute("aria-describedby", this.errorMessage.id);
      this.display.setError(this.errorMessage.id);
    } else {
      this.input.removeAttribute("aria-invalid");
      this.display.element.removeAttribute("aria-invalid");
      this.input.removeAttribute("aria-describedby");
      this.display.setError(null);
      this.errorMessage.removeAttribute("id");
    }
  }

  focus() {
    if (this.inputMode === "virtual") {
      this.controller.setOpen(true);
      this.display.element.focus();
    } else {
      this.input.focus();
    }
  }

  clear() {
    this.input.value = "";
    this.input.rows = 1;
    this.controller.clear();
    this.setError(null);
    this.updateSendButton();
  }

  destroy() {
    this.listeners.abort();
    this.unsubscribeController();
    this.display.destroy();
    this.keyboard?.destroy();
    this.disposers.forEach((dispose) => dispose());
  }

  private syncControllerFromNative() {
    if (this.inputMode !== "native") return;
    this.controller.setValue(this.input.value, this.input.selectionStart || 0);
  }

  private toggleInputMode() {
    const nextMode = this.inputMode === "native" ? "virtual" : "native";
    this.setInputMode(nextMode);
    this.options.onInputModeChange?.(nextMode);
    if (nextMode === "native") this.input.focus();
  }

  private toggleVirtualKeyboard() {
    const open = !this.controller.state.open;
    this.controller.setOpen(open);
    this.updateModePresentation();
    if (!open) this.keyboardButton.focus();
    else this.display.element.focus();
  }

  private updateModePresentation() {
    const virtual = this.inputMode === "virtual";
    this.input.hidden = virtual;
    this.display.setVisible(virtual);
    this.keyboardButton.hidden = !virtual || Boolean(this.keyboardShowcase);
    this.keyboardButton.setAttribute("aria-expanded", String(virtual && this.controller.state.open));
    this.keyboardButton.setAttribute("aria-label", this.controller.state.open ? "Ocultar teclado virtual" : "Mostrar teclado virtual");
    this.keyboardButton.textContent = this.controller.state.open ? "⌃" : "⌄";
    this.modeButton.setAttribute("aria-label", virtual ? "Usar teclado del dispositivo" : "Usar teclado virtual");
    this.modeButton.title = virtual ? "Usar teclado del dispositivo" : "Usar teclado virtual";
    this.modeButton.dataset.inputMode = this.inputMode;
  }

  private updateSendButton() {
    this.sendButton.disabled = this.disabled || !this.controller.state.value.trim();
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

  private createModeButton() {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "kroma-chat__input-mode";
    button.textContent = "⌨";
    return button;
  }

  private createKeyboardButton() {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "kroma-chat__keyboard-toggle";
    button.textContent = "⌄";
    return button;
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

  private createKeyboardShowcase() {
    const showcase = document.createElement("section");
    showcase.className = "kroma-chat__keyboard-showcase";
    showcase.setAttribute("aria-label", "Estados del composer y teclado virtual");
    const title = document.createElement("h3");
    title.className = "kroma-chat__keyboard-showcase-title";
    title.textContent = "Teclado virtual · variantes";
    showcase.append(title);

    const samples = [
      { label: "Alfabético", symbols: false, shifted: false },
      { label: "Shift", symbols: false, shifted: true },
      { label: "Numérico y símbolos", symbols: true, shifted: false },
    ];
    samples.forEach((sample) => {
      const group = document.createElement("div");
      group.className = "kroma-chat__keyboard-showcase-sample";
      const sampleLabel = document.createElement("span");
      sampleLabel.className = "kroma-chat__keyboard-showcase-label";
      sampleLabel.textContent = sample.label;
      const controller = new VirtualKeyboardController(2000, true);
      if (sample.shifted) controller.toggleShift();
      if (sample.symbols) controller.toggleSymbols();
      const keyboard = new VirtualKeyboard({ controller, disabled: true, preview: true, label: sample.label });
      this.disposers.push(() => keyboard.destroy());
      group.append(sampleLabel, keyboard.element);
      showcase.append(group);
    });

    const composerSamples = document.createElement("div");
    composerSamples.className = "kroma-chat__keyboard-showcase-composers";
    composerSamples.append(this.createComposerSample("Composer vacío", ""));
    composerSamples.append(this.createComposerSample("Composer con texto", "¿Tienen atención los sábados?"));
    const disabledLabel = document.createElement("span");
    disabledLabel.className = "kroma-chat__keyboard-showcase-label";
    disabledLabel.textContent = "Composer deshabilitado";
    composerSamples.append(disabledLabel);
    showcase.append(composerSamples);
    return showcase;
  }

  private createComposerSample(label: string, value: string) {
    const sample = document.createElement("div");
    sample.className = "kroma-chat__keyboard-showcase-composer";
    const caption = document.createElement("span");
    caption.className = "kroma-chat__keyboard-showcase-label";
    caption.textContent = label;
    const controller = new VirtualKeyboardController(2000);
    if (value) controller.setValue(value);
    const display = new VirtualTextDisplay(controller, label, this.options.placeholder);
    display.element.classList.add("kroma-chat__virtual-display--sample");
    display.setDisabled(true);
    this.disposers.push(() => display.destroy());
    sample.append(caption, display.element);
    return sample;
  }
}
