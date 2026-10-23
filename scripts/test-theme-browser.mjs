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
const installColorHelpers = () => {
  const parse = (color) => {
    const values = color.match(/[\d.]+/g)?.map(Number);
    if (!values || values.length < 3) return { r: 0, g: 0, b: 0, a: 0 };
    return { r: values[0], g: values[1], b: values[2], a: values.length > 3 ? values[3] : 1 };
  };
  const blend = (foreground, background) => ({
    r: foreground.r * foreground.a + background.r * (1 - foreground.a),
    g: foreground.g * foreground.a + background.g * (1 - foreground.a),
    b: foreground.b * foreground.a + background.b * (1 - foreground.a),
    a: 1,
  });
  window.__kromaReadColors = (element) => {
    const chain = [];
    for (let node = element; node; node = node.parentElement) chain.unshift(node);
    let background = { r: 255, g: 255, b: 255, a: 1 };
    for (const node of chain) {
      const layer = parse(getComputedStyle(node).backgroundColor);
      if (layer.a > 0) background = blend(layer, background);
    }
    return {
      background: [background.r, background.g, background.b],
      foreground: (() => {
        const text = blend(parse(getComputedStyle(element).color), background);
        return [text.r, text.g, text.b];
      })(),
    };
  };
};
const channelLuminance = (color) => color.map((value) => value / 255)
  .map((value) => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
  .reduce((total, value, index) => total + value * [.2126, .7152, .0722][index], 0);
const channelContrast = (foreground, background) => {
  const first = channelLuminance(foreground);
  const second = channelLuminance(background);
  return (Math.max(first, second) + .05) / (Math.min(first, second) + .05);
};
const readColors = (locator) => locator.evaluate((element) => window.__kromaReadColors(element));
const assertColorsContrast = (label, colors, minimum = 4.5) => {
  const ratio = channelContrast(colors.foreground, colors.background);
  assert.ok(ratio >= minimum, `${label}: contrast ${ratio.toFixed(2)} (${colors.foreground.join(", ")} on ${colors.background.join(", ")})`);
};
const buttonSelectors = [
  ".btn-primary",
  ".btn-secondary",
  ".btn-success",
  ".btn-info",
  ".btn-warning",
  ".btn-danger",
  ".btn-outline-primary",
  ".btn-outline-secondary",
  ".btn-outline-success",
  ".btn-outline-info",
  ".btn-outline-warning",
  ".btn-outline-danger",
];
const componentSelectors = [
  "#forms .form-control",
  "#forms .form-select",
  "#forms .form-check-label",
  "#forms .invalid-feedback:visible",
  "#navs .nav-tabs .nav-link:not(.active)",
  "#navs .nav-tabs .nav-link.active",
  "#accordion .accordion-button",
  "#alerts .alert-primary",
  "#alerts .alert-primary .alert-link",
  "#badge .badge.bg-primary",
  "#card .card-body",
  "#list-group .list-group-item:not(.disabled)",
  "#pagination .page-link",
  "#tables .table",
  "#toasts .toast-body",
];

const assertElementContrast = async (page, label, selector, minimum = 4.5) => {
  const locator = page.locator(selector).first();
  if (await locator.count() === 0) return;
  assertColorsContrast(`${label} (${selector})`, await readColors(locator), minimum);
};

const assertButtonStates = async (page, label, selector) => {
  const button = page.locator(selector).first();
  if (await button.count() === 0) return;
  assertColorsContrast(`${label} default`, await readColors(button));
  await button.hover();
  assertColorsContrast(`${label} hover`, await readColors(button));
  const box = await button.boundingBox();
  if (!box) throw new Error(`${label}: button has no box`);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  assertColorsContrast(`${label} active`, await readColors(button));
  await page.mouse.up();
  await page.mouse.move(0, 0);
};

const assertFixtureLayout = async (page, browserName, mode) => {
  const fixture = await page.evaluate(() => {
    const style = (selector) => getComputedStyle(document.querySelector(selector));
    const link = document.querySelector(".bd-aside a");
    const active = document.querySelector(".bd-aside .btn");
    const wasActive = active.classList.contains("active");
    active.classList.add("active");
    const activeStyle = getComputedStyle(active);
    const result = {
      sidebarBackground: style(".bd-sidebar").backgroundColor,
      sidebarBorder: style(".bd-sidebar").borderRightColor,
      exampleBackground: style(".bd-example").backgroundColor,
      exampleBorder: style(".bd-example").borderTopColor,
      asideBackground: style(".bd-aside").backgroundColor,
      linkColor: getComputedStyle(link).color,
      activeBackground: activeStyle.backgroundColor,
      activeColor: activeStyle.color,
      pageBackground: style("body").backgroundColor,
    };
    if (!wasActive) active.classList.remove("active");
    return result;
  });
  assert.notEqual(fixture.sidebarBorder, "rgba(0, 0, 0, 0)", `${browserName}/fixture/${mode}: sidebar border`);
  assert.notEqual(fixture.exampleBorder, "rgba(0, 0, 0, 0)", `${browserName}/fixture/${mode}: example border`);
  assert.notEqual(fixture.sidebarBackground, "rgba(0, 0, 0, 0)", `${browserName}/fixture/${mode}: sidebar background`);
  assert.notEqual(fixture.exampleBackground, "rgba(0, 0, 0, 0)", `${browserName}/fixture/${mode}: example background`);
  assert.notEqual(fixture.activeBackground, "rgba(0, 0, 0, 0)", `${browserName}/fixture/${mode}: active aside background`);
  assertContrast(`${browserName}/fixture/${mode}: aside link`, fixture.linkColor, fixture.pageBackground);
  assertContrast(`${browserName}/fixture/${mode}: aside active`, fixture.activeColor, fixture.activeBackground);
};

const runThemeFailureChecks = async (browserName, browser) => {
  const openPage = async (initScript, routes = []) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addInitScript(installColorHelpers);
    if (initScript) await context.addInitScript(initScript);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const { pattern, handler } of routes) await page.route(pattern, handler);
    await page.goto(url);
    await page.waitForFunction(() => document.querySelector("[data-theme-dropdown]")?.dataset.themeState !== "loading");
    return { context, page, errors };
  };
  const status = (page) => page.evaluate(() => ({
    theme: document.documentElement.dataset.kromaTheme,
    stored: (() => {
      try {
        return localStorage.getItem("kroma-theme-mode");
      } catch {
        return null;
      }
    })(),
    visibility: document.documentElement.style.visibility,
    pending: document.querySelectorAll("[data-pending-kroma-theme]").length,
    state: document.querySelector("[data-theme-dropdown]")?.dataset.themeState,
    label: document.querySelector("#kroma-theme-label")?.textContent,
    busy: document.querySelector("[data-theme-selector]")?.getAttribute("aria-busy"),
  }));
  const select = async (page, theme) => {
    await page.locator(`[data-theme-value="${theme}"]`).evaluate((element) => element.click());
  };
  const waitForTheme = (page, theme) => page.waitForFunction((id) => document.documentElement.dataset.kromaTheme === id
    && document.querySelector("[data-theme-dropdown]")?.dataset.themeState === "ready", theme);
  const waitForError = (page) => page.waitForFunction(() => document.querySelector("[data-theme-dropdown]")?.dataset.themeState === "error");

  {
    const { context, page, errors } = await openPage(() => localStorage.setItem("kroma-theme-mode", "bootstrap"), [{
      pattern: "**/themes/dracula.css",
      handler: (route) => route.fulfill({ status: 404, contentType: "text/css", body: "" }),
    }]);
    await select(page, "dracula");
    await waitForError(page);
    const failed = await status(page);
    assert.equal(failed.theme, "bootstrap", `${browserName}: 404 must keep active theme`);
    assert.equal(failed.stored, "bootstrap", `${browserName}: 404 must not persist failed theme`);
    assert.equal(failed.pending, 0, `${browserName}: 404 must remove pending links`);
    assert.equal(failed.visibility, "", `${browserName}: 404 must reveal document`);
    assert.equal(failed.busy, "false", `${browserName}: 404 must clear busy state`);
    await page.unroute("**/themes/dracula.css");
    await select(page, "dracula");
    await waitForTheme(page, "dracula");
    assert.equal((await status(page)).stored, "dracula", `${browserName}: retry must persist confirmed theme`);
    assert.deepEqual(errors, [], `${browserName}: theme 404 page errors`);
    await context.close();
  }

  {
    const { context, page } = await openPage(() => localStorage.setItem("kroma-theme-mode", "bootstrap"), [{
      pattern: "**/themes/kroma-entrepreneur.css",
      handler: (route) => route.fulfill({ status: 500, contentType: "text/css", body: "" }),
    }]);
    await select(page, "kroma-entrepreneur");
    await waitForError(page);
    assert.equal((await status(page)).theme, "bootstrap", `${browserName}: 500 must keep active theme`);
    await context.close();
  }

  {
    const { context, page } = await openPage(() => localStorage.setItem("kroma-theme-mode", "bootstrap"), [{
      pattern: "**/themes/dracula.css",
      handler: (route) => route.abort("failed"),
    }]);
    await select(page, "dracula");
    await waitForError(page);
    assert.equal((await status(page)).pending, 0, `${browserName}: aborted request must clean pending link`);
    await context.close();
  }

  {
    const draculaCss = fs.readFileSync(path.join(root, "dist/themes/dracula.css"), "utf8");
    const { context, page } = await openPage(() => localStorage.setItem("kroma-theme-mode", "bootstrap"), [{
      pattern: "**/themes/dracula.css",
      handler: async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 700));
        try {
          await route.fulfill({ status: 200, contentType: "text/css", body: draculaCss });
        } catch {
          // The stale request is expected to be cancelled by the newer selection.
        }
      },
    }]);
    await select(page, "dracula");
    await page.waitForFunction(() => document.querySelector("[data-theme-dropdown]")?.dataset.themeState === "loading");
    await select(page, "kroma-entrepreneur");
    await page.locator('[data-bs-theme-value="dark"]').evaluate((element) => element.click());
    await waitForTheme(page, "kroma-entrepreneur");
    await page.waitForTimeout(900);
    const result = await status(page);
    assert.equal(result.theme, "kroma-entrepreneur", `${browserName}: late stylesheet must not override newer selection`);
    assert.equal(result.stored, "kroma-entrepreneur", `${browserName}: newer selection must persist`);
    assert.equal(result.pending, 0, `${browserName}: stale request must leave no pending links`);
    assert.equal(await page.evaluate(() => document.documentElement.dataset.bsTheme), "dark", `${browserName}: contrast change during load must persist`);
    await page.unroute("**/themes/dracula.css");
    await select(page, "dracula");
    await waitForTheme(page, "dracula");
    assert.equal((await status(page)).theme, "dracula", `${browserName}: later request must still win`);
    await context.close();
  }

  {
    const { context, page } = await openPage(() => localStorage.setItem("kroma-theme-mode", "dracula"), [{
      pattern: "**/themes/dracula.css",
      handler: (route) => route.fulfill({ status: 404, contentType: "text/css", body: "" }),
    }]);
    await waitForError(page);
    const failed = await status(page);
    assert.equal(failed.theme, "bootstrap", `${browserName}: initial failure must fall back`);
    assert.equal(failed.stored, "bootstrap", `${browserName}: initial failure must persist fallback`);
    assert.equal(failed.visibility, "", `${browserName}: initial failure must reveal document`);
    await context.close();
  }

  {
    const { context, page } = await openPage(() => localStorage.setItem("kroma-theme-mode", "unknown-theme"));
    const initial = await status(page);
    assert.equal(initial.theme, "bootstrap", `${browserName}: unknown stored theme must fall back`);
    assert.equal(initial.stored, "bootstrap", `${browserName}: unknown stored theme must be normalized`);
    await context.close();
  }

  {
    const { context, page } = await openPage(() => {
      Storage.prototype.getItem = () => { throw new DOMException("Storage denied", "SecurityError"); };
      Storage.prototype.setItem = () => { throw new DOMException("Storage denied", "SecurityError"); };
    });
    await select(page, "dracula");
    await waitForTheme(page, "dracula");
    assert.equal((await status(page)).theme, "dracula", `${browserName}: unavailable storage must not block theme changes`);
    await context.close();
  }

  passed += 7;
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
        await context.addInitScript(installColorHelpers);
        const page = await context.newPage();
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await page.goto(url);
        if (viewport.width === 1440) {
          await page.addStyleTag({ content: "*, *::before, *::after { transition-duration: 0s !important; animation-duration: 0s !important; }" });
        }
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
            if (viewport.width === 1440 && mode !== "auto" && theme !== "bootstrap") {
              for (const selector of buttonSelectors) {
                await assertButtonStates(page, `${browserName}/${theme}/${mode} ${selector}`, `#buttons ${selector}`);
              }
              for (const selector of componentSelectors) {
                await assertElementContrast(page, `${browserName}/${theme}/${mode}`, selector);
              }
            }
            passed += 1;
            if (screenshot && browserName === "chromium" && viewport.width === 1440 && (mode === "dark" || mode === "light")) {
              await page.screenshot({ path: path.join(screenshotDir, `kroma-after-${theme}-${mode}.png`) });
            }
            if (viewport.width === 1440 && mode === "dark") {
              const modalTrigger = page.locator('#modal [data-bs-toggle="modal"]').first();
              assert.ok((await modalTrigger.getAttribute("aria-label")) || (await modalTrigger.innerText()).trim().length > 0, `${browserName}/${theme}/${mode}: modal trigger name`);
              await modalTrigger.click();
              const modal = page.locator(".modal.show").first();
              await modal.waitFor();
              assert.equal(await modal.getAttribute("role"), "dialog");
              assert.equal(await modal.getAttribute("aria-modal"), "true");
              assert.ok((await modal.getAttribute("aria-labelledby")) || (await modal.getAttribute("aria-label")), `${browserName}/${theme}/${mode}: modal accessible name`);
              const modalContent = page.locator(".modal.show .modal-content").first();
              assertColorsContrast(`${browserName}/${theme}/${mode}: modal text`, await readColors(modalContent));
              await page.keyboard.press("Escape");
              await modal.waitFor({ state: "hidden" });
              await page.waitForFunction((element) => document.activeElement === element, await modalTrigger.elementHandle());
              assert.equal(await page.evaluate(() => document.activeElement === document.querySelector('#modal [data-bs-toggle="modal"]')), true, `${browserName}/${theme}/${mode}: modal must return focus`);

              const accordion = page.locator("#accordion .accordion-button").first();
              const expanded = await accordion.getAttribute("aria-expanded");
              await accordion.click();
              assert.equal(await accordion.getAttribute("aria-expanded"), expanded === "true" ? "false" : "true");

              const dropdownTrigger = page.locator('#dropdowns .dropdown-toggle').first();
              await dropdownTrigger.click();
              await page.locator("#dropdowns .dropdown-menu.show").first().waitFor();
              assert.equal(await dropdownTrigger.getAttribute("aria-expanded"), "true");
              await assertElementContrast(page, `${browserName}/${theme}/${mode}`, "#dropdowns .dropdown-menu.show .dropdown-item");
              await page.keyboard.press("Escape");
              await page.locator("#dropdowns .dropdown-menu.show").first().waitFor({ state: "hidden" });
              assert.equal(await dropdownTrigger.getAttribute("aria-expanded"), "false");

              const tab = page.locator("#nav-tab .nav-link").first();
              await tab.click();
              assert.equal(await tab.getAttribute("aria-selected"), "true");
              assertColorsContrast(`${browserName}/${theme}/${mode}: active tab`, await readColors(tab));

              assert.ok(await page.getByLabel("Check me out").count() > 0, `${browserName}/${theme}/${mode}: checkbox label`);
              assert.ok(await page.getByLabel("Default radio").count() > 0, `${browserName}/${theme}/${mode}: radio label`);

              const tooltipTrigger = page.locator('#tooltips [data-bs-toggle="tooltip"]').first();
              await tooltipTrigger.hover();
              const tooltip = page.locator(".tooltip.show").first();
              await tooltip.waitFor();
              assertColorsContrast(`${browserName}/${theme}/${mode}: tooltip`, await readColors(tooltip));

              const popoverTrigger = page.locator('#popovers [data-bs-toggle="popover"]').first();
              await popoverTrigger.click();
              const popover = page.locator(".popover.show").first();
              await popover.waitFor();
              assertColorsContrast(`${browserName}/${theme}/${mode}: popover`, await readColors(popover));
              await popoverTrigger.click();
              await popover.waitFor({ state: "hidden" });
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
          if (viewport.width === 1440) await assertFixtureLayout(page, browserName, mode);
          if (screenshot && browserName === "chromium" && viewport.width === 1440) {
            await page.screenshot({ path: path.join(screenshotDir, `kroma-fixture-${mode}.png`) });
          }
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

      {
        const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
        const page = await context.newPage();
        await page.goto(url);
        await page.locator('[data-theme-value="kroma-entrepreneur"]').evaluate((element) => element.click());
        await page.waitForFunction(() => document.documentElement.dataset.kromaTheme === "kroma-entrepreneur");
        const reduced = await page.evaluate(() => ({
          scroll: getComputedStyle(document.body).scrollBehavior,
          transition: getComputedStyle(document.querySelector("#buttons .btn-primary")).transitionDuration,
          pseudo: getComputedStyle(document.querySelector(".bd-aside .btn"), "::before").transitionDuration,
        }));
        assert.equal(reduced.scroll, "auto", `${browserName}: reduced motion scroll behavior`);
        for (const [label, value] of [["transition", reduced.transition], ["pseudo transition", reduced.pseudo]]) {
          assert.ok(value.split(",").every((item) => item.trim().endsWith("s") && parseFloat(item) <= .001), `${browserName}: reduced motion ${label} (${value})`);
        }
        passed += 1;
        await context.close();
      }

      await runThemeFailureChecks(browserName, browser);
    } finally {
      await browser.close();
    }
  }
  console.log(`Browser checks passed: ${passed} cases across ${browserNames.join(", ")} (themes, modes, viewports, states, fixture, network failures).`);
} finally {
  server.kill();
}
