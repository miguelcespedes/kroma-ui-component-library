import type { KeyboardButtonAttributes, KeyboardLayoutObject } from "simple-keyboard";

/** Layout configuration consumed directly by simple-keyboard. */
export const SIMPLE_KEYBOARD_LAYOUT: KeyboardLayoutObject = {
  default: [
    "q w e r t y u i o p",
    "a s d f g h j k l ñ",
    "{shift} z x c v b n m {bksp}",
    "{numbers} , {space} . {enter}",
  ],
  shift: [
    "Q W E R T Y U I O P",
    "A S D F G H J K L Ñ",
    "{shift} Z X C V B N M {bksp}",
    "{numbers} , {space} . {enter}",
  ],
  numbers: [
    "1 2 3 4 5 6 7 8 9 0",
    "@ # $ % & - + ( ) /",
    "{symbols} ¿ ¡ á é í ó ú ü {bksp}",
    "{abc} , {space} . {enter}",
  ],
  symbols: [
    "~ ` | • √ π ÷ × ¶ Δ",
    "€ £ ¥ ^ ° = ? ! : ;",
    "{numbers} ¿ ¡ á é í ó ú ü {bksp}",
    "{abc} , {space} . {enter}",
  ],
};

export const SIMPLE_KEYBOARD_DISPLAY: Record<string, string> = {
  "{shift}": "⇧",
  "{bksp}": "⌫",
  "{numbers}": "123",
  "{symbols}": "#+=",
  "{abc}": "ABC",
  "{space}": "Espacio",
  "{enter}": "↵",
};

export const SIMPLE_KEYBOARD_BUTTON_ATTRIBUTES: KeyboardButtonAttributes[] = [
  { attribute: "type", value: "button" },
  { attribute: "aria-label", value: "Mayúsculas", buttons: "{shift}" },
  { attribute: "aria-label", value: "Borrar carácter", buttons: "{bksp}" },
  { attribute: "aria-label", value: "Cambiar a números", buttons: "{numbers}" },
  { attribute: "aria-label", value: "Cambiar a símbolos", buttons: "{symbols}" },
  { attribute: "aria-label", value: "Volver a letras", buttons: "{abc}" },
  { attribute: "aria-label", value: "Espacio", buttons: "{space}" },
  { attribute: "aria-label", value: "Enviar mensaje", buttons: "{enter}" },
];
