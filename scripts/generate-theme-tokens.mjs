import fs from "node:fs";
import path from "node:path";
import * as sass from "sass";

const themesRoot = path.resolve("src/themes");
const outputPath = path.resolve("src/components/theme-dropdown/theme-tokens.ts");
const readMap = (value, theme, group) => {
  if (!(value instanceof sass.SassMap)) throw new Error(`${theme}: ${group} must be a Sass map`);
  return [...value.contents].map(([key, color]) => {
    if (!(key instanceof sass.SassString)) throw new Error(`${theme}: ${group} keys must be strings`);
    const type = color instanceof sass.SassColor ? "color" : color instanceof sass.SassNumber ? "number" : color instanceof sass.SassList ? "font-family" : "string";
    if (group.startsWith("semantic") && type !== "color") {
      throw new Error(`${theme}: ${group}.${key.text} must evaluate to a Sass color, got ${color}`);
    }
    return { name: key.text, value: color.toString(), type };
  });
};

const themes = fs.readdirSync(themesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(themesRoot, entry.name, "theme.scss")))
  .map((entry) => {
    const directory = path.join(themesRoot, entry.name);
    const catalog = { id: entry.name };
    const capture = (group) => ([map]) => {
      catalog[group] = readMap(map, entry.name, group);
      return sass.sassNull;
    };
    sass.compileString(`
      @import "tokens";
      a { b: capture-shared($primitive-shared); c: capture-light($primitive-light); d: capture-dark($primitive-dark); }
      @import "semantic-light";
      a { b: capture-semantic-light($theme-semantic-light-color-tokens); }
      @import "semantic-dark";
      a { b: capture-semantic-dark($theme-semantic-dark-color-tokens); }
    `, {
      loadPaths: [directory],
      logger: sass.Logger.silent,
      functions: {
        "capture-shared($map)": capture("primitiveShared"),
        "capture-light($map)": capture("primitiveLight"),
        "capture-dark($map)": capture("primitiveDark"),
        "capture-semantic-light($map)": capture("semanticLight"),
        "capture-semantic-dark($map)": capture("semanticDark"),
      },
    });
    return catalog;
  });

fs.writeFileSync(outputPath, `export const themeTokens = ${JSON.stringify(themes, null, 2)} as const;\n`);
