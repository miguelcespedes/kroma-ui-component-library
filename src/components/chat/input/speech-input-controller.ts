export type SpeechInputState = "idle" | "starting" | "listening" | "stopping" | "error" | "unsupported";

export type SpeechInputStatus = Readonly<{
  state: SpeechInputState;
  message: string;
}>;

export type SpeechInputTranscript = Readonly<{
  transcript: string;
  finalTranscript: string;
  interimTranscript: string;
}>;

export type SpeechRecognitionAlternativeLike = { transcript: string };
export type SpeechRecognitionResultLike = {
  readonly isFinal: boolean;
  readonly length: number;
  readonly [index: number]: SpeechRecognitionAlternativeLike;
};
export type SpeechRecognitionResultListLike = {
  readonly length: number;
  readonly [index: number]: SpeechRecognitionResultLike;
};
export type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onresult: ((event: { results: SpeechRecognitionResultListLike }) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};

export type SpeechRecognitionFactory = () => SpeechRecognitionLike;
export type SpeechInputStatusListener = (status: SpeechInputStatus) => void;
export type SpeechInputResultListener = (result: SpeechInputTranscript) => void;

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

const DEFAULT_STATUS: SpeechInputStatus = { state: "idle", message: "" };

/** Owns Web Speech API lifecycle and exposes transcripts without coupling them to chat state. */
export class SpeechInputController {
  private readonly statusListeners = new Set<SpeechInputStatusListener>();
  private readonly resultListeners = new Set<SpeechInputResultListener>();
  private recognition: SpeechRecognitionLike | null = null;
  private currentStatus: SpeechInputStatus;
  private destroyed = false;

  constructor(private readonly factory = detectSpeechRecognitionFactory()) {
    this.currentStatus = factory
      ? DEFAULT_STATUS
      : { state: "unsupported", message: unsupportedMessage() };
  }

  get status() {
    return this.currentStatus;
  }

  get supported() {
    return this.factory !== null;
  }

  subscribeStatus(listener: SpeechInputStatusListener) {
    this.statusListeners.add(listener);
    listener(this.currentStatus);
    return () => this.statusListeners.delete(listener);
  }

  subscribeResults(listener: SpeechInputResultListener) {
    this.resultListeners.add(listener);
    return () => this.resultListeners.delete(listener);
  }

  start() {
    if (this.destroyed || !this.factory || ["starting", "listening", "stopping"].includes(this.currentStatus.state)) return false;
    if (this.recognition) {
      const previous = this.recognition;
      this.detachRecognition(previous);
      try {
        previous.abort();
      } catch {
        // A previous failed session may already have ended.
      }
    }

    let recognition: SpeechRecognitionLike;
    try {
      recognition = this.factory();
    } catch {
      this.publishStatus("error", "No se pudo preparar el reconocimiento de voz. Puedes escribir el mensaje.");
      return false;
    }

    recognition.lang = "es-PE";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    this.recognition = recognition;
    this.publishStatus("starting", "Preparando el dictado…");

    recognition.onstart = () => {
      if (this.recognition !== recognition || this.destroyed) return;
      this.publishStatus("listening", "Escuchando. Puedes detener el dictado cuando quieras.");
    };
    recognition.onresult = (event) => {
      if (this.recognition !== recognition || this.destroyed) return;
      const finalParts: string[] = [];
      const interimParts: string[] = [];
      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript || "";
        (result.isFinal ? finalParts : interimParts).push(transcript);
      }
      const finalTranscript = finalParts.join("");
      const interimTranscript = interimParts.join("");
      this.resultListeners.forEach((listener) => listener({
        transcript: `${finalTranscript}${interimTranscript}`,
        finalTranscript,
        interimTranscript,
      }));
    };
    recognition.onerror = (event) => {
      if (this.recognition !== recognition || this.destroyed) return;
      this.publishStatus("error", messageForSpeechError(event.error));
    };
    recognition.onend = () => {
      if (this.recognition !== recognition || this.destroyed) return;
      this.recognition = null;
      if (this.currentStatus.state === "error") return;
      if (this.currentStatus.state === "starting") {
        this.publishStatus("error", "El reconocimiento terminó antes de empezar. Puedes intentarlo de nuevo o escribir.");
        return;
      }
      this.publishStatus("idle", "");
    };

    try {
      recognition.start();
      return true;
    } catch (error) {
      this.detachRecognition(recognition);
      this.publishStatus("error", messageForStartError(error));
      return false;
    }
  }

  stop() {
    if (!this.recognition || !["starting", "listening"].includes(this.currentStatus.state)) return false;
    const recognition = this.recognition;
    this.publishStatus("stopping", "Deteniendo el dictado…");
    try {
      recognition.stop();
    } catch {
      this.detachRecognition(recognition);
      this.publishStatus("error", "No se pudo detener el dictado correctamente. Puedes seguir escribiendo.");
      return false;
    }
    return true;
  }

  cancel() {
    const recognition = this.recognition;
    if (recognition) {
      this.detachRecognition(recognition);
      try {
        recognition.abort();
      } catch {
        // The recognition may already have ended; cleanup is still complete.
      }
    }
    if (!this.destroyed && this.currentStatus.state !== "unsupported") this.publishStatus("idle", "");
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    const recognition = this.recognition;
    if (recognition) {
      this.detachRecognition(recognition);
      try {
        recognition.abort();
      } catch {
        // Ignore an already-ended recognition instance.
      }
    }
    this.statusListeners.clear();
    this.resultListeners.clear();
  }

  private detachRecognition(recognition: SpeechRecognitionLike) {
    if (this.recognition === recognition) this.recognition = null;
    recognition.onstart = null;
    recognition.onend = null;
    recognition.onerror = null;
    recognition.onresult = null;
  }

  private publishStatus(state: SpeechInputState, message: string) {
    this.currentStatus = { state, message };
    this.statusListeners.forEach((listener) => listener(this.currentStatus));
  }
}

export function detectSpeechRecognitionFactory(scope: Window | null = typeof window === "undefined" ? null : window) {
  if (!scope || !scope.isSecureContext) return null;
  const speechWindow = scope as SpeechRecognitionWindow;
  const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
  return Recognition ? () => new Recognition() : null;
}

function unsupportedMessage() {
  return "El dictado por voz no está disponible en este navegador o contexto. Puedes escribir el mensaje.";
}

function messageForSpeechError(error: string) {
  switch (error) {
    case "not-allowed":
    case "service-not-allowed":
      return "No se concedió permiso para usar el micrófono. Puedes escribir el mensaje.";
    case "audio-capture":
      return "No se encontró un micrófono disponible. Puedes escribir el mensaje.";
    case "no-speech":
      return "No se detectó voz. Puedes intentarlo de nuevo o escribir el mensaje.";
    case "network":
      return "El servicio de voz del navegador no pudo conectarse. Verifica tu conexión o inténtalo de nuevo; también puedes escribir el mensaje.";
    default:
      return "Ocurrió un error durante el dictado. Puedes intentarlo de nuevo o escribir el mensaje.";
  }
}

function messageForStartError(error: unknown) {
  if (typeof DOMException !== "undefined" && error instanceof DOMException && error.name === "NotAllowedError") {
    return messageForSpeechError("not-allowed");
  }
  return "No se pudo iniciar el dictado. Comprueba el permiso del micrófono o escribe el mensaje.";
}
