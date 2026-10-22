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
  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (isComment(line)) return;

    if (!isSassVariable(line) || !line.endsWith(";")) {
      addError(filePath, index + 1, "_tokens.scss solo puede declarar primitivas Sass terminadas en punto y coma");
    }
  });
}

function checkSemantic(filePath, lines, mode) {
  let blockDepth = 0;
  let activeSelector = null;
  let nestedDepth = 0;

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (isComment(line)) return;

    if (line.startsWith("@import")) {
      addError(filePath, index + 1, "las capas semánticas no deben importar otras capas");
      return;
    }

    if (line.endsWith("{")) {
      activeSelector = line.slice(0, -1).trim();
      blockDepth += 1;
      if (blockDepth > 1) nestedDepth += 1;
      const expectedSelector = mode === "light"
        ? /^\[data-kroma-theme=\"kroma-entrepreneur\"\]\[data-bs-theme=\"light\"\]$/
        : /^\[data-kroma-theme="kroma-entrepreneur"\]\[data-bs-theme="dark"\]( \.([a-z-]+))?$/;
      const allowedComponentSelector = mode === "dark" && (/^\.[a-z-]+$/.test(activeSelector) || /^&::[a-z-]+$/.test(activeSelector) || /^\[data-kroma-theme="kroma-entrepreneur"\]\[data-bs-theme="dark"\]( \.([a-z-]+))?(,\s*\[data-kroma-theme="kroma-entrepreneur"\]\[data-bs-theme="dark"\]( \.([a-z-]+))?)+$/.test(activeSelector));
      if (blockDepth === 1 && !expectedSelector.test(activeSelector)) {
        addError(filePath, index + 1, `selector runtime no permitido en la capa semántica ${mode}`);
      } else if (blockDepth > 1 && !allowedComponentSelector) {
        addError(filePath, index + 1, "solo se permiten selectores de componentes dentro del selector runtime dark");
      }
      return;
    }

    if (line === "}") {
      blockDepth = Math.max(0, blockDepth - 1);
      if (nestedDepth > 0 && blockDepth < 2) nestedDepth = 0;
      if (blockDepth === 0) activeSelector = null;
      return;
    }

    if (isSassVariable(line)) {
      const variable = line.match(/^\$([a-z0-9-]+)\s*:/)[1];
      const allowed = mode === "dark"
        ? variable === "enable-dark-mode" || variable.endsWith("-dark")
        : !variable.endsWith("-dark");
      if (!allowed) addError(filePath, index + 1, `variable Sass fuera del contrato semántico ${mode}`);
      if (mode === "light" && isLiteralColor(line)) addError(filePath, index + 1, "los colores deben declararse en _tokens.scss y consumirse por referencia");
      return;
    }

    if (isCssVariable(line)) {
      if (blockDepth === 0) addError(filePath, index + 1, "las variables CSS runtime deben estar dentro de un selector permitido");
      return;
    }

    if (blockDepth > 0 && isLiteralColor(line)) {
      addError(filePath, index + 1, "los colores runtime deben reutilizar primitivas o variables CSS existentes");
      return;
    }

    if (blockDepth > 1 && mode === "dark" && line.endsWith(";")) return;

    if (!line.startsWith("@") && !line.startsWith("//")) {
      addError(filePath, index + 1, "declaración fuera del contrato de la capa semántica");
    }
  });
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

  if (lines.join("\n") !== expected.join("\n")) {
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
