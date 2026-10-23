import fs from "node:fs";
import path from "node:path";
import * as sass from "sass";
import postcss from "postcss";

const root = process.cwd();
const themesRoot = path.join(root, "src/themes");
const errors = [];
const source = (file) => fs.readFileSync(path.isAbsolute(file) ? file : path.join(root, file), "utf8");
const fail = (file, message) => errors.push(`${file}: ${message}`);
const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const metadata = (theme) => {
  const file = path.join(themesRoot, theme, "theme.json");
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
};
const themes = fs.readdirSync(themesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(themesRoot, entry.name, "theme.scss")))
  .map((entry) => entry.name)
  .sort();
const publicThemes = themes.filter((theme) => metadata(theme).fixture !== true);
const catalogFile = "src/components/theme-dropdown/theme-tokens.ts";
const catalogSource = source(catalogFile);
const catalog = JSON.parse(catalogSource.slice("export const themeTokens = ".length, catalogSource.lastIndexOf(" as const;")));
const requiredRoles = ["primary", "link", "success", "info", "warning", "danger", "body", "surface", "content", "muted-content", "border"];
const requiredDimensions = [
  "--kroma-font-family-base",
  "--kroma-font-size-base",
  "--kroma-font-weight-normal",
  "--kroma-font-weight-semibold",
  "--kroma-font-weight-bold",
  "--kroma-line-height-base",
  "--kroma-space-1",
  "--kroma-space-2",
  "--kroma-space-3",
  "--kroma-space-4",
  "--kroma-radius-sm",
  "--kroma-radius-md",
  "--kroma-radius-lg",
  "--kroma-elevation-1",
  "--kroma-elevation-2",
  "--kroma-motion-duration-fast",
  "--kroma-motion-duration-normal",
  "--kroma-motion-easing-standard",
  "--kroma-motion-easing-emphasized",
];
const adapterFile = process.env.KROMA_ADAPTER_FILE ?? "src/adapters/bootstrap/_adapter.scss";
const adapter = source(adapterFile);
for (const theme of themes) {
  if (adapter.includes(`data-kroma-theme="${theme}"`) || adapter.includes(`data-kroma-theme=${theme}`)) {
    fail(adapterFile, `shared adapter must not name the ${theme} theme`);
  }
}
if (!adapter.includes("[data-kroma-theme]:not([data-kroma-theme=\"bootstrap\"])")) {
  fail(adapterFile, "shared adapter must use the generic Kroma theme scope");
}

const compileTheme = (theme) => sass.compile(path.join(root, `src/themes/${theme}/theme.scss`), {
  loadPaths: [path.join(root, "node_modules")],
  logger: sass.Logger.silent,
}).css;

let adapterCss;
try {
  adapterCss = sass.compileString(adapter, { loadPaths: [path.join(root, "node_modules")], logger: sass.Logger.silent }).css;
} catch (error) {
  fail(adapterFile, `Sass compilation failed: ${error.message}`);
}

const bootstrapCss = source("node_modules/bootstrap/dist/css/bootstrap.css");
const compatibilityFile = process.env.KROMA_COMPATIBILITY_FILE ?? "src/adapters/bootstrap/compatibility.json";
const compatibility = JSON.parse(source(compatibilityFile));
const fixtureCss = compileTheme("kroma-certification");
const fixtureRule = postcss.parse(fixtureCss).nodes.find((node) => node.type === "rule"
  && node.selector.includes("data-kroma-theme=kroma-certification")
  && node.selector.includes("data-bs-theme=light"));
