import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  configFile: false,
  build: {
    outDir: "lib-dist/chat",
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: resolve("src/library/chat/index.ts"),
      formats: ["es"],
      fileName: () => "index.js",
      cssFileName: "styles",
    },
    rollupOptions: {
      external: [],
      output: {
        entryFileNames: "index.js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: (assetInfo) => assetInfo.name?.endsWith(".css")
          ? "styles.css"
          : "assets/[name]-[hash][extname]",
      },
    },
    minify: "esbuild",
    sourcemap: false,
  },
});
