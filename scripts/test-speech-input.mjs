import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import ts from "typescript";

const compile = async (path) => {
  const source = await readFile(resolve(path), "utf8");
  return ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
};
const asModuleUrl = (source) => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const audioModuleUrl = asModuleUrl(await compile("src/components/chat/input/audio-capture.ts"));
const adapterSource = (await compile("src/components/chat/input/whisper-transcription-adapter.ts"))
  .replaceAll('from "browser-whisper"', 'from "browser-whisper"');
const adapterModuleUrl = asModuleUrl(adapterSource);
const insertionModuleUrl = asModuleUrl(await compile("src/components/chat/input/speech-transcript-insertion.ts"));
const controllerSource = (await compile("src/components/chat/input/speech-input-controller.ts"))
  .replace('from "./audio-capture"', `from "${audioModuleUrl}"`)
  .replace('from "./whisper-transcription-adapter"', `from "${adapterModuleUrl}"`);
const { SpeechInputController } = await import(asModuleUrl(controllerSource));
const { AudioCapture } = await import(audioModuleUrl);
const { WhisperTranscriptionAdapter } = await import(adapterModuleUrl);
const { insertSpeechTranscript } = await import(insertionModuleUrl);

class FakeAdapter {
  ready = false;
  preparationState = "idle";
  prepareCalls = 0;
  preparationListeners = new Set();
  transcribeCalls = 0;
  transcript = "Hola, este es un dictado local.";
  prepareError = null;
  transcribeError = null;
  subscribePreparation(listener) {
    this.preparationListeners.add(listener);
    listener(this.preparationState);
    return () => this.preparationListeners.delete(listener);
  }
  setPreparationState(state) {
    this.preparationState = state;
    this.preparationListeners.forEach((listener) => listener(state));
  }
  async prepare(onProgress, signal) {
    this.prepareCalls += 1;
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    this.setPreparationState("preparing");
    onProgress?.({ stage: "loading", progress: 0.45 });
    if (this.prepareError) throw this.prepareError;
    this.ready = true;
    this.setPreparationState("ready");
  }
  async transcribe(_file, onProgress, signal) {
    this.transcribeCalls += 1;
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    onProgress?.({ stage: "transcribing", progress: 1 });
    if (this.transcribeError) throw this.transcribeError;
    return this.transcript;
  }
}

class FakeCapture {
  started = false;
  stopped = false;
  cancelled = false;
  destroyed = false;
  constructor(onEvent, { stopResult = new File(["audio"], "capture.webm", { type: "audio/webm" }), stopError = null } = {}) {
    this.onEvent = onEvent;
    this.stopResult = stopResult;
    this.stopError = stopError;
  }
  async start() { this.started = true; }
  async stop() {
    this.stopped = true;
    if (this.stopError) throw this.stopError;
    return this.stopResult;
  }
  cancel() { this.cancelled = true; }
  destroy() { this.destroyed = true; }
  emit(event) { this.onEvent(event); }
}

const adapter = new FakeAdapter();
const captures = [];
const statuses = [];
const results = [];
const controller = new SpeechInputController({
  adapter,
  supported: () => true,
  createCapture: (onEvent) => {
    const capture = new FakeCapture(onEvent);
    captures.push(capture);
    return capture;
  },
});
controller.subscribeStatus((status) => statuses.push(status));
controller.subscribeResults((result) => results.push(result));

assert.equal(await controller.start(), false);
assert.equal(controller.status.state, "idle");
assert.equal(controller.status.message, "", "background preparation stays invisible to the composer");
assert.equal(adapter.prepareCalls, 0, "the composer never initiates engine preparation");
assert.equal(captures.length, 0, "the microphone remains off until the shared engine is ready");

await adapter.prepare();
assert.equal(adapter.prepareCalls, 1);
assert.equal(controller.status.state, "ready");
assert.equal(controller.status.modelReady, true);
assert.equal(controller.status.message, "", "engine preparation progress is never exposed in the composer");

