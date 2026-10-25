import type {
  BrowserWhisper,
  TranscriptSegment,
  TranscribeProgress,
} from "browser-whisper";

export type WhisperProgressListener = (progress: TranscribeProgress) => void;
export type WhisperPreparationState = "idle" | "preparing" | "ready" | "error";

export type WhisperTranscriptionEngine = Pick<BrowserWhisper, "downloadModel" | "transcribe" | "dispose">;
export type WhisperEngineFactory = () => Promise<WhisperTranscriptionEngine>;

export interface WhisperTranscriptionPort {
  readonly ready: boolean;
  readonly preparationState?: WhisperPreparationState;
  retain?(): void;
  release?(): void;
  subscribePreparation?(listener: (state: WhisperPreparationState) => void): () => void;
  prepare(onProgress?: WhisperProgressListener, signal?: AbortSignal): Promise<void>;
  transcribe(file: File, onProgress?: WhisperProgressListener, signal?: AbortSignal): Promise<string>;
}

const MODEL = "whisper-tiny" as const;
const MODEL_LANGUAGE = "es";

/** Lazy browser-whisper adapter. One shared instance reuses workers and OPFS-cached weights across chats. */
export class WhisperTranscriptionAdapter implements WhisperTranscriptionPort {
  private enginePromise: Promise<WhisperTranscriptionEngine> | null = null;
  private preparePromise: Promise<void> | null = null;
  private prepareAbort: AbortController | null = null;
  private readonly preparationClients = new Map<symbol, WhisperProgressListener | undefined>();
  private readonly preparationListeners = new Set<(state: WhisperPreparationState) => void>();
  private isReady = false;
  private currentPreparationState: WhisperPreparationState = "idle";
  private retainedClients = 0;
  private transcriptionQueue: Promise<void> = Promise.resolve();

  constructor(private readonly createEngine: WhisperEngineFactory = createBrowserWhisperEngine) {}

  get ready() {
    return this.isReady;
  }

  get preparationState() {
    return this.currentPreparationState;
  }

  get hasConsumers() {
    return this.retainedClients > 0;
  }

  subscribePreparation(listener: (state: WhisperPreparationState) => void) {
    this.preparationListeners.add(listener);
    listener(this.currentPreparationState);
    return () => this.preparationListeners.delete(listener);
  }

  retain() {
    this.retainedClients += 1;
  }

  release() {
    this.retainedClients = Math.max(0, this.retainedClients - 1);
    if (this.retainedClients === 0) {
      preparationScheduled = false;
      void this.dispose();
    }
  }

  async prepare(onProgress?: WhisperProgressListener, signal?: AbortSignal) {
    if (this.isReady) return;
    throwIfAborted(signal);
    const clientId = Symbol("whisper-preparation-client");
    this.preparationClients.set(clientId, onProgress);
    if (!this.preparePromise) {
      const abortController = new AbortController();
      this.prepareAbort = abortController;
      this.publishPreparationState("preparing");
      const pendingPreparation = this.loadEngine()
        .then((engine) => engine.downloadModel({
          model: MODEL,
          signal: abortController.signal,
          onProgress: (progress) => this.preparationClients.forEach((listener) => listener?.(progress)),
        }))
        .then(() => {
          this.isReady = true;
          this.publishPreparationState("ready");
        })
        .catch((error) => {
          if (!abortController.signal.aborted || this.retainedClients > 0) this.publishPreparationState("error");
          throw error;
        });
      const trackedPreparation = pendingPreparation.finally(() => {
        if (this.preparePromise === trackedPreparation) {
          this.preparePromise = null;
          this.prepareAbort = null;
        }
      });
      this.preparePromise = trackedPreparation;
      // Each client observes the same failure, including clients that cancel independently.
      this.preparePromise.catch(() => undefined);
    }

    let abortListener: (() => void) | null = null;
    const cancelled = new Promise<never>((_resolve, reject) => {
      abortListener = () => {
        this.preparationClients.delete(clientId);
        reject(abortError());
        if (this.preparationClients.size === 0) this.prepareAbort?.abort();
      };
      signal?.addEventListener("abort", abortListener, { once: true });
    });

    try {
      await (signal ? Promise.race([this.preparePromise, cancelled]) : this.preparePromise);
    } finally {
      if (abortListener) signal?.removeEventListener("abort", abortListener);
      this.preparationClients.delete(clientId);
    }
  }

  async transcribe(file: File, onProgress?: WhisperProgressListener, signal?: AbortSignal) {
    if (!this.isReady) throw new Error("ModelNotPreparedError");
    throwIfAborted(signal);
    let releaseQueue!: () => void;
    const previous = this.transcriptionQueue;
    this.transcriptionQueue = new Promise<void>((resolve) => { releaseQueue = resolve; });
    await previous;
    try {
      throwIfAborted(signal);
      const engine = await this.loadEngine();
      const stream = engine.transcribe(file, {
        language: MODEL_LANGUAGE,
        onProgress,
      });
      const abortStream = () => stream.cancel();
      signal?.addEventListener("abort", abortStream, { once: true });
      const segments: TranscriptSegment[] = [];
      try {
        for await (const segment of stream) {
          throwIfAborted(signal);
          segments.push(segment);
        }
      } finally {
        signal?.removeEventListener("abort", abortStream);
      }
      throwIfAborted(signal);
      return segments.map(({ text }) => text).join("").trim();
    } finally {
      releaseQueue();
    }
  }

