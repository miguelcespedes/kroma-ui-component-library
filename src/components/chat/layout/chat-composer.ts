import { VirtualKeyboard } from "../input/virtual-keyboard";
import { VirtualKeyboardController, type VirtualKeyboardLayoutName } from "../input/virtual-keyboard-controller";
import { SpeechInputController, type SpeechInputStatus, type SpeechInputTranscript } from "../input/speech-input-controller";
import { insertSpeechTranscript } from "../input/speech-transcript-insertion";
import { VirtualTextDisplay, type VirtualTextDisplayCallbacks } from "../input/virtual-text-display";

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
  readonly speechButton: HTMLButtonElement;
  readonly speechStatus: HTMLParagraphElement;
  readonly errorMessage: HTMLParagraphElement;
  readonly controller: VirtualKeyboardController;
  readonly keyboardDock: HTMLDivElement | null;
  private readonly listeners = new AbortController();
  private readonly disposers: Array<() => void> = [];
  private readonly composerField: HTMLDivElement;
  private readonly actions: HTMLDivElement;
  private readonly keyboardShowcase: HTMLElement | null;
  private readonly showcaseLayouts = new Map<VirtualKeyboardLayoutName, HTMLButtonElement>();
  private readonly unsubscribeController: () => void;
  private readonly speechInput: SpeechInputController;
  private readonly speechUnsubscribers: Array<() => void> = [];
  private keyboard: VirtualKeyboard | null = null;
  private keyboardTarget: HTMLInputElement | null = null;
  private readonly inputsWithPhysicalKeyHandlers = new WeakSet<HTMLInputElement>();
  private showcaseToggle: HTMLButtonElement | null = null;
  private disabled: boolean;
  private interactionMode: ChatInteractionMode;
  private draftValue = "";
  private caretStart = 0;
  private caretEnd = 0;
  private speechInsertion: { value: string; start: number; end: number } | null = null;
  private speechHidKeyboard = false;

  constructor(private readonly options: ChatComposerOptions) {
    this.disabled = Boolean(options.disabled);
    this.interactionMode = options.interactionMode || "guided";
    const showKeyboardShowcase = Boolean(options.showKeyboardShowcase);
    this.element = document.createElement("div");
    this.element.className = "kroma-chat__composer-area";

    this.form = document.createElement("form");
    this.form.className = "kroma-chat__composer";
    this.composerField = document.createElement("div");
    this.composerField.className = "kroma-chat__composer-field";
    this.controller = new VirtualKeyboardController(false);
    const displayCallbacks: VirtualTextDisplayCallbacks = {
      onCaretChange: (start, end) => {
        if (this.keyboardTarget) return;
        if (this.interactionMode !== "free-text") this.setInteractionMode("free-text");
        this.keyboard?.setCaretPosition(start, end);
        this.keyboard?.setOpen(true);
      },
      onPhysicalKey: (event) => this.keyboard?.handlePhysicalKey(event, () => this.form.requestSubmit()),
      onPhysicalKeyRelease: () => this.keyboard?.restoreCaretAfterPhysicalKey(),
    };
    this.display = new VirtualTextDisplay(options.inputLabel, "", displayCallbacks);
    this.display.setDisabled(this.disabled);
    this.display.update(this.draftValue);
    this.display.setVisible(true);

    this.actions = document.createElement("div");
    this.actions.className = "kroma-chat__composer-actions";
    this.speechInput = new SpeechInputController();
    this.speechButton = this.createSpeechButton();
    this.sendButton = this.createSendButton(options.sendLabel);
    this.actions.append(this.speechButton, this.sendButton);
    this.composerField.append(this.display.element);
    this.form.append(this.composerField, this.actions);

    this.createKeyboard();
    this.keyboardShowcase = showKeyboardShowcase ? this.createKeyboardShowcase() : null;
    this.keyboardDock = this.keyboard && !this.keyboardShowcase ? document.createElement("div") : null;
    if (this.keyboardDock) {
      this.keyboardDock.className = "kroma-chat__keyboard-dock";
      this.keyboardDock.append(this.keyboard!.element);
    }
    if (this.interactionMode === "free-text" && !this.keyboardShowcase) this.keyboard?.setOpen(true);
    this.element.append(this.form);
    if (this.keyboardShowcase) this.element.append(this.keyboardShowcase);

    this.errorMessage = document.createElement("p");
    this.errorMessage.className = "kroma-chat__error";
    this.errorMessage.setAttribute("role", "alert");
    this.errorMessage.hidden = true;
    this.element.append(this.errorMessage);

    this.speechStatus = document.createElement("p");
    this.speechStatus.className = "kroma-chat__speech-status";
    this.speechStatus.setAttribute("role", "status");
    this.speechStatus.setAttribute("aria-live", "polite");
    this.speechStatus.setAttribute("aria-atomic", "true");
    this.element.append(this.speechStatus);
    const signal = this.listeners.signal;
    document.addEventListener("pointerdown", (event) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (this.keyboard?.element.contains(target) || this.keyboardShowcase?.contains(target)) return;
      if (this.keyboardTarget?.contains(target)) return;
      if (this.speechButton.contains(target)) return;
      // Keep the submit target stable until its click is dispatched. Closing
      // the dock on pointerdown can reflow the composer before pointerup.
      if (this.sendButton.contains(target)) return;
      if (this.keyboardTarget) {
        this.setKeyboardTarget(null);
        return;
      }
      if (this.display.element.contains(target)) return;
      this.controller.setOpen(false);
      if (this.interactionMode === "free-text") this.setInteractionMode("guided");
    }, { capture: true, signal });
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
    this.speechUnsubscribers.push(this.speechInput.subscribeStatus((status) => this.updateSpeechStatus(status)));
    this.speechUnsubscribers.push(this.speechInput.subscribeResults((result) => this.applySpeechTranscript(result)));
    this.updatePresentation();
    this.updateSendButton();
  }

  setDisabled(disabled: boolean) {
    this.disabled = disabled;
    this.display.setDisabled(disabled);
    this.keyboard?.setDisabled(disabled);
    if (disabled) {
      this.setKeyboardTarget(null);
      this.speechInput.cancel();
    }
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
    if (this.interactionMode !== "guided") return;
    if (this.keyboardTarget) this.setKeyboardTarget(null);
    this.display.element.focus({ preventScroll: true });
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
    this.speechUnsubscribers.forEach((unsubscribe) => unsubscribe());
    this.speechInput.destroy();
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
    this.display.setVisible(!externalInput);
    this.display.setEditing(!guided && !externalInput);
    this.form.hidden = externalInput;
    this.speechButton.hidden = Boolean(this.keyboardShowcase) || externalInput || !this.speechInput.supported;
    this.sendButton.hidden = Boolean(this.keyboardShowcase) || externalInput;
    if (this.keyboardDock) this.keyboardDock.hidden = !this.controller.state.open;
    if (!virtualInput && !this.keyboardShowcase) this.controller.setOpen(false);
  }

  private updateSendButton() {
    this.sendButton.disabled = this.disabled || !this.currentValue().trim();
    this.speechButton.disabled = this.disabled || !this.speechInput.supported || this.speechInput.status.state === "stopping";
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
    outerPath.setAttribute("d", "M12 19V5m-7 7 7-7 7 7");
    icon.setAttribute("stroke-width", "2");
    icon.append(outerPath);
    button.append(label, icon);
    return button;
  }

  private createSpeechButton() {
    const button = document.createElement("button");
    button.className = "kroma-chat__speech-button";
    button.type = "button";
    button.dataset.speechState = this.speechInput.status.state;
    button.setAttribute("aria-label", this.speechInput.supported
      ? "Iniciar dictado por voz"
      : this.speechInput.status.message);
    button.setAttribute("aria-pressed", "false");
    button.title = this.speechInput.status.message || "Dictar mensaje por voz";
    button.hidden = !this.speechInput.supported;
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("aria-hidden", "true");
    icon.setAttribute("focusable", "false");
    icon.setAttribute("fill", "none");
    icon.setAttribute("stroke", "currentColor");
    icon.setAttribute("stroke-width", "1.8");
    icon.setAttribute("stroke-linecap", "round");
    icon.setAttribute("stroke-linejoin", "round");
    const microphone = document.createElementNS("http://www.w3.org/2000/svg", "path");
    microphone.setAttribute("d", "M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Z");
    const stand = document.createElementNS("http://www.w3.org/2000/svg", "path");
    stand.setAttribute("d", "M19 11a7 7 0 0 1-14 0m7 7v4m-4 0h8");
    icon.append(microphone, stand);
    button.append(icon);
    button.addEventListener("click", () => this.toggleSpeechInput(), { signal: this.listeners.signal });
    return button;
  }

  private toggleSpeechInput() {
    const state = this.speechInput.status.state;
    if (state === "starting" || state === "listening") {
      this.speechInput.stop();
      return;
    }
    if (state === "stopping" || !this.speechInput.supported || this.disabled) return;

    this.captureSpeechInsertion();
    if (this.speechInput.start()) this.keyboard?.setOpen(false);
    else this.speechInsertion = null;
  }

  private captureSpeechInsertion() {
    if (this.interactionMode !== "free-text") this.setInteractionMode("free-text");
    const caret = this.keyboard?.getCaretRange() ?? { start: this.caretStart, end: this.caretEnd };
    this.speechInsertion = {
      value: this.draftValue,
      start: Math.max(0, Math.min(caret.start, this.draftValue.length)),
      end: Math.max(0, Math.min(caret.end, this.draftValue.length)),
    };
    this.speechHidKeyboard = this.controller.state.open;
  }

  private updateSpeechStatus(status: SpeechInputStatus) {
    const active = ["starting", "listening", "stopping"].includes(status.state);
    const isError = status.state === "error";
    this.speechButton.dataset.speechState = status.state;
    this.speechButton.hidden = !this.speechInput.supported
      || Boolean(this.keyboardShowcase) || this.keyboardTarget !== null;
    this.speechButton.setAttribute("aria-pressed", String(active));
    this.speechButton.setAttribute("aria-label", active
      ? status.state === "stopping" ? "Deteniendo dictado por voz" : "Detener dictado por voz"
      : this.speechInput.supported ? "Iniciar dictado por voz" : status.message);
    this.speechButton.title = status.message || "Dictar mensaje por voz";
    this.speechButton.disabled = this.disabled || !this.speechInput.supported || status.state === "stopping";
    this.speechStatus.textContent = status.message;
    this.speechStatus.dataset.state = status.state;
    this.speechStatus.hidden = !status.message;
    if (status.state === "idle" || isError || status.state === "unsupported") {
      const returnFocusToComposer = status.state === "idle" && this.speechInsertion !== null;
      this.speechInsertion = null;
      if (isError && this.speechHidKeyboard && this.interactionMode === "free-text") this.keyboard?.setOpen(true);
      this.speechHidKeyboard = false;
      if (returnFocusToComposer && !this.disabled) this.display.element.focus({ preventScroll: true });
    }
  }

  private applySpeechTranscript(result: SpeechInputTranscript) {
    const insertion = this.speechInsertion;
    if (!insertion) return;
    const inserted = insertSpeechTranscript(
      insertion.value,
      insertion.start,
      insertion.end,
      result.transcript,
      COMPOSER_MAX_LENGTH,
    );
    this.keyboard?.setInput(inserted.value, inserted.caretStart, inserted.caretEnd);
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
