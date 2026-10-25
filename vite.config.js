import { defineConfig } from "vite";
import { join } from "node:path";
import { mkdir, rename } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

function routeChatPage(server) {
  server.middlewares.use((request, response, next) => {
    if (!request.url) return next();
    const url = new URL(request.url, "http://localhost");
    const pathname = url.pathname.replace(/\/$/, "");
    if (pathname === "/chat" || pathname.endsWith("/chat") || pathname.includes("/chat/")) {
      response.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
      response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    }
    if (pathname === "/chat" || pathname.endsWith("/chat")) {
      if (!url.pathname.endsWith("/")) {
        response.statusCode = 308;
        response.setHeader("Location", `${pathname}/${url.search}`);
        response.end();
        return;
      }
      request.url = `${pathname}/index.html${url.search}`;
    }
    next();
  });
}

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
      input: ["src/cheatsheet/index.html", "src/cheatsheet/chat/index.html"],
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
    name: "kroma-chat-page-route",
    configureServer: routeChatPage,
    configurePreviewServer: routeChatPage,
  }, {
    name: "write-named-build-files",
    async closeBundle() {
      const dist = join(process.cwd(), "dist");
      await mkdir(dist, { recursive: true });
    }
  }]
}));
