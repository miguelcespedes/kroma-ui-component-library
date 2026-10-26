import { VirtualKeyboard } from "../input/virtual-keyboard";
import { VirtualKeyboardController } from "../input/virtual-keyboard-controller";
import { SpeechInputController, type SpeechInputStatus, type SpeechInputTranscript } from "../input/speech-input-controller";
import { insertSpeechTranscript } from "../input/speech-transcript-insertion";
import { VirtualTextDisplay, type VirtualTextDisplayCallbacks } from "../input/virtual-text-display";

export type ChatInteractionMode = "guided" | "free-text";
const COMPOSER_MAX_LENGTH = 2000;

export type ChatComposerOptions = {
  id: string;
  inputLabel: string;
  placeholder: string;
  disabled?: boolean;
  interactionMode?: ChatInteractionMode;
  onInteractionModeChange?: (mode: ChatInteractionMode) => void;
  onSend: (message: string) => void;
};

/** Coordinates guided actions, optional free text and the single simple-keyboard instance. */
export class ChatComposer {
  readonly element: HTMLDivElement;
  readonly form: HTMLFormElement;
  readonly display: VirtualTextDisplay;
  readonly speechButton: HTMLButtonElement;
  readonly errorMessage: HTMLParagraphElement;
  readonly controller: VirtualKeyboardController;
  readonly keyboardDock: HTMLDivElement | null;
  private readonly listeners = new AbortController();
  private readonly composerField: HTMLDivElement;
  private readonly actions: HTMLDivElement;
  private readonly unsubscribeController: () => void;
  private readonly speechInput: SpeechInputController;
  private readonly speechUnsubscribers: Array<() => void> = [];
  private readonly draftStorageKey: string;
  private keyboard: VirtualKeyboard | null = null;
  private keyboardTarget: HTMLInputElement | null = null;
  private readonly inputsWithPhysicalKeyHandlers = new WeakSet<HTMLInputElement>();
  private disabled: boolean;
  private interactionMode: ChatInteractionMode;
  private draftValue = "";
  private caretStart = 0;
  private caretEnd = 0;
  private speechInsertion: { value: string; start: number; end: number } | null = null;
  private applyingSpeechTranscript = false;

