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
  const context = await browser.newContext({ viewport: { width: 430, height: 900 } });
  const page = await context.newPage();
  await page.route("https://**", (route) => route.abort());
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    window.__microphoneRequests = 0;
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia() {
          window.__microphoneRequests += 1;
          return Promise.reject(new Error("Unexpected microphone access during background preparation test"));
        },
      },
    });
    class FakeMediaRecorder extends EventTarget {
      static isTypeSupported() { return true; }
    }
    Object.defineProperty(window, "MediaRecorder", { configurable: true, value: FakeMediaRecorder });

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
  assert.equal(await page.evaluate(() => window.crossOriginIsolated), true, "the chat route serves the COOP/COEP headers required by browser-whisper");

  const chat = page.locator("kroma-chat");
  const display = chat.locator(".kroma-chat__virtual-display");
  const keyboard = chat.locator(".hg-theme-default");
  const speechButton = chat.locator(".kroma-chat__speech-button");
  const speechStatus = chat.locator(".kroma-chat__speech-status");
  const sendButton = chat.locator(".kroma-chat__send");
  const botMessage = chat.locator('li[data-author="assistant"]').first();
  const playbackButton = botMessage.locator(".kroma-chat__speak-button");
  assert.equal(await speechButton.isHidden(), true, "the microphone stays hidden until the engine is ready");
  await page.waitForFunction(() => performance.getEntriesByType("resource").some((entry) =>
    /\/index-[\w-]+\.js(?:$|\?)/.test(new URL(entry.name).pathname)), null, { timeout: 10_000 });
  assert.equal(await speechButton.isHidden(), true, "background preparation does not expose a partially initialized engine");
  assert.equal(await page.evaluate(() => window.__microphoneRequests), 0, "background preparation never requests microphone access");
  assert.doesNotMatch(await chat.innerText(), /Hugging Face|120 MB|whisper-tiny|Descargando modelo/i, "preparation details are not exposed in the composer");
  assert.equal(await chat.locator(".kroma-chat__speech-prepare, .kroma-chat__speech-cancel").count(), 0, "the composer has no installation controls");
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
  assert.equal(await keyboard.isVisible(), true, "the virtual keyboard remains usable while background preparation runs");
  assert.equal(await display.innerText(), "Tengo una consulta", "background preparation does not change the existing draft");
  await keyboard.locator('button[data-skbtn="a"]').click();
  assert.equal(await display.innerText(), "Tengo auna consulta", "virtual keyboard remains usable while dictation is unavailable");
  await display.focus();
  await page.keyboard.type("x");
  assert.equal(await display.innerText(), "Tengo axuna consulta", "physical typing remains usable while dictation is unavailable");

  await sendButton.click();
  await page.waitForFunction(() => document.querySelector(".kroma-chat__virtual-display")?.innerText === "");
  assert.equal(await display.innerText(), "", "manual send submits and clears the edited draft");
  assert.deepEqual(errors, [], "dictation integration produces no browser errors");
  assert.equal(await speechStatus.getAttribute("role"), "status", "speech feedback is announced politely");
  console.log("Chat speech Playwright checks passed: automatic deferred preparation, hidden microphone, no premature permission request, keyboard editing and manual send.");
} finally {
  await browser?.close();
  server.kill();
}
