export type SpeechOutputState = "idle" | "speaking" | "error" | "unsupported";

export type SpeechOutputStatus = Readonly<{
  state: SpeechOutputState;
  messageId: string | null;
  message: string;
}>;

export type SpeechOutputUtteranceLike = Pick<SpeechSynthesisUtterance, "text" | "lang" | "voice" | "onstart" | "onend" | "onerror">;

export type SpeechOutputSynthesisLike = {
  readonly speaking: boolean;
  cancel(): void;
  speak(utterance: SpeechOutputUtteranceLike): void;
  getVoices(): SpeechSynthesisVoice[];
};

export type SpeechOutputListener = (status: SpeechOutputStatus) => void;
export type SpeechOutputUtteranceFactory = (text: string) => SpeechOutputUtteranceLike;

const IDLE_STATUS: SpeechOutputStatus = { state: "idle", messageId: null, message: "" };

/** Handles explicit, per-message browser speech playback and its lifecycle. */
export class SpeechOutputController {
  private readonly listeners = new Set<SpeechOutputListener>();
  private currentStatus: SpeechOutputStatus;
  private utteranceSequence = 0;
  private destroyed = false;

  constructor(
    private readonly synthesis = detectSpeechSynthesis(),
    private readonly createUtterance = detectUtteranceFactory(),
  ) {
    this.currentStatus = this.supported
      ? IDLE_STATUS
      : { state: "unsupported", messageId: null, message: "La lectura en voz alta no está disponible en este navegador." };
  }

  get status() {
    return this.currentStatus;
  }

  get supported() {
    return this.synthesis !== null && this.createUtterance !== null;
  }

  subscribe(listener: SpeechOutputListener) {
    this.listeners.add(listener);
    listener(this.currentStatus);
    return () => this.listeners.delete(listener);
  }

  toggle(messageId: string, text: string) {
    if (this.destroyed || !this.supported || !text.trim()) return false;
    if (this.currentStatus.state === "speaking" && this.currentStatus.messageId === messageId) {
      this.stop();
      return true;
    }

    this.cancelCurrentUtterance();
    const sequence = ++this.utteranceSequence;
    const utterance = this.createUtterance!(text);
    utterance.lang = "es-PE";
    utterance.voice = this.selectSpanishVoice(this.synthesis!.getVoices());
    this.publish({ state: "speaking", messageId, message: "" });
    utterance.onstart = () => {
      if (!this.destroyed && this.utteranceSequence === sequence && this.currentStatus.messageId === messageId) {
        this.publish({ state: "speaking", messageId, message: "" });
      }
    };
    utterance.onend = () => {
      if (!this.destroyed && this.utteranceSequence === sequence && this.currentStatus.messageId === messageId) this.publish(IDLE_STATUS);
    };
    utterance.onerror = () => {
      if (!this.destroyed && this.utteranceSequence === sequence && this.currentStatus.messageId === messageId) {
        this.publish({ state: "error", messageId, message: "No se pudo reproducir este mensaje. Puedes intentarlo de nuevo." });
      }
    };

    try {
      this.synthesis!.speak(utterance);
      return true;
    } catch {
      this.publish({ state: "error", messageId, message: "No se pudo iniciar la lectura en voz alta." });
      return false;
    }
  }

  stop() {
    if (this.currentStatus.state !== "speaking") return false;
    this.cancelCurrentUtterance();
    this.publish(IDLE_STATUS);
    return true;
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.cancelCurrentUtterance();
    this.listeners.clear();
  }

  private cancelCurrentUtterance() {
    this.utteranceSequence += 1;
    if (this.currentStatus.state !== "speaking") return;
    try {
      this.synthesis?.cancel();
    } catch {
      // The browser may have already stopped its current utterance.
    }
  }

  private selectSpanishVoice(voices: SpeechSynthesisVoice[]) {
    return voices.find((voice) => voice.lang.toLowerCase() === "es-pe")
      || voices.find((voice) => voice.lang.toLowerCase().startsWith("es"))
      || null;
  }

  private publish(status: SpeechOutputStatus) {
    this.currentStatus = status;
    this.listeners.forEach((listener) => listener(status));
  }
}

function detectSpeechSynthesis() {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const synthesis = window.speechSynthesis;
  return {
    get speaking() { return synthesis.speaking; },
    cancel: () => synthesis.cancel(),
    speak: (utterance: SpeechOutputUtteranceLike) => synthesis.speak(utterance as SpeechSynthesisUtterance),
    getVoices: () => synthesis.getVoices(),
  } satisfies SpeechOutputSynthesisLike;
}

function detectUtteranceFactory(): SpeechOutputUtteranceFactory | null {
  if (typeof SpeechSynthesisUtterance === "undefined") return null;
  return (text) => new SpeechSynthesisUtterance(text);
}
