import fs from "node:fs";
import { execFileSync } from "node:child_process";
import ts from "typescript";
import postcss from "postcss";

const baseline = (file) => execFileSync("git", ["show", `HEAD:${file}`], { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
const current = (file) => fs.readFileSync(`dist/${file}`, "utf8");

function embeddedStyles(script) {
  const styles = [];
  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) && node.text.length > 10000 && node.text.includes("[data-kroma-theme")) {
      styles.push(node.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(ts.createSourceFile("baseline.js", script, ts.ScriptTarget.Latest, true));
  return styles;
}

function analyze(styles) {
  const rules = new Map();
  let invalid = 0;
  for (const css of styles) {
    postcss.parse(css).walk((node) => {
      if (node.type === "rule") {
        const signature = node.selector + "{" + node.nodes.filter((child) => child.type === "decl").map((child) => `${child.prop}:${child.value}`).join(";") + "}";
        rules.set(signature, (rules.get(signature) ?? 0) + 1);
      }
      if (node.type === "decl" && /\$[a-z][a-z0-9-]*/i.test(node.value)) invalid += 1;
    });
  }
  return { duplicateRuleCopies: [...rules.values()].reduce((total, count) => total + Math.max(count - 1, 0), 0), invalidSassValues: invalid };
}

const baseCss = baseline("dist/style.debug.css");
const baseJs = baseline("dist/main.js");
const oldThemeStyles = embeddedStyles(baseJs);
const newThemeStyles = ["dracula", "kroma-entrepreneur"].map((theme) => current(`themes/${theme}.css`));
const oldAnalysis = analyze([baseCss, ...oldThemeStyles]);
const newAnalysis = analyze([current("style.debug.css"), ...newThemeStyles]);
console.log(JSON.stringify({
  baseline: {
    cssBaseBytes: Buffer.byteLength(baseCss),
    themeStyleBytes: oldThemeStyles.map((style) => Buffer.byteLength(style)),
    jsBytes: Buffer.byteLength(baseJs),
    totalArtifactsBytes: ["dist/index.html", "dist/style.debug.css", "dist/main.js", "dist/main.js.map"].reduce((sum, file) => sum + Buffer.byteLength(baseline(file)), 0),
    bootstrapCompilations: 3,
    ...oldAnalysis,
  },
  current: {
    cssBaseBytes: Buffer.byteLength(current("style.debug.css")),
    themeStyleBytes: newThemeStyles.map((style) => Buffer.byteLength(style)),
    jsBytes: Buffer.byteLength(current("main.js")),
    totalArtifactsBytes: ["index.html", "style.debug.css", "main.js", "main.js.map", "themes/dracula.css", "themes/kroma-entrepreneur.css"].reduce((sum, file) => sum + fs.statSync(`dist/${file}`).size, 0),
    bootstrapCompilations: 1,
    ...newAnalysis,
  },
}, null, 2));
