import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const url = "http://127.0.0.1:4177/";
const server = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "preview", "--config", "vite.config.js", "--host", "127.0.0.1", "--port", "4177", "--strictPort"], { stdio: "ignore" });
let browser;
let passed = 0;

try {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try { const response = await fetch(url); if (response.ok) break; } catch { /* Waiting for preview. */ }
    if (attempt === 59) throw new Error("Vite preview did not start");
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  browser = await chromium.launch({ headless: true });
  for (const viewport of [{ width: 1440, height: 900 }, { width: 820, height: 900 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, colorScheme: "light" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(url);
    for (const theme of ["bootstrap", "dracula", "kroma-entrepreneur"]) {
      await page.locator(`[data-theme-value="${theme}"]`).evaluate((element) => element.click());
      await page.waitForFunction((id) => document.documentElement.dataset.kromaTheme === id, theme);
      for (const mode of ["light", "dark", "auto"]) {
        await page.locator(`[data-bs-theme-value="${mode}"]`).evaluate((element) => element.click());
        await page.waitForTimeout(250);
        const result = await page.evaluate(() => {
          const root = document.documentElement;
          const color = (selector, property) => getComputedStyle(document.querySelector(selector))[property];
          return {
            theme: root.dataset.kromaTheme,
            mode: root.dataset.bsTheme,
            stylesheet: document.querySelector("#kroma-theme-stylesheet")?.getAttribute("href"),
            tokens: document.querySelectorAll("[data-theme-token-palette] .bd-color-token").length,
            button: color("#buttons .btn-primary", "backgroundColor"),
            buttonText: color("#buttons .btn-primary", "color"),
            buttonVars: ["--bs-btn-bg", "--bs-btn-color", "--kroma-color-on-action"].map((key) => getComputedStyle(document.querySelector("#buttons .btn-primary")).getPropertyValue(key).trim()),
            input: color(".form-control", "backgroundColor"),
            table: color("#tables .table", "borderColor"),
            sidebar: color(".bd-sidebar", "backgroundColor"),
            header: color(".bd-header", "backgroundColor"),
            headerText: color(".bd-header", "color"),
            themeSelector: color(".bd-header [data-theme-selector]", "backgroundColor"),
            role: getComputedStyle(root).getPropertyValue("--kroma-color-primary").trim(),
            overflow: document.documentElement.scrollWidth > innerWidth + 1,
          };
        });
        assert.equal(result.theme, theme);
        assert.equal(result.mode, mode === "auto" ? "light" : mode);
        assert.ok(result.button && result.button !== "rgba(0, 0, 0, 0)", `${theme}/${mode}: button background`);
        const luminance = (rgb) => {
          const channels = rgb.match(/[\d.]+/g).slice(0, 3).map((channel) => Number(channel) / 255)
            .map((channel) => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4);
          return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
        };
        const a = luminance(result.button);
        const b = luminance(result.buttonText);
        assert.ok((Math.max(a, b) + .05) / (Math.min(a, b) + .05) >= 4.5, `${theme}/${mode}: primary button text contrast ${result.buttonText} on ${result.button} ${result.buttonVars}`);
        assert.ok(result.input, `${theme}/${mode}: form input`);
        assert.ok(result.table, `${theme}/${mode}: table`);
        assert.ok(result.sidebar, `${theme}/${mode}: sidebar`);
        assert.ok(result.header && result.header !== "rgba(0, 0, 0, 0)", `${theme}/${mode}: header background`);
        assert.ok(result.themeSelector && result.themeSelector !== "rgba(0, 0, 0, 0)", `${theme}/${mode}: theme selector background`);
        const headerA = luminance(result.header);
        const headerB = luminance(result.headerText);
        assert.ok((Math.max(headerA, headerB) + .05) / (Math.min(headerA, headerB) + .05) >= 4.5, `${theme}/${mode}: header text contrast ${result.headerText} on ${result.header}`);
        assert.equal(result.overflow, false, `${theme}/${mode}: horizontal overflow at ${viewport.width}`);
        if (theme !== "bootstrap") {
          assert.ok(result.stylesheet?.includes(`/themes/${theme}.css`), `${theme}/${mode}: stylesheet URL`);
          assert.ok(result.tokens > 0, `${theme}/${mode}: color palette`);
          assert.ok(result.role.startsWith("#"), `${theme}/${mode}: semantic CSS token`);
        } else {
          assert.equal(result.tokens, 0);
          assert.equal(result.role, "", "Bootstrap must not inherit Kroma tokens");
        }
        passed += 1;
        if (viewport.width === 1440 && (mode === "dark" || mode === "light")) {
          await page.screenshot({ path: `C:/Users/HOME/AppData/Local/Temp/opencode/kroma-after-${theme}-${mode}.png` });
        }
        if (viewport.width === 1440 && mode === "dark") {
          const trigger = page.locator('#modal [data-bs-toggle="modal"]').first();
          await trigger.click();
          await page.locator(".modal.show").first().waitFor();
          await page.locator('.modal.show [data-bs-dismiss="modal"]').first().click();
          await page.locator(".modal.show").first().waitFor({ state: "hidden" });
          const accordion = page.locator("#accordion .accordion-button").first();
          const expanded = await accordion.getAttribute("aria-expanded");
          await accordion.click();
          assert.notEqual(await accordion.getAttribute("aria-expanded"), expanded);
        }
      }
    }
    await page.reload();
    await page.waitForFunction(() => document.documentElement.dataset.kromaTheme === "kroma-entrepreneur" && getComputedStyle(document.documentElement).visibility === "visible");
    await context.setDefaultNavigationTimeout(15000);
    await page.emulateMedia({ colorScheme: "dark" });
    await page.waitForFunction(() => document.documentElement.dataset.bsTheme === "dark");
    await page.locator('[data-theme-value="dracula"]').evaluate((element) => element.click());
    await page.waitForFunction(() => document.documentElement.dataset.kromaTheme === "dracula");
    await page.locator('[data-theme-value="bootstrap"]').evaluate((element) => element.click());
    await page.waitForFunction(() => document.documentElement.dataset.kromaTheme === "bootstrap");
    assert.equal(await page.locator("#kroma-theme-stylesheet").getAttribute("href"), null);
    assert.deepEqual(errors, [], `browser errors at ${viewport.width}`);
    await context.close();
  }
  console.log(`Browser checks passed: ${passed} theme/mode/viewport cases + auto system change.`);
} finally {
  await browser?.close();
  server.kill();
}