assert.equal(await controller.start(), true);
assert.equal(controller.status.state, "recording");
assert.equal(captures.at(-1).started, true);
captures.at(-1).emit("muted");
assert.match(controller.status.message, /silenciado/i);
captures.at(-1).emit("resumed");
assert.match(controller.status.message, /escuchando/i);
assert.equal(await controller.stop(), true);
assert.equal(captures.at(-1).stopped, true);
assert.equal(controller.status.state, "completed");
assert.equal(results.length, 1);
assert.equal(results[0].transcript, adapter.transcript);
assert.equal(results[0].finalTranscript, adapter.transcript);
assert.equal(results[0].interimTranscript, "", "the stable first implementation does not fabricate interim transcription");
assert.equal(adapter.transcribeCalls, 1);

const emptyAudioError = new Error("No audio captured");
emptyAudioError.name = "EmptyAudioError";
const failedStop = new FakeCapture(() => {}, { stopError: emptyAudioError });
const emptyController = new SpeechInputController({
  adapter,
  supported: () => true,
  createCapture: () => failedStop,
});
assert.equal(await emptyController.start(), true);
assert.equal(await emptyController.stop(), false);
assert.equal(emptyController.status.state, "error");
assert.equal(emptyController.status.message, "No se detectó voz");
emptyController.destroy();

const deniedCapture = new FakeCapture(() => {});
deniedCapture.start = async () => { throw Object.assign(new Error("denied"), { name: "NotAllowedError" }); };
const deniedController = new SpeechInputController({
  adapter,
  supported: () => true,
  createCapture: () => deniedCapture,
});
assert.equal(await deniedController.start(), false);
await new Promise((resolve) => setImmediate(resolve));
assert.equal(deniedController.status.state, "error");
assert.match(deniedController.status.message, /permiso/i);
assert.equal(deniedCapture.destroyed, true);
deniedController.destroy();

adapter.transcribeError = new Error("model failed");
assert.equal(await controller.start(), true);
assert.equal(await controller.stop(), false);
assert.equal(controller.status.state, "error");
assert.match(controller.status.message, /no fue posible procesar el audio/i);
adapter.transcribeError = null;

assert.equal(await controller.start(), true);
const activeCapture = captures.at(-1);
controller.cancel();
assert.equal(activeCapture.cancelled, true);
assert.equal(activeCapture.destroyed, true);
assert.equal(controller.status.state, "ready");

const unsupported = new SpeechInputController({ adapter, supported: () => false });
assert.equal(unsupported.supported, false);
assert.equal(unsupported.status.state, "unsupported");
assert.equal(await unsupported.start(), false);
unsupported.destroy();

// Adapter-level contract: one worker/model preparation is shared, language is Whisper's "es",
// async segments are joined once, cancellation is forwarded, and the engine can be disposed.
let engineCreations = 0;
let downloads = 0;
let receivedLanguage = "";
let cancelledStream = false;
let disposed = false;
const mockEngine = {
  async downloadModel(options) {
    downloads += 1;
    options.onProgress?.({ stage: "loading", progress: 0.5 });
  },
  transcribe(_file, options) {
    receivedLanguage = options.language;
    const stream = {
      async *[Symbol.asyncIterator]() {
        yield { text: "Hola ", start: 0, end: 0.4 };
        yield { text: "mundo", start: 0.4, end: 0.8 };
      },
      cancel() { cancelledStream = true; },
    };
    return stream;
  },
  dispose() { disposed = true; },
};
const whisperAdapter = new WhisperTranscriptionAdapter(async () => {
  engineCreations += 1;
  return mockEngine;
});
const progressUpdates = [];
await Promise.all([
  whisperAdapter.prepare((progress) => progressUpdates.push(progress.progress)),
  whisperAdapter.prepare((progress) => progressUpdates.push(progress.progress)),
]);
assert.equal(engineCreations, 1, "concurrent preparation reuses one engine");
assert.equal(downloads, 1, "concurrent preparation downloads the model once");
assert.deepEqual(progressUpdates, [0.5, 0.5], "all concurrent requesters receive shared download progress");
assert.equal(await whisperAdapter.transcribe(new File(["audio"], "voice.webm")), "Hola mundo");
assert.equal(receivedLanguage, "es", "Whisper receives Spanish language ID rather than regional es-PE");
await whisperAdapter.dispose();
assert.equal(disposed, true);

