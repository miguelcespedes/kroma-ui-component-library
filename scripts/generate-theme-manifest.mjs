import fs from "node:fs";
import path from "node:path";

const themesRoot = path.resolve("src/themes");
const outputPath = path.resolve("src/components/theme-dropdown/themes-inventary.ts");

const metadata = (directory) => {
  const file = path.join(directory, "theme.json");
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
};

const themes = fs.readdirSync(themesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .filter((entry) => fs.existsSync(path.join(themesRoot, entry.name, "theme.scss")))
  .map((entry) => {
    const directory = path.join(themesRoot, entry.name);
    const meta = metadata(directory);
    return {
      id: entry.name,
      label: meta.label ?? entry.name.replace(/(^|-)([a-z])/g, (_, separator, letter) => `${separator ? " " : ""}${letter.toUpperCase()}`),
      fixture: meta.fixture === true,
      importPath: `../../themes/${entry.name}/theme.scss?url`,
    };
  })
  .filter((theme) => !theme.fixture)
  .sort((first, second) => first.id.localeCompare(second.id));

const imports = themes.map((theme, index) => `import theme${index} from "${theme.importPath}";`).join("\n");
  const entries = themes.map((theme, index) => `  { id: "${theme.id}", label: "${theme.label}", stylesheet: theme${index} },`).join("\n");

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${imports}\n\nexport const themes = [\n${entries}\n] as const;\n`);
