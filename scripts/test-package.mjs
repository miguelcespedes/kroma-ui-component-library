import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { preview } from "vite";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cacheRoot = path.join(root, "node_modules", ".cache", "kroma-package-test");
const consumer = path.join(cacheRoot, "consumer");
const gitConsumer = path.join(cacheRoot, "git-consumer");
const gitSnapshot = path.join(cacheRoot, "git-source");
const nextFixture = path.join(root, "test", "package-consumer-next");
const node = process.execPath;
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("Run this check using npm run test:package.");

await rm(cacheRoot, { recursive: true, force: true });
await mkdir(consumer, { recursive: true });
execFileSync(node, [npmCli, "run", "build:lib"], { cwd: root, stdio: "inherit" });

const packageManifest = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
assert.equal(packageManifest.private, true, "the package remains private");
assert.equal(packageManifest.exports["./chat"].import, "./lib-dist/chat/index.js");
assert.equal(packageManifest.exports["./chat"].types, "./lib-dist/chat/index.d.ts");
assert.equal(packageManifest.exports["./chat/styles.css"], "./lib-dist/chat/styles.css");
assert.deepEqual(packageManifest.dependencies || {}, {}, "no runtime packages need separate installation");

const dryRun = JSON.parse(execFileSync(node, [npmCli, "pack", "--dry-run", "--json", "--ignore-scripts"], { cwd: root, encoding: "utf8" }))[0];
const packedFiles = new Set(dryRun.files.map((file) => file.path));
for (const required of [
  "lib-dist/chat/index.js",
  "lib-dist/chat/index.d.ts",
  "lib-dist/chat/styles.css",
  "lib-dist/chat/kroma-chat.d.ts",
]) assert.ok(packedFiles.has(required), `npm pack includes ${required}`);
assert.ok([...packedFiles].some((file) => file.endsWith(".woff2")), "npm pack includes Inter Variable");
assert.ok([...packedFiles].some((file) => file.endsWith(".png")), "npm pack includes Kitchen image assets");
assert.ok([...packedFiles].some((file) => /lib-dist\/chat\/chunks\/kitchen\.messages-.*\.js/.test(file)), "npm pack includes the lazy Kitchen Mode module");

