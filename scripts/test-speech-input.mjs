import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import ts from "typescript";

const source = await readFile(resolve("src/components/chat/input/speech-input-controller.ts"), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { SpeechInputController, detectSpeechRecognitionFactory } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

class FakeRecognition {
  lang = "";
  continuous = true;
  interimResults = false;
  maxAlternatives = 3;
  onstart = null;
  onend = null;
  onerror = null;
  onresult = null;
  started = false;
  stopped = false;
  aborted = false;

  start() { this.started = true; }
  stop() { this.stopped = true; }
  abort() { this.aborted = true; }
  emitStart() { this.onstart?.(); }
  emitEnd() { this.onend?.(); }
  emitError(error) { this.onerror?.({ error }); }
  emitResults(results) {
    const list = results.map(({ transcript, isFinal }) => ({ 0: { transcript }, length: 1, isFinal }));
    this.onresult?.({ results: Object.assign(list, { length: list.length }) });
  }
}

let recognition;
const controller = new SpeechInputController(() => (recognition = new FakeRecognition()));
const states = [];
const transcripts = [];
controller.subscribeStatus(({ state }) => states.push(state));
controller.subscribeResults((result) => transcripts.push(result));

assert.equal(controller.supported, true);
assert.equal(controller.status.state, "idle");
assert.equal(controller.start(), true);
assert.equal(controller.status.state, "starting");
assert.equal(recognition.lang, "es-PE");
assert.equal(recognition.continuous, false);
assert.equal(recognition.interimResults, true);
assert.equal(recognition.maxAlternatives, 1);
recognition.emitStart();
assert.equal(controller.status.state, "listening");

recognition.emitResults([{ transcript: "Hola ", isFinal: true }, { transcript: "mun", isFinal: false }]);
recognition.emitResults([{ transcript: "Hola ", isFinal: true }, { transcript: "mundo", isFinal: false }]);
assert.equal(transcripts.at(-1).transcript, "Hola mundo", "updated interim results replace earlier provisional text without duplication");
assert.equal(transcripts.at(-1).finalTranscript, "Hola ");
assert.equal(transcripts.at(-1).interimTranscript, "mundo");
recognition.emitResults([{ transcript: "Hola mundo", isFinal: true }]);
assert.equal(transcripts.at(-1).transcript, "Hola mundo", "final results replace the provisional transcript");

assert.equal(controller.stop(), true);
assert.equal(controller.status.state, "stopping");
assert.equal(recognition.stopped, true);
recognition.emitEnd();
assert.equal(controller.status.state, "idle");

controller.start();
recognition.emitStart();
recognition.emitError("not-allowed");
assert.equal(controller.status.state, "error");
assert.match(controller.status.message, /permiso/i, "permission denial has an accessible explanation");
recognition.emitEnd();
assert.equal(controller.status.state, "error", "end after an error does not erase the error status");

controller.start();
recognition.emitError("audio-capture");
assert.match(controller.status.message, /micrófono/i, "missing audio capture device is explained");
recognition.emitEnd();
controller.start();
recognition.emitError("network");
assert.match(controller.status.message, /conexión/i, "network errors are explained");
recognition.emitEnd();
controller.start();
recognition.emitError("no-speech");
assert.match(controller.status.message, /voz/i, "silence is explained without interrupting the chat");
recognition.emitEnd();

controller.start();
const cancelled = recognition;
controller.cancel();
assert.equal(cancelled.aborted, true);
assert.equal(cancelled.onresult, null, "cancel detaches recognition event listeners");
assert.equal(controller.status.state, "idle");

controller.start();
recognition.emitEnd();
assert.equal(controller.status.state, "error", "unexpected end while starting does not leave a stale listening state");
controller.start();
const destroyed = recognition;
controller.destroy();
assert.equal(destroyed.aborted, true, "destroy aborts active recognition");
assert.equal(destroyed.onresult, null, "destroy releases recognition callbacks");

const unsupported = new SpeechInputController(null);
assert.equal(unsupported.supported, false);
assert.equal(unsupported.status.state, "unsupported");
assert.match(unsupported.status.message, /no está disponible/i);
assert.equal(unsupported.start(), false);
unsupported.destroy();
assert.equal(detectSpeechRecognitionFactory({ isSecureContext: false, SpeechRecognition: FakeRecognition }), null, "recognition is not exposed outside secure browser contexts");
assert.equal(typeof detectSpeechRecognitionFactory({ isSecureContext: true, webkitSpeechRecognition: FakeRecognition }), "function", "webkit-prefixed browser capability is detected without user-agent sniffing");

console.log(`Speech input controller checks passed: ${states.length} state updates and ${transcripts.length} transcript snapshots.`);
