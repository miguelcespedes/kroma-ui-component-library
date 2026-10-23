import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium, firefox, webkit } from "playwright";
import * as sass from "sass";

const root = path.resolve(import.meta.dirname, "..");
const port = Number(process.env.KROMA_PREVIEW_PORT ?? 4177);
const url = `http://127.0.0.1:${port}/`;
const screenshotDir = process.env.KROMA_SCREENSHOT_DIR ?? path.join(os.tmpdir(), "kroma-screenshots");
const screenshot = process.env.KROMA_SCREENSHOTS !== "0";
const browserNames = (process.env.KROMA_BROWSERS ?? (process.argv.includes("--all") ? "chromium,firefox,webkit" : "chromium")).split(",").map((name) => name.trim()).filter(Boolean);
const browserTypes = { chromium, firefox, webkit };
const fixtureCss = sass.compile(path.join(root, "src/themes/kroma-certification/theme.scss"), {
  loadPaths: [path.join(root, "node_modules")],
  logger: sass.Logger.silent,
}).css;
const server = spawn(process.execPath, [path.join(root, "node_modules/vite/bin/vite.js"), "preview", "--config", "vite.config.js", "--host", "127.0.0.1", "--port", String(port), "--strictPort"], { cwd: root, stdio: "ignore" });
let passed = 0;

const luminance = (rgb) => {
  const values = rgb.match(/[\d.]+/g);
  if (values?.length === 4 && Number(values[3]) === 0) return null;
  const channels = values?.slice(0, 3).map((channel) => Number(channel) / 255)
    .map((channel) => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4);
  if (!channels || channels.length !== 3) return null;
  return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
};
const contrast = (foreground, background) => {
  const first = luminance(foreground);
  const second = luminance(background);
  if (first === null || second === null) return null;
  return (Math.max(first, second) + .05) / (Math.min(first, second) + .05);
};
const assertContrast = (label, foreground, background, minimum = 4.5) => {
  const ratio = contrast(foreground, background);
  if (ratio === null) return;
  assert.ok(ratio >= minimum, `${label}: contrast ${ratio.toFixed(2)} (${foreground} on ${background})`);
};