const fixtureTokens = new Set(fixtureRule?.nodes.filter((node) => node.type === "decl").map((node) => node.prop) ?? []);
if (adapterCss) {
  const parsedAdapter = postcss.parse(adapterCss, { from: adapterFile });
  const rules = parsedAdapter.nodes.filter((node) => node.type === "rule");
  for (const item of compatibility) {
    for (const field of ["component", "scope", "mechanism", "expansion"]) {
      if (typeof item[field] !== "string" || item[field].trim() === "") fail(compatibilityFile, `missing ${field}`);
    }
    if (typeof item.inherits !== "boolean") fail(compatibilityFile, `${item.component}: inherits must be boolean`);
    const scopes = item.scopes ?? [item.scope];
    for (const scope of scopes) {
      const matching = rules.filter((rule) => rule.selectors.some((selector) => selector.includes(scope)));
      if (matching.length === 0) fail(compatibilityFile, `${item.component}: adapter has no rule for ${scope}`);
    }
    for (const mapping of item.mappings ?? []) {
      if (!mapping.source?.startsWith("--kroma-") || !mapping.target || !mapping.state) {
        fail(compatibilityFile, `${item.component}: invalid mapping`);
        continue;
      }
      if (!fixtureTokens.has(mapping.source)) fail(compatibilityFile, `${item.component}: unknown Kroma source ${mapping.source}`);
      if (mapping.target.startsWith("--bs-") && !bootstrapCss.includes(`${mapping.target}:`)) {
        fail(compatibilityFile, `${item.component}: target ${mapping.target} is not a Bootstrap 5.3.8 API`);
      }
      const declaration = rules
        .filter((rule) => rule.selectors.some((selector) => selector.includes(item.scope)))
        .flatMap((rule) => rule.nodes)
        .find((node) => node.type === "decl"
          && node.prop === mapping.target
          && new RegExp(`var\\(\\s*${escape(mapping.source)}\\s*\\)`).test(node.value));
      if (!declaration) fail(compatibilityFile, `${item.component}: ${mapping.source} does not reach ${mapping.target}`);
    }
  }

  for (const rule of rules) {
    const declarations = rule.nodes.filter((node) => node.type === "decl");
    if (!declarations.some((node) => node.value.includes("var(--kroma-"))) continue;
    if (!compatibility.some((item) => (item.scopes ?? [item.scope]).some((scope) => rule.selectors.some((selector) => selector.includes(scope))))) {
      fail(compatibilityFile, `adapter rule has no compatibility contract: ${rule.selector}`);
    }
  }
}

