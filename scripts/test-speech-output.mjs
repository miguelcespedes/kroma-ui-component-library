import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import ts from "typescript";

const source = await readFile(resolve("src/components/chat/messages/speech-output-controller.ts"), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { SpeechOutputController } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

class FakeUtterance {
  text;
  lang = "";
  voice = null;
  onstart = null;
  onend = null;
  onerror = null;
  constructor(text) { this.text = text; }
}

class FakeSynthesis {
  speaking = false;
  current = null;
  voices = [{ lang: "es-ES" }, { lang: "es-PE" }];
  cancelCount = 0;
  spoken = [];
  getVoices() { return this.voices; }
  speak(utterance) {
    this.current = utterance;
    this.spoken.push(utterance);
    this.speaking = true;
  }
  cancel() {
    this.cancelCount += 1;
    this.current = null;
    this.speaking = false;
  }
  finish() {
    const utterance = this.current;
    this.current = null;
    this.speaking = false;
    utterance?.onend?.();
  }
  fail() {
    const utterance = this.current;
    this.current = null;
    this.speaking = false;
    utterance?.onerror?.();
  }
}

const synthesis = new FakeSynthesis();
const controller = new SpeechOutputController(synthesis, (text) => new FakeUtterance(text));
const statuses = [];
controller.subscribe((status) => statuses.push(status));

assert.equal(controller.supported, true);
assert.equal(controller.status.state, "idle");
assert.equal(controller.toggle("assistant-1", "Hola, ¿cómo puedo ayudarte?"), true);
assert.equal(synthesis.spoken[0].text, "Hola, ¿cómo puedo ayudarte?");
assert.equal(synthesis.spoken[0].lang, "es-PE");
assert.equal(synthesis.spoken[0].voice.lang, "es-PE", "Peruvian Spanish voice is preferred when available");
assert.equal(controller.status.state, "speaking");
assert.equal(controller.status.messageId, "assistant-1", "playback state belongs to a single assistant response");

controller.toggle("assistant-2", "Otra respuesta");
assert.equal(synthesis.cancelCount, 1, "starting another response stops current playback");
assert.equal(synthesis.current.text, "Otra respuesta");
assert.equal(controller.status.messageId, "assistant-2");
synthesis.finish();
assert.equal(controller.status.state, "idle", "the playback control resets when speech reaches its end");

controller.toggle("assistant-3", "Respuesta que se puede detener");
controller.toggle("assistant-3", "Respuesta que se puede detener");
assert.equal(synthesis.cancelCount, 2, "pressing the active message button cancels playback");
assert.equal(controller.status.state, "idle");

controller.toggle("assistant-4", "Error de voz");
synthesis.fail();
assert.equal(controller.status.state, "error");
assert.match(controller.status.message, /no se pudo reproducir/i);

const unsupported = new SpeechOutputController(null, null);
assert.equal(unsupported.supported, false);
assert.equal(unsupported.status.state, "unsupported");
assert.equal(unsupported.toggle("assistant-5", "No se reproduce"), false);
unsupported.destroy();

controller.toggle("assistant-6", "Reproducción al destruir");
controller.destroy();
assert.equal(synthesis.cancelCount, 3, "destroy cancels any active utterance");
assert.equal(statuses.at(-1).state, "speaking", "destroy does not dispatch status to cleared listeners");

console.log(`Speech output controller checks passed: ${statuses.length} status updates.`);
