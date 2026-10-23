import fs from "node:fs";
import path from "node:path";
import postcss from "postcss";

const root = process.cwd();
const baselineFile = path.resolve(process.env.KROMA_METRICS_BASELINE ?? "metrics/architecture-baseline.json");
const baseline = JSON.parse(fs.readFileSync(baselineFile, "utf8"));
const themesRoot = path.join(root, "src/themes");
const metadata = (theme) => {
  const file = path.join(themesRoot, theme, "theme.json");
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
};
const themes = fs.readdirSync(themesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(themesRoot, entry.name, "theme.scss")))
  .map((entry) => entry.name)
  .sort();
const publicThemes = themes.filter((theme) => metadata(theme).fixture !== true);
const fixtureThemes = themes.filter((theme) => metadata(theme).fixture === true);
const dist = path.join(root, "dist");
const baseCssName = fs.existsSync(path.join(dist, "style.debug.css")) ? "style.debug.css" : "style.min.css";
const jsName = fs.existsSync(path.join(dist, "main.js")) ? "main.js" : "main.min.js";
const mapName = `${jsName}.map`;
const themeFiles = publicThemes.map((theme) => path.join(dist, "themes", `${theme}.css`)).filter((file) => fs.existsSync(file));
const read = (file) => fs.readFileSync(path.join(dist, file), "utf8");
const size = (file) => fs.statSync(path.join(dist, file)).size;
const themeStyles = Object.fromEntries(publicThemes.map((theme) => [theme, fs.existsSync(path.join(dist, "themes", `${theme}.css`)) ? fs.readFileSync(path.join(dist, "themes", `${theme}.css`), "utf8") : ""]));
const css = [read(baseCssName), ...Object.values(themeStyles).filter(Boolean)];

function analyze(styles) {
  const rules = new Map();
  let invalid = 0;
  let important = 0;
  for (const style of styles) {
    postcss.parse(style).walk((node) => {
      if (node.type === "rule") {
        const signature = node.selector + "{" + node.nodes.filter((child) => child.type === "decl").map((child) => `${child.prop}:${child.value}`).join(";") + "}";
        rules.set(signature, (rules.get(signature) ?? 0) + 1);
      }
      if (node.type === "decl" && /\$[a-z][a-z0-9-]*/i.test(node.value)) invalid += 1;
      if (node.type === "decl" && node.important) important += 1;
    });
  }
  return {
    duplicateRuleCopies: [...rules.values()].reduce((total, count) => total + Math.max(count - 1, 0), 0),
    invalidSassValues: invalid,
    importantDeclarations: important,
  };
}

function tokenCounts() {
  const counts = {};
  for (const theme of publicThemes) {
    const style = themeStyles[theme];
    if (!style) continue;
    const parsed = postcss.parse(style);
    counts[theme] = {};
    for (const mode of ["light", "dark"]) {
      const props = new Set(parsed.nodes
        .filter((node) => node.type === "rule" && node.selector.includes(`[data-kroma-theme=${theme}]`) && node.selector.includes(`[data-bs-theme=${mode}]`))
        .flatMap((node) => node.nodes.filter((child) => child.type === "decl" && child.prop.startsWith("--kroma-")).map((child) => child.prop)));
      counts[theme][mode] = props.size;
    }
  }
  return counts;
}

