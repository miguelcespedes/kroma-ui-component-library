export type VirtualKeyAction =
  | "character"
  | "shift"
  | "backspace"
  | "symbols"
  | "letters"
  | "space"
  | "comma"
  | "period"
  | "send";

export type VirtualKey = Readonly<{
  id: string;
  label: string;
  action: VirtualKeyAction;
  value?: string;
  flex?: number;
  ariaLabel?: string;
  functional?: boolean;
}>;

export type VirtualKeyboardLayout = Readonly<{
  id: "letters" | "symbols";
  rows: readonly (readonly VirtualKey[])[];
}>;

const key = (id: string, label: string, action: VirtualKeyAction, options: Omit<VirtualKey, "id" | "label" | "action"> = {}): VirtualKey => ({
  id,
  label,
  action,
  ...options,
});

const letterRow = (letters: string) => [...letters].map((letter) => key(letter, letter, "character", { value: letter, flex: 1 }));

export function createVirtualKeyboardLayout(symbols: boolean, shifted: boolean): VirtualKeyboardLayout {
  if (symbols) {
    return {
      id: "symbols",
      rows: [
        [..."1234567890"].map((character) => key(`number-${character}`, character, "character", { value: character, flex: 1 })),
        [..."@#$%&-+()/"].map((character, index) => key(`symbol-${index}`, character, "character", { value: character, flex: 1 })),
        [
          key("letters", "ABC", "letters", { flex: 1.4, functional: true }),
          ...["¿", "¡", "á", "é", "í", "ó", "ú", "ü"].map((character) => key(`accent-${character}`, character, "character", { value: character, flex: 1 })),
          key("backspace", "⌫", "backspace", { flex: 1.4, ariaLabel: "Borrar carácter", functional: true }),
        ],
        [
          key("letters-bottom", "ABC", "letters", { flex: 1.2, functional: true }),
          key("comma", ",", "comma", { flex: .75 }),
          key("space", "Espacio", "space", { value: " ", flex: 3.5 }),
          key("period", ".", "period", { flex: .75 }),
          key("send", "Enter", "send", { flex: 1.5, ariaLabel: "Enviar mensaje", functional: true }),
        ],
      ],
    };
  }

  const transformLetter = (letter: string) => shifted ? letter.toLocaleUpperCase("es") : letter;
  return {
    id: "letters",
    rows: [
      letterRow("qwertyuiop").map((item) => ({ ...item, label: transformLetter(item.value || ""), value: transformLetter(item.value || "") })),
      letterRow("asdfghjklñ").map((item) => ({ ...item, label: transformLetter(item.value || ""), value: transformLetter(item.value || "") })),
      [
        key("shift", "⇧", "shift", { flex: 1.5, ariaLabel: shifted ? "Desactivar mayúsculas" : "Activar mayúscula; pulsa dos veces para bloqueo", functional: true }),
        ...letterRow("zxcvbnm").map((item) => ({ ...item, label: transformLetter(item.value || ""), value: transformLetter(item.value || "") })),
        key("backspace", "⌫", "backspace", { flex: 1.5, ariaLabel: "Borrar carácter", functional: true }),
      ],
      [
        key("symbols", "123", "symbols", { flex: 1.25, functional: true }),
        key("comma", ",", "comma", { flex: 1 }),
        key("space", "Espacio", "space", { value: " ", flex: 4 }),
        key("period", ".", "period", { flex: 1 }),
        key("send", "Enter", "send", { flex: 1.45, ariaLabel: "Enviar mensaje", functional: true }),
      ],
    ],
  };
}
