import SimpleKeyboard, { type KeyboardOptions } from "simple-keyboard";
import { VirtualKeyboardController } from "./virtual-keyboard-controller";
import {
  SIMPLE_KEYBOARD_BUTTON_ATTRIBUTES,
  SIMPLE_KEYBOARD_DISPLAY,
  SIMPLE_KEYBOARD_LAYOUT,
} from "./simple-keyboard-layout";

export type VirtualKeyboardOptions = {
  inputName: string;
  controller: VirtualKeyboardController;
  maxLength: number;
  disabled?: boolean;
  onChange: (value: string, caretStart: number, caretEnd: number) => void;
  onEnter: () => void;
};

/** Per-composer wrapper for the official engine; its internal input owns virtual text and caret. */
export class VirtualKeyboard {
  private static readonly instances = new Set<VirtualKeyboard>();
  readonly element: HTMLDivElement;
  private readonly keyPreview: HTMLDivElement;
  private keyboard: SimpleKeyboard | null = null;
  private disabled: boolean;
  private readonly listeners = new AbortController();
  private readonly unsubscribeController: () => void;
  private readonly savedDocumentHandlers: {
    pointerup: Document["onpointerup"];
    touchend: Document["ontouchend"];
    touchcancel: Document["ontouchcancel"];
    mouseup: Document["onmouseup"];
  };
  private lastCaretStart = 0;
  private lastCaretEnd = 0;
  private lastPressedKey = "";
  private previewPointerId: number | null = null;
  private previewButton: HTMLButtonElement | null = null;
  private previewHideTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly options: VirtualKeyboardOptions) {
    this.disabled = Boolean(options.disabled);
    const instanceClass = options.inputName.replace(/[^a-zA-Z0-9_-]/g, "-");
    this.element = document.createElement("div");
    this.element.className = `kroma-chat__simple-keyboard-instance-${instanceClass}`;
    this.element.hidden = !options.controller.state.open;
    this.keyPreview = document.createElement("div");
    this.keyPreview.className = "kroma-chat__key-preview";
    this.keyPreview.setAttribute("aria-hidden", "true");
    this.keyPreview.dataset.visible = "false";
    this.keyPreview.hidden = true;
    document.body.append(this.keyPreview);
    this.savedDocumentHandlers = {
      pointerup: document.onpointerup,
      touchend: document.ontouchend,
      touchcancel: document.ontouchcancel,
      mouseup: document.onmouseup,
    };

    const previousContextMenu = window.oncontextmenu;
    const keyboardOptions: KeyboardOptions = {
      inputName: options.inputName,
      syncInstanceInputs: false,
      maxLength: options.maxLength,
      layout: SIMPLE_KEYBOARD_LAYOUT,
      layoutName: options.controller.state.layoutName,
      display: SIMPLE_KEYBOARD_DISPLAY,
      buttonAttributes: SIMPLE_KEYBOARD_BUTTON_ATTRIBUTES,
      theme: "hg-theme-default",
      useButtonTag: true,
      disableRowButtonContainers: true,
      disableButtonHold: true,
      newLineOnEnter: false,
      enableLayoutCandidates: false,
      updateCaretOnSelectionChange: false,
      autoUseTouchEvents: false,
      useTouchEvents: false,
      useMouseEvents: true,
      onKeyPress: (button) => this.handleKeyPress(button),
      onChange: (value) => this.handleLibraryChange(value),
      onRender: () => this.updateButtonStates(),
    };
    this.keyboard = new SimpleKeyboard(this.element, keyboardOptions);
    // The package assigns window.oncontextmenu on touch devices; keep that behavior local to its keys.
    if (window.oncontextmenu !== previousContextMenu) window.oncontextmenu = previousContextMenu;
    this.keyboard.setInput("", options.inputName, true);
    this.keyboard.setCaretPosition(0, 0);
    const signal = this.listeners.signal;
    this.element.addEventListener("pointerdown", this.restoreLocalCaret, { capture: true, signal });
    this.element.addEventListener("mousedown", this.restoreLocalCaret, { capture: true, signal });
    this.element.addEventListener("touchstart", this.restoreLocalCaret, { capture: true, passive: true, signal });
    this.element.addEventListener("pointerdown", this.beginKeyPreview, { capture: true, signal });
    window.addEventListener("pointermove", this.moveKeyPreview, { signal });
    window.addEventListener("pointerup", this.endKeyPreview, { signal });
    window.addEventListener("pointercancel", this.endKeyPreview, { signal });
    window.addEventListener("blur", this.cancelKeyPreview, { signal });
    window.addEventListener("scroll", this.cancelKeyPreview, { capture: true, signal });
    document.addEventListener("visibilitychange", this.cancelKeyPreview, { signal });
    window.addEventListener("resize", this.repositionKeyPreview, { signal });
    this.unsubscribeController = options.controller.subscribe((state) => this.applyControllerState(state.layoutName, state.open));
    VirtualKeyboard.instances.add(this);
    this.updateButtonStates();
  }

  get value() {
    return this.keyboard?.getInput(this.options.inputName) || "";
  }

  getCaretRange() {
    const start = this.keyboard?.getCaretPosition();
    const end = this.keyboard?.getCaretPositionEnd();
    return {
      start: start === null || start === undefined ? this.lastCaretStart : start,
      end: end === null || end === undefined ? start ?? this.lastCaretEnd : end,
    };
  }

  setInput(value: string, caretStart = value.length, caretEnd = caretStart) {
    if (!this.keyboard) return;
    this.keyboard.setInput(value, this.options.inputName, true);
    this.keyboard.setCaretPosition(caretStart, caretEnd);
    this.rememberCaret(caretStart, caretEnd);
    this.notifyChange();
  }

  setCaretPosition(caretStart: number, caretEnd = caretStart) {
    if (!this.keyboard) return;
    this.keyboard.setCaretPosition(caretStart, caretEnd);
    this.rememberCaret(caretStart, caretEnd);
    this.notifyChange();
  }

  setDisabled(disabled: boolean) {
    this.disabled = disabled;
    this.updateButtonStates();
  }

  setMaxLength(maxLength: number) {
    this.keyboard?.setOptions({ maxLength: Math.max(1, maxLength) });
    this.updateButtonStates();
  }

  setOpen(open: boolean) {
    this.options.controller.setOpen(open);
  }

  clear() {
    if (!this.keyboard) return;
    this.keyboard.clearInput(this.options.inputName);
    this.keyboard.setCaretPosition(0, 0);
    this.rememberCaret(0, 0);
    this.notifyChange();
  }

  handlePhysicalKey(event: KeyboardEvent, onEnter: () => void) {
    if (!this.keyboard || this.disabled || event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
    this.restoreLocalCaret();
    if (event.key === "Backspace") {
      event.preventDefault();
      this.keyboard.handleButtonClicked("{bksp}");
    } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const value = this.value;
      const { start, end } = this.getCaretRange();
      const cursor = start === end
        ? (event.key === "ArrowLeft" ? previousCodePoint(value, start) : nextCodePoint(value, end))
        : (event.key === "ArrowLeft" ? Math.min(start, end) : Math.max(start, end));
      this.setCaretPosition(cursor, cursor);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (event.shiftKey) this.insertAtCaret("\n");
      else onEnter();
    } else if (event.key.length === 1) {
      event.preventDefault();
      this.keyboard.handleButtonClicked(event.key === " " ? "{space}" : event.key);
    }
  }

  restoreCaretAfterPhysicalKey() {
    queueMicrotask(() => VirtualKeyboard.restoreInstanceCarets());
  }

  destroy() {
    this.unsubscribeController();
    this.listeners.abort();
    this.cancelKeyPreview();
    if (this.previewHideTimer !== null) clearTimeout(this.previewHideTimer);
    this.previewHideTimer = null;
    this.keyPreview.remove();
    if (this.keyboard) {
      const documentHandlers = {
        pointerup: document.onpointerup,
        touchend: document.ontouchend,
        touchcancel: document.ontouchcancel,
        mouseup: document.onmouseup,
      };
      this.keyboard.destroy();
      if (document.onpointerup === null) document.onpointerup = documentHandlers.pointerup || this.savedDocumentHandlers.pointerup;
      if (document.ontouchend === null) document.ontouchend = documentHandlers.touchend || this.savedDocumentHandlers.touchend;
      if (document.ontouchcancel === null) document.ontouchcancel = documentHandlers.touchcancel || this.savedDocumentHandlers.touchcancel;
      if (document.onmouseup === null) document.onmouseup = documentHandlers.mouseup || this.savedDocumentHandlers.mouseup;
    }
    this.keyboard = null;
    VirtualKeyboard.instances.delete(this);
    this.element.replaceChildren();
  }

  private applyControllerState(layoutName: string, open: boolean) {
    if (!this.keyboard) return;
    this.element.hidden = !open;
    if (this.keyboard.options.layoutName !== layoutName) {
      const focusedKey = this.focusedKeyName();
      this.keyboard.setOptions({ layoutName });
      this.restoreKeyFocus(focusedKey, layoutName);
    }
    this.updateButtonStates();
  }

  private handleKeyPress(button: string) {
    this.lastPressedKey = button;
    switch (button) {
      case "{shift}": this.options.controller.pressShift(); break;
      case "{numbers}": this.options.controller.setLayout("numbers"); break;
      case "{symbols}": this.options.controller.setLayout("symbols"); break;
      case "{abc}": this.options.controller.setLayout("default"); break;
      case "{enter}": if (!this.disabled && this.value.trim()) this.options.onEnter(); break;
      default: break;
    }
    queueMicrotask(() => VirtualKeyboard.restoreInstanceCarets());
  }

  private handleLibraryChange(value: string) {
    const start = this.keyboard?.getCaretPosition();
    const end = this.keyboard?.getCaretPositionEnd();
    this.rememberCaret(start ?? value.length, end ?? start ?? value.length);
    this.options.onChange(value, this.lastCaretStart, this.lastCaretEnd);
    const pressedKey = this.lastPressedKey;
    this.lastPressedKey = "";
    if (pressedKey && !pressedKey.startsWith("{") && this.options.controller.state.layoutName === "shift" && !this.options.controller.state.capsLock) {
      queueMicrotask(() => this.options.controller.consumeOneShotShift());
    }
    this.updateButtonStates();
    queueMicrotask(() => VirtualKeyboard.restoreInstanceCarets());
  }

  private insertAtCaret(text: string) {
    const value = this.value;
    const { start, end } = this.getCaretRange();
    const next = `${value.slice(0, start)}${text}${value.slice(end)}`;
    const caret = start + text.length;
    this.setInput(next, caret, caret);
  }

  private updateButtonStates() {
    if (!this.keyboard) return;
    const value = this.value;
    const { start, end } = this.getCaretRange();
    this.element.dataset.layout = this.options.controller.state.layoutName;
    this.element.querySelectorAll<HTMLButtonElement>("button.hg-button").forEach((button) => {
      const key = button.dataset.skbtn || "";
      button.disabled = this.disabled
        || (key === "{enter}" && !value.trim())
        || ((key === "{bksp}" || key === "{backspace}") && start === 0 && start === end)
        || (this.keyboard?.options.maxLength === value.length && !key.startsWith("{") && key !== " ");
    });
    const shiftButton = this.element.querySelector<HTMLButtonElement>("button[data-skbtn='{shift}']");
    if (shiftButton) {
      const state = this.options.controller.state;
      shiftButton.setAttribute("aria-pressed", String(state.shifted));
      shiftButton.setAttribute("aria-label", state.capsLock ? "Mayúsculas bloqueadas; pulsa para desbloquear" : state.shifted ? "Mayúsculas activadas" : "Activar mayúscula; pulsa dos veces para bloqueo");
    }
  }

  private focusedKeyName() {
    const active = document.activeElement;
    return active instanceof HTMLButtonElement && this.element.contains(active) ? active.dataset.skbtn || "" : "";
  }

  private restoreKeyFocus(key: string, layoutName: string) {
    if (!key || !this.keyboard) return;
    let targetKey = key;
    if (layoutName === "shift" && /^[a-zñ]$/i.test(key)) targetKey = key.toLocaleUpperCase("es");
    else if (layoutName === "default" && /^[A-ZÑ]$/.test(key)) targetKey = key.toLocaleLowerCase("es");
    else if (key === "{numbers}") targetKey = layoutName === "numbers" ? "{symbols}" : "{numbers}";
    else if (key === "{symbols}") targetKey = layoutName === "symbols" ? "{numbers}" : "{symbols}";
    else if (key === "{abc}") targetKey = layoutName === "default" ? "{numbers}" : "{abc}";
    const candidate = this.keyboard.getButtonElement(targetKey);
    const button = Array.isArray(candidate) ? candidate[0] : candidate;
    if (button instanceof HTMLButtonElement && !button.disabled) button.focus({ preventScroll: true });
  }

  private rememberCaret(start: number, end: number) {
    this.lastCaretStart = start;
    this.lastCaretEnd = end;
  }

  private restoreLocalCaret = () => {
    this.keyboard?.setCaretPosition(this.lastCaretStart, this.lastCaretEnd);
  };

  private beginKeyPreview = (event: PointerEvent) => {
    if (!event.isPrimary || event.button !== 0 || !(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLButtonElement>("button.hg-button");
    if (!button || !this.element.contains(button) || button.disabled) return;
    const character = button.dataset.skbtn || "";
    if (!isPrintableKeyCharacter(character)) return;
    this.previewPointerId = event.pointerId;
    this.showKeyPreview(button, character);
  };

  private moveKeyPreview = (event: PointerEvent) => {
    if (event.pointerId !== this.previewPointerId) return;
    const target = document.elementFromPoint(event.clientX, event.clientY);
    const button = target instanceof Element ? target.closest<HTMLButtonElement>("button.hg-button") : null;
    if (!button || !this.element.contains(button) || button.disabled) {
      this.hideKeyPreview();
      return;
    }
    const character = button.dataset.skbtn || "";
    if (isPrintableKeyCharacter(character)) this.showKeyPreview(button, character);
    else this.hideKeyPreview();
  };

  private endKeyPreview = (event: PointerEvent) => {
    if (event.pointerId !== this.previewPointerId) return;
    this.previewPointerId = null;
    this.previewButton = null;
    this.hideKeyPreview();
  };

  private cancelKeyPreview = () => {
    this.previewPointerId = null;
    this.previewButton = null;
    this.hideKeyPreview();
  };

  private showKeyPreview(button: HTMLButtonElement, character: string) {
    if (this.previewHideTimer !== null) {
      clearTimeout(this.previewHideTimer);
      this.previewHideTimer = null;
    }
    const sourceStyles = getComputedStyle(this.element);
    [
      "--kroma-chat-border-subtle",
      "--kroma-chat-canvas",
      "--kroma-elevation-2",
      "--kroma-chat-text-primary",
      "--kroma-chat-font-family",
      "--kroma-chat-weight-semibold",
    ].forEach((token) => {
      const value = sourceStyles.getPropertyValue(token).trim();
      if (value) this.keyPreview.style.setProperty(token, value);
    });
    this.previewButton = button;
    this.keyPreview.textContent = character;
    this.keyPreview.hidden = false;
    this.keyPreview.dataset.visible = "true";
    this.repositionKeyPreview();
  }

  private hideKeyPreview = () => {
    if (this.keyPreview.hidden || this.keyPreview.dataset.visible === "false") return;
    this.keyPreview.dataset.visible = "false";
    if (this.previewHideTimer !== null) clearTimeout(this.previewHideTimer);
    this.previewHideTimer = setTimeout(() => {
      this.keyPreview.hidden = true;
      this.previewHideTimer = null;
    }, 110);
  };

  private repositionKeyPreview = () => {
    if (!this.previewButton || this.keyPreview.hidden) return;
    const keyBounds = this.previewButton.getBoundingClientRect();
    const keyboardBounds = this.element.getBoundingClientRect();
    const popupBounds = this.keyPreview.getBoundingClientRect();
    const popupWidth = popupBounds.width;
    const popupHeight = popupBounds.height;
    const minLeft = Math.min(Math.max(0, keyboardBounds.left), Math.max(0, window.innerWidth - popupWidth));
    const maxLeft = Math.max(minLeft, Math.min(keyboardBounds.right - popupWidth, window.innerWidth - popupWidth));
    const left = Math.min(maxLeft, Math.max(minLeft, keyBounds.left + keyBounds.width / 2 - popupWidth / 2));
    const minTop = Math.min(Math.max(0, keyboardBounds.top), Math.max(0, window.innerHeight - popupHeight));
    const maxTop = Math.max(minTop, Math.min(keyboardBounds.bottom - popupHeight, window.innerHeight - popupHeight));
    const top = Math.min(maxTop, Math.max(minTop, keyBounds.top - popupHeight + 12));
    this.keyPreview.style.left = `${left}px`;
    this.keyPreview.style.top = `${top}px`;
  };

  private notifyChange() {
    this.options.onChange(this.value, this.lastCaretStart, this.lastCaretEnd);
    this.updateButtonStates();
    queueMicrotask(() => VirtualKeyboard.restoreInstanceCarets());
  }

  private static restoreInstanceCarets() {
    VirtualKeyboard.instances.forEach((instance) => instance.keyboard?.setCaretPosition(instance.lastCaretStart, instance.lastCaretEnd));
  }
}

function previousCodePoint(value: string, index: number) {
  if (index <= 0) return 0;
  const previous = index - 1;
  const code = value.charCodeAt(previous);
  return code >= 0xdc00 && code <= 0xdfff && previous > 0 ? previous - 1 : previous;
}

function nextCodePoint(value: string, index: number) {
  if (index >= value.length) return value.length;
  const code = value.charCodeAt(index);
  return code >= 0xd800 && code <= 0xdbff && index + 1 < value.length ? index + 2 : index + 1;
}

function isPrintableKeyCharacter(value: string) {
  return Array.from(value).length === 1 && /^[\p{L}\p{M}\p{N}\p{P}\p{S}]$/u.test(value);
}
