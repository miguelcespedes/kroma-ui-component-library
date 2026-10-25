import { AudioCapture, type AudioCaptureEvent } from "./audio-capture";
import {
  getSharedWhisperTranscriptionAdapter,
  type WhisperProgressListener,
  type WhisperTranscriptionPort,
} from "./whisper-transcription-adapter";

export type SpeechInputState =
  | "idle"
  | "preparing"
  | "downloading"
  | "loading"
  | "ready"
  | "recording"
  | "transcribing"
  | "completed"
  | "error"
  | "unsupported";

export type SpeechInputStatus = Readonly<{
  state: SpeechInputState;
  message: string;
  progress: number | null;
  modelReady: boolean;
}>;

export type SpeechInputTranscript = Readonly<{
  transcript: string;
  finalTranscript: string;
  interimTranscript: string;
}>;

export type SpeechInputStatusListener = (status: SpeechInputStatus) => void;
export type SpeechInputResultListener = (result: SpeechInputTranscript) => void;
export type AudioCapturePort = {
  start(): Promise<void>;
  stop(): Promise<File>;
  cancel(): void;
  destroy(): void;
};
export type SpeechInputControllerOptions = Readonly<{
  adapter?: WhisperTranscriptionPort;
  createCapture?: (onEvent: (event: AudioCaptureEvent) => void) => AudioCapturePort;
  supported?: () => boolean;
}>;

const DEFAULT_STATUS: SpeechInputStatus = {
  state: "idle",
  message: "",
  progress: null,
  modelReady: false,
};

/** Public speech-input facade. Coordinates local model preparation, short capture, and transcription. */
export class SpeechInputController {
  private readonly statusListeners = new Set<SpeechInputStatusListener>();
  private readonly resultListeners = new Set<SpeechInputResultListener>();
  private readonly adapter: WhisperTranscriptionPort;
  private readonly createCapture: NonNullable<SpeechInputControllerOptions["createCapture"]>;
  private readonly isSupported: () => boolean;
  private currentStatus: SpeechInputStatus;
  private capture: AudioCapturePort | null = null;
  private transcriptionAbort: AbortController | null = null;
  private requestSequence = 0;
  private destroyed = false;
  private readonly unsubscribePreparation: (() => void) | null;

  constructor(options: SpeechInputControllerOptions = {}) {
    this.adapter = options.adapter ?? getSharedWhisperTranscriptionAdapter();
    this.adapter.retain?.();
    this.createCapture = options.createCapture ?? ((onEvent) => new AudioCapture({ onEvent }));
    this.isSupported = options.supported ?? detectSpeechInputSupport;
    this.currentStatus = this.isSupported()
      ? { ...DEFAULT_STATUS, modelReady: this.adapter.ready }
      : { ...DEFAULT_STATUS, state: "unsupported", message: unsupportedMessage() };
    if (this.adapter.ready && this.isSupported()) {
      this.currentStatus = { ...this.currentStatus, state: "ready" };
    }
    this.unsubscribePreparation = this.adapter.subscribePreparation?.((state) => {
      if (this.destroyed || !this.isSupported() || ["recording", "transcribing"].includes(this.currentStatus.state)) return;
      if (state === "ready") {
        this.publish({ ...DEFAULT_STATUS, state: "ready", modelReady: true });
      } else if (state === "error") {
        this.publish({ ...DEFAULT_STATUS, state: "error", modelReady: false });
      } else if (state === "idle" && !this.adapter.ready) {
        this.publish({ ...DEFAULT_STATUS, state: "idle", modelReady: false });
      }
    }) ?? null;
  }

  get status() {
    return this.currentStatus;
  }

