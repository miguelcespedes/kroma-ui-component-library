import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const root = process.cwd();
const port = Number(process.env.KROMA_CHAT_SPEECH_PORT ?? 4179);
const url = `http://127.0.0.1:${port}/`;
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
  const page = await browser.newPage({ viewport: { width: 430, height: 900 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
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
  });
  await page.goto(url);
  await page.locator("[data-theme-selector]").click();
  await page.locator('[data-theme-value="kroma-entrepreneur"]').click();
  await page.waitForFunction(() => document.documentElement.dataset.kromaTheme === "kroma-entrepreneur"
    && document.querySelector("[data-theme-dropdown]")?.dataset.themeState === "ready");

  const chat = page.locator("#chat kroma-chat");
  const display = chat.locator(".kroma-chat__virtual-display");
  const keyboard = chat.locator(".hg-theme-default");
  const speechButton = chat.locator(".kroma-chat__speech-button");
  const speechStatus = chat.locator(".kroma-chat__speech-status");
  const sendButton = chat.locator(".kroma-chat__send");
  assert.equal(await speechButton.isDisabled(), false, "secure localhost with the SpeechRecognition capability enables dictation");
  assert.equal(await speechButton.getAttribute("aria-pressed"), "false");
  assert.match(await speechButton.getAttribute("aria-describedby"), /speech-privacy/);

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
  await speechButton.click();
  await page.waitForFunction(() => document.querySelector(".kroma-chat__speech-button")?.dataset.speechState === "listening");
  assert.equal(await speechButton.getAttribute("aria-pressed"), "true", "listening state is exposed to assistive technology");
  assert.equal(await keyboard.isHidden(), true, "dictation temporarily hides the virtual keyboard without clearing its text");
  let sends;
  await chat.evaluate((element) => element.addEventListener("kroma-chat-send", () => {
    element.dataset.speechTestSent = String(Number(element.dataset.speechTestSent || 0) + 1);
  }));
  await page.evaluate(() => {
    window.SpeechRecognition.lastInstance.emitResults([
      { transcript: "Hola ", isFinal: true },
      { transcript: "¿cómo estás?", isFinal: false },
    ]);
  });
  assert.equal(await display.innerText(), "Tengo Hola ¿cómo estás? una consulta", "partial speech inserts at the cursor and preserves text on both sides");
  await page.evaluate(() => window.SpeechRecognition.lastInstance.emitResults([
    { transcript: "Hola ", isFinal: true },
    { transcript: "¿cómo estás hoy?", isFinal: false },
  ]));
  assert.equal(await display.innerText(), "Tengo Hola ¿cómo estás hoy? una consulta", "successive interim results replace, rather than duplicate, provisional text");
  await page.evaluate(() => window.SpeechRecognition.lastInstance.emitResults([
    { transcript: "Hola, ¿cómo estás hoy?", isFinal: true },
  ]));
  assert.equal(await display.innerText(), "Tengo Hola, ¿cómo estás hoy? una consulta", "final result replaces interim text and preserves the original draft");
  sends = await chat.evaluate((element) => Number(element.dataset.speechTestSent || 0));
  assert.equal(sends, 0, "dictation never submits automatically");

  await page.waitForTimeout(300);
  const listeningStyle = await speechButton.evaluate((button) => ({
    background: getComputedStyle(button).backgroundColor,
    color: getComputedStyle(button).color,
  }));
  await page.evaluate(() => { window.SpeechRecognition.holdStop = true; });
  await speechButton.click();
  await page.waitForFunction(() => document.querySelector(".kroma-chat__speech-button")?.dataset.speechState === "stopping");
  assert.equal(await speechButton.getAttribute("aria-pressed"), "true", "stopping remains announced as active until recognition ends");
  await page.waitForTimeout(300);
  const stoppingStyle = await speechButton.evaluate((button) => ({
    background: getComputedStyle(button).backgroundColor,
    color: getComputedStyle(button).color,
    iconStroke: getComputedStyle(button.querySelector("svg")).strokeWidth,
  }));
  assert.deepEqual(stoppingStyle, { ...listeningStyle, iconStroke: "2.2px" }, "stopping keeps the intense active button and icon treatment");
  await page.evaluate(() => {
    window.SpeechRecognition.lastInstance.emitEnd();
    window.SpeechRecognition.holdStop = false;
  });
  await page.waitForFunction(() => document.querySelector(".kroma-chat__speech-button")?.dataset.speechState === "idle");
  const displayBounds = await display.boundingBox();
  assert.ok(displayBounds, "composer is visible after dictation");
  await display.click({ position: { x: displayBounds.width - 4, y: displayBounds.height / 2 } });
  assert.equal(await keyboard.isVisible(), true, "clicking the composer reopens the virtual keyboard after dictation");
  await keyboard.locator('button[data-skbtn="a"]').click();
  assert.match(await display.innerText(), /a$/, "virtual keyboard edits the same synchronized transcript");
  await display.focus();
  await page.keyboard.type("x");
  assert.match(await display.innerText(), /ax$/, "physical typing edits the same transcript after dictation");

  await sendButton.click();
  await page.waitForFunction(() => document.querySelector("kroma-chat")?.dataset.speechTestSent === "1");
  assert.equal(await display.innerText(), "", "manual send clears the final edited draft");
  await speechButton.click();
  await page.waitForFunction(() => document.querySelector(".kroma-chat__speech-button")?.dataset.speechState === "listening");
  await page.evaluate(() => window.SpeechRecognition.lastInstance.emitError("network"));
  await page.waitForFunction(() => document.querySelector(".kroma-chat__speech-button")?.dataset.speechState === "error");
  assert.match(await speechStatus.innerText(), /servicio de voz del navegador/i, "network errors identify the browser's speech service");
  assert.equal(await keyboard.isVisible(), true, "a speech service error restores the virtual keyboard fallback");
  await display.focus();
  await page.keyboard.type("fallback");
  assert.match(await display.innerText(), /fallback$/, "physical typing remains available after a speech service error");
  assert.deepEqual(errors, [], "dictation integration produces no browser errors");
  assert.equal(await speechStatus.getAttribute("role"), "status", "speech feedback is announced politely");
  console.log("Chat speech Playwright checks passed: explicit start, interim/final replacement, existing draft, keyboard synchronization and manual send.");
} finally {
  await browser?.close();
  server.kill();
}
