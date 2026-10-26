import assert from "node:assert/strict";
import { chromium } from "playwright";
import { preview } from "vite";

const server = await preview({
  configFile: "vite.config.js",
  preview: { host: "127.0.0.1", port: 0, strictPort: false },
});
let browser;
try {
  const address = server.httpServer.address();
  assert.ok(address && typeof address !== "string");
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const pageErrors = [];
  const failedResponses = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
  });

  await page.goto(`http://127.0.0.1:${address.port}/chat/`, { waitUntil: "networkidle" });
  const commerce = page.locator("kroma-chat[data-demo='commerce-journey']");
  const kitchen = page.locator("kroma-chat[data-demo='kitchen-lab']");
  await commerce.waitFor({ state: "visible" });
  assert.equal(await commerce.evaluate((element) => customElements.get(element.localName) !== undefined), true);
  await page.locator("[data-chat-mode]").selectOption("kitchen");
  await kitchen.waitFor({ state: "visible" });
  await page.waitForFunction(() => {
    const lab = document.querySelector("kroma-chat[data-demo='kitchen-lab']");
    return Boolean(lab?.querySelectorAll(".kroma-chat__message").length);
  });
  assert.equal(await kitchen.locator(".kroma-chat__virtual-display").getAttribute("aria-disabled"), "true");
  assert.equal(await commerce.isHidden(), true);
  await page.locator("[data-chat-mode]").selectOption("default");
  await commerce.waitFor({ state: "visible" });
  assert.equal(await kitchen.isHidden(), true);

  await page.goto(`http://127.0.0.1:${address.port}/kroma-chat/`, { waitUntil: "networkidle" });
  await page.locator("kroma-chat").waitFor({ state: "visible" });
  assert.equal(await page.locator("kroma-chat").evaluate((element) => customElements.get(element.localName) !== undefined), true);
  assert.deepEqual(failedResponses, [], "chat routes load their JS, CSS and assets");
  assert.deepEqual(pageErrors, [], "chat routes run without browser errors");
  console.log("Chat lab smoke passed: /chat/ commerce and Kitchen consumer switching; /kroma-chat/ component mount.");
} finally {
  await browser?.close();
  await server.httpServer.close();
}
