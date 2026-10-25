export type VirtualTextDisplayCallbacks = {
  onCaretChange: (start: number, end: number) => void;
  onPhysicalKey: (event: KeyboardEvent) => void;
  onPhysicalKeyRelease: () => void;
};

/** Visual projection of simple-keyboard's value/caret; it never stores authoritative text. */
export class VirtualTextDisplay {
  readonly element: HTMLDivElement;
  private readonly textLayer: HTMLSpanElement;
  private value = "";
  private cursorStart = 0;
  private cursorEnd = 0;
  private disabled = false;
  private visible = true;

  constructor(
    inputLabel: string,
    private readonly placeholder: string,
    private readonly callbacks: VirtualTextDisplayCallbacks,
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
      const cursor = this.cursorAtPoint(event.clientX, event.clientY);
      this.callbacks.onCaretChange(cursor, cursor);
    });
    this.element.addEventListener("keydown", (event) => this.callbacks.onPhysicalKey(event));
    this.element.addEventListener("keyup", () => this.callbacks.onPhysicalKeyRelease());
    this.render();
  }

  update(value: string, cursorStart = value.length, cursorEnd = cursorStart) {
    this.value = value;
    this.cursorStart = Math.max(0, Math.min(cursorStart, value.length));
    this.cursorEnd = Math.max(0, Math.min(cursorEnd, value.length));
    this.render();
  }

  setVisible(visible: boolean) {
    this.visible = visible;
    this.element.hidden = !visible;
    if (visible) this.render();
  }

  setEditing(editing: boolean) {
    this.element.dataset.editing = String(editing);
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
    this.element.replaceChildren();
  }

  private render() {
    if (!this.visible) return;
    this.textLayer.replaceChildren();
    if (!this.value) {
      this.textLayer.append(this.createCaret());
      const placeholder = document.createElement("span");
      placeholder.className = "kroma-chat__virtual-display-placeholder";
      placeholder.textContent = this.placeholder;
      this.textLayer.append(placeholder);
    } else {
      const selectionStart = Math.min(this.cursorStart, this.cursorEnd);
      const selectionEnd = Math.max(this.cursorStart, this.cursorEnd);
      let offset = 0;
      for (const character of this.value) {
        if (this.cursorStart === offset) this.textLayer.append(this.createCaret());
        const characterNode = document.createElement("span");
        characterNode.dataset.start = String(offset);
        characterNode.dataset.end = String(offset + character.length);
        if (selectionStart !== selectionEnd && offset >= selectionStart && offset < selectionEnd) {
          characterNode.className = "kroma-chat__virtual-display-selection";
        }
        characterNode.textContent = character;
        this.textLayer.append(characterNode);
        offset += character.length;
      }
      if (this.cursorStart === offset) this.textLayer.append(this.createCaret());
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
    let nearest = { index: this.value.length, distance: Number.POSITIVE_INFINITY };
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
}