  constructor(private readonly options: ChatComposerOptions) {
    this.disabled = Boolean(options.disabled);
    this.interactionMode = options.interactionMode || "guided";
    this.draftStorageKey = `kroma-chat-draft:${options.id}`;
    this.draftValue = this.readStoredDraft();
    this.caretStart = this.draftValue.length;
    this.caretEnd = this.draftValue.length;
    this.element = document.createElement("div");
    this.element.className = "kroma-chat__composer-area";

    this.form = document.createElement("form");
    this.form.className = "kroma-chat__composer";
    this.composerField = document.createElement("div");
    this.composerField.className = "kroma-chat__composer-field";
    this.controller = new VirtualKeyboardController(false);
    const displayCallbacks: VirtualTextDisplayCallbacks = {
      onFocus: () => this.stopSpeechForEditing(),
      onCaretChange: (start, end) => {
        this.stopSpeechForEditing();
        if (this.keyboardTarget) return;
        if (this.interactionMode !== "free-text") this.setInteractionMode("free-text");
        this.keyboard?.setCaretPosition(start, end);
        this.keyboard?.setOpen(true);
      },
      onPhysicalKey: (event) => this.keyboard?.handlePhysicalKey(event, () => this.form.requestSubmit()),
      onPhysicalKeyRelease: () => this.keyboard?.restoreCaretAfterPhysicalKey(),
    };
    this.display = new VirtualTextDisplay(options.inputLabel, "", displayCallbacks);
    this.display.element.id = options.id;
    this.display.setDisabled(this.disabled);
    this.display.update(this.draftValue);
    this.display.setVisible(true);

    this.actions = document.createElement("div");
    this.actions.className = "kroma-chat__composer-actions";
    this.speechInput = new SpeechInputController();
    this.speechButton = this.createSpeechButton();
    this.actions.append(this.speechButton);
    this.composerField.append(this.display.element);
    this.form.append(this.composerField, this.actions);

    this.createKeyboard();
    this.keyboard?.setInput(this.draftValue, this.caretStart, this.caretEnd);
    this.keyboardDock = this.keyboard ? document.createElement("div") : null;
    if (this.keyboardDock) {
      this.keyboardDock.className = "kroma-chat__keyboard-dock";
      this.keyboardDock.append(this.keyboard!.element);
    }
    if (this.interactionMode === "free-text") this.keyboard?.setOpen(true);
    this.element.append(this.form);

    this.errorMessage = document.createElement("p");
    this.errorMessage.className = "kroma-chat__error";
    this.errorMessage.setAttribute("role", "alert");
    this.errorMessage.hidden = true;
    this.element.append(this.errorMessage);

    const signal = this.listeners.signal;
    document.addEventListener("pointerdown", (event) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (this.keyboard?.element.contains(target)) return;
      if (this.keyboardTarget?.contains(target)) return;
      if (this.speechButton.contains(target)) return;
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
      this.speechInsertion = null;
      this.speechInput.cancel();
      options.onSend(message);
      this.clear();
      this.setInteractionMode("guided");
    }, { signal });
    this.unsubscribeController = this.controller.subscribe(() => {
      this.updateComposerControls();
      this.updatePresentation();
    });
    this.speechUnsubscribers.push(this.speechInput.subscribeStatus((status) => this.updateSpeechStatus(status)));
    this.speechUnsubscribers.push(this.speechInput.subscribeResults((result) => this.applySpeechTranscript(result)));
    this.updatePresentation();
    this.updateComposerControls();
  }

  setDisabled(disabled: boolean) {
    this.disabled = disabled;
    this.display.setDisabled(disabled);
    this.keyboard?.setDisabled(disabled);
    if (disabled) {
      this.setKeyboardTarget(null);
      this.speechInput.cancel();
    }
    this.updateComposerControls();
    this.updatePresentation();
  }

  get mode() {
    return this.interactionMode;
  }

  setInteractionMode(mode: ChatInteractionMode, focusDisplay = true) {
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
    this.updateComposerControls();
    this.options.onInteractionModeChange?.(mode);
    if (focusDisplay && mode === "free-text" && !this.disabled) this.display.element.focus();
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
    this.updateComposerControls();
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
    this.persistDraft();
    this.setError(null);
    this.updateComposerControls();
  }

  destroy() {
    this.listeners.abort();
    this.unsubscribeController();
    this.speechUnsubscribers.forEach((unsubscribe) => unsubscribe());
    this.speechInput.destroy();
    this.display.destroy();
    this.keyboard?.destroy();
  }

  private createKeyboard() {
    if (this.keyboard) return;
    this.keyboard = new VirtualKeyboard({
      inputName: this.options.id,
      controller: this.controller,
      maxLength: COMPOSER_MAX_LENGTH,
      disabled: this.disabled,
      onChange: (value, start, end) => {
        if (!this.applyingSpeechTranscript) this.stopSpeechForEditing();
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
        this.persistDraft();
      },
      onEnter: () => {
        if (this.keyboardTarget) this.keyboardTarget.form?.requestSubmit();
        else this.form.requestSubmit();
      },
    });
    this.keyboard.element.addEventListener("pointerdown", () => this.stopSpeechForEditing(), { signal: this.listeners.signal });
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
    this.speechButton.hidden = externalInput || !this.speechInput.supported;
    this.actions.hidden = this.speechButton.hidden;
    if (this.keyboardDock) this.keyboardDock.hidden = !this.controller.state.open;
    if (!virtualInput) this.controller.setOpen(false);
  }

  private updateComposerControls() {
    this.speechButton.disabled = this.disabled || !this.speechInput.supported || this.speechInput.status.state === "stopping";
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
    button.title = "Dictar mensaje por voz";
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
    const stopIndicator = document.createElementNS("http://www.w3.org/2000/svg", "path");
    stopIndicator.setAttribute("d", "M4 20 20 4");
    stopIndicator.setAttribute("stroke-width", "2.4");
    stopIndicator.dataset.speechSlash = "true";
    icon.append(microphone, stand, stopIndicator);
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
    if (this.interactionMode !== "free-text") this.setInteractionMode("free-text", false);
    if (!this.speechInput.start()) {
      this.speechInsertion = null;
      return;
    }
    this.keyboard?.setOpen(true);
  }

  private captureSpeechInsertion() {
    const end = this.draftValue.length;
    this.speechInsertion = {
      value: this.draftValue,
      start: end,
      end,
    };
  }

  private updateSpeechStatus(status: SpeechInputStatus) {
    const active = ["starting", "listening", "stopping"].includes(status.state);
    const isError = status.state === "error";
    if (isError && status.message) console.warn(status.message);
    this.speechButton.dataset.speechState = status.state;
    this.speechButton.hidden = !this.speechInput.supported || this.keyboardTarget !== null;
    this.actions.hidden = this.speechButton.hidden;
    this.speechButton.setAttribute("aria-pressed", String(active));
    this.speechButton.setAttribute("aria-label", active
      ? status.state === "stopping" ? "Deteniendo dictado por voz" : "Detener dictado por voz"
      : this.speechInput.supported ? "Iniciar dictado por voz" : status.message);
    this.speechButton.title = "Dictar mensaje por voz";
    this.speechButton.disabled = this.disabled || !this.speechInput.supported || status.state === "stopping";
    if (status.state === "idle" || isError || status.state === "unsupported") {
      const returnFocusToComposer = status.state === "idle" && this.speechInsertion !== null;
      this.speechInsertion = null;
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
    this.applyingSpeechTranscript = true;
    try {
      this.keyboard?.setInput(inserted.value, inserted.caretStart, inserted.caretEnd);
    } finally {
      this.applyingSpeechTranscript = false;
    }
  }

  private stopSpeechForEditing() {
    if (!["starting", "listening"].includes(this.speechInput.status.state)) return;
    this.speechInsertion = null;
    this.speechInput.stop();
  }

  private readStoredDraft() {
    try {
      return window.sessionStorage.getItem(this.draftStorageKey) || "";
    } catch {
      return "";
    }
  }

  private persistDraft() {
    try {
      if (this.draftValue) window.sessionStorage.setItem(this.draftStorageKey, this.draftValue);
      else window.sessionStorage.removeItem(this.draftStorageKey);
    } catch {
      // Draft persistence is best-effort when browser storage is unavailable.
    }
  }

}
