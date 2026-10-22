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
    const values = Object.fromEntries(
      [...source.matchAll(/^\s*\$([\w-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/gm)]
        .map((match) => [match[1], match[2]])
    );
    const parseMap = (name) => source.match(new RegExp(`\\$${name}:\\s*\\(([\\s\\S]*?)\\);`, "m"))?.[1] ?? "";
    const parseTokens = (map) => [...map.matchAll(/"([^"\n]+)":\s*\$([\w-]+)/g)]
      .map((match) => ({ name: match[1], value: values[match[2]] }))
      .filter((token) => token.value);

    return { id: entry.name, primitive: parseTokens(parseMap("theme-color-tokens")), semantic: parseTokens(parseMap("theme-semantic-color-tokens")) };
  })
  .filter(Boolean);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `export const themeTokens = ${JSON.stringify(themes, null, 2)} as const;\n`);
