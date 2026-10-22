import fs from "node:fs";
import path from "node:path";

const themesRoot = path.resolve("src/themes");
const outputPath = path.resolve("src/components/theme-dropdown/theme-tokens.ts");

const themes = fs.readdirSync(themesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => {
    const tokensPath = path.join(themesRoot, entry.name, "_tokens.scss");
    if (!fs.existsSync(tokensPath)) return null;

    const source = fs.readFileSync(tokensPath, "utf8");
    const semanticSources = [
      source,
      fs.readFileSync(path.join(themesRoot, entry.name, "_semantic-light.scss"), "utf8"),
      fs.readFileSync(path.join(themesRoot, entry.name, "_semantic-dark.scss"), "utf8"),
    ].join("\n");
    const values = Object.fromEntries(
      [...source.matchAll(/^\s*\$([\w-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/gm)]
        .map((match) => [match[1], match[2]])
    );
    for (const match of source.matchAll(/^\s*\$([\w-]+):\s*map-get\(\$([\w-]+),\s*"([^"]+)"\)\s*;/gm)) {
      const mapMatch = source.match(new RegExp(`\\$${match[2]}\\s*:\\s*\\(([\\s\\S]*?)\\);`));
      const value = mapMatch?.[1].match(new RegExp(`"${match[3]}"\\s*:\\s*(#[0-9a-fA-F]{3,8})`))?.[1];
      if (value) values[match[1]] = value;
    }
    const resolveValue = (value) => {
      const variable = value.match(/^\$([\w-]+)$/)?.[1];
      return variable ? values[variable] ?? value : value;
    };
    const parseMap = (name) => {
      const start = semanticSources.indexOf(`$${name}:`);
      if (start < 0) return "";
      const open = semanticSources.indexOf("(", start);
      const alias = semanticSources.slice(start).match(new RegExp(`^\\$${name}\\s*:\\s*\\$([\\w-]+)\\s*;`))?.[1];
      if (alias) return parseMap(alias);
      if (open < 0) return "";
      let depth = 0;
      for (let index = open; index < semanticSources.length; index += 1) {
        if (semanticSources[index] === "(") depth += 1;
        if (semanticSources[index] === ")") depth -= 1;
        if (depth === 0) return semanticSources.slice(open + 1, index);
      }
      return "";
    };
    const parseTokens = (map) => [...map.matchAll(/"([^"\n]+)":\s*(?:\$([\w-]+)|([^,\n]+))/g)]
      .map((match) => ({ name: match[1], value: resolveValue(values[match[2]] ?? match[3].trim()) }))
      .filter((token) => token.value);

    return {
      id: entry.name,
      primitiveShared: parseTokens(parseMap("primitive-shared")),
      primitiveLight: parseTokens(parseMap("primitive-light")),
      primitiveDark: parseTokens(parseMap("primitive-dark")),
      semanticLight: parseTokens(parseMap("theme-semantic-light-color-tokens")),
      semanticDark: parseTokens(parseMap("theme-semantic-dark-color-tokens")),
    };
  })
  .filter(Boolean);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `export const themeTokens = ${JSON.stringify(themes, null, 2)} as const;\n`);
