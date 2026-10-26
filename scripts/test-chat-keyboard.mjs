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
  await page.locator("[data-theme-selector]").click();
  await page.locator('[data-theme-value="kroma-entrepreneur"]').click();
  await page.waitForFunction(() => document.documentElement.dataset.kromaTheme === "kroma-entrepreneur"
    && document.querySelector("[data-theme-dropdown]")?.dataset.themeState === "ready");
  const chat = page.locator("#chat kroma-chat");
  const display = chat.locator(".kroma-chat__virtual-display");
  await display.click();
  const keyboard = chat.locator(".hg-theme-default");
  await keyboard.waitFor({ state: "visible" });
  const key = (value) => keyboard.locator(`button[data-skbtn="${value}"]`);
  const popup = page.locator("body > .kroma-chat__key-preview");
  const composerArea = chat.locator(".kroma-chat__composer-area");
  const keyboardDock = chat.locator(".kroma-chat__keyboard-dock");
  assert.equal(await keyboard.locator('button[data-skbtn="{language}"]').count(), 0, "keyboard omits the language/globe key from the reference image");
  assert.equal(await chat.locator(".kroma-chat__composer-field").evaluate((element) => getComputedStyle(element).outlineStyle), "none", "focused composer uses a single border instead of a doubled blue outline");
  assert.equal(await key("{enter}").innerText(), "↵", "Enter key uses the return symbol rather than text");
  assert.equal(await key("{enter}").getAttribute("aria-label"), "Enviar mensaje", "Enter keeps its accessible action label");
  assert.equal(await chat.locator(".kroma-chat__composer-field").evaluate((element) => getComputedStyle(element).borderRadius), "24px", "text field uses a softly rounded shell");
  assert.equal(await chat.locator(".kroma-chat__send").count(), 0, "composer omits a separate send button");
  assert.equal(await chat.locator(".kroma-chat__composer-field").evaluate((element) => element.closest(".kroma-chat__keyboard-dock")), null, "composer is structurally independent from the keyboard dock");
  assert.equal(await keyboard.evaluate((element) => element.parentElement?.classList.contains("kroma-chat__keyboard-dock")), true, "keyboard lives in its own bottom dock");
  assert.equal(await key("{enter}").evaluate((element) => getComputedStyle(element).backgroundColor), await key("{enter}").evaluate((element) => {
    const probe = document.createElement("span");
    probe.style.backgroundColor = getComputedStyle(element.closest(".kroma-chat")).getPropertyValue("--kroma-chat-action-primary-surface");
    document.body.append(probe);
    const color = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return color;
  }), "Enter key uses the primary action color");
  await display.focus();
  await page.keyboard.type("d");
  assert.match(await display.innerText(), /d/, "physical keyboard input still reaches the composer");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  const focusProbe = await display.evaluate((element) => {
    const style = getComputedStyle(element);
    const fieldStyle = getComputedStyle(element.closest(".kroma-chat__composer-field"));
    return {
      active: document.activeElement === element,
      focusVisible: element.matches(":focus-visible"),
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      outlineOffset: style.outlineOffset,
      boxShadow: style.boxShadow,
      fieldBorder: fieldStyle.borderTopColor,
      fieldFocusToken: fieldStyle.getPropertyValue("--kroma-chat-state-focus").trim(),
    };
  });
  assert.equal(focusProbe.active, true, "Shift+Tab returns focus to the virtual textbox");
  assert.equal(focusProbe.focusVisible, true, "keyboard navigation exposes the textbox focus-visible state");
  assert.equal(focusProbe.outlineStyle, "none", `keyboard focus ring is rendered only by the outer field, not the inner textbox: ${JSON.stringify(focusProbe)}`);
  assert.equal(await composerArea.locator(".kroma-chat__composer-field").evaluate((element) => getComputedStyle(element).outlineStyle), "none", "outer field uses its focus border instead of a second outline");
  await key("{bksp}").click();

  const verifyComposerFocus = async () => {
    await display.click();
    await page.keyboard.type("h");
    assert.match(await display.innerText(), /h/, "physical key inserts into the virtual textbox");
    const microphoneEnabled = await composerArea.locator(".kroma-chat__speech-button").isEnabled();
    await page.keyboard.press("Tab");
    if (microphoneEnabled) {
      const microphoneStop = await page.evaluate(() => ({
        isMicrophone: document.activeElement?.matches(".kroma-chat__speech-button"),
        outlineStyle: document.activeElement ? getComputedStyle(document.activeElement).outlineStyle : "none",
      }));
      assert.equal(microphoneStop.isMicrophone, true, "Tab exposes the available microphone control");
      assert.equal(microphoneStop.outlineStyle, "solid", "microphone retains its keyboard focus indicator");
      await page.keyboard.press("Tab");
    }
    const tabStop = await page.evaluate(() => ({
      isKeyboardKey: document.activeElement?.matches(".hg-theme-default button.hg-button"),
      key: document.activeElement?.getAttribute("data-skbtn"),
      outlineStyle: document.activeElement ? getComputedStyle(document.activeElement).outlineStyle : "none",
    }));
    assert.equal(tabStop.isKeyboardKey, true, "Tab advances from the microphone to the virtual keyboard");
    assert.equal(tabStop.key, "q", "the keyboard's first key follows the microphone in the tab order");
    assert.equal(tabStop.outlineStyle, "solid", "virtual keys retain their keyboard focus indicator");
    const unfocusedBorder = await composerArea.locator(".kroma-chat__composer-field").evaluate((element) => getComputedStyle(element).borderTopColor);
    await page.keyboard.press("Shift+Tab");
    if (microphoneEnabled) await page.keyboard.press("Shift+Tab");
    // Let the field's 150ms border-color transition settle before comparing
    // the resolved semantic token with the computed border color.
    await page.waitForTimeout(200);
    const focusState = await display.evaluate((element) => {
      const field = element.closest(".kroma-chat__composer-field");
      const tokenProbe = document.createElement("span");
      tokenProbe.style.color = "var(--kroma-chat-state-focus)";
      field?.append(tokenProbe);
      const expectedFocusColor = tokenProbe.isConnected ? getComputedStyle(tokenProbe).color : "";
      tokenProbe.remove();
      return {
        active: document.activeElement === element,
        focusVisible: element.matches(":focus-visible"),
        innerOutline: getComputedStyle(element).outlineStyle,
        innerOutlineOffset: getComputedStyle(element).outlineOffset,
        fieldOutline: field ? getComputedStyle(field).outlineStyle : "none",
        fieldBorder: field ? getComputedStyle(field).borderTopColor : "",
        expectedFocusColor,
        outerRadius: field ? getComputedStyle(field).borderRadius : "",
      };
    });
    assert.equal(focusState.active, true, "Shift+Tab returns focus to the virtual textbox");
    assert.equal(focusState.focusVisible, true, "textbox remains visibly keyboard-focused");
    assert.equal(focusState.innerOutline, "none", `inner textbox has no rectangular focus outline: ${JSON.stringify(focusState)}`);
    assert.equal(focusState.innerOutlineOffset, "0px", "inner textbox has no offset focus ring");
    assert.equal(focusState.fieldOutline, "none", "outer field uses its border, not an extra outline");
    assert.equal(focusState.fieldBorder, focusState.expectedFocusColor, "outer field border uses the semantic focus token");
    assert.notEqual(focusState.fieldBorder, unfocusedBorder, "outer border clearly changes between normal and focused states");
    assert.equal(focusState.outerRadius, "24px", "focus styling preserves the 1.5rem outer radius");
    await key("{bksp}").click();
  };

  for (const theme of ["light", "dark"]) {
    await page.evaluate((mode) => document.documentElement.setAttribute("data-bs-theme", mode), theme);
    await verifyComposerFocus();
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
          dockBounds: rect(element.parentElement),
          rows: [...element.querySelectorAll(".hg-row")].map(rect),
          keys: [...element.querySelectorAll("button.hg-button")].map(rect),
          noInnerScroll: element.scrollHeight <= element.clientHeight + 1,
          keyColor: keyStyle.color,
          hostColor: getComputedStyle(element.closest(".kroma-chat")).color,
          keySurface: keyStyle.backgroundColor,
          dockSurface: getComputedStyle(element.parentElement).backgroundColor,
          dockRadius: Number.parseFloat(getComputedStyle(element.parentElement).borderRadius),
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
      assert.notEqual(metrics.dockSurface, metrics.keySurface, `${theme} keyboard sits on a darker contrasting surface`);
      assert.ok(metrics.dockRadius >= 20, `${theme} keyboard dock has generous rounded corners`);
      assert.ok(metrics.spaceWidth >= metrics.commaWidth * 2.5, `space dominates the bottom row at ${width}px`);
      assert.ok(metrics.keys.every((key) => key.height >= 39 && key.top >= metrics.bounds.top - 1 && key.bottom <= metrics.bounds.bottom + 1), `${theme} keys are touch-sized and not clipped at ${width}px`);
      assert.ok(metrics.rows.every((row) => row.left >= metrics.bounds.left - 1 && row.right <= metrics.bounds.right + 1), `${theme} rows fit the keyboard at ${width}px`);
      assert.ok(metrics.bounds.left - metrics.dockBounds.left <= 10
        && metrics.dockBounds.right - metrics.bounds.right <= 10, `keyboard uses the dock width with a compact gutter at ${width}px`);
      const [composerBounds, dockBounds] = await Promise.all([composerArea.boundingBox(), keyboardDock.boundingBox()]);
      assert.ok(composerBounds && dockBounds && composerBounds.y + composerBounds.height <= dockBounds.y + 1, `composer floats immediately above the keyboard dock at ${width}px`);
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

  await key("{numbers}").click();
  await holdKey("1", "1", 80);
  assert.equal((await display.innerText()).split("1").length - 1, 1, "number press inserts one digit");
  await key("{bksp}").click();
  await holdKey("0", "0", 80);
  await key("{bksp}").click();
  await key("{symbols}").click();
  await holdKey("€", "€", 80);
  assert.equal((await display.innerText()).split("€").length - 1, 1, "symbol press inserts one symbol");
  await key("{bksp}").click();
  await key("{abc}").click();
  await holdKey(",", ",", 80);
  await key("{bksp}").click();

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
  await display.click();
  await page.keyboard.type("send by Enter");
  assert.equal(await keyboard.isVisible(), true, "typing opens the virtual keyboard before submitting with Enter");
  await chat.evaluate((element) => element.addEventListener("kroma-chat-send", () => {
    element.dataset.keyboardSendCount = String(Number(element.dataset.keyboardSendCount || 0) + 1);
  }));
  await key("{enter}").click();
  assert.equal(await chat.getAttribute("data-keyboard-send-count"), "1", "Enter submits while the virtual keyboard is open");
  assert.equal(await display.innerText(), "", "Enter submission clears the composer");
  assert.equal(await keyboard.isHidden(), true, "successful Enter submission closes the virtual keyboard");

  const adaptivePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await adaptivePage.addInitScript(() => {
    localStorage.setItem("kroma-theme-mode", "dracula");
    localStorage.setItem("kroma-color-mode", "light");
    Object.defineProperty(navigator, "brave", { configurable: true, value: {} });
    Object.defineProperty(window, "SpeechRecognition", { configurable: true, value: class {} });
  });
  await adaptivePage.goto(`${url}kroma-chat`);
  await adaptivePage.waitForFunction(() => document.querySelector("kroma-chat")?.isConnected === true);
  await adaptivePage.waitForFunction(() => document.documentElement.dataset.kromaTheme === "dracula"
    && document.querySelector("#kroma-theme-stylesheet")?.media === "all");
  const standaloneState = await adaptivePage.evaluate(() => {
    const page = document.querySelector(".kroma-chat-page");
    const chat = document.querySelector("kroma-chat");
    return {
      hasToolbar: Boolean(document.querySelector(".kroma-chat-lab__toolbar")),
      hasVisibleThemeControls: [...document.querySelectorAll("[data-theme-selector], [data-bs-theme-value]")]
        .some((control) => control.getClientRects().length > 0),
      adaptive: page?.hasAttribute("data-chat-layout-adaptive"),
      chatWidth: getComputedStyle(chat).width,
      contrast: document.documentElement.dataset.bsTheme,
      speechButtonHidden: chat.querySelector(".kroma-chat__speech-button")?.hidden,
      composerFieldEnd: chat.querySelector(".kroma-chat__composer-field").getBoundingClientRect().right,
      composerEnd: chat.querySelector(".kroma-chat__composer").getBoundingClientRect().right,
    };
  });
  assert.equal(standaloneState.hasToolbar, false, "standalone route omits the customization toolbar");
  assert.equal(standaloneState.hasVisibleThemeControls, false, "standalone route exposes no theme or contrast controls");
  assert.equal(standaloneState.adaptive, true, "standalone route starts in adaptive layout");
  assert.equal(standaloneState.chatWidth, "390px", "adaptive chat fills the viewport width");
  assert.equal(standaloneState.contrast, "light", "standalone route restores saved contrast mode");
  assert.equal(standaloneState.speechButtonHidden, true, "Brave does not show the unsupported microphone control");
  assert.ok(Math.abs(standaloneState.composerEnd - standaloneState.composerFieldEnd) < 1, "composer field uses the full available width when no action buttons are visible");
  await adaptivePage.close();

  assert.deepEqual(errors, [], "keyboard interactions produce no browser errors");
  console.log("Chat keyboard Playwright checks passed: 360/390/430px, light/dark popup surfaces, short/long/edge presses, pointer slide/cancel, excluded keys and input behavior.");
} finally {
  await browser?.close();
  server.kill();
}
