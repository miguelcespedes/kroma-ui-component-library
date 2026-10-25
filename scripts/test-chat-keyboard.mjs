import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const root = process.cwd();
const port = Number(process.env.KROMA_CHAT_PREVIEW_PORT ?? 4178);
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
  await page.goto(url);
  const chat = page.locator("#chat kroma-chat");
  const display = chat.locator(".kroma-chat__virtual-display");
  await display.click();
  const keyboard = chat.locator(".hg-theme-default");
  await keyboard.waitFor({ state: "visible" });

  for (const theme of ["light", "dark"]) {
    await page.evaluate((mode) => document.documentElement.setAttribute("data-bs-theme", mode), theme);
    for (const width of [360, 390, 430]) {
      await page.setViewportSize({ width, height: 900 });
      const metrics = await keyboard.evaluate((element) => {
        const rect = (node) => {
          const { left, right, top, bottom, width, height } = node.getBoundingClientRect();
          return { left, right, top, bottom, width, height };
        };
        const button = (value) => element.querySelector(`button[data-skbtn="${value}"]`);
        const keyStyle = getComputedStyle(button("a"));
        return {
          bounds: rect(element),
          rows: [...element.querySelectorAll(".hg-row")].map(rect),
          keys: [...element.querySelectorAll("button.hg-button")].map(rect),
          noInnerScroll: element.scrollHeight <= element.clientHeight + 1,
          keyColor: keyStyle.color,
          hostColor: getComputedStyle(element.closest(".kroma-chat")).color,
          fontWeight: Number(keyStyle.fontWeight),
          primarySurface: keyStyle.backgroundColor,
          utilitySurface: getComputedStyle(button("{shift}")).backgroundColor,
          spaceWidth: rect(button("{space}")).width,
          commaWidth: rect(button(",")).width,
        };
      });
      assert.equal(metrics.rows.length, 4, `${theme} layout retains four rows at ${width}px`);
      assert.equal(metrics.noInnerScroll, true, `${theme} layout avoids internal keyboard scroll at ${width}px`);
      assert.equal(metrics.keyColor, metrics.hostColor, `${theme} letters use Kroma semantic content color`);
      assert.ok(metrics.fontWeight >= 500 && metrics.fontWeight <= 600, "key labels use medium weight");
      assert.notEqual(metrics.primarySurface, metrics.utilitySurface, `${theme} utility keys use a secondary surface`);
      assert.ok(metrics.spaceWidth >= metrics.commaWidth * 2.5, `space dominates the bottom row at ${width}px`);
      assert.ok(metrics.keys.every((key) => key.height >= 39 && key.top >= metrics.bounds.top - 1 && key.bottom <= metrics.bounds.bottom + 1), `${theme} keys are touch-sized and not clipped at ${width}px`);
      assert.ok(metrics.rows.every((row) => row.left >= metrics.bounds.left - 1 && row.right <= metrics.bounds.right + 1), `${theme} rows fit the keyboard at ${width}px`);
    }
  }

  const key = (value) => keyboard.locator(`button[data-skbtn="${value}"]`);
  await key("a").click();
  await key("{shift}").click();
  await key("B").click();
  assert.match(await display.innerText(), /aB/, "typing and one-shot Shift work");
  await key("{shift}").click({ clickCount: 2, delay: 60 });
  await key("C").click();
  assert.match(await display.innerText(), /aBC/, "Caps Lock works");
  await key("{bksp}").click();
  assert.match(await display.innerText(), /aB\s*$/, "Backspace removes the previous character");
  await key("{numbers}").click();
  await key("1").click();
  assert.match(await display.innerText(), /aB1/, "number layout types digits");
  await key("{symbols}").click();
  await key("~").click();
  assert.match(await display.innerText(), /aB1~/, "symbol layout types symbols");
  await key("{abc}").click();
  await key("{space}").click();
  assert.match(await display.innerText(), /aB1~\s/, "alphabet layout and space work");
  const secondCharacter = display.locator('[data-start="1"]');
  const secondCharacterBox = await secondCharacter.boundingBox();
  const displayBox = await display.boundingBox();
  assert.ok(secondCharacterBox, "typed text exposes a selectable cursor position");
  assert.ok(displayBox, "composer display has a clickable area");
  await display.click({ position: {
    x: secondCharacterBox.x - displayBox.x + 1,
    y: secondCharacterBox.y - displayBox.y + secondCharacterBox.height / 2,
  } });
  await key("x").click();
  assert.match(await display.innerText(), /axB1~/, "clicking text moves the cursor and inserts at the selection");
  let sends = 0;
  await chat.evaluate((element) => element.addEventListener("kroma-chat-send", () => element.dataset.keyboardSent = "true"));
  await key("{enter}").click();
  sends = await chat.evaluate((element) => element.dataset.keyboardSent === "true" ? 1 : 0);
  assert.equal(sends, 1, "Enter sends the composed message");
  assert.equal(await display.innerText(), "", "sending clears the composer");
  assert.deepEqual(errors, [], "keyboard interactions produce no browser errors");
  console.log("Chat keyboard Playwright checks passed: 360/390/430px, light/dark, four-row fit, touch geometry, Shift/Caps Lock, Backspace, numbers, symbols, space and send.");
} finally {
  await browser?.close();
  server.kill();
}