  get supported() {
    return this.isSupported();
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

  /** The first microphone activation only requests model-download consent. */
  async start() {
    if (this.destroyed || !this.supported || !this.adapter.ready || this.isBusy()) return false;
    return this.startCapture();
  }

  /** Stops recording and transcribes once. No partial transcript is fabricated. */
  async stop() {
    if (!this.capture || this.currentStatus.state !== "recording") return false;
    const capture = this.capture;
    this.publish({ ...this.currentStatus, state: "transcribing", progress: null, message: "Transcribiendo audio…" });
    let file: File;
    try {
      file = await capture.stop();
    } catch (error) {
      if (this.capture === capture) this.capture = null;
      this.publish({
        ...this.currentStatus,
        state: "error",
        message: errorName(error) === "EmptyAudioError" ? "No se detectó voz" : "No fue posible procesar el audio. Puedes intentarlo de nuevo o escribir el mensaje.",
      });
      return false;
    }
    if (this.destroyed || this.capture !== capture) return false;
    this.capture = null;
    const requestId = ++this.requestSequence;
    const abortController = new AbortController();
    this.transcriptionAbort = abortController;
    const onProgress: WhisperProgressListener = ({ stage, progress }) => {
      if (!this.isCurrent(requestId)) return;
      const percent = Math.round(Math.max(0, Math.min(1, progress)) * 100);
      this.publish({
        ...this.currentStatus,
        state: "transcribing",
        progress: percent,
        message: "Transcribiendo audio…",
      });
    };
    try {
      const transcript = await this.adapter.transcribe(file, onProgress, abortController.signal);
      if (!this.isCurrent(requestId)) return false;
      if (!transcript.trim()) {
        this.publish({
          ...DEFAULT_STATUS,
          state: "completed",
          modelReady: true,
          message: "No se detectó voz. Puedes intentarlo de nuevo o escribir el mensaje.",
        });
        return false;
      }
      const finalTranscript = transcript.trim();
      this.resultListeners.forEach((listener) => listener({
        transcript: finalTranscript,
        finalTranscript,
        interimTranscript: "",
      }));
      this.publish({
        ...DEFAULT_STATUS,
        state: "completed",
        modelReady: true,
        message: "Dictado agregado. Revísalo y envíalo cuando quieras.",
      });
      return true;
    } catch (error) {
      if (!this.isCurrent(requestId)) return false;
      if (isAbortError(error)) {
        this.publish({ ...DEFAULT_STATUS, state: "ready", modelReady: this.adapter.ready, message: "Transcripción cancelada. Puedes grabar de nuevo o escribir." });
      } else {
        this.publish({
          ...DEFAULT_STATUS,
          state: "error",
          modelReady: this.adapter.ready,
          message: "No fue posible procesar el audio. Puedes intentarlo de nuevo o escribir el mensaje.",
        });
      }
      return false;
    } finally {
      if (this.transcriptionAbort === abortController) this.transcriptionAbort = null;
    }
  }

  cancel() {
    this.requestSequence += 1;
    this.transcriptionAbort?.abort();
    this.transcriptionAbort = null;
    this.capture?.cancel();
    this.capture?.destroy();
    this.capture = null;
    if (!this.destroyed) {
      this.publish({
        ...DEFAULT_STATUS,
        state: this.adapter.ready ? "ready" : "idle",
        modelReady: this.adapter.ready,
      });
    }
  }

  destroy() {
    if (this.destroyed) return;
    this.cancel();
    this.destroyed = true;
    this.unsubscribePreparation?.();
    this.adapter.release?.();
    this.statusListeners.clear();
    this.resultListeners.clear();
  }

  private async startCapture() {
    const requestId = ++this.requestSequence;
    const capture = this.createCapture((event) => this.handleCaptureEvent(event, capture));
    this.capture = capture;
    this.publish({
      ...this.currentStatus,
      state: "recording",
      progress: null,
      modelReady: true,
      message: "Solicitando acceso al micrófono…",
    });
    try {
      await capture.start();
      if (!this.isCurrent(requestId) || this.capture !== capture) {
        capture.cancel();
        capture.destroy();
        return false;
      }
      this.publish({ ...this.currentStatus, state: "recording", message: "Escuchando… Pulsa el micrófono para detener y transcribir." });
      return true;
    } catch (error) {
      if (this.capture === capture) this.capture = null;
      capture.destroy();
      if (!this.isCurrent(requestId)) return false;
      this.publish({
        ...this.currentStatus,
        state: "error",
        message: captureErrorMessage(error),
      });
      return false;
    }
  }

  private handleCaptureEvent(event: AudioCaptureEvent, capture: AudioCapturePort) {
    if (this.capture !== capture || this.destroyed) return;
    if (event === "limit") {
      this.publish({ ...this.currentStatus, message: "Límite de 30 segundos alcanzado. Transcribiendo audio…" });
      void this.stop();
    } else if (event === "muted") {
      this.publish({ ...this.currentStatus, message: "El micrófono está silenciado. Revisa el dispositivo o continúa escribiendo." });
    } else if (event === "resumed") {
      this.publish({ ...this.currentStatus, message: "Escuchando… Pulsa el micrófono para detener y transcribir." });
    } else if (event === "interrupted" || event === "error") {
      capture.cancel();
      this.capture = null;
      this.publish({ ...this.currentStatus, state: "error", message: "Se perdió la captura del micrófono. Puedes volver a intentarlo o escribir el mensaje." });
    }
  }

  private isBusy() {
    return ["downloading", "loading", "recording", "transcribing"].includes(this.currentStatus.state);
  }

  private isCurrent(requestId: number) {
    return !this.destroyed && requestId === this.requestSequence;
  }

  private publish(status: SpeechInputStatus) {
    this.currentStatus = status;
    this.statusListeners.forEach((listener) => listener(this.currentStatus));
  }
}

export function detectSpeechInputSupport(scope: Window | null = typeof window === "undefined" ? null : window) {
  if (!scope?.isSecureContext || !scope.navigator?.mediaDevices?.getUserMedia) return false;
  if (typeof MediaRecorder === "undefined") return false;
  // browser-whisper requires isolation for its threaded WASM backend; WebGPU then remains an automatic fast path.
  return scope.crossOriginIsolated === true;
}

function unsupportedMessage() {
  return "El dictado local requiere un navegador compatible, acceso al micrófono y aislamiento seguro de origen. Puedes escribir el mensaje.";
}

function captureErrorMessage(error: unknown) {
  switch (errorName(error)) {
    case "NotAllowedError":
    case "SecurityError":
      return "No se concedió permiso para usar el micrófono. Puedes revisar el permiso del sitio o escribir el mensaje.";
    case "NotFoundError":
    case "DevicesNotFoundError":
      return "No se encontró un micrófono disponible. Conecta uno o escribe el mensaje.";
    case "NotReadableError":
    case "TrackStartError":
      return "No se pudo acceder al micrófono. Comprueba que no esté ocupado o desconectado.";
    case "NotSupportedError":
      return "Este navegador no ofrece captura de audio compatible para el dictado local.";
    case "AbortError":
      return "Se canceló el acceso al micrófono. Puedes intentarlo de nuevo.";
    default:
      return "No se pudo iniciar el micrófono. Comprueba el dispositivo o escribe el mensaje.";
  }
}

function errorName(error: unknown) {
  if (error && typeof error === "object" && "name" in error && typeof error.name === "string") return error.name;
  return error instanceof Error ? error.name : "UnknownError";
}

function isAbortError(error: unknown) {
  return errorName(error) === "AbortError";
}
