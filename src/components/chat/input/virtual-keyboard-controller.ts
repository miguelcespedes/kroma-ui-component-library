export type VirtualKeyboardLayoutName = "default" | "shift" | "numbers" | "symbols";

export type VirtualKeyboardState = Readonly<{
  layoutName: VirtualKeyboardLayoutName;
  shifted: boolean;
  capsLock: boolean;
  open: boolean;
}>;

export type VirtualKeyboardListener = (state: VirtualKeyboardState) => void;

/** Tracks layout presentation only; simple-keyboard owns virtual text and caret state. */
export class VirtualKeyboardController {
  private layoutName: VirtualKeyboardLayoutName = "default";
  private capsLock = false;
  private open: boolean;
  private lastShiftAt = 0;
  private readonly listeners = new Set<VirtualKeyboardListener>();

  constructor(initiallyOpen = false) {
    this.open = initiallyOpen;
  }

  get state(): VirtualKeyboardState {
    return {
      layoutName: this.layoutName,
      shifted: this.layoutName === "shift",
      capsLock: this.capsLock,
      open: this.open,
    };
  }

  subscribe(listener: VirtualKeyboardListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  setLayout(layoutName: VirtualKeyboardLayoutName) {
    if (this.layoutName === layoutName) return;
    this.layoutName = layoutName;
    if (layoutName !== "shift") this.capsLock = false;
    this.publish();
  }

  pressShift() {
    const now = Date.now();
    if (this.capsLock) {
      this.capsLock = false;
      this.layoutName = "default";
    } else if (this.layoutName === "shift" && now - this.lastShiftAt < 450) {
      this.capsLock = true;
      this.layoutName = "shift";
    } else {
      this.layoutName = this.layoutName === "shift" ? "default" : "shift";
    }
    this.lastShiftAt = now;
    this.publish();
  }

  consumeOneShotShift() {
    if (this.layoutName !== "shift" || this.capsLock) return;
    this.layoutName = "default";
    this.publish();
  }

  setOpen(open: boolean) {
    if (this.open === open) return;
    this.open = open;
    this.publish();
  }

  private publish() {
    const state = this.state;
    this.listeners.forEach((listener) => listener(state));
  }
}
