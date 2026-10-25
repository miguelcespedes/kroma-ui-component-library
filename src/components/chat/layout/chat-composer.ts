import { VirtualKeyboard } from "../input/virtual-keyboard";
import { VirtualKeyboardController, type VirtualKeyboardLayoutName } from "../input/virtual-keyboard-controller";
import { VirtualTextDisplay, type VirtualTextDisplayCallbacks } from "../input/virtual-text-display";
import { createIcon } from "../shared/icons";

export type ChatInteractionMode = "guided" | "free-text";
const COMPOSER_MAX_LENGTH = 2000;

export type ChatComposerOptions = {
  id: string;
  inputLabel: string;
  placeholder: string;
  sendLabel: string;
  disabled?: boolean;
  showKeyboardShowcase?: boolean;
  interactionMode?: ChatInteractionMode;
  onInteractionModeChange?: (mode: ChatInteractionMode) => void;
  onSend: (message: string) => void;
};

/** Coordinates guided actions, optional free text and the single simple-keyboard instance. */
export class ChatComposer {
  readonly element: HTMLDivElement;
  readonly form: HTMLFormElement;
  readonly display: VirtualTextDisplay;
  readonly sendButton: HTMLButtonElement;
  readonly errorMessage: HTMLParagraphElement;
  readonly controller: VirtualKeyboardController;
  private readonly listeners = new AbortController();
  private readonly disposers: Array<() => void> = [];
  private readonly actions: HTMLDivElement;
  private readonly guidedEntryButton: HTMLButtonElement;
  private readonly guidedReturnButton: HTMLButtonElement;
  private readonly keyboardButton: HTMLButtonElement;
  private readonly keyboardShowcase: HTMLElement | null;
  private readonly showcaseLayouts = new Map<VirtualKeyboardLayoutName, HTMLButtonElement>();
  private readonly unsubscribeController: () => void;
  private keyboard: VirtualKeyboard | null = null;
  private keyboardTarget: HTMLInputElement | null = null;
  private readonly inputsWithPhysicalKeyHandlers = new WeakSet<HTMLInputElement>();
  private showcaseToggle: HTMLButtonElement | null = null;
  private disabled: boolean;
  private interactionMode: ChatInteractionMode;
  private draftValue = "";
  private caretStart = 0;
  private caretEnd = 0;

