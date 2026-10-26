import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const node = process.execPath;
execFileSync(node, ["node_modules/vite/bin/vite.js", "build", "--config", "vite.lib.config.js"], { stdio: "inherit" });
await externalizeInlineAssets(path.resolve("lib-dist/chat"));
execFileSync(node, ["node_modules/typescript/bin/tsc", "--project", "tsconfig.lib.json"], { stdio: "inherit" });

async function externalizeInlineAssets(directory) {
  const assetsDirectory = path.join(directory, "assets");
  await mkdir(assetsDirectory, { recursive: true });
  const files = await walk(directory);
  const dataPattern = /data:([a-z0-9.+-]+\/[a-z0-9.+-]+)(?:;[^,]*)?;base64,([a-z0-9+/=]+)/gi;
  const assetWrites = new Map();

  for (const file of files) {
    if (!/\.(?:css|js)$/.test(file)) continue;
    const source = await readFile(file, "utf8");
    const relativeFromFile = (assetName) => path.posix.relative(
      path.posix.dirname(path.relative(directory, file).split(path.sep).join("/")),
      `assets/${assetName}`,
    );
    let next = source;

    if (file.endsWith(".css")) {
      next = next.replace(/url\((['"]?)(data:[^)]+)\1\)/gi, (_match, quote, dataUrl) => {
        const parsed = dataPattern.exec(dataUrl);
        dataPattern.lastIndex = 0;
        if (!parsed) return _match;
        const assetName = writeAsset(parsed[1], parsed[2]);
        return `url(${quote}./assets/${assetName}${quote})`;
      });
      next = scopeKeyboardSelectors(next);
    } else {
      next = next.replace(/(['"])(data:[^'"]+)\1/gi, (_match, _quote, dataUrl) => {
        const parsed = dataPattern.exec(dataUrl);
        dataPattern.lastIndex = 0;
        if (!parsed) return _match;
        const assetName = writeAsset(parsed[1], parsed[2]);
        return `new URL(${JSON.stringify(relativeFromFile(assetName))}, import.meta.url).href`;
      });
    }
    if (next !== source) await writeFile(file, next);
  }

  function writeAsset(mime, base64) {
    const extension = mime === "font/woff2" ? ".woff2" : mime === "image/png" ? ".png" : ".bin";
    const bytes = Buffer.from(base64, "base64");
    const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 10);
    const assetName = `${mime.startsWith("font/") ? "inter-variable" : "chat-image"}-${hash}${extension}`;
    assetWrites.set(assetName, bytes);
    return assetName;
  }

  for (const [assetName, bytes] of assetWrites) await writeFile(path.join(assetsDirectory, assetName), bytes);
  if (files.some((file) => file.endsWith(".css")) && assetWrites.size > 0) {
    const css = await readFile(path.join(directory, "styles.css"), "utf8").catch(() => "");
    if (css && /data:[^;]+;base64,/.test(css)) throw new Error("Library CSS still contains an inline asset URL.");
  }
}

function scopeKeyboardSelectors(css) {
  return css.replace(/^@charset[^;]*;/, "").replace(/([^{}]+)\{/g, (rule, selector) => {
    const trimmed = selector.trim();
    if (trimmed.startsWith("@") || !trimmed.includes(".hg-")) return rule;
    const scoped = trimmed.split(",").map((item) => {
      const normalized = item.trim();
      return normalized.startsWith(".kroma-chat") ? normalized : `:where(.kroma-chat) ${normalized}`;
    }).join(",");
    return `${scoped}{`;
  });
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  }));
  return nested.flat();
}