assert.deepEqual(insertSpeechTranscript("Tengo una consulta", 6, 10, "Hola mundo", 2000), {
  value: "Tengo Hola mundo consulta",
  caretStart: 16,
  caretEnd: 16,
}, "recognized text replaces the active selection and preserves text on both sides");
assert.deepEqual(insertSpeechTranscript("Hola mundo", 4, 4, "hoy", 2000), {
  value: "Hola hoy mundo",
  caretStart: 8,
  caretEnd: 8,
}, "cursor insertion preserves pre-existing text and spacing");
assert.deepEqual(insertSpeechTranscript("abc", 1, 1, "", 2000), {
  value: "abc", caretStart: 1, caretEnd: 1,
}, "an empty result never changes the draft");
assert.equal(insertSpeechTranscript("abc", 1, 1, "long", 6).value.length, 6, "transcript insertion respects the composer maximum");

// MediaRecorder capture is short-lived, keeps audio constraints browser-controlled, and releases tracks.
class FakeTrack extends EventTarget {
  readyState = "live";
  stopCount = 0;
  stop() { this.stopCount += 1; this.readyState = "ended"; this.dispatchEvent(new Event("ended")); }
}
class FakeRecorder extends EventTarget {
  state = "inactive";
  mimeType = "audio/webm;codecs=opus";
  startedWith = null;
  start(timeslice) { this.state = "recording"; this.startedWith = timeslice; }
  stop() {
    this.state = "inactive";
    const data = new Event("dataavailable");
    Object.defineProperty(data, "data", { value: new Blob(["known test audio"], { type: this.mimeType }) });
    this.dispatchEvent(data);
    this.dispatchEvent(new Event("stop"));
  }
}
const track = new FakeTrack();
let requestedConstraints;
let fakeRecorder;
const audioCapture = new AudioCapture({
  supported: true,
  maxDurationMs: 30_000,
  mediaDevices: { getUserMedia: async (constraints) => {
    requestedConstraints = constraints;
    return { getAudioTracks: () => [track], getTracks: () => [track] };
  } },
  recorderFactory: (_stream, options) => {
    assert.match(options.mimeType, /audio\/webm/);
    fakeRecorder = new FakeRecorder();
    return fakeRecorder;
  },
  isTypeSupported: (type) => type.startsWith("audio/webm"),
});
await audioCapture.start();
assert.equal(fakeRecorder.startedWith, 1000, "audio is emitted in bounded recorder chunks");
assert.deepEqual(requestedConstraints.audio, { echoCancellation: true, noiseSuppression: true, autoGainControl: true });
const audioFile = await audioCapture.stop();
assert.ok(audioFile.size > 0);
assert.equal(track.stopCount, 1, "the microphone track is released after stopping");
audioCapture.destroy();

let interruptedCount = 0;
const interruptedTrack = new FakeTrack();
const interruptedCapture = new AudioCapture({
  supported: true,
  onEvent: (event) => { if (event === "interrupted") interruptedCount += 1; },
  mediaDevices: { getUserMedia: async () => ({ getAudioTracks: () => [interruptedTrack], getTracks: () => [interruptedTrack] }) },
  recorderFactory: () => new FakeRecorder(),
  isTypeSupported: () => false,
});
await interruptedCapture.start();
interruptedTrack.readyState = "ended";
interruptedTrack.dispatchEvent(new Event("ended"));
assert.equal(interruptedCount, 1, "device removal is surfaced as an interruption");
interruptedCapture.destroy();

controller.destroy();
assert.equal(statuses.some(({ state }) => state === "recording"), true);
assert.equal(statuses.some(({ state }) => state === "transcribing"), true);
assert.equal(statuses.some(({ state }) => state === "completed"), true);
console.log(`Speech input checks passed: silent preparation state, local capture lifecycle, errors, cancellation, Whisper adapter and ${statuses.length} controller updates.`);