  constructor(private readonly options: ChatComposerOptions) {
    this.disabled = Boolean(options.disabled);
    this.interactionMode = options.interactionMode || "guided";
    const showKeyboardShowcase = Boolean(options.showKeyboardShowcase);
    this.element = document.createElement("div");
    this.element.className = "kroma-chat__composer-area";

    this.form = document.createElement("form");
    this.form.className = "kroma-chat__composer";
    this.controller = new VirtualKeyboardController(false);
    const displayCallbacks: VirtualTextDisplayCallbacks = {
      onCaretChange: (start, end) => {
        if (this.interactionMode !== "free-text" || this.keyboardTarget) return;
        this.keyboard?.setCaretPosition(start, end);
        this.keyboard?.setOpen(true);
      },
      onPhysicalKey: (event) => this.keyboard?.handlePhysicalKey(event, () => this.form.requestSubmit()),
      onPhysicalKeyRelease: () => this.keyboard?.restoreCaretAfterPhysicalKey(),
    };
    this.display = new VirtualTextDisplay(options.inputLabel, options.placeholder, displayCallbacks);
    this.display.setDisabled(this.disabled);
    this.display.update(this.draftValue);
    this.display.setVisible(false);

    this.actions = document.createElement("div");
    this.actions.className = "kroma-chat__composer-actions";
    this.guidedEntryButton = this.createModeAction("kroma-chat__composer-guided-entry", "Escribir una consulta");
    this.guidedReturnButton = this.createModeAction("kroma-chat__composer-guided-return", "Volver a opciones guiadas", "options");
    this.keyboardButton = this.createModeAction("kroma-chat__keyboard-toggle", "Ocultar teclado virtual", "keyboard-up");
    this.sendButton = this.createSendButton(options.sendLabel);
    this.actions.append(this.guidedEntryButton, this.guidedReturnButton, this.keyboardButton, this.sendButton);
    this.form.append(this.display.element, this.actions);

    this.createKeyboard();
    this.keyboardShowcase = showKeyboardShowcase ? this.createKeyboardShowcase() : null;
    if (this.interactionMode === "free-text" && !this.keyboardShowcase) this.keyboard?.setOpen(true);
    this.element.append(this.form);
    if (this.keyboardShowcase) this.element.append(this.keyboardShowcase);
    else if (this.keyboard) this.element.append(this.keyboard.element);

    this.errorMessage = document.createElement("p");
    this.errorMessage.className = "kroma-chat__error";
    this.errorMessage.setAttribute("role", "alert");
    this.errorMessage.hidden = true;
    this.element.append(this.errorMessage);

    const signal = this.listeners.signal;
    document.addEventListener("pointerdown", (event) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (this.display.element.contains(target) || this.keyboard?.element.contains(target) || this.keyboardButton.contains(target) || this.keyboardShowcase?.contains(target)) return;
      if (this.keyboardTarget?.contains(target)) return;
      if (this.keyboardTarget) {
        this.setKeyboardTarget(null);
        return;
      }
      this.controller.setOpen(false);
    }, { capture: true, signal });
    this.guidedEntryButton.addEventListener("click", () => this.setInteractionMode("free-text"), { signal });
    this.guidedReturnButton.addEventListener("click", () => this.setInteractionMode("guided"), { signal });
    this.keyboardButton.addEventListener("click", () => this.keyboard?.setOpen(!this.controller.state.open), { signal });
    this.form.addEventListener("submit", (event) => {
      event.preventDefault();
      const message = this.currentValue().trim();
      if (!message || this.disabled) return;
      options.onSend(message);
      this.clear();
      this.setInteractionMode("guided");
    }, { signal });
    this.unsubscribeController = this.controller.subscribe(() => {
      this.updateSendButton();
      this.updateShowcaseControls();
      this.updatePresentation();
    });
    this.updatePresentation();
    this.updateSendButton();
  }

  setDisabled(disabled: boolean) {
    this.disabled = disabled;
    this.display.setDisabled(disabled);
    this.keyboard?.setDisabled(disabled);
    if (disabled) this.setKeyboardTarget(null);
    this.updateSendButton();
    this.updatePresentation();
  }

  get mode() {
    return this.interactionMode;
  }

  setInteractionMode(mode: ChatInteractionMode) {
    if (this.interactionMode === mode) return;
    if (this.keyboardTarget) this.setKeyboardTarget(null);
    this.interactionMode = mode;
    if (mode === "free-text") {
      this.keyboard?.setInput(this.draftValue, this.caretStart, this.caretEnd);
      this.keyboard?.setOpen(true);
    } else {
      this.controller.setOpen(false);
    }
    this.updatePresentation();
    this.updateSendButton();
    this.options.onInteractionModeChange?.(mode);
    if (mode === "free-text" && !this.disabled) this.display.element.focus();
    else if (mode === "guided" && !this.disabled && !this.keyboardShowcase) this.guidedEntryButton.focus({ preventScroll: true });
  }

  setKeyboardTarget(target: HTMLInputElement | null) {
    if (target === this.keyboardTarget) {
      if (target) this.controller.setOpen(true);
      return;
    }
    this.keyboardTarget = target;
    if (target) {
      this.bindPhysicalKeyboard(target);
      const numericLayout = ["number", "tel", "date"].includes(target.type);
      this.controller.setLayout(numericLayout ? "numbers" : "default");
      this.keyboard?.setMaxLength(target.maxLength > 0 ? target.maxLength : COMPOSER_MAX_LENGTH);
      const caretStart = target.selectionStart ?? target.value.length;
      const caretEnd = target.selectionEnd ?? caretStart;
      this.keyboard?.setInput(target.value, caretStart, caretEnd);
      this.controller.setOpen(true);
    } else {
      this.controller.setLayout("default");
      this.keyboard?.setMaxLength(COMPOSER_MAX_LENGTH);
      this.keyboard?.setInput(this.draftValue, this.caretStart, this.caretEnd);
      this.controller.setOpen(false);
    }
    this.updatePresentation();
    this.updateSendButton();
  }

  private bindPhysicalKeyboard(target: HTMLInputElement) {
    if (this.inputsWithPhysicalKeyHandlers.has(target)) return;
    this.inputsWithPhysicalKeyHandlers.add(target);
    target.addEventListener("keydown", (event) => {
      if (this.keyboardTarget !== target) return;
      this.keyboard?.handlePhysicalKey(event, () => target.form?.requestSubmit());
    }, { signal: this.listeners.signal });
    target.addEventListener("keyup", () => this.keyboard?.restoreCaretAfterPhysicalKey(), { signal: this.listeners.signal });
  }

  private setTargetSelection(target: HTMLInputElement, start: number, end: number) {
    if (!["text", "search", "tel", "url", "password"].includes(target.type)) return;
    try {
      target.setSelectionRange(start, end);
    } catch {
      // Some input types expose values but do not support a selection range.
    }
  }

  setError(message: string | null) {
    this.errorMessage.textContent = message || "";
    this.errorMessage.hidden = !message;
    if (message) {
      this.display.element.setAttribute("aria-invalid", "true");
      this.errorMessage.id = `${this.options.id}-error`;
      this.display.setError(this.errorMessage.id);
    } else {
      this.display.element.removeAttribute("aria-invalid");
      this.display.setError(null);
      this.errorMessage.removeAttribute("id");
    }
  }

  focus() {
    // Move focus to a safe action without interpreting message-control selection as typing intent.
    if (this.interactionMode !== "guided") return;
    if (this.keyboardTarget) this.setKeyboardTarget(null);
    if (!this.guidedEntryButton.hidden) this.guidedEntryButton.focus({ preventScroll: true });
  }

  clear() {
    if (this.keyboardTarget) this.setKeyboardTarget(null);
    this.draftValue = "";
    this.caretStart = 0;
    this.caretEnd = 0;
    this.keyboard?.clear();
    this.display.update("");
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

  private createKeyboard() {
    if (this.keyboard) return;
    this.keyboard = new VirtualKeyboard({
      inputName: this.options.id,
      controller: this.controller,
      maxLength: COMPOSER_MAX_LENGTH,
      disabled: this.disabled,
      onChange: (value, start, end) => {
        if (this.keyboardTarget) {
          this.keyboardTarget.value = value;
          this.setTargetSelection(this.keyboardTarget, start, end);
          this.keyboardTarget.dispatchEvent(new Event("input", { bubbles: true }));
          return;
        }
        this.draftValue = value;
        this.caretStart = start;
        this.caretEnd = end;
        this.display.update(value, start, end);
        this.updateSendButton();
      },
      onEnter: () => {
        if (this.keyboardTarget) this.keyboardTarget.form?.requestSubmit();
        else this.form.requestSubmit();
      },
    });
  }

  private currentValue() {
    return this.draftValue;
  }

  private updatePresentation() {
    const guided = this.interactionMode === "guided";
    const externalInput = this.keyboardTarget !== null;
    const virtualInput = !guided || externalInput;
    this.element.dataset.interactionMode = this.interactionMode;
    this.display.setVisible(virtualInput && !externalInput);
    this.guidedEntryButton.hidden = !guided || this.disabled || Boolean(this.keyboardShowcase) || externalInput;
    this.guidedEntryButton.textContent = this.draftValue ? "Continuar escribiendo" : "Escribir una consulta";
    this.guidedReturnButton.hidden = guided || Boolean(this.keyboardShowcase) || externalInput;
    this.guidedReturnButton.disabled = this.disabled;
    this.keyboardButton.disabled = this.disabled;
    this.keyboardButton.hidden = !virtualInput || Boolean(this.keyboardShowcase);
    this.keyboardButton.replaceChildren(createIcon(this.controller.state.open ? "keyboard-up" : "keyboard"));
    this.keyboardButton.setAttribute("aria-expanded", String(virtualInput && this.controller.state.open));
    this.keyboardButton.setAttribute("aria-label", this.controller.state.open ? "Ocultar teclado virtual" : "Mostrar teclado virtual");
    this.sendButton.hidden = guided || Boolean(this.keyboardShowcase) || externalInput;
    if (!virtualInput && !this.keyboardShowcase) this.controller.setOpen(false);
  }

  private updateSendButton() {
    this.sendButton.disabled = this.disabled || !this.currentValue().trim();
  }

  private createModeAction(className: string, label: string, iconName?: string) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = iconName ? `${className} kroma-chat__composer-icon-button` : className;
    button.setAttribute("aria-label", label);
    if (iconName) button.append(createIcon(iconName));
    else button.textContent = label;
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

    const controls = document.createElement("div");
    controls.className = "kroma-chat__keyboard-showcase-layouts";
    const layouts: ReadonlyArray<{ label: string; name: VirtualKeyboardLayoutName }> = [
      { label: "ABC", name: "default" },
      { label: "Shift", name: "shift" },
      { label: "123", name: "numbers" },
      { label: "#+=", name: "symbols" },
    ];
    layouts.forEach(({ label, name }) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "kroma-chat__keyboard-showcase-layout";
      button.textContent = label;
      button.setAttribute("aria-pressed", String(this.controller.state.layoutName === name));
      button.addEventListener("click", () => this.keyboard?.setLayoutDemo(name), { signal: this.listeners.signal });
      this.showcaseLayouts.set(name, button);
      controls.append(button);
    });

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "kroma-chat__keyboard-showcase-toggle";
    toggle.dataset.keyboardShowcaseToggle = "true";
    toggle.addEventListener("click", () => this.keyboard?.setOpen(!this.controller.state.open), { signal: this.listeners.signal });
    this.showcaseToggle = toggle;
    this.updateShowcaseControls();
    controls.append(toggle);

    const composerSamples = document.createElement("div");
    composerSamples.className = "kroma-chat__keyboard-showcase-composers";
    composerSamples.append(this.createComposerSample("Composer vacío", ""));
    composerSamples.append(this.createComposerSample("Composer con texto", "¿Tienen atención los sábados?"));
    const disabledLabel = document.createElement("span");
    disabledLabel.className = "kroma-chat__keyboard-showcase-label";
    disabledLabel.textContent = "Composer deshabilitado";

    showcase.append(title, controls);
    if (this.keyboard) showcase.append(this.keyboard.element);
    showcase.append(composerSamples, disabledLabel);
    return showcase;
  }

  private createComposerSample(label: string, value: string) {
    const sample = document.createElement("div");
    sample.className = "kroma-chat__keyboard-showcase-composer";
    const caption = document.createElement("span");
    caption.className = "kroma-chat__keyboard-showcase-label";
    caption.textContent = label;
    const display = new VirtualTextDisplay(label, this.options.placeholder, {
      onCaretChange: () => undefined,
      onPhysicalKey: () => undefined,
      onPhysicalKeyRelease: () => undefined,
    });
    display.element.classList.add("kroma-chat__virtual-display--sample");
    display.setDisabled(true);
    display.update(value, value.length);
    this.disposers.push(() => display.destroy());
    sample.append(caption, display.element);
    return sample;
  }

  private updateShowcaseControls() {
    const state = this.controller.state;
    this.showcaseLayouts.forEach((button, layout) => button.setAttribute("aria-pressed", String(state.layoutName === layout)));
    if (this.showcaseToggle) {
      this.showcaseToggle.textContent = state.open ? "Ocultar teclado" : "Mostrar teclado";
      this.showcaseToggle.setAttribute("aria-expanded", String(state.open));
    }
  }
}