  async dispose() {
    this.prepareAbort?.abort();
    const enginePromise = this.enginePromise;
    this.enginePromise = null;
    this.isReady = false;
    this.preparePromise = null;
    this.preparationClients.clear();
    this.publishPreparationState("idle");
    if (enginePromise) {
      try {
        (await enginePromise).dispose();
      } catch {
        // Dynamic import/worker initialization may have failed before an engine existed.
      }
    }
  }

  private loadEngine() {
    if (!this.enginePromise) {
      const enginePromise = this.createEngine();
      const trackedPromise = enginePromise.catch((error) => {
        if (this.enginePromise === trackedPromise) this.enginePromise = null;
        throw error;
      });
      this.enginePromise = trackedPromise;
    }
    return this.enginePromise;
  }

  private publishPreparationState(state: WhisperPreparationState) {
    this.currentPreparationState = state;
    this.preparationListeners.forEach((listener) => listener(state));
  }
}

let sharedAdapter: WhisperTranscriptionAdapter | null = null;

export function getSharedWhisperTranscriptionAdapter() {
  sharedAdapter ??= new WhisperTranscriptionAdapter();
  return sharedAdapter;
}

let preparationScheduled = false;
let preparationGeneration = 0;
const MODEL_STORAGE_ESTIMATE_BYTES = 150 * 1024 * 1024;

/** Starts one lazy preparation after critical page work; all chat instances share its adapter/promise. */
export function scheduleWhisperPreparation() {
  if (preparationScheduled || typeof window === "undefined") return;
  preparationScheduled = true;
  const generation = ++preparationGeneration;
  const run = () => {
    if (generation !== preparationGeneration) return;
    void prepareWhenResourcesAllow();
  };
  const idleWindow = window as Window & {
    requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  };
  if (idleWindow.requestIdleCallback) {
    idleWindow.requestIdleCallback(run, { timeout: 2500 });
  } else if (document.readyState === "complete") {
    window.setTimeout(run, 0);
  } else {
    window.addEventListener("load", () => window.setTimeout(run, 0), { once: true });
  }
}

async function prepareWhenResourcesAllow() {
  if (!isWhisperRuntimeAvailable()) return;
  const adapter = getSharedWhisperTranscriptionAdapter();
  if (!adapter.hasConsumers) {
    preparationScheduled = false;
    return;
  }
  const network = getNetworkInformation();
  if (!navigator.onLine || network?.saveData || network?.effectiveType === "slow-2g" || network?.effectiveType === "2g") {
    const retry = () => {
      if (!navigator.onLine || network?.saveData || network?.effectiveType === "slow-2g" || network?.effectiveType === "2g") return;
      network?.removeEventListener?.("change", retry);
      window.removeEventListener("online", retry);
      preparationScheduled = false;
      scheduleWhisperPreparation();
    };
    network?.addEventListener?.("change", retry);
    window.addEventListener("online", retry, { once: true });
    return;
  }

  const abortController = new AbortController();
  const timeout = window.setTimeout(() => abortController.abort(), 5 * 60_000);
  try {
    // downloadModel checks/verifies the library's OPFS/Cache API entries before fetching weights.
    // Estimate is intentionally advisory: an existing valid cache must still be reusable on low quota.
    const hasModelStorageHeadroom = await estimateModelStorage();
    // Probe the library's cache even if estimated free space is low: a complete cached model needs no download.
    void hasModelStorageHeadroom;
    await adapter.prepare(undefined, abortController.signal);
  } catch {
    // Preparation failures never surface as technical composer messages; typing remains available.
  } finally {
    window.clearTimeout(timeout);
  }
}

async function estimateModelStorage() {
  try {
    const estimate = await navigator.storage?.estimate?.();
    if (estimate?.quota !== undefined && estimate.usage !== undefined) {
      return Math.max(0, estimate.quota - estimate.usage) >= MODEL_STORAGE_ESTIMATE_BYTES;
    }
  } catch {
    // Storage estimates are optional and must not block a cache check.
  }
  return null;
}

function isWhisperRuntimeAvailable() {
  return typeof window !== "undefined"
    && window.isSecureContext
    && typeof Worker !== "undefined"
    && typeof WebAssembly !== "undefined"
    && typeof MediaRecorder !== "undefined"
    && Boolean(navigator.mediaDevices?.getUserMedia)
    && !((navigator as Navigator & { deviceMemory?: number }).deviceMemory
      && (navigator as Navigator & { deviceMemory?: number }).deviceMemory! <= 2);
}

function getNetworkInformation() {
  return (navigator as Navigator & {
    connection?: EventTarget & { saveData?: boolean; effectiveType?: string };
  }).connection;
}

async function createBrowserWhisperEngine(): Promise<WhisperTranscriptionEngine> {
  const { BrowserWhisper } = await import("browser-whisper");
  return new BrowserWhisper({ model: MODEL, language: MODEL_LANGUAGE });
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw abortError();
}

function abortError() {
  return new DOMException("The operation was aborted", "AbortError");
}
