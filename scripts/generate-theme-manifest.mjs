import fs from "node:fs";
import path from "node:path";

const themesRoot = path.resolve("src/themes");
const outputPath = path.resolve("src/components/theme-dropdown/themes-inventary.ts");

const themes = fs.readdirSync(themesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .filter((entry) => fs.existsSync(path.join(themesRoot, entry.name, "theme.scss")))
  .map((entry) => ({
    id: entry.name,
    label: entry.name.replace(/(^|-)([a-z])/g, (_, separator, letter) => `${separator ? " " : ""}${letter.toUpperCase()}`),
    importPath: `../../themes/${entry.name}/theme.scss?inline`,
  }));

const imports = themes.map((theme, index) => `import theme${index} from "${theme.importPath}";`).join("\n");
const entries = themes.map((theme, index) => `  { id: "${theme.id}", label: "${theme.label}", stylesheet: theme${index} },`).join("\n");

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${imports}\n\nexport const themes = [\n${entries}\n] as const;\n`);
