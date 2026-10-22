import fs from "node:fs";
import path from "node:path";

const packageJsonPath = path.resolve("package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

const themeRoot = path.resolve("src/themes");
const themes = fs.readdirSync(themeRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join(themeRoot, entry.name));

const errors = [];

if (packageJson.private !== true) {
  errors.push("package.json:1 el cheatsheet debe permanecer como paquete privado");
}

if (Object.hasOwn(packageJson, "exports")) {
  errors.push("package.json:1 no debe declarar exports npm para rutas que no forman parte del bundle del cheatsheet");
}

function relative(filePath) {
  return path.relative(process.cwd(), filePath);
}

function addError(filePath, lineNumber, message) {
  errors.push(`${relative(filePath)}:${lineNumber} ${message}`);
}

function isComment(line) {
  return !line || line.startsWith("//") || line.startsWith("/*") || line.startsWith("*") || line.endsWith("*/");
}

function isSassVariable(line) {
  return /^\$[a-z0-9-]+\s*:/.test(line);
}

function isCssVariable(line) {
  return /^--bs-[a-z0-9-]+\s*:/.test(line);
}

function isLiteralColor(line) {
  return /#[0-9a-f]{3,8}\b/i.test(line);
}

function checkTokens(filePath, lines) {
  let mapDepth = 0;
  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (isComment(line)) return;

    if (mapDepth > 0) {
      mapDepth += (line.match(/\(/g) ?? []).length;
      mapDepth -= (line.match(/\)/g) ?? []).length;
      return;
    }

    if (/^\$[a-z0-9-]+\s*:\s*\($/.test(line)) {
      mapDepth = 1;
      return;
    }

    if (!isSassVariable(line) || !line.endsWith(";")) {
      addError(filePath, index + 1, "_tokens.scss solo puede declarar primitivas Sass terminadas en punto y coma");
    }
  });
}

function checkSemantic(filePath, lines, mode) {
  const source = lines.join("\n");
  const themeName = path.basename(path.dirname(filePath));
  const rootSelector = `[data-kroma-theme="${themeName}"][data-bs-theme="${mode}"]`;

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (isComment(line)) return;
    if (line.startsWith("@import")) addError(filePath, index + 1, "las capas semánticas no deben importar otras capas");
  });

  const runtimeSelectors = [...source.matchAll(/(^|\n)\s*([^@\n][^\n{]+)\{/g)].map((match) => match[2].trim());
  for (const selector of runtimeSelectors) {
    if (!selector.includes("data-kroma-theme")) continue;
    if (!selector.startsWith(rootSelector)) {
      addError(filePath, 1, `selector runtime no permitido en la capa semántica ${mode}`);
    }
  }

  if (mode === "light") {
    lines.forEach((rawLine, index) => {
      const line = rawLine.trim();
      if (isComment(line) || line.startsWith("$")) return;
      if (isLiteralColor(line) && !line.includes("$")) addError(filePath, index + 1, "los colores deben declararse en _tokens.scss y consumirse por referencia");
    });
  }
}

function checkEntry(filePath) {
  const lines = fs.readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("//"));
  const expected = [
    '@import "./tokens";',
    '@import "./semantic-light";',
    '@import "./semantic-dark";',
    '@import "bootstrap/scss/bootstrap";',
  ];

  if (!lines.slice(0, 4).join("\n").includes(expected.join("\n"))) {
    addError(filePath, 1, "theme.scss debe contener únicamente los cuatro imports obligatorios en orden");
  }
}

for (const themePath of themes) {
  const files = [
    ["_tokens.scss", (filePath, lines) => checkTokens(filePath, lines)],
    ["_semantic-light.scss", (filePath, lines) => checkSemantic(filePath, lines, "light")],
    ["_semantic-dark.scss", (filePath, lines) => checkSemantic(filePath, lines, "dark")],
  ];

  for (const [fileName, check] of files) {
    const filePath = path.join(themePath, fileName);
    if (fs.existsSync(filePath)) check(filePath, fs.readFileSync(filePath, "utf8").split(/\r?\n/));
    else addError(filePath, 1, `falta la capa obligatoria ${fileName}`);
  }

  const entryPath = path.join(themePath, "theme.scss");
  if (fs.existsSync(entryPath)) checkEntry(entryPath);
  else addError(entryPath, 1, "falta el entrypoint theme.scss");
}

if (errors.length > 0) {
  console.error("Theme layer contract failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Theme layer contract passed for ${themes.length} theme(s).`);
}
