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

const runChatChecks = async (browserName, browser) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url);

  const chat = page.locator("#chat kroma-chat");
  await chat.waitFor();
  assert.equal(await chat.evaluate((element) => element instanceof customElements.get("kroma-chat")), true, `${browserName}: kroma-chat custom element registration`);
  assert.equal(await chat.evaluate((element) => element.constructor.name), "KromaChat", `${browserName}: public class uses the KromaChat name`);
  assert.equal(await chat.evaluate((element) => typeof element.addMessage === "function" && typeof element.setHeaderActions === "function"), true, `${browserName}: public facade exposes its documented methods`);

  const initial = await chat.evaluate((element) => ({
    messageType: element.querySelector(".kroma-chat__message")?.dataset.messageType,
    menuItems: element.querySelectorAll(".kroma-chat__journey-item").length,
    messageId: element.querySelector(".kroma-chat__message")?.dataset.messageId,
  }));
  assert.equal(initial.messageType, "journey-menu", `${browserName}: demo must start with a JourneyMenu`);
  assert.equal(initial.menuItems, 4, `${browserName}: JourneyMenu renders the entry actions`);
  assert.ok(initial.messageId, `${browserName}: messages receive a stable id`);

  const composerInput = chat.locator(".kroma-chat__input");
  await composerInput.focus();
  await page.waitForTimeout(180);
  const focusState = await chat.evaluate((element) => {
    const input = element.querySelector(".kroma-chat__input");
    const composer = element.querySelector(".kroma-chat__composer");
    return {
      inputOutline: getComputedStyle(input).outlineStyle,
      inputBorder: getComputedStyle(input).borderWidth,
      inputShadow: getComputedStyle(input).boxShadow,
      composerRing: getComputedStyle(composer).boxShadow,
    };
  });
  assert.equal(focusState.inputOutline, "none", `${browserName}: textarea has no inner focus outline`);
  assert.equal(focusState.inputBorder, "0px", `${browserName}: textarea has no inner border`);
  assert.equal(focusState.inputShadow, "none", `${browserName}: textarea has no inner shadow`);
  assert.notEqual(focusState.composerRing, "none", `${browserName}: composer retains an accessible focus ring`);
  await composerInput.blur();

  const optionHover = chat.locator(".kroma-chat__journey-item").first();
  await optionHover.hover();
  const hoveredOption = await optionHover.evaluate((button) => ({
    background: getComputedStyle(button).backgroundColor,
    border: getComputedStyle(button).borderColor,
  }));
  assert.ok(hoveredOption.background && hoveredOption.border, `${browserName}: journey action hover state is styled`);
  await page.mouse.move(0, 0);

  await chat.evaluate((element) => element.setComposerDisabled(true));
  assert.equal(await composerInput.isDisabled(), true, `${browserName}: host can disable the composer`);
  assert.equal(await chat.getByRole("button", { name: "Enviar mensaje" }).isDisabled(), true, `${browserName}: disabled composer disables send`);
  await chat.evaluate((element) => element.setComposerDisabled(false));

  await chat.evaluate((element) => {
    element.__chatTestEvents = { sends: [], selections: [], actions: [], quantities: [], forms: [] };
    element.addEventListener("kroma-chat-send", (event) => element.__chatTestEvents.sends.push(event.detail));
    element.addEventListener("kroma-chat-option-select", (event) => element.__chatTestEvents.selections.push(event.detail));
    element.addEventListener("kroma-chat-rich-action", (event) => element.__chatTestEvents.actions.push(event.detail));
    element.addEventListener("kroma-chat-action", (event) => element.__chatTestEvents.actions.push(event.detail));
    element.addEventListener("kroma-chat-quantity-change", (event) => element.__chatTestEvents.quantities.push(event.detail));
    element.addEventListener("kroma-chat-form-submit", (event) => element.__chatTestEvents.forms.push(event.detail));
  });

  await chat.getByRole("button", { name: "Explorar productos" }).click();
  await page.waitForSelector("#chat .kroma-chat__category-picker");
  assert.equal((await chat.evaluate((element) => element.__chatTestEvents.actions[0])).control, "journey-menu");
  await chat.locator(".kroma-chat__category").filter({ hasText: "Todos" }).click();
  await page.waitForSelector("#chat .kroma-chat__product-list");
  assert.equal((await chat.evaluate((element) => element.__chatTestEvents.actions[1])).control, "category-picker");

  await chat.locator(".kroma-chat__product-list .kroma-chat__product-card").first().click();
  await page.waitForSelector("#chat .kroma-chat__product-detail");
  assert.equal((await chat.evaluate((element) => element.__chatTestEvents.actions[2])).control, "product-list");
  assert.equal(await chat.locator(".kroma-chat__product-detail .kroma-chat__variant-selector input").count(), 3, `${browserName}: product variants are rendered`);
  await chat.getByLabel("Talla M").focus();
  await chat.getByLabel("Talla M").press("Space");
  assert.equal(await chat.getByLabel("Talla M").isChecked(), true, `${browserName}: keyboard can select a product variant`);
  const variantEvent = await chat.evaluate((element) => element.__chatTestEvents.actions.at(-1));
  assert.equal(variantEvent.control, "product-variant-selector");
  assert.equal(variantEvent.data.variantId, "polo-size-m");
  await chat.locator(".kroma-chat__product-detail .kroma-chat__quantity-button").last().click();
  const quantityEvent = await chat.evaluate((element) => element.__chatTestEvents.quantities.at(-1));
  assert.equal(quantityEvent.quantity, 2, `${browserName}: QuantitySelector increments and emits its state`);
  await chat.locator(".kroma-chat__product-add").click();
  await page.waitForSelector("#chat .kroma-chat__message--assistant .kroma-chat__options");
  const addEvent = await chat.evaluate((element) => element.__chatTestEvents.actions.at(-1));
  assert.equal(addEvent.actionId, "add-to-cart");
  assert.equal(addEvent.data.quantity, 2, `${browserName}: add action carries the selected quantity`);
  assert.equal(addEvent.data.variantId, "polo-size-m", `${browserName}: add action carries the selected variant`);
  await chat.getByRole("button", { name: "Seguir explorando" }).last().click();
  await page.waitForFunction(() => document.querySelectorAll("#chat .kroma-chat__product-list").length >= 2);
  await chat.locator(".kroma-chat__product-list").last().locator(".kroma-chat__product-card").nth(1).click();
  await page.waitForFunction(() => [...document.querySelectorAll("#chat .kroma-chat__product-detail-title")].some((title) => title.textContent === "Casaca ligera"));
  await chat.locator(".kroma-chat__product-add").last().click();
  await page.waitForFunction(() => [...document.querySelectorAll("#chat .kroma-chat__option")].some((button) => button.textContent?.startsWith("Revisar selección (2)")));
  await chat.getByRole("button", { name: "Revisar selección (2)" }).last().click();
  await page.waitForSelector("#chat .kroma-chat__cart-summary");
  assert.equal(await chat.locator(".kroma-chat__cart-item").count(), 2, `${browserName}: cart keeps multiple products`);
  await chat.locator(".kroma-chat__cart-remove").first().click();
  await page.waitForFunction(() => {
    const summaries = document.querySelectorAll("#chat .kroma-chat__cart-summary");
    const latest = summaries[summaries.length - 1];
    return latest?.querySelectorAll(".kroma-chat__cart-item").length === 1;
  });
  await chat.getByRole("button", { name: "Continuar con mis datos" }).last().click();
  await page.waitForSelector("#chat .kroma-chat__conversational-form");
  const customerInputs = chat.locator(".kroma-chat__form-input");
  assert.equal(await customerInputs.count(), 3, `${browserName}: customer form has the three requested fields`);
  assert.equal(await chat.locator(".kroma-chat__form-fields").evaluate((form) => form.checkValidity()), false, `${browserName}: customer form validates required fields`);
  await customerInputs.nth(0).fill("Miguel");
  await customerInputs.nth(1).fill("miguel@example.test");
  await customerInputs.nth(2).fill("Lima");
  assert.equal(await chat.locator(".kroma-chat__form-fields").evaluate((form) => form.checkValidity()), true);
  await chat.getByRole("button", { name: "Revisar solicitud" }).last().click();
  await page.waitForSelector("#chat .kroma-chat__order-review");
  assert.equal(await chat.locator(".kroma-chat__customer-details").innerText().then((text) => text.includes("Miguel")), true, `${browserName}: form values reach the in-memory review`);
  await chat.getByRole("button", { name: "Editar datos" }).last().click();
  await page.waitForFunction(() => document.querySelectorAll("#chat .kroma-chat__conversational-form").length >= 2);
  assert.equal(await chat.locator(".kroma-chat__conversational-form").last().locator(".kroma-chat__form-input").first().inputValue(), "Miguel", `${browserName}: editing preserves entered details`);
  await chat.getByRole("button", { name: "Revisar solicitud" }).last().click();
  await page.waitForFunction(() => document.querySelectorAll("#chat .kroma-chat__order-review").length >= 2);
  await chat.getByRole("button", { name: "Confirmar solicitud simulada" }).last().click();
  await page.waitForSelector("#chat .kroma-chat__confirmation-title");
  assert.equal(await chat.locator(".kroma-chat__confirmation-title").last().textContent(), "Solicitud simulada");
  assert.match(await chat.locator(".kroma-chat__confirmation-description").last().textContent(), /No se ha registrado ningún pedido real/);
  await chat.getByRole("button", { name: "Iniciar otra conversación" }).last().click();
  await page.waitForFunction(() => document.querySelectorAll("#chat .kroma-chat__journey-menu").length >= 2);
  assert.equal(await chat.locator(".kroma-chat__confirmation-title").count(), 1, `${browserName}: restart preserves the completed history`);
  await chat.getByRole("button", { name: "Explorar productos" }).last().click();
  await page.waitForFunction(() => document.querySelectorAll("#chat .kroma-chat__category-picker").length >= 2);
  await chat.locator(".kroma-chat__category").filter({ hasText: "Accesorios" }).last().click();
  await page.waitForFunction(() => document.querySelectorAll("#chat .kroma-chat__product-list").length >= 3);
  await chat.locator(".kroma-chat__product-list").last().locator(".kroma-chat__product-card").click();
  await page.waitForFunction(() => [...document.querySelectorAll("#chat .kroma-chat__product-detail-title")].some((title) => title.textContent === "Botella reutilizable"));

  await chat.evaluate((element) => element.addMessage({
    id: "chat-product-card-contract",
    author: "assistant",
    type: "product-card",
    actionLabel: "Open standalone card",
    product: { id: "contract-card", name: "Standalone card", description: "Card contract", price: { amount: 4, currency: "USD" } },
  }));
  await chat.locator("#chat-product-card-contract .kroma-chat__product-card").click();
  assert.equal((await chat.evaluate((element) => element.__chatTestEvents.actions.at(-1))).control, "product-card");

  await chat.evaluate((element) => element.addMessage({
    id: "chat-product-carousel-contract",
    author: "assistant",
    type: "product-carousel",
    text: "Legacy carousel contract",
    products: [
      { id: "carousel-a", name: "Carousel A", description: "First item" },
      { id: "carousel-b", name: "Carousel B", description: "Second item" },
    ],
  }));
  await chat.locator("#chat-product-carousel-contract .kroma-chat__product-card").first().click();
  assert.equal((await chat.evaluate((element) => element.__chatTestEvents.actions.at(-1))).control, "product-carousel");

  await chat.evaluate((element) => element.addMessage({
    id: "chat-standalone-variant",
    author: "assistant",
    type: "product-variant-selector",
    controlId: "variant-contract",
    label: "Size",
    variants: [{ id: "variant-contract-one", label: "One size", value: "one" }],
  }));
  await chat.locator("#chat-standalone-variant input").focus();
  await chat.locator("#chat-standalone-variant input").press("Space");
  assert.equal((await chat.evaluate((element) => element.__chatTestEvents.actions.at(-1))).control, "product-variant-selector");

  await chat.evaluate((element) => element.addMessage({
    id: "chat-standalone-quantity",
    author: "assistant",
    type: "quantity-selector",
    controlId: "quantity-contract",
    label: "Units",
    value: 1,
    minimum: 0,
    maximum: 2,
  }));
  await chat.locator("#chat-standalone-quantity .kroma-chat__quantity-button").last().click();
  assert.equal((await chat.evaluate((element) => element.__chatTestEvents.quantities.at(-1))).quantity, 2);

  await chat.evaluate((element) => element.addMessage({
    id: "chat-confirmation-card-contract",
    author: "assistant",
    type: "confirmation-card",
    status: "success",
    title: "Generic confirmation",
    description: "This confirmation is not an order receipt.",
  }));
  assert.equal(await chat.locator("#chat-confirmation-card-contract .kroma-chat__confirmation").getAttribute("data-status"), "success");
  await chat.evaluate((element) => element.setHeaderActions([{ id: "header-help", label: "Help", value: "help" }]));
  await chat.getByRole("button", { name: "Help" }).click();
  assert.equal((await chat.evaluate((element) => element.__chatTestEvents.actions.at(-1))).control, "header");
  await chat.evaluate((element) => element.setHeaderActions([]));

  const firstIndependent = chat.evaluate((element) => element.addMessage({
    id: "chat-independent-a",
    author: "assistant",
    type: "quick-replies",
    text: "First group",
    replies: [{ id: "first", label: "First", value: "first" }],
  }));
  const secondIndependent = chat.evaluate((element) => element.addMessage({
    id: "chat-independent-b",
    author: "assistant",
    type: "quick-replies",
    text: "Second group",
    replies: [{ id: "second", label: "Second", value: "second" }],
  }));
  assert.equal(await firstIndependent, "chat-independent-a");
  assert.equal(await secondIndependent, "chat-independent-b");
  await chat.locator('[data-message-id="chat-independent-a"] .kroma-chat__option').click();
  assert.equal(await chat.locator('[data-message-id="chat-independent-a"] .kroma-chat__option').isDisabled(), true);
  assert.equal(await chat.locator('[data-message-id="chat-independent-b"] .kroma-chat__option').isDisabled(), false, `${browserName}: consuming one group leaves other messages' options enabled`);

  const quickReplyCount = await chat.evaluate((element) => element.__chatTestEvents.selections.length);
  await chat.locator('[data-message-id="chat-independent-a"] .kroma-chat__option').evaluate((button) => button.click());
  assert.equal(await chat.evaluate((element) => element.__chatTestEvents.selections.length), quickReplyCount, `${browserName}: disabled QuickReply cannot fire twice`);

  const hostileId = await chat.evaluate((element) => element.addMessage({
    id: "chat-safe-rich",
    author: "assistant",
    type: "rich",
    title: "<img src=x onerror=alert(1)>",
    description: "<script>unsafe()</script>",
    link: { label: "Unsafe link", href: "javascript:alert(1)" },
    action: { id: "safe-action", label: "Safe action", value: "safe" },
  }));
  const safeRender = await chat.locator(`[data-message-id="${hostileId}"]`).evaluate((message) => ({
    imageCount: message.querySelectorAll("img").length,
    scriptCount: message.querySelectorAll("script").length,
    linkCount: message.querySelectorAll("a").length,
    title: message.querySelector(".kroma-chat__rich-title")?.textContent,
    description: message.querySelector(".kroma-chat__rich-description")?.textContent,
  }));
  assert.deepEqual(safeRender, {
    imageCount: 0,
    scriptCount: 0,
    linkCount: 0,
    title: "<img src=x onerror=alert(1)>",
    description: "<script>unsafe()</script>",
  }, `${browserName}: RichMessage renders dynamic content as text and rejects javascript URLs`);
  await chat.locator(`[data-message-id="${hostileId}"] .kroma-chat__rich-action`).click();
  assert.equal((await chat.evaluate((element) => element.__chatTestEvents.actions.at(-1))).actionId, "safe-action");

  const hostOptionMessage = await chat.evaluate((element) => element.addMessage({
    id: "chat-host-options",
    author: "assistant",
    type: "options",
    text: "Legacy options payload",
    options: [
      { id: "host-enabled", label: "Enabled", value: "enabled" },
      { id: "host-disabled", label: "Disabled", disabled: true },
    ],
  }));
  assert.equal(await chat.locator(`[data-message-id="${hostOptionMessage}"] .kroma-chat__option`).count(), 2, `${browserName}: legacy options messages remain supported`);
  await chat.evaluate((element, id) => element.setOptionsDisabled(id, true), hostOptionMessage);
  assert.equal(await chat.locator(`[data-message-id="${hostOptionMessage}"] .kroma-chat__option`).first().isDisabled(), true);
  await chat.evaluate((element, id) => element.setOptionsDisabled(id, false), hostOptionMessage);
  assert.equal(await chat.locator(`[data-message-id="${hostOptionMessage}"] .kroma-chat__option`).first().isDisabled(), false);
  assert.equal(await chat.locator(`[data-message-id="${hostOptionMessage}"] .kroma-chat__option`).last().isDisabled(), true, `${browserName}: host re-enable preserves individually disabled options`);

  await chat.evaluate((element) => element.addMessage({
    author: "assistant",
    type: "info",
    title: "Legacy rich content",
    description: "Legacy info messages remain readable.",
  }));
  assert.equal(await chat.locator(".kroma-chat__info-title").last().textContent(), "Legacy rich content", `${browserName}: legacy info payload remains supported`);
  await chat.evaluate((element) => element.addMessage({ author: "system", type: "status", text: "Conversation updated", status: "neutral" }));
  assert.equal(await chat.locator(".kroma-chat__status-message").last().textContent(), "Conversation updated", `${browserName}: status messages render`);

  await chat.evaluate((element) => {
    element.setTyping(true, "Assistant is typing");
    element.setTyping(true, "Assistant is typing");
  });
  assert.equal(await chat.locator(".kroma-chat__message--typing").count(), 1, `${browserName}: typing state is idempotent`);
  assert.equal(await chat.locator(".kroma-chat__message--typing .kroma-chat__sr-only").textContent(), "Assistant is typing");
  await page.waitForTimeout(100);
  assert.equal(await chat.locator(".kroma-chat__message--typing").count(), 1, `${browserName}: typing stays host-controlled`);
  await chat.evaluate((element) => element.setTyping(false));
  assert.equal(await chat.locator(".kroma-chat__message--typing").count(), 0);

  const legacyMessageId = await chat.evaluate((element) => element.addMessage({ author: "assistant", text: "Legacy text message" }));
  assert.ok(legacyMessageId, `${browserName}: addMessage still accepts legacy text messages`);
  assert.equal(await chat.locator(`#${legacyMessageId} .kroma-chat__text`).textContent(), "Legacy text message");

  const unsafeRichId = await chat.evaluate((element) => element.addMessage({
    author: "assistant",
    type: "rich",
    title: "<img src=x onerror=alert(1)>",
    description: "<script>unsafe()</script>",
    link: { label: "Unsafe link", href: "javascript:alert(1)" },
  }));
  const unsafeRich = await chat.locator(`#${unsafeRichId}`).evaluate((message) => ({
    images: message.querySelectorAll("img").length,
    scripts: message.querySelectorAll("script").length,
    links: message.querySelectorAll("a").length,
    title: message.querySelector(".kroma-chat__rich-title")?.textContent,
    description: message.querySelector(".kroma-chat__rich-description")?.textContent,
  }));
  assert.deepEqual(unsafeRich, {
    images: 0,
    scripts: 0,
    links: 0,
    title: "<img src=x onerror=alert(1)>",
    description: "<script>unsafe()</script>",
  }, `${browserName}: RichMessage escapes content and rejects script URLs`);

  const input = chat.locator(".kroma-chat__input");
  const measureComposer = () => chat.evaluate((element) => {
    const textarea = element.querySelector(".kroma-chat__input");
    const send = element.querySelector(".kroma-chat__send");
    return {
      rows: textarea.rows,
      textareaHeight: textarea.getBoundingClientRect().height,
      composerHeight: element.querySelector(".kroma-chat__composer").getBoundingClientRect().height,
      scrollHeight: textarea.scrollHeight,
      clientHeight: textarea.clientHeight,
      sendHeight: send.getBoundingClientRect().height,
      sendDisabled: send.disabled,
    };
  });
  await input.fill("");
  let composer = await measureComposer();
  assert.equal(composer.rows, 1, `${browserName}: empty composer starts at one row`);
  assert.ok(composer.textareaHeight >= 44 && composer.textareaHeight <= 48, `${browserName}: empty textarea height (${composer.textareaHeight}px)`);
  assert.ok(composer.composerHeight <= 52, `${browserName}: compact composer height (${composer.composerHeight}px)`);
  assert.equal(composer.sendDisabled, true, `${browserName}: empty send button disabled`);

  await input.fill("One line");
  composer = await measureComposer();
  assert.equal(composer.rows, 1, `${browserName}: one line remains one row`);
  assert.ok(composer.textareaHeight >= 44 && composer.textareaHeight <= 48);
  assert.equal(composer.sendDisabled, false);

  await input.fill("First line\nSecond line\nThird line");
  composer = await measureComposer();
  assert.ok(composer.rows >= 3 && composer.textareaHeight > 48 && composer.textareaHeight < 120, `${browserName}: multiline composer grows naturally`);

  await input.fill("A long message to force the composer to grow and then use its own scrollbar. ".repeat(30));
  composer = await measureComposer();
  assert.equal(composer.rows, 6, `${browserName}: long composer is capped at six rows`);
  assert.ok(composer.textareaHeight <= 120, `${browserName}: long textarea does not exceed the maximum height`);
  assert.ok(composer.scrollHeight > composer.clientHeight, `${browserName}: long textarea scrolls internally`);

  await input.fill("");
  composer = await measureComposer();
  assert.equal(composer.rows, 1, `${browserName}: clearing restores one row`);
  assert.ok(composer.textareaHeight >= 44 && composer.textareaHeight <= 48, `${browserName}: clearing restores compact height`);

  let sendEventCount = await chat.evaluate((element) => element.__chatTestEvents.sends.length);
  await input.fill("Line before newline");
  await input.press("Shift+Enter");
  assert.equal(await chat.evaluate((element) => element.__chatTestEvents.sends.length), sendEventCount, `${browserName}: Shift+Enter does not send`);
  assert.ok(await input.inputValue() .then((value) => value.includes("\n")), `${browserName}: Shift+Enter inserts a newline`);
  await input.press("Enter");
  await page.waitForFunction(() => document.querySelector("#chat kroma-chat .kroma-chat__input")?.value === "");
  sendEventCount += 1;
  assert.equal(await chat.evaluate((element) => element.__chatTestEvents.sends.length), sendEventCount, `${browserName}: Enter emits one text-send event`);
  composer = await measureComposer();
  assert.equal(composer.rows, 1, `${browserName}: sending resets the composer to one row`);
  assert.ok(composer.textareaHeight >= 44 && composer.textareaHeight <= 48, `${browserName}: sending restores compact height`);

  await chat.evaluate((element) => element.setError("User-facing error"));
  assert.equal(await input.getAttribute("aria-invalid"), "true");
  assert.equal(await chat.locator("[role=alert]").textContent(), "User-facing error");
  await chat.evaluate((element) => element.setError(null));
  assert.equal(await input.getAttribute("aria-invalid"), null);
  await chat.evaluate((element) => element.setComposerDisabled(true));
  assert.equal(await input.isDisabled(), true);
  assert.equal(await chat.getByRole("button", { name: "Enviar mensaje" }).isDisabled(), true);
  await chat.evaluate((element) => element.setComposerDisabled(false));

  const legacyForms = await chat.locator("form").count();
  const legacyMessages = await chat.locator(".kroma-chat__message").count();
  await chat.evaluate((element) => {
    const parent = element.parentElement;
    element.remove();
    parent.append(element);
  });
  assert.equal(await chat.locator("form").count(), legacyForms, `${browserName}: reconnect does not duplicate the composer`);
  assert.equal(await chat.locator(".kroma-chat__message").count(), legacyMessages, `${browserName}: reconnect preserves history`);

  await page.evaluate(() => {
    const other = document.createElement("kroma-chat");
    document.body.append(other);
  });
  const secondChat = page.locator("body > kroma-chat").last();
  await secondChat.waitFor();
  await secondChat.evaluate((element) => element.addMessage({ author: "assistant", text: "Isolated second instance" }));
  const instanceIds = await page.evaluate(() => [...document.querySelectorAll("kroma-chat .kroma-chat__input")].map((input) => input.id));
  assert.equal(new Set(instanceIds).size, instanceIds.length, `${browserName}: composer IDs are unique across instances`);
  assert.equal(await secondChat.locator(".kroma-chat__message").count(), 1, `${browserName}: second instance owns an independent history`);
  await secondChat.evaluate((element) => element.remove());

  const isNeutralColor = (color) => {
    const channels = color.match(/[\d.]+/g)?.slice(0, 3).map(Number);
    if (!channels || channels.length !== 3) return false;
    const scale = Math.max(...channels) <= 1 ? 1 : 255;
    return Math.max(...channels) / scale - Math.min(...channels) / scale < .01;
  };
  for (const theme of ["bootstrap", "dracula", "kroma-entrepreneur"]) {
    await page.locator(`[data-theme-value="${theme}"]`).evaluate((element) => element.click());
    await page.waitForFunction((name) => document.documentElement.dataset.kromaTheme === name
      && (name === "bootstrap" || document.querySelector("#kroma-theme-stylesheet")?.media === "all"), theme);
    for (const mode of ["light", "dark"]) {
      await page.locator(`[data-bs-theme-value="${mode}"]`).evaluate((element) => element.click());
      await page.waitForTimeout(100);
      const surfaces = await chat.evaluate((element) => {
        const background = (selector) => getComputedStyle(element.querySelector(selector)).backgroundColor;
        return {
          header: background(".kroma-chat__header"),
          history: background(".kroma-chat__messages"),
          assistant: background(".kroma-chat__message--assistant .kroma-chat__bubble"),
          composer: background(".kroma-chat__composer-area"),
          options: background(".kroma-chat__journey-item"),
          user: background(".kroma-chat__message--user .kroma-chat__bubble"),
          relativeColors: CSS.supports("color", "hsl(from var(--chat-surface-token) 0 0% l)"),
        };
      });
      assert.equal(surfaces.relativeColors, true, `${browserName}/${theme}/${mode}: semantic surface neutralization is supported`);
      for (const key of ["header", "history", "assistant", "composer", "options"]) {
        assert.ok(isNeutralColor(surfaces[key]), `${browserName}/${theme}/${mode}: Chat ${key} surface is neutral (${surfaces[key]})`);
      }
      assert.notEqual(surfaces.user, surfaces.header, `${browserName}/${theme}/${mode}: user bubble retains an action accent`);
      passed += 1;
    }
  }

  for (const viewport of [
    { width: 320, height: 568 },
    { width: 360, height: 780 },
    { width: 375, height: 812 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
    { width: 768, height: 900 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    const layout = await page.evaluate(() => {
      const chatElement = document.querySelector("#chat kroma-chat");
      const chatRect = chatElement.getBoundingClientRect();
      const composerRect = chatElement.querySelector(".kroma-chat__composer-area").getBoundingClientRect();
      const header = document.querySelector(".bd-header");
      return {
        width: innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        chatWidth: chatRect.width,
        composerInside: composerRect.bottom <= chatRect.bottom + 1,
        headerOverflow: header.scrollWidth > header.clientWidth + 1,
        optionOverflow: [...chatElement.querySelectorAll(".kroma-chat__option")].some((button) => button.scrollWidth > button.clientWidth),
        overflowers: [...document.body.querySelectorAll("*")]
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return { selector: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}.${String(element.className || "").trim().replace(/\s+/g, ".")}`, left: Math.round(rect.left), right: Math.round(rect.right), scrollWidth: element.scrollWidth, clientWidth: element.clientWidth };
          })
          .filter((element) => element.right > innerWidth + 1 || element.left < -1 || element.scrollWidth > element.clientWidth + 1)
          .slice(0, 12),
      };
    });
    assert.equal(layout.documentWidth > layout.width + 1, false, `${browserName}: horizontal overflow at ${viewport.width}px (document ${layout.documentWidth}px; ${JSON.stringify(layout.overflowers)})`);
    assert.equal(layout.headerOverflow, false, `${browserName}: Cheatsheet header fits at ${viewport.width}px`);
    assert.ok(layout.chatWidth > 0, `${browserName}: Chat has a visible width at ${viewport.width}px`);
    assert.equal(layout.composerInside, true, `${browserName}: composer remains inside Chat at ${viewport.width}px`);
    assert.equal(layout.optionOverflow, false, `${browserName}: options do not clip at ${viewport.width}px`);
  }

  assert.deepEqual(errors, [], `${browserName}: Chat page errors`);
  passed += 28;
  await context.close();
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

      await runChatChecks(browserName, browser);
      await runThemeFailureChecks(browserName, browser);
    } finally {
      await browser.close();
    }
  }
  console.log(`Browser checks passed: ${passed} cases across ${browserNames.join(", ")} (themes, modes, Chat controls, responsive layout, accessibility, fixture, network failures).`);
} finally {
  server.kill();
}
