export type VirtualKeyboardState = Readonly<{
  value: string;
  cursor: number;
  shifted: boolean;
  capsLock: boolean;
  symbols: boolean;
  open: boolean;
}>;

export type VirtualKeyboardListener = (state: VirtualKeyboardState) => void;

/** Owns editable text and keyboard state independently from rendered DOM. */
export class VirtualKeyboardController {
  private value = "";
  private cursor = 0;
  private shifted = false;
  private capsLock = false;
  private symbols = false;
  private open: boolean;
  private lastShiftAt = 0;
  private readonly listeners = new Set<VirtualKeyboardListener>();

  constructor(private readonly maxLength = 2000, initiallyOpen = false) {
    this.open = initiallyOpen;
  }

  get state(): VirtualKeyboardState {
    return {
      value: this.value,
      cursor: this.cursor,
      shifted: this.shifted || this.capsLock,
      capsLock: this.capsLock,
      symbols: this.symbols,
      open: this.open,
    };
  }

  subscribe(listener: VirtualKeyboardListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  setValue(value: string, cursor = value.length) {
    this.value = this.truncateAtCodePoint(value, this.maxLength);
    this.cursor = this.snapCursor(Math.min(cursor, this.value.length));
    this.publish();
  }

  insert(text: string, isLetter = false) {
    if (!text || this.value.length >= this.maxLength) return;
    const available = this.maxLength - this.value.length;
    const insertion = this.truncateAtCodePoint(text, available);
    if (!insertion) return;
    this.value = `${this.value.slice(0, this.cursor)}${insertion}${this.value.slice(this.cursor)}`;
    this.cursor += insertion.length;
    if (isLetter && this.shifted && !this.capsLock) this.shifted = false;
    this.publish();
  }

  backspace() {
    if (this.cursor === 0) return;
    const previous = this.previousCodePoint(this.cursor);
    this.value = `${this.value.slice(0, previous)}${this.value.slice(this.cursor)}`;
    this.cursor = previous;
    this.publish();
  }

  moveCursor(direction: -1 | 1) {
    const next = direction < 0 ? this.previousCodePoint(this.cursor) : this.nextCodePoint(this.cursor);
    if (next === this.cursor) return;
    this.cursor = next;
    this.publish();
  }

  setCursor(cursor: number) {
    const next = this.snapCursor(Math.max(0, Math.min(cursor, this.value.length)));
    if (next === this.cursor) return;
    this.cursor = next;
    this.publish();
  }

  toggleShift() {
    const now = Date.now();
    if (this.shifted && now - this.lastShiftAt < 450) {
      this.capsLock = !this.capsLock;
      this.shifted = this.capsLock;
    } else {
      this.shifted = !this.shifted;
      if (!this.shifted) this.capsLock = false;
    }
    this.lastShiftAt = now;
    this.publish();
  }

  toggleSymbols() {
    this.symbols = !this.symbols;
    this.shifted = false;
    this.capsLock = false;
    this.publish();
  }

  showLetters() {
    this.symbols = false;
    this.publish();
  }

  setOpen(open: boolean) {
    if (this.open === open) return;
    this.open = open;
    this.publish();
  }

  clear() {
    this.value = "";
    this.cursor = 0;
    this.shifted = false;
    this.capsLock = false;
    this.publish();
  }

  private previousCodePoint(index: number) {
    if (index <= 0) return 0;
    const previous = index - 1;
    const code = this.value.charCodeAt(previous);
    return code >= 0xdc00 && code <= 0xdfff && previous > 0 ? previous - 1 : previous;
  }

  private nextCodePoint(index: number) {
    if (index >= this.value.length) return this.value.length;
    const code = this.value.charCodeAt(index);
    return code >= 0xd800 && code <= 0xdbff && index + 1 < this.value.length ? index + 2 : index + 1;
  }

  private snapCursor(index: number) {
    if (index <= 0 || index >= this.value.length) return index;
    const current = this.value.charCodeAt(index);
    const previous = this.value.charCodeAt(index - 1);
    return current >= 0xdc00 && current <= 0xdfff && previous >= 0xd800 && previous <= 0xdbff ? index - 1 : index;
  }

  private truncateAtCodePoint(value: string, maxLength: number) {
    let end = Math.max(0, Math.min(value.length, maxLength));
    if (end > 0 && end < value.length) {
      const current = value.charCodeAt(end);
      const previous = value.charCodeAt(end - 1);
      if (current >= 0xdc00 && current <= 0xdfff && previous >= 0xd800 && previous <= 0xdbff) end--;
    }
    return value.slice(0, end);
  }

  private publish() {
    const state = this.state;
    this.listeners.forEach((listener) => listener(state));
  }
}
