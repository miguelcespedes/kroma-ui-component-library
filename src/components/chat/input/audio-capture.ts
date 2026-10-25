export type AudioCaptureEvent = "muted" | "resumed" | "interrupted" | "limit" | "error";

export type AudioCaptureOptions = Readonly<{
  maxDurationMs?: number;
  onEvent?: (event: AudioCaptureEvent) => void;
  mediaDevices?: Pick<MediaDevices, "getUserMedia"> | null;
  recorderFactory?: (stream: MediaStream, options?: MediaRecorderOptions) => MediaRecorder;
  isTypeSupported?: (type: string) => boolean;
  supported?: boolean;
}>;

const MAX_RECORDING_DURATION_MS = 30_000;
const AUDIO_MIME_TYPES = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4"];

/** Captures a short, temporary microphone recording and releases every track on completion/cancellation. */
export class AudioCapture {
  private readonly maxDurationMs: number;
  private readonly mediaDevices: Pick<MediaDevices, "getUserMedia"> | null;
  private readonly recorderFactory: (stream: MediaStream, options?: MediaRecorderOptions) => MediaRecorder;
  private readonly isTypeSupported: (type: string) => boolean;
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: BlobPart[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private stopping = false;
  private disposed = false;
  private stopPromise: Promise<File> | null = null;

  constructor(private readonly options: AudioCaptureOptions = {}) {
    this.maxDurationMs = Math.max(1000, options.maxDurationMs ?? MAX_RECORDING_DURATION_MS);
    this.mediaDevices = options.mediaDevices === undefined
      ? (typeof navigator !== "undefined" ? navigator.mediaDevices : null)
      : options.mediaDevices;
    this.recorderFactory = options.recorderFactory ?? ((stream, recorderOptions) => new MediaRecorder(stream, recorderOptions));
    this.isTypeSupported = options.isTypeSupported ?? ((type) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type));
  }

  static get supported() {
    return typeof navigator !== "undefined"
      && Boolean(navigator.mediaDevices?.getUserMedia)
      && typeof MediaRecorder !== "undefined";
  }

  async start() {
    if (this.disposed) throw namedError("AbortError");
    if (!(this.options.supported ?? AudioCapture.supported) || !this.mediaDevices) throw namedError("NotSupportedError");
    if (this.recorder?.state === "recording") throw namedError("InvalidStateError");

    this.chunks = [];
    this.stopping = false;
    this.stopPromise = null;
    const stream = await this.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });
    if (this.disposed) {
      stream.getTracks().forEach((track) => track.stop());
      throw namedError("AbortError");
    }
    this.stream = stream;
    const track = stream.getAudioTracks()[0];
    if (!track || track.readyState !== "live") {
      this.releaseTracks();
      throw namedError("NotFoundError");
    }
    track.addEventListener("mute", this.onTrackMuted);
    track.addEventListener("unmute", this.onTrackUnmuted);
    track.addEventListener("ended", this.onTrackEnded);

    const mimeType = AUDIO_MIME_TYPES.find((candidate) => this.isTypeSupported(candidate));
    try {
      this.recorder = mimeType
        ? this.recorderFactory(stream, { mimeType, audioBitsPerSecond: 64_000 })
        : this.recorderFactory(stream);
      this.recorder.addEventListener("dataavailable", this.onDataAvailable);
      this.recorder.addEventListener("stop", this.onRecorderStop);
      this.recorder.addEventListener("error", this.onRecorderError);
      this.recorder.start(1000);
      this.timer = setTimeout(() => {
        this.options.onEvent?.("limit");
      }, this.maxDurationMs);
    } catch (error) {
      this.releaseTracks();
      this.detachRecorder();
      throw error;
    }
  }

  stop() {
    if (this.stopPromise) return this.stopPromise;
    const recorder = this.recorder;
    if (!recorder || recorder.state === "inactive") {
      this.releaseTracks();
      return Promise.reject(namedError("InvalidStateError"));
    }
    this.stopping = true;
    this.stopPromise = new Promise<File>((resolve, reject) => {
      const settle = () => {
        const type = recorder.mimeType || this.chunks.find((chunk) => chunk instanceof Blob)?.type || "audio/webm";
        const blob = new Blob(this.chunks, { type });
        this.chunks = [];
        this.releaseTracks();
        this.detachRecorder();
        if (blob.size === 0) {
          reject(namedError("EmptyAudioError"));
          return;
        }
        const extension = type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "webm";
        resolve(new File([blob], `kroma-dictation.${extension}`, { type }));
      };
      this.onStopResolve = settle;
      this.onStopReject = (error) => {
        this.releaseTracks();
        this.detachRecorder();
        reject(error);
      };
      try {
        recorder.stop();
      } catch (error) {
        this.onStopReject(error);
      }
    });
    return this.stopPromise;
  }

  cancel() {
    this.stopping = true;
    const recorder = this.recorder;
    this.chunks = [];
    if (recorder && recorder.state !== "inactive") {
      try {
        recorder.stop();
      } catch {
        // Tracks are still stopped below even if the recorder has already ended.
      }
    }
    this.releaseTracks();
    this.detachRecorder();
    this.stopPromise = null;
  }

  destroy() {
    this.disposed = true;
    this.cancel();
  }

  private onStopResolve: (() => void) | null = null;
  private onStopReject: ((error: unknown) => void) | null = null;

  private readonly onDataAvailable = (event: BlobEvent) => {
    if (event.data.size > 0) this.chunks.push(event.data);
  };

  private readonly onRecorderStop = () => {
    this.onStopResolve?.();
    this.onStopResolve = null;
    this.onStopReject = null;
  };

  private readonly onRecorderError = (event: Event) => {
    const error = (event as Event & { error?: DOMException }).error ?? new Error("MediaRecorderError");
    this.options.onEvent?.("error");
    this.onStopReject?.(error);
    if (!this.onStopReject) {
      this.releaseTracks();
      this.detachRecorder();
    }
    this.onStopResolve = null;
    this.onStopReject = null;
  };

  private readonly onTrackMuted = () => this.options.onEvent?.("muted");
  private readonly onTrackUnmuted = () => this.options.onEvent?.("resumed");
  private readonly onTrackEnded = () => {
    if (!this.stopping) this.options.onEvent?.("interrupted");
  };

  private releaseTracks() {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
    const stream = this.stream;
    this.stream = null;
    stream?.getAudioTracks().forEach((track) => {
      track.removeEventListener("mute", this.onTrackMuted);
      track.removeEventListener("unmute", this.onTrackUnmuted);
      track.removeEventListener("ended", this.onTrackEnded);
    });
    stream?.getTracks().forEach((track) => track.stop());
  }

  private detachRecorder() {
    const recorder = this.recorder;
    if (!recorder) return;
    recorder.removeEventListener("dataavailable", this.onDataAvailable);
    recorder.removeEventListener("stop", this.onRecorderStop);
    recorder.removeEventListener("error", this.onRecorderError);
    this.recorder = null;
  }
}

function namedError(name: string) {
  const error = new Error(name);
  error.name = name;
  return error;
}
