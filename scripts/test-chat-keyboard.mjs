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
  const key = (value) => keyboard.locator(`button[data-skbtn="${value}"]`);
  const popup = page.locator("body > .kroma-chat__key-preview");

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

  const holdKey = async (value, character, duration = 420) => {
    const keyBounds = await key(value).boundingBox();
    assert.ok(keyBounds, `key ${value} is visible for preview test`);
    await page.mouse.move(keyBounds.x + keyBounds.width / 2, keyBounds.y + keyBounds.height / 2);
    await page.mouse.down();
    await popup.waitFor({ state: "visible" });
    assert.equal(await popup.getAttribute("data-visible"), "true", `${character} preview appears on pointerdown`);
    assert.equal(await popup.innerText(), character, `${character} preview reflects the active layout`);
    const popupBounds = await popup.boundingBox();
    const keyboardBounds = await keyboard.boundingBox();
    const viewport = page.viewportSize();
    assert.ok(popupBounds && keyboardBounds, "preview and keyboard have visible bounds");
    assert.ok(popupBounds.width > keyBounds.width && popupBounds.height > keyBounds.height, "preview is larger than its source key");
    assert.ok(popupBounds.x >= Math.max(0, keyboardBounds.x) - 1
      && popupBounds.x + popupBounds.width <= Math.min(viewport.width, keyboardBounds.x + keyboardBounds.width) + 1
      && popupBounds.y >= Math.max(0, keyboardBounds.y) - 1
      && popupBounds.y + popupBounds.height <= Math.min(viewport.height, keyboardBounds.y + keyboardBounds.height) + 1,
    "preview stays inside the keyboard and viewport");
    assert.equal(await popup.evaluate((element) => getComputedStyle(element).pointerEvents), "none", "preview cannot intercept pointer input");
    const previewColors = await popup.evaluate((element) => ({
      background: getComputedStyle(element).backgroundColor,
      foreground: getComputedStyle(element).color,
      surfaceToken: getComputedStyle(element).getPropertyValue("--kroma-chat-canvas").trim(),
    }));
    const keyColors = await key(value).evaluate((element) => ({
      foreground: getComputedStyle(element).color,
      surfaceToken: getComputedStyle(element).getPropertyValue("--kroma-chat-canvas").trim(),
    }));
    assert.equal(previewColors.foreground, keyColors.foreground, "popup character uses the active Kroma content color");
    assert.equal(previewColors.surfaceToken, keyColors.surfaceToken, "popup surface follows the active Kroma surface token");
    assert.notEqual(previewColors.background, "rgba(0, 0, 0, 0)", "popup surface is visible in both contrast modes");
    if (await page.evaluate(() => document.documentElement.dataset.bsTheme) === "light") {
      const channels = previewColors.background.match(/[\d.]+/g)?.slice(0, 3).map(Number) || [];
      assert.equal(channels.length, 3, "light popup background resolves to RGB");
      assert.ok(channels.every((channel) => channel >= 245), "light popup uses a white Kroma surface");
    }
    await page.waitForTimeout(duration);
    assert.equal(await popup.getAttribute("data-visible"), "true", "long press keeps preview visible");
    await page.mouse.up();
    await expectPopupHidden(popup);
  };
  const expectPopupHidden = async (element) => {
    await page.waitForFunction((node) => node.dataset.visible === "false", await element.elementHandle());
    await page.waitForTimeout(130);
    assert.equal(await element.isHidden(), true, "popup is removed from view after release or cancellation");
  };

  await page.setViewportSize({ width: 360, height: 900 });
  await page.evaluate(() => document.documentElement.setAttribute("data-bs-theme", "light"));
  await holdKey("ñ", "ñ");
  assert.equal((await display.innerText()).split("ñ").length - 1, 1, "a long press inserts its character only once");
  await key("{bksp}").click();

  await page.setViewportSize({ width: 430, height: 900 });
  await page.evaluate(() => document.documentElement.setAttribute("data-bs-theme", "dark"));
  await holdKey("q", "q", 80);
  await key("{bksp}").click();

  await page.setViewportSize({ width: 390, height: 900 });
  await key("{shift}").click();
  await holdKey("A", "A", 80);
  assert.equal((await display.innerText()).split("A").length - 1, 1, "shifted character inserts once");
  await key("{bksp}").click();

  await key("{numbers}").click();
  await holdKey("á", "á", 80);
  await key("{bksp}").click();
  await key("{abc}").click();

  await key("{shift}").dispatchEvent("pointerdown", { pointerId: 42, isPrimary: true, button: 0 });
  assert.equal(await popup.getAttribute("data-visible"), "false", "Shift does not show a preview");
  await page.evaluate(() => window.dispatchEvent(new PointerEvent("pointerup", { pointerId: 42, isPrimary: true })));

  await key("m").dispatchEvent("pointerdown", { pointerId: 43, isPrimary: true, button: 0 });
  assert.equal(await popup.getAttribute("data-visible"), "true", "letter preview appears before cancellation");
  await page.evaluate(() => window.dispatchEvent(new PointerEvent("pointercancel", { pointerId: 43, isPrimary: true })));
  await expectPopupHidden(popup);

  let syntheticPointerId = 50;
  const assertNoPreview = async (value) => {
    const pointerId = syntheticPointerId++;
    await key(value).dispatchEvent("pointerdown", { pointerId, isPrimary: true, button: 0 });
    assert.equal(await popup.getAttribute("data-visible"), "false", `${value} does not show a character preview`);
    await page.evaluate((id) => window.dispatchEvent(new PointerEvent("pointerup", { pointerId: id, isPrimary: true })), pointerId);
  };
  await assertNoPreview("{shift}");
  await assertNoPreview("{bksp}");
  await assertNoPreview("{space}");
  await assertNoPreview("{enter}");
  await assertNoPreview("{numbers}");
  await key("{numbers}").click();
  await assertNoPreview("{symbols}");
  await assertNoPreview("{abc}");
  await key("{abc}").click();

  const qBounds = await key("q").boundingBox();
  const xBounds = await key("x").boundingBox();
  assert.ok(qBounds && xBounds, "keys are available for pointer-slide testing");
  await key("q").dispatchEvent("pointerdown", { pointerId: 60, isPrimary: true, button: 0 });
  await page.evaluate(({ pointerId, x, y }) => window.dispatchEvent(new PointerEvent("pointermove", {
    pointerId, isPrimary: true, clientX: x, clientY: y,
  })), { pointerId: 60, x: xBounds.x + xBounds.width / 2, y: xBounds.y + xBounds.height / 2 });
  assert.equal(await popup.innerText(), "x", "sliding to another letter updates the preview");
  await page.evaluate(() => window.dispatchEvent(new PointerEvent("pointercancel", { pointerId: 60, isPrimary: true })));
  await expectPopupHidden(popup);

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
  console.log("Chat keyboard Playwright checks passed: 360/390/430px, light/dark popup surfaces, short/long/edge presses, pointer slide/cancel, excluded keys and input behavior.");
} finally {
  await browser?.close();
  server.kill();
}
