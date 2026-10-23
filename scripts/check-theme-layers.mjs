import fs from "node:fs";
import path from "node:path";
import * as sass from "sass";
import postcss from "postcss";

const root = process.cwd();
const themesRoot = path.join(root, "src/themes");
const errors = [];
const source = (file) => fs.readFileSync(path.join(root, file), "utf8");
const fail = (file, message) => errors.push(`${file}: ${message}`);
const themes = fs.readdirSync(themesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(themesRoot, entry.name, "theme.scss")))
  .map((entry) => entry.name);
const catalogFile = "src/components/theme-dropdown/theme-tokens.ts";
const catalogSource = source(catalogFile);
const catalog = JSON.parse(catalogSource.slice("export const themeTokens = ".length, catalogSource.lastIndexOf(" as const;")));
const requiredRoles = ["primary", "link", "success", "info", "warning", "danger", "body", "surface", "content", "muted-content", "border"];
const adapter = source("src/adapters/bootstrap/_adapter.scss");
for (const item of JSON.parse(source("src/adapters/bootstrap/compatibility.json"))) {
  if (!adapter.includes(item.source) || !adapter.includes(item.target)) {
    fail("src/adapters/bootstrap/compatibility.json", `${item.component}: missing source ${item.source} or target ${item.target} in adapter`);
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
    const css = sass.compile(path.join(root, entry), { loadPaths: [path.join(root, "node_modules")], logger: sass.Logger.silent }).css;
    const parsed = postcss.parse(css, { from: entry });
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
      for (const role of requiredRoles) {
        const item = tokens.find((token) => token.name === role);
        if (!item || item.type !== "color") fail(catalogFile, `${theme}/${mode}: missing color role ${role}`);
        const declaration = roleRule?.nodes.find((node) => node.prop === `--kroma-color-${role}`);
        if (item && declaration?.value !== item.value) fail(catalogFile, `${theme}/${mode}: ${role} differs from compiled CSS (${declaration?.value} vs ${item.value})`);
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
    });
    if (css.includes("Bootstrap v5")) fail(entry, "theme contains a full Bootstrap build");
  } catch (error) { fail(entry, `Sass/PostCSS compilation failed: ${error.message}`); }
}

if (fs.existsSync(path.join(root, "dist/index.html"))) {
  const html = source("dist/index.html");
  if (!html.includes("style.debug.css") && !html.includes("style.min.css")) fail("dist/index.html", "base stylesheet missing");
  for (const theme of themes) {
    const file = `dist/themes/${theme}.css`;
    if (!fs.existsSync(path.join(root, file))) { fail(file, "theme CSS asset missing"); continue; }
    if (source(file).includes("Bootstrap v5")) fail(file, "theme asset duplicates Bootstrap");
  }
}

if (errors.length) {
  console.error(`Theme architecture failed (${errors.length}):\n${errors.map((error) => `- ${error}`).join("\n")}`);
  process.exitCode = 1;
} else console.log(`Theme architecture passed for ${themes.length} themes; one shared Bootstrap compilation.`);
