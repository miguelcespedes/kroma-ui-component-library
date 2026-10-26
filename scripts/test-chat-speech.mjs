import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const root = process.cwd();
const port = Number(process.env.KROMA_CHAT_SPEECH_PORT ?? 4179);
const url = `http://127.0.0.1:${port}/chat/`;
const server = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "preview", "--config", "vite.config.js", "--host", "127.0.0.1", "--port", String(port), "--strictPort"], { cwd: root, stdio: "ignore" });
let browser;

try {
  let ready = false;
  for (let attempt = 0; attempt < 80 && !ready; attempt += 1) {
    try {
      ready = (await fetch(url)).ok;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 125));
    }
  }
  assert.equal(ready, true, "Vite preview starts for the local Playwright run");

  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 430, height: 900 },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    window.__speechWarnings = [];
    const originalWarn = console.warn.bind(console);
    console.warn = (...args) => {
      window.__speechWarnings.push(args.map(String).join(" "));
      originalWarn(...args);
    };
    class FakeSpeechRecognition {
      static lastInstance;
      static holdStop = false;
      lang = "";
      continuous = true;
      interimResults = false;
      maxAlternatives = 5;
      onstart = null;
      onend = null;
      onerror = null;
      onresult = null;
      constructor() { FakeSpeechRecognition.lastInstance = this; }
      start() { queueMicrotask(() => this.onstart?.()); }
      stop() { if (!FakeSpeechRecognition.holdStop) queueMicrotask(() => this.onend?.()); }
      abort() { this.onend?.(); }
      emitEnd() { this.onend?.(); }
      emitError(error) { this.onerror?.({ error }); }
      emitResults(parts) {
        const results = parts.map(({ transcript, isFinal }) => ({ 0: { transcript }, isFinal, length: 1 }));
        this.onresult?.({ results: Object.assign(results, { length: results.length }) });
      }
    }
    Object.defineProperty(window, "SpeechRecognition", { configurable: true, value: FakeSpeechRecognition });
    window.__FakeSpeechRecognition = FakeSpeechRecognition;

    class FakeSpeechSynthesisUtterance {
      constructor(text) {
        this.text = text;
        this.lang = "";
        this.voice = null;
        this.onstart = null;
        this.onend = null;
        this.onerror = null;
      }
    }
    const fakeSpeechSynthesis = {
      speaking: false,
      current: null,
      getVoices() { return [{ lang: "es-PE" }]; },
      speak(utterance) {
        this.current = utterance;
        queueMicrotask(() => {
          if (this.current !== utterance) return;
          this.speaking = true;
          utterance.onstart?.();
        });
      },
      cancel() { this.current = null; this.speaking = false; },
      finish() {
        const utterance = this.current;
        this.current = null;
        this.speaking = false;
        utterance?.onend?.();
      },
    };
    Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, value: FakeSpeechSynthesisUtterance });
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: fakeSpeechSynthesis });
    window.__fakeSpeechSynthesis = fakeSpeechSynthesis;
  });
  await page.goto(url);
  await page.waitForFunction(() => document.querySelector("kroma-chat")?.isConnected === true);

  const chat = page.locator("kroma-chat");
  const display = chat.locator(".kroma-chat__virtual-display");
  const keyboard = chat.locator(".hg-theme-default");
  const speechButton = chat.locator(".kroma-chat__speech-button");
  const speechSlash = speechButton.locator("[data-speech-slash]");
  const sendButton = chat.locator(".kroma-chat__send");
  const botMessage = chat.locator('li[data-author="assistant"]').first();
  const playbackButton = botMessage.locator(".kroma-chat__speak-button");
  assert.equal(await speechButton.isVisible(), true, "the microphone is available when the browser provides Web Speech API");
  assert.equal(await speechButton.isDisabled(), false);
  assert.equal(await speechSlash.isVisible(), true, "idle dictation shows the muted microphone");
  assert.equal(await chat.locator(".kroma-chat__speech-status").count(), 0, "the composer does not create a speech-message element");
  assert.equal(await speechButton.getAttribute("title"), "Dictar mensaje por voz", "browser service details are not exposed as a microphone tooltip");
  assert.equal(await playbackButton.count(), 1, "assistant text responses have their own playback button");
  assert.equal(await chat.locator('li[data-author="user"] .kroma-chat__speak-button').count(), 0, "user messages do not get a playback button");
  const bubbleBounds = await botMessage.locator(".kroma-chat__bubble").boundingBox();
  const playbackBounds = await playbackButton.boundingBox();
  assert.ok(bubbleBounds && playbackBounds && playbackBounds.x >= bubbleBounds.x + bubbleBounds.width, "speaker control sits outside the bubble on its right");
  await playbackButton.click();
  await page.waitForFunction(() => document.querySelector(".kroma-chat__speak-button")?.dataset.speechState === "speaking");
  assert.equal(await playbackButton.getAttribute("aria-pressed"), "true", "active playback is exposed accessibly");
  const spokenMessage = await page.evaluate(() => ({
    text: window.__fakeSpeechSynthesis.current?.text,
    lang: window.__fakeSpeechSynthesis.current?.lang,
  }));
  assert.equal(spokenMessage.text, await botMessage.locator(".kroma-chat__text").innerText(), "playback reads only the selected assistant response");
  assert.equal(spokenMessage.lang, "es-PE", "playback uses Peruvian Spanish");
  await page.evaluate(() => window.__fakeSpeechSynthesis.finish());
  await page.waitForFunction(() => document.querySelector(".kroma-chat__speak-button")?.dataset.speechState === "idle");
  assert.equal(await playbackButton.getAttribute("aria-pressed"), "false", "the control resets when playback finishes");

  await display.click();
  await page.keyboard.type("Tengo una consulta");
  assert.equal(await display.innerText(), "Tengo una consulta");
  const insertionCharacter = display.locator('[data-start="6"]');
  const insertionCharacterBounds = await insertionCharacter.boundingBox();
  const displayBoundsBeforeSpeech = await display.boundingBox();
  assert.ok(insertionCharacterBounds && displayBoundsBeforeSpeech, "existing draft exposes a cursor insertion point");
  await display.click({ position: {
    x: insertionCharacterBounds.x - displayBoundsBeforeSpeech.x + 1,
    y: insertionCharacterBounds.y - displayBoundsBeforeSpeech.y + insertionCharacterBounds.height / 2,
  } });
  assert.equal(await keyboard.isVisible(), true, "the virtual keyboard is available before dictation starts");
  assert.equal(await display.innerText(), "Tengo una consulta", "starting dictation does not change the existing draft");
  await speechButton.click();
  await page.waitForFunction(() => document.querySelector(".kroma-chat__speech-button")?.dataset.speechState === "listening");
  assert.equal(await speechButton.getAttribute("aria-pressed"), "true");
  assert.equal(await speechSlash.isVisible(), false, "the microphone is unmuted while listening");
  assert.equal(await speechSlash.getAttribute("d"), "M4 20 20 4", "the slash follows the provided microphone-off reference");
  assert.equal(await keyboard.isHidden(), true, "dictation hides the virtual keyboard without clearing the draft");
  const recognitionSettings = await page.evaluate(() => ({
    lang: window.__FakeSpeechRecognition.lastInstance.lang,
    continuous: window.__FakeSpeechRecognition.lastInstance.continuous,
    interimResults: window.__FakeSpeechRecognition.lastInstance.interimResults,
  }));
  assert.deepEqual(recognitionSettings, { lang: "es-PE", continuous: true, interimResults: true }, "Edge keeps recognition active to return complete transcripts");
  await page.evaluate(() => window.__FakeSpeechRecognition.lastInstance.emitResults([
    { transcript: "Hola ", isFinal: true },
    { transcript: "¿cómo estás?", isFinal: false },
  ]));
  assert.equal(await display.innerText(), "Tengo Hola ¿cómo estás? una consulta", "interim recognition is inserted at the current caret");
  await page.evaluate(() => window.__FakeSpeechRecognition.lastInstance.emitResults([
    { transcript: "Hola, ¿cómo estás hoy?", isFinal: true },
  ]));
  assert.equal(await display.innerText(), "Tengo Hola, ¿cómo estás hoy? una consulta", "final recognition replaces interim text without submitting the draft");
  await page.evaluate(() => { window.__FakeSpeechRecognition.holdStop = true; });
  await speechButton.click();
  await page.waitForFunction(() => document.querySelector(".kroma-chat__speech-button")?.dataset.speechState === "stopping");
  await page.evaluate(() => {
    window.__FakeSpeechRecognition.lastInstance.emitEnd();
    window.__FakeSpeechRecognition.holdStop = false;
  });
  await page.waitForFunction(() => document.querySelector(".kroma-chat__speech-button")?.dataset.speechState === "idle");
  assert.equal(await speechSlash.isVisible(), true, "the microphone returns to muted when dictation stops");
  await speechButton.click();
  await page.waitForFunction(() => document.querySelector(".kroma-chat__speech-button")?.dataset.speechState === "listening");
  await page.evaluate(() => window.__FakeSpeechRecognition.lastInstance.emitError("network"));
  assert.equal(await chat.locator(".kroma-chat__speech-status").count(), 0, "recognition errors do not create a message in the composer");
  assert.doesNotMatch(await chat.innerText(), /El servicio de voz|Verifica tu conexión|micrófono no pudo/i, "recognition diagnostics are absent from the composer and keyboard");
  assert.equal(await speechButton.getAttribute("title"), "Dictar mensaje por voz", "recognition errors are not exposed as button tooltips");
  assert.match((await page.evaluate(() => window.__speechWarnings)).at(-1), /El servicio de voz del navegador no pudo conectarse/i, "recognition diagnostics are logged to the browser console");
  await page.evaluate(() => window.__FakeSpeechRecognition.lastInstance.emitEnd());
  await speechButton.click();
  await page.waitForFunction(() => document.querySelector(".kroma-chat__speech-button")?.dataset.speechState === "listening");
  await speechButton.click();
  await page.waitForFunction(() => document.querySelector(".kroma-chat__speech-button")?.dataset.speechState === "idle");
  await display.click();
  assert.equal(await keyboard.isVisible(), true, "the virtual keyboard reopens for editing after dictation");
  await keyboard.locator('button[data-skbtn="a"]').click();
  const keyboardEditedDraft = await display.innerText();
  assert.notEqual(keyboardEditedDraft, "Tengo Hola, ¿cómo estás hoy? una consulta", "virtual keyboard edits recognized text");
  assert.match(keyboardEditedDraft, /a/, "virtual keyboard input is present in the draft");
  await display.focus();
  await page.keyboard.type("x");
  const physicallyEditedDraft = await display.innerText();
  assert.notEqual(physicallyEditedDraft, keyboardEditedDraft, "physical typing edits recognized text");
  assert.match(physicallyEditedDraft, /x/, "physical keyboard input is present in the draft");

  await sendButton.click();
  await page.waitForFunction(() => document.querySelector(".kroma-chat__virtual-display")?.innerText === "");
  assert.equal(await display.innerText(), "", "manual send submits and clears the edited draft");
  await speechButton.click();
  await page.waitForFunction(() => document.querySelector(".kroma-chat__speech-button")?.dataset.speechState === "listening");
  await page.evaluate(() => window.__FakeSpeechRecognition.lastInstance.emitResults([
    { transcript: "Texto dictado", isFinal: false },
  ]));
  assert.equal(await display.innerText(), "Texto dictado", "active dictation appears in the composer before sending");
  const latestRecognition = await page.evaluateHandle(() => window.__FakeSpeechRecognition.lastInstance);
  await sendButton.click();
  await page.waitForFunction(() => document.querySelector(".kroma-chat__virtual-display")?.innerText === "");
  await latestRecognition.evaluate((recognition) => recognition.emitResults([
    { transcript: "resultado tardío", isFinal: true },
  ]));
  assert.equal(await display.innerText(), "", "late recognition results cannot refill the composer after send clears it");
  assert.deepEqual(errors, [], "dictation integration produces no browser errors");
  console.log("Chat speech Playwright checks passed: Web Speech API insertion, interim/final replacement, playback, keyboard editing and manual send.");
} finally {
  await browser?.close();
  server.kill();
}