const adapter = fs.readFileSync(path.join(root, "src/adapters/bootstrap/_adapter.scss"), "utf8");
const adapterThemeNames = [...new Set([...adapter.matchAll(/data-kroma-theme=["']?([\w-]+)["']?/g)].map((match) => match[1]).filter((name) => name !== "bootstrap"))];
const adapterLines = adapter.split(/\r?\n/).length;
const themeAdapterLines = Object.fromEntries(themes.map((theme) => {
  const files = ["light", "dark"].map((mode) => path.join(root, `src/adapters/bootstrap/themes/${theme}/_${mode}.scss`));
  return [theme, files.filter((file) => fs.existsSync(file)).reduce((total, file) => total + fs.readFileSync(file, "utf8").split(/\r?\n/).length, 0)];
}));
const compatibility = JSON.parse(fs.readFileSync(path.join(root, "src/adapters/bootstrap/compatibility.json"), "utf8"));
const bootstrapCompilations = ["src/cheatsheet/app.scss", ...themes.map((theme) => `src/themes/${theme}/theme.scss`)]
  .reduce((total, file) => total + (fs.readFileSync(path.join(root, file), "utf8").match(/@import\s+["']bootstrap\/scss\/bootstrap["']/g)?.length ?? 0), 0);
const analysis = analyze(css);
const totalThemeBytes = Object.values(themeStyles).reduce((total, style) => total + Buffer.byteLength(style), 0);
const totalArtifactsBytes = [
  "index.html",
  baseCssName,
  jsName,
  ...(fs.existsSync(path.join(dist, mapName)) ? [mapName] : []),
  ...themeFiles.map((file) => path.relative(dist, file).replaceAll("\\", "/")),
].reduce((total, file) => total + size(file), 0);

const current = {
  artifacts: {
    cssBaseBytes: Buffer.byteLength(read(baseCssName)),
    themeStyleBytes: Object.fromEntries(publicThemes.map((theme) => [theme, Buffer.byteLength(themeStyles[theme])])),
    totalThemeStyleBytes: totalThemeBytes,
    jsBytes: size(jsName),
    totalArtifactsBytes,
  },
  architecture: {
    bootstrapCompilations,
    ...analysis,
    publicThemes: publicThemes.length,
    fixtureThemes: fixtureThemes.length,
    sharedAdapterThemeNames: adapterThemeNames.length,
    sharedAdapterLines: adapterLines,
    themeAdapterLines,
    compatibilityContracts: compatibility.length,
    compatibilityMappings: compatibility.reduce((total, item) => total + (item.mappings?.length ?? 0), 0),
    kromaTokens: tokenCounts(),
  },
};
const delta = {
  cssBaseBytes: current.artifacts.cssBaseBytes - baseline.artifacts.cssBaseBytes,
  totalThemeStyleBytes: current.artifacts.totalThemeStyleBytes - Object.values(baseline.artifacts.themeStyleBytes).reduce((total, value) => total + value, 0),
  jsBytes: current.artifacts.jsBytes - baseline.artifacts.jsBytes,
  totalArtifactsBytes: current.artifacts.totalArtifactsBytes - baseline.artifacts.totalArtifactsBytes,
  totalArtifactsPercent: Number((((current.artifacts.totalArtifactsBytes - baseline.artifacts.totalArtifactsBytes) / baseline.artifacts.totalArtifactsBytes) * 100).toFixed(2)),
  themeAdapterLines: Object.values(current.architecture.themeAdapterLines).reduce((total, value) => total + value, 0) - Object.values(baseline.architecture.themeAdapterLines).reduce((total, value) => total + value, 0),
};
const checks = {
  "single-bootstrap-compilation": current.architecture.bootstrapCompilations === 1,
  "no-duplicate-theme-rules": current.architecture.duplicateRuleCopies <= baseline.architecture.duplicateRuleCopies,
  "no-invalid-sass-values": current.architecture.invalidSassValues === 0,
  "generic-shared-adapter": current.architecture.sharedAdapterThemeNames === 0,
  "third-theme-fixture": current.architecture.fixtureThemes >= 1,
  "compatibility-expanded": current.architecture.compatibilityContracts > baseline.architecture.compatibilityContracts,
  "theme-adapter-debt-reduced": delta.themeAdapterLines < 0,
  "artifact-growth-under-10-percent": delta.totalArtifactsPercent <= 10,
};
const passed = Object.values(checks).every(Boolean);
const result = {
  baseline: { capturedFromCommit: baseline.capturedFromCommit, ...baseline.artifacts },
  current,
  delta,
  checks,
  result: passed ? "PASS" : "FAIL",
};
console.log(JSON.stringify(result, null, 2));
if (!passed) process.exitCode = 1;
