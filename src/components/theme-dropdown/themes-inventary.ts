import theme0 from "../../themes/dracula/theme.scss?inline";
import theme1 from "../../themes/kroma-entrepreneur/theme.scss?inline";

export const themes = [
  { id: "dracula", label: "Dracula", stylesheet: theme0 },
  { id: "kroma-entrepreneur", label: "Kroma Entrepreneur", stylesheet: theme1 },
] as const;