try {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try { const response = await fetch(url); if (response.ok) break; } catch { /* Waiting for preview. */ }
    if (attempt === 59) throw new Error("Vite preview did not start");
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  if (screenshot) fs.mkdirSync(screenshotDir, { recursive: true });

  for (const browserName of browserNames) {
    const browserType = browserTypes[browserName];
    if (!browserType) throw new Error(`Unsupported browser: ${browserName}`);
    const browser = await browserType.launch({ headless: true });
    try {
      for (const viewport of [{ width: 1440, height: 900 }, { width: 820, height: 900 }, { width: 390, height: 844 }]) {
        const context = await browser.newContext({ viewport, colorScheme: "light" });
        const page = await context.newPage();
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await page.goto(url);
        await page.locator('[data-theme-value="kroma-entrepreneur"]').evaluate((element) => element.click());
        await page.waitForFunction(() => document.documentElement.dataset.kromaTheme === "kroma-entrepreneur");
        await page.keyboard.press("Tab");
        const focus = await page.evaluate(() => {
          const style = getComputedStyle(document.activeElement);
          return { outline: style.outlineStyle, width: style.outlineWidth };
        });
        assert.notEqual(focus.outline, "none", "keyboard focus must be visible");
        assert.notEqual(focus.width, "0px", "keyboard focus must have width");
        for (const theme of ["bootstrap", "dracula", "kroma-entrepreneur"]) {
          await page.locator(`[data-theme-value="${theme}"]`).evaluate((element) => element.click());
          await page.waitForFunction((id) => document.documentElement.dataset.kromaTheme === id, theme);
          for (const mode of ["light", "dark", "auto"]) {
            await page.locator(`[data-bs-theme-value="${mode}"]`).evaluate((element) => element.click());
            await page.waitForTimeout(250);
            const result = await page.evaluate(() => {
              const rootElement = document.documentElement;
              const color = (selector, property) => getComputedStyle(document.querySelector(selector))[property];
              return {
                theme: rootElement.dataset.kromaTheme,
                mode: rootElement.dataset.bsTheme,
                stylesheet: document.querySelector("#kroma-theme-stylesheet")?.getAttribute("href"),
                tokens: document.querySelectorAll("[data-theme-token-palette] .bd-color-token").length,
                button: color("#buttons .btn-primary", "backgroundColor"),
                buttonText: color("#buttons .btn-primary", "color"),
                buttonVars: ["--bs-btn-bg", "--bs-btn-color", "--kroma-color-on-action"].map((key) => getComputedStyle(document.querySelector("#buttons .btn-primary")).getPropertyValue(key).trim()),
                input: color(".form-control", "backgroundColor"),
                table: color("#tables .table", "borderColor"),
                tableText: color("#tables .table", "color"),
                tableBackground: color("#tables .table", "backgroundColor"),
                sidebar: color(".bd-sidebar", "backgroundColor"),
                header: color(".bd-header", "backgroundColor"),
                headerText: color(".bd-header", "color"),
                themeSelector: color(".bd-header [data-theme-selector]", "backgroundColor"),
                role: getComputedStyle(rootElement).getPropertyValue("--kroma-color-primary").trim(),
                space: getComputedStyle(rootElement).getPropertyValue("--kroma-space-3").trim(),
                radius: getComputedStyle(rootElement).getPropertyValue("--kroma-radius-md").trim(),
                duration: getComputedStyle(rootElement).getPropertyValue("--kroma-motion-duration-normal").trim(),
                overflow: document.documentElement.scrollWidth > innerWidth + 1,
              };
            });
            assert.equal(result.theme, theme);
            assert.equal(result.mode, mode === "auto" ? "light" : mode);
            assert.ok(result.button && result.button !== "rgba(0, 0, 0, 0)", `${browserName}/${theme}/${mode}: button background`);
            assertContrast(`${browserName}/${theme}/${mode}: button text`, result.buttonText, result.button);
            assert.ok(result.input, `${browserName}/${theme}/${mode}: form input`);
            assert.ok(result.table, `${browserName}/${theme}/${mode}: table`);
            assertContrast(`${browserName}/${theme}/${mode}: table text`, result.tableText, result.tableBackground);
            assert.ok(result.sidebar, `${browserName}/${theme}/${mode}: sidebar`);
            assert.ok(result.header && result.header !== "rgba(0, 0, 0, 0)", `${browserName}/${theme}/${mode}: header background`);
            assert.ok(result.themeSelector && result.themeSelector !== "rgba(0, 0, 0, 0)", `${browserName}/${theme}/${mode}: theme selector background`);
            assertContrast(`${browserName}/${theme}/${mode}: header text`, result.headerText, result.header);
            assert.equal(result.overflow, false, `${browserName}/${theme}/${mode}: horizontal overflow at ${viewport.width}`);
            if (theme !== "bootstrap") {
              assert.ok(result.stylesheet?.includes(`/themes/${theme}.css`), `${browserName}/${theme}/${mode}: stylesheet URL`);
              assert.ok(result.tokens > 0, `${browserName}/${theme}/${mode}: color palette`);
              assert.ok(result.role.startsWith("#"), `${browserName}/${theme}/${mode}: semantic CSS token`);
              assert.ok(result.space, `${browserName}/${theme}/${mode}: spacing token`);
              assert.ok(result.radius, `${browserName}/${theme}/${mode}: shape token`);
              assert.ok(result.duration, `${browserName}/${theme}/${mode}: motion token`);
            } else {
              assert.equal(result.tokens, 0);
              assert.equal(result.role, "", "Bootstrap must not inherit Kroma tokens");
              assert.equal(result.space, "", "Bootstrap must not inherit Kroma spacing");
            }
            passed += 1;
            if (screenshot && browserName === "chromium" && viewport.width === 1440 && (mode === "dark" || mode === "light")) {
              await page.screenshot({ path: path.join(screenshotDir, `kroma-after-${theme}-${mode}.png`) });
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

        await page.addStyleTag({ content: fixtureCss });
        await page.evaluate(() => { document.documentElement.dataset.kromaTheme = "kroma-certification"; });
        for (const mode of ["light", "dark"]) {
          await page.locator(`[data-bs-theme-value="${mode}"]`).evaluate((element) => element.click());
          await page.waitForTimeout(350);
          const fixture = await page.evaluate(() => {
            const rootElement = document.documentElement;
            const button = getComputedStyle(document.querySelector("#buttons .btn-primary"));
            return {
              theme: rootElement.dataset.kromaTheme,
              mode: rootElement.dataset.bsTheme,
              role: getComputedStyle(rootElement).getPropertyValue("--kroma-color-primary").trim(),
              space: getComputedStyle(rootElement).getPropertyValue("--kroma-space-3").trim(),
              button: button.backgroundColor,
              buttonText: button.color,
            };
          });
          assert.equal(fixture.theme, "kroma-certification");
          assert.equal(fixture.mode, mode);
          assert.ok(fixture.role.startsWith("#"), `${browserName}/fixture/${mode}: semantic token`);
          assert.ok(fixture.space, `${browserName}/fixture/${mode}: spacing token`);
          assertContrast(`${browserName}/fixture/${mode}: button text`, fixture.buttonText, fixture.button);
          passed += 1;
        }

        await page.evaluate(() => { document.documentElement.dataset.kromaTheme = "unregistered-theme"; });
        const unknownRole = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--kroma-color-primary").trim());
        assert.equal(unknownRole, "", "unregistered themes must not inherit the shared adapter");
        passed += 1;

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
    } finally {
      await browser.close();
    }
  }
  console.log(`Browser checks passed: ${passed} cases across ${browserNames.join(", ")} (themes, modes, viewports, fixture, negative).`);
} finally {
  server.kill();
}