if (JSON.parse(source("package.json")).private !== true) fail("package.json", "the cheatsheet must remain private");
const bootstrapImports = [];
for (const file of ["src/cheatsheet/app.scss", ...themes.map((theme) => `src/themes/${theme}/theme.scss`)]) {
  const imports = source(file).match(/@import\s+["']bootstrap\/scss\/bootstrap["']/g) ?? [];
  bootstrapImports.push(...imports.map(() => file));
}
if (bootstrapImports.length !== 1 || bootstrapImports[0] !== "src/cheatsheet/app.scss") {
  fail("src/cheatsheet/app.scss", `expected one shared Bootstrap compilation, found ${bootstrapImports.length}: ${bootstrapImports.join(", ")}`);
}

for (const theme of themes) {
  const prefix = `src/themes/${theme}`;
  const entry = `${prefix}/theme.scss`;
  const imports = [...source(entry).matchAll(/@import\s+["']([^"']+)["']/g)].map((match) => match[1]);
  if (new Set(imports).size !== imports.length) fail(entry, "duplicate import");
  if (imports.some((item) => item.includes("bootstrap/scss/bootstrap"))) fail(entry, "theme must not compile Bootstrap");
  for (const layer of ["tokens", "semantic-light", "semantic-dark"]) {
    const file = `${prefix}/_${layer}.scss`;
    if (!fs.existsSync(path.join(root, file))) { fail(file, "required layer missing"); continue; }
    const text = source(file);
    if (/@import\b|--bs-|\.(?:bd-|btn|card|accordion|navbar)/.test(text)) fail(file, "core tokens must not depend on Bootstrap or the cheatsheet");
  }

  try {
    const css = compileTheme(theme);
    const parsed = postcss.parse(css, { from: entry });
    if (publicThemes.includes(theme)) {
      const data = catalog.find((item) => item.id === theme);
      if (!data) fail(catalogFile, `${theme}: missing theme`);
      for (const mode of ["light", "dark"]) {
        const tokens = data?.[mode === "light" ? "semanticLight" : "semanticDark"] ?? [];
        const selector = `[data-kroma-theme=${theme}][data-bs-theme=${mode}]`;
        const roleRule = parsed.nodes.find((node) => node.type === "rule" && node.selector === selector && node.nodes.some((child) => child.prop?.startsWith("--kroma-color-")));
        const properties = new Map(roleRule?.nodes.filter((node) => node.type === "decl" && node.prop.startsWith("--kroma-")).map((node) => [node.prop, node.value]));
        const checked = new Set();
        const checking = new Set();
        const resolve = (name) => {
          if (checking.has(name)) { fail(entry, `${theme}/${mode}: circular token ${name}`); return; }
          if (checked.has(name)) return;
          if (!properties.has(name)) { fail(entry, `${theme}/${mode}: unresolved token ${name}`); return; }
          checking.add(name);
          for (const [, dependency] of properties.get(name).matchAll(/var\((--kroma-[\w-]+)/g)) resolve(dependency);
          checking.delete(name);
          checked.add(name);
        };
        for (const key of properties.keys()) resolve(key);
        for (const [name, value] of properties) {
          if (name.startsWith("--kroma-button-") || name.startsWith("--kroma-card-") || name.startsWith("--kroma-input-")) {
            if (!value.includes("var(--kroma-color-")) fail(entry, `${theme}/${mode}: ${name} must consume a semantic color role`);
          }
        }
        for (const dimension of requiredDimensions) {
          if (!properties.has(dimension)) fail(entry, `${theme}/${mode}: missing ${dimension}`);
        }
        for (const role of requiredRoles) {
          const item = tokens.find((token) => token.name === role);
          if (!item || item.type !== "color") fail(catalogFile, `${theme}/${mode}: missing color role ${role}`);
          const declaration = roleRule?.nodes.find((node) => node.prop === `--kroma-color-${role}`);
          if (item && declaration?.value !== item.value) fail(catalogFile, `${theme}/${mode}: ${role} differs from compiled CSS (${declaration?.value} vs ${item.value})`);
        }
      }
    } else {
      for (const mode of ["light", "dark"]) {
        const selector = `[data-kroma-theme=${theme}][data-bs-theme=${mode}]`;
        const roleRule = parsed.nodes.find((node) => node.type === "rule" && node.selector === selector);
        const properties = new Set(roleRule?.nodes.filter((node) => node.type === "decl").map((node) => node.prop) ?? []);
        for (const role of requiredRoles) if (!properties.has(`--kroma-color-${role}`)) fail(entry, `${theme}/${mode}: missing color role ${role}`);
        for (const dimension of requiredDimensions) if (!properties.has(dimension)) fail(entry, `${theme}/${mode}: missing ${dimension}`);
      }
    }
    parsed.walk((node) => {
      if (node.type === "rule") {
        const selectors = node.selectors ?? [node.selector];
        for (const selector of selectors) {
          if (!selector.includes(`[data-kroma-theme=${theme}]`) && !selector.includes(`[data-kroma-theme="${theme}"]`)) {
            fail(entry, `unscoped rule: ${selector}`);
          }
        }
        const declarations = new Map();
        for (const child of node.nodes) {
          if (child.type !== "decl") continue;
          if (declarations.has(child.prop) && declarations.get(child.prop) !== child.value) {
            fail(entry, `contradictory ${child.prop} in ${node.selector}: ${declarations.get(child.prop)} vs ${child.value}`);
          }
          declarations.set(child.prop, child.value);
        }
      }
      if (node.type === "decl" && /\$[a-z][a-z0-9-]*/i.test(node.value)) {
        fail(entry, `unresolved Sass value ${node.prop}: ${node.value}`);
      }
      if (node.type === "decl" && node.prop.startsWith("--bs-") && !bootstrapCss.includes(`${node.prop}:`) && !["--bs-navbar-bg", "--bs-navbar-border"].includes(node.prop)) {
        fail(entry, `unknown Bootstrap variable ${node.prop}; use compatibility.json and the shared adapter`);
      }
    });
    if (css.includes("Bootstrap v5")) fail(entry, "theme contains a full Bootstrap build");
  } catch (error) { fail(entry, `Sass/PostCSS compilation failed: ${error.message}`); }
}

const manifestFile = "src/components/theme-dropdown/themes-inventary.ts";
const manifest = source(manifestFile);
for (const theme of themes) {
  if (metadata(theme).fixture === true && manifest.includes(`"${theme}"`)) fail(manifestFile, `fixture ${theme} must not be registered`);
}
for (const theme of publicThemes) {
  if (!manifest.includes(`"${theme}"`)) fail(manifestFile, `missing theme ${theme}`);
}

if (fs.existsSync(path.join(root, "dist/index.html"))) {
  const html = source("dist/index.html");
  if (!html.includes("style.debug.css") && !html.includes("style.min.css")) fail("dist/index.html", "base stylesheet missing");
  for (const theme of publicThemes) {
    const file = `dist/themes/${theme}.css`;
    if (!fs.existsSync(path.join(root, file))) { fail(file, "theme CSS asset missing"); continue; }
    if (source(file).includes("Bootstrap v5")) fail(file, "theme asset duplicates Bootstrap");
  }
}

if (errors.length) {
  console.error(`Theme architecture failed (${errors.length}):\n${errors.map((error) => `- ${error}`).join("\n")}`);
  process.exitCode = 1;
} else console.log(`Theme architecture passed for ${themes.length} themes (${publicThemes.length} public); one shared Bootstrap compilation.`);
