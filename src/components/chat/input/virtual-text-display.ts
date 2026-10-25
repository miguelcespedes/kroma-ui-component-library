import { VirtualKeyboardController } from "./virtual-keyboard-controller";

/** Read-only DOM projection of controlled text; edits are delegated to the controller. */
export class VirtualTextDisplay {
  readonly element: HTMLDivElement;
  private readonly textLayer: HTMLSpanElement;
  private readonly unsubscribe: () => void;
  private disabled = false;
  private visible = true;

  constructor(
    private readonly controller: VirtualKeyboardController,
    inputLabel: string,
    private readonly placeholder: string,
  ) {
    this.element = document.createElement("div");
    this.element.className = "kroma-chat__virtual-display";
    this.element.setAttribute("role", "textbox");
    this.element.setAttribute("aria-label", inputLabel);
    this.element.setAttribute("aria-multiline", "true");
    this.element.setAttribute("aria-readonly", "false");
    this.element.tabIndex = 0;

    this.textLayer = document.createElement("span");
    this.textLayer.className = "kroma-chat__virtual-display-text";
    this.element.append(this.textLayer);
    this.element.addEventListener("click", (event) => {
      if (this.disabled) return;
      this.controller.setCursor(this.cursorAtPoint(event.clientX, event.clientY));
      this.controller.setOpen(true);
    });
    this.element.addEventListener("keydown", (event) => this.handlePhysicalKey(event));
    this.unsubscribe = controller.subscribe(() => { if (this.visible) this.render(); });
    this.render();
  }

  setVisible(visible: boolean) {
    if (this.visible === visible) return;
    this.visible = visible;
    this.element.hidden = !visible;
    if (visible) this.render();
  }

  setDisabled(disabled: boolean) {
    this.disabled = disabled;
    this.element.setAttribute("aria-disabled", String(disabled));
    this.element.tabIndex = disabled ? -1 : 0;
  }

  setError(messageId: string | null) {
    if (messageId) this.element.setAttribute("aria-describedby", messageId);
    else this.element.removeAttribute("aria-describedby");
  }

  destroy() {
    this.unsubscribe();
    this.element.replaceChildren();
  }

  private render() {
    const { value, cursor } = this.controller.state;
    this.textLayer.replaceChildren();
    if (!value) {
      this.textLayer.append(this.createCaret());
      const placeholder = document.createElement("span");
      placeholder.className = "kroma-chat__virtual-display-placeholder";
      placeholder.textContent = this.placeholder;
      this.textLayer.append(placeholder);
    } else {
      let offset = 0;
      for (const character of value) {
        if (cursor === offset) this.textLayer.append(this.createCaret());
        const characterNode = document.createElement("span");
        characterNode.dataset.start = String(offset);
        characterNode.dataset.end = String(offset + character.length);
        characterNode.textContent = character;
        this.textLayer.append(characterNode);
        offset += character.length;
      }
      if (cursor === offset) this.textLayer.append(this.createCaret());
    }
    this.keepCaretVisible();
  }

  private createCaret() {
    const caret = document.createElement("span");
    caret.className = "kroma-chat__virtual-display-caret";
    caret.setAttribute("aria-hidden", "true");
    return caret;
  }

  private cursorAtPoint(x: number, y: number) {
    const characters = [...this.textLayer.querySelectorAll<HTMLElement>("[data-start][data-end]")];
    if (!characters.length) return 0;
    let nearest = { index: this.controller.state.value.length, distance: Number.POSITIVE_INFINITY };
    characters.forEach((character) => {
      const rect = character.getBoundingClientRect();
      const verticalDistance = y < rect.top ? rect.top - y : y > rect.bottom ? y - rect.bottom : 0;
      const horizontalDistance = x < rect.left ? rect.left - x : x > rect.right ? x - rect.right : 0;
      const distance = verticalDistance * 2 + horizontalDistance;
      if (distance < nearest.distance) {
        const midpoint = rect.left + rect.width / 2;
        nearest = { index: Number(x < midpoint ? character.dataset.start : character.dataset.end), distance };
      }
    });
    return nearest.index;
  }

  private keepCaretVisible() {
    const caret = this.textLayer.querySelector<HTMLElement>(".kroma-chat__virtual-display-caret");
    if (!caret) return;
    const viewport = this.element.getBoundingClientRect();
    const rect = caret.getBoundingClientRect();
    if (rect.bottom > viewport.bottom) this.element.scrollTop += rect.bottom - viewport.bottom;
    else if (rect.top < viewport.top) this.element.scrollTop -= viewport.top - rect.top;
  }

  private handlePhysicalKey(event: KeyboardEvent) {
    if (this.disabled || event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "Backspace") {
      event.preventDefault();
      this.controller.backspace();
    } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      this.controller.moveCursor(event.key === "ArrowLeft" ? -1 : 1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      this.controller.insert("\n");
    } else if (event.key.length === 1) {
      event.preventDefault();
      this.controller.insert(event.key);
    }
  }
}
