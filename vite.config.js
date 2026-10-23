import { defineConfig } from "vite";
import { join } from "node:path";
import { mkdir, rename } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

export default defineConfig(({ mode }) => ({
  root: "src/cheatsheet",
  base: "./",
  publicDir: false,
  build: {
    outDir: "../../dist",
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsDir: ".",
    rollupOptions: {
      input: "src/cheatsheet/index.html",
      output: {
        entryFileNames: mode === "min" ? "main.min.js" : "main.js",
        assetFileNames: (assetInfo) => {
          const source = assetInfo.originalFileNames?.find((file) => file.includes("/themes/"));
          if (source) return `themes/${source.split("/themes/")[1].split("/")[0]}.css`;
          return assetInfo.name?.endsWith(".css") ? (mode === "min" ? "style.min.css" : "style.debug.css") : "[name][extname]";
        }
      }
    },
    minify: mode === "min" ? "esbuild" : false,
    sourcemap: mode === "debug"
  },
  plugins: [{
    name: "generate-theme-manifest",
    async configResolved() {
      await run(process.execPath, ["scripts/generate-theme-manifest.mjs"]);
      await run(process.execPath, ["scripts/generate-theme-tokens.mjs"]);
    }
  }, {
    name: "write-named-build-files",
    async closeBundle() {
      const dist = join(process.cwd(), "dist");
      await mkdir(dist, { recursive: true });
    }
  }]
}));
