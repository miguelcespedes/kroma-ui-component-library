import { VirtualKeyboardController } from "./virtual-keyboard-controller";
import { createVirtualKeyboardLayout, type VirtualKey } from "./virtual-keyboard-layout";

export type VirtualKeyboardOptions = {
  controller: VirtualKeyboardController;
  onSend?: () => void;
  disabled?: boolean;
  preview?: boolean;
  label?: string;
};

/** Semantic button-based keyboard renderer; text editing remains in its controller. */
export class VirtualKeyboard {
  readonly element: HTMLDivElement;
  private disabled: boolean;
  private readonly unsubscribe: () => void;

  constructor(private readonly options: VirtualKeyboardOptions) {
    this.disabled = Boolean(options.disabled);
    this.element = document.createElement("div");
    this.element.className = "kroma-chat__virtual-keyboard";
    this.element.setAttribute("role", "group");
    this.element.setAttribute("aria-label", options.label || "Teclado virtual en español");
    if (options.preview) this.element.dataset.preview = "true";
    this.unsubscribe = options.controller.subscribe(() => this.render());
    this.render();
  }

  setDisabled(disabled: boolean) {
    if (this.disabled === disabled) return;
    this.disabled = disabled;
    this.render();
  }

  destroy() {
    this.unsubscribe();
    this.element.replaceChildren();
  }

  private render() {
    const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusedKey = activeElement && this.element.contains(activeElement) ? activeElement.dataset.keyId : undefined;
    const state = this.options.controller.state;
    const layout = createVirtualKeyboardLayout(state.symbols, state.shifted);
    this.element.dataset.layout = layout.id;
    this.element.hidden = !state.open;
    this.element.replaceChildren();
    if (!state.open) return;

    layout.rows.forEach((keys, rowIndex) => {
      const row = document.createElement("div");
      row.className = "kroma-chat__virtual-keyboard-row";
      row.dataset.row = String(rowIndex + 1);
      keys.forEach((key) => row.append(this.createKey(key, state.value.trim().length > 0)));
      this.element.append(row);
    });
    if (focusedKey && state.open) {
      const fallbackKey = focusedKey === "symbols" || focusedKey === "letters-bottom" ? "letters" : focusedKey === "letters" ? "symbols" : focusedKey;
      const replacement = this.element.querySelector<HTMLButtonElement>(`[data-key-id="${CSS.escape(focusedKey)}"], [data-key-id="${CSS.escape(fallbackKey)}"]`);
      if (replacement && !replacement.disabled) replacement.focus({ preventScroll: true });
    }
  }

  private createKey(key: VirtualKey, hasText: boolean) {
    const state = this.options.controller.state;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "kroma-chat__virtual-key";
    button.dataset.action = key.action;
    button.dataset.keyId = key.id;
    button.dataset.flex = String(key.flex || 1);
    if (key.functional) button.classList.add("kroma-chat__virtual-key--functional");
    button.textContent = this.keyLabel(key);
    button.disabled = this.disabled
      || (key.action === "send" && !hasText)
      || (key.action === "backspace" && state.cursor === 0)
      || (key.action === "cursor-left" && state.cursor === 0)
      || (key.action === "cursor-right" && state.cursor === state.value.length);
    if (key.action === "shift") {
      button.setAttribute("aria-pressed", String(state.shifted));
      button.setAttribute("aria-label", state.capsLock ? "Mayúsculas bloqueadas; pulsa para desbloquear" : key.ariaLabel || "Activar mayúscula; pulsa dos veces para bloqueo");
      if (state.capsLock) button.dataset.capsLock = "true";
    } else if (key.ariaLabel) {
      button.setAttribute("aria-label", key.ariaLabel);
    }
    button.addEventListener("click", () => this.activate(key));
    return button;
  }

  private keyLabel(key: VirtualKey) {
    if (key.action === "space") return "Espacio";
    if (key.action === "backspace") return "⌫";
    if (key.action === "shift") return "⇧";
    if (key.action === "cursor-left") return "←";
    if (key.action === "cursor-right") return "→";
    return key.label;
  }

  private activate(key: VirtualKey) {
    const controller = this.options.controller;
    switch (key.action) {
      case "character": controller.insert(key.value || key.label, layoutIsLetter(key)); break;
      case "space": controller.insert(" "); break;
      case "comma": controller.insert(","); break;
      case "period": controller.insert("."); break;
      case "backspace": controller.backspace(); break;
      case "cursor-left": controller.moveCursor(-1); break;
      case "cursor-right": controller.moveCursor(1); break;
      case "shift": controller.toggleShift(); break;
      case "symbols": controller.toggleSymbols(); break;
      case "letters": controller.showLetters(); break;
      case "send": if (!this.disabled && controller.state.value.trim()) this.options.onSend?.(); break;
    }
  }
}

function layoutIsLetter(key: VirtualKey) {
  return key.action === "character" && Boolean(key.value) && /^[a-zñáéíóúü]$/iu.test(key.value || "");
}
