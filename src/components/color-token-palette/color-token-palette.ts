import { themeTokens } from "../theme-dropdown/theme-tokens";

type ThemeToken = { readonly name: string; readonly value: string; readonly type: string };
type TokenGroup = readonly [string, readonly ThemeToken[]];

function getTextColor(value: string) {
  const hex = value.match(/^#([0-9a-f]{3,8})$/i)?.[1];
  if (!hex) return "#212529";
  const normalized = hex.length === 3
    ? hex.split("").map((channel) => channel + channel).join("")
    : hex.slice(0, 6);
  const channels = [0, 2, 4].map((index) => parseInt(normalized.slice(index, index + 2), 16) / 255);
  const luminance = channels.map((channel) => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * luminance[0] + 0.7152 * luminance[1] + 0.0722 * luminance[2] < 0.45 ? "#ffffff" : "#212529";
}

export function initializeColorTokenPalette() {
  const palette = document.querySelector<HTMLElement>("[data-theme-token-palette]");
  if (!palette) return;

  const renderTokens = () => {
    const theme = themeTokens.find((entry) => entry.id === document.documentElement.dataset.kromaTheme);
    const contrast = document.documentElement.dataset.bsTheme === "dark" ? "dark" : "light";
    const groups: TokenGroup[] = theme ? contrast === "dark" ? [
      ["Primitive color tokens · dark", theme.primitiveDark as readonly ThemeToken[]],
      ["Semantic color tokens · dark", theme.semanticDark as readonly ThemeToken[]],
    ] : [
      ["Primitive color tokens · light", theme.primitiveLight as readonly ThemeToken[]],
      ["Semantic color tokens · light", theme.semanticLight as readonly ThemeToken[]],
    ] : [];

    palette.innerHTML = groups.map(([title, tokens]) => {
      const colors = tokens.filter((token) => token.type === "color");
      if (!colors.length) return "";
      return `
        <div class="col-12"><h4 class="h6 mt-3">${title}</h4></div>
        ${colors.map((token) => `
        <div class="col-6 col-md-3">
          <div class="bd-color-token" style="--bd-token-color: ${token.value}; --bd-token-text: ${getTextColor(token.value)}">
            <span>${token.name}</span>
            <code>${token.value}</code>
          </div>
        </div>`).join("")}`;
    }).join("");
  };

  renderTokens();
  new MutationObserver(renderTokens).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-kroma-theme", "data-bs-theme"],
  });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", renderTokens);
}