const cssPath = path.join(root, "lib-dist/chat/styles.css");
const css = await readFile(cssPath, "utf8");
assert.match(css, /@font-face/);
assert.match(css, /font-family:Inter/);
assert.doesNotMatch(css, /data:(?:font|image)\/[a-z0-9.+-]+;base64,/i, "CSS uses package-relative assets rather than base64-inlining fonts or images");
assert.doesNotMatch(css, /(?:^|})\.hg-theme-default(?:[.#:\s,{]|\{)/, "keyboard base rules do not leak outside KromaChat");
assert.doesNotMatch(await readFile(path.join(root, "lib-dist/chat/index.js"), "utf8"), /from\s+["']bootstrap/, "the library entry does not import Bootstrap runtime code");
const nextClient = await readFile(path.join(nextFixture, "app/kroma-chat-client.tsx"), "utf8");
assert.match(nextClient, /useEffect/);
assert.match(nextClient, /import\(["']@kroma\/ui-component-library\/chat["']\)/, "Next.js loads the HTMLElement-based module only in the client effect");

await copyGitSource(root, gitSnapshot);
execFileSync("git", ["init", "--initial-branch=main"], { cwd: gitSnapshot, stdio: "ignore" });
execFileSync("git", ["-c", "user.name=Kroma package test", "-c", "user.email=kroma-package-test@localhost", "add", "-A"], { cwd: gitSnapshot, stdio: "inherit" });
execFileSync("git", ["-c", "user.name=Kroma package test", "-c", "user.email=kroma-package-test@localhost", "commit", "-m", "Package installation smoke fixture"], { cwd: gitSnapshot, stdio: "ignore" });
await mkdir(gitConsumer, { recursive: true });
await writeFile(path.join(gitConsumer, "package.json"), JSON.stringify({ name: "kroma-git-consumer-smoke", private: true }, null, 2));
const gitUrl = `git+${pathToFileURL(gitSnapshot).href}#main`;
execFileSync(node, [npmCli, "install", "--offline", "--no-audit", "--no-fund", "--prefix", gitConsumer, gitUrl], { cwd: root, stdio: "inherit" });
for (const required of [
  "node_modules/@kroma/ui-component-library/lib-dist/chat/index.js",
  "node_modules/@kroma/ui-component-library/lib-dist/chat/index.d.ts",
  "node_modules/@kroma/ui-component-library/lib-dist/chat/styles.css",
]) assert.ok(await exists(path.join(gitConsumer, required)), `Git prepare creates installed ${required}`);

const packedTarballs = JSON.parse(execFileSync(node, [npmCli, "pack", "--json", "--ignore-scripts", "--pack-destination", cacheRoot], { cwd: root, encoding: "utf8" }));
const tarball = path.join(cacheRoot, packedTarballs[0].filename);
await writeFile(path.join(consumer, "package.json"), JSON.stringify({ name: "kroma-package-consumer-smoke", private: true, type: "module" }, null, 2));
execFileSync(node, [npmCli, "install", "--offline", "--ignore-scripts", "--no-audit", "--no-fund", "--prefix", consumer, tarball], { cwd: root, stdio: "inherit" });

await cp(path.join(nextFixture, "smoke.html"), path.join(consumer, "index.html"));
await cp(path.join(nextFixture, "smoke.ts"), path.join(consumer, "smoke.ts"));
await writeFile(path.join(consumer, "vite.config.js"), `import { defineConfig } from ${JSON.stringify(pathToFileURL(path.join(root, "node_modules/vite/dist/node/index.js")).href)};\nexport default defineConfig({ root: ${JSON.stringify(consumer)}, base: "./", build: { outDir: "dist", emptyOutDir: true } });\n`);
execFileSync(node, [path.join(root, "node_modules/vite/bin/vite.js"), "build", "--config", "vite.config.js"], { cwd: consumer, stdio: "inherit" });
execFileSync(node, [path.join(root, "node_modules/typescript/bin/tsc"), "--noEmit", "--strict", "--skipLibCheck", "--target", "ES2022", "--module", "ESNext", "--moduleResolution", "Bundler", "--lib", "DOM,ES2022", "smoke.ts"], { cwd: consumer, stdio: "inherit" });

const server = await preview({
  configFile: false,
  root: consumer,
  preview: { host: "127.0.0.1", port: 0, strictPort: false },
  build: { outDir: "dist" },
});
let browser;
try {
  const address = server.httpServer.address();
  assert.ok(address && typeof address !== "string");
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 900, height: 800 } });
  const failedResponses = [];
  const pageErrors = [];
  page.on("response", (response) => { if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`); });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`http://127.0.0.1:${address.port}/`, { waitUntil: "networkidle" });
  const chat = page.locator("kroma-chat");
  await chat.waitFor({ state: "attached" });
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await chat.evaluate((element) => element.localName), "kroma-chat");
  const fontFamily = await chat.evaluate((element) => getComputedStyle(element).fontFamily);
  assert.match(fontFamily, /Inter/, `KromaChat loads its packaged font; computed=${fontFamily}; class=${await chat.getAttribute("class")}; stylesheets=${await page.locator("link[rel=stylesheet]").evaluateAll((links) => links.map((link) => link.href).join(","))}`);
  assert.equal(await chat.evaluate((element) => customElements.get("kroma-chat") !== undefined), true);

  await chat.getByRole("button", { name: "Ver productos" }).click();
  await page.waitForFunction(() => document.querySelector("#chat-event-output")?.value === "option:browse");
  await chat.locator(".kroma-chat__quantity-button").last().click();
  await page.waitForFunction(() => document.querySelector("#chat-event-output")?.value === "quantity:2");
  await chat.locator(".kroma-chat__product-add").click();
  await page.waitForFunction(() => document.querySelector("#chat-event-output")?.value === "action:add-to-cart");

  const keyboardDock = chat.locator(".kroma-chat__keyboard-dock");
  assert.equal(await keyboardDock.isHidden(), true, "the virtual keyboard starts closed");
  await chat.locator(".kroma-chat__virtual-display").click();
  await page.waitForFunction(() => !document.querySelector(".kroma-chat__keyboard-dock")?.hasAttribute("hidden"));
  await chat.locator(".kroma-chat__header").click();
  await page.waitForFunction(() => document.querySelector(".kroma-chat__keyboard-dock")?.hasAttribute("hidden"));

  await chat.evaluate((element) => { element.mode = "kitchen"; });
  await page.waitForFunction(() => [...document.querySelectorAll("kroma-chat img")].some((image) => image.complete && image.naturalWidth > 0));
  assert.deepEqual(failedResponses, [], "all JS, CSS, font and image requests succeed");
  assert.deepEqual(pageErrors, [], "the installed component runs without browser errors");
  console.log(`Package consumer smoke passed: ${packedFiles.size} packed files; local Git prepare; TypeScript declarations; browser events, quantity control, virtual keyboard and loaded assets.`);
} finally {
  await browser?.close();
  await server.httpServer.close();
  await rm(cacheRoot, { recursive: true, force: true });
}

function pathToFileURL(filePath) {
  return new URL(`file:///${filePath.replaceAll("\\", "/")}`);
}

async function copyGitSource(source, target) {
  await mkdir(target, { recursive: true });
  const excluded = new Set([".git", "node_modules", "dist", "lib-dist"]);
  const entries = await readdir(source, { withFileTypes: true });
  for (const entry of entries) {
    if (excluded.has(entry.name)) continue;
    const from = path.join(source, entry.name);
    const to = path.join(target, entry.name);
    if (entry.isDirectory()) await copyGitSource(from, to);
    else await cp(from, to);
  }
}

async function exists(filePath) {
  try {
    await readFile(filePath);
    return true;
  } catch {
    return false;
  }
}
