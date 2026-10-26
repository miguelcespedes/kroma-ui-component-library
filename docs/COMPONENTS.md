# Guía de componentes Kroma UI

Esta guía explica qué se puede consumir desde una aplicación y cómo se relaciona con los componentes que aparecen en el catálogo visual.

## Qué se distribuye

La aplicación/repo conserva `private: true`: no se publica en npm Registry. La API de paquete documentada y verificable hoy expone KromaChat y sus estilos; los controles del cheatsheet no son subpaquetes de la biblioteca.

| Importación | Qué contiene | Uso |
| --- | --- | --- |
| `@kroma/ui-component-library/chat` | Registro de `<kroma-chat>`, clase `KromaChat` y tipos de mensajes/eventos | API del chat y tipos TypeScript |
| `@kroma/ui-component-library/chat/styles.css` | Layout y renderers de KromaChat, simple-keyboard, Inter Variable y CSS de los temas públicos incluidos | Importar una vez en la hoja global de la aplicación |

Para instalar desde GitHub, fijar tags/commits y configurar Next.js, consulta [Instalación Git](GIT_INSTALLATION.md). La guía completa de los renderers, sus datos y eventos está en [KromaChat y su inventario](CHAT.md); para utilizar o crear temas, ve a [Temas](THEMES.md).

## Inicio rápido

Importa la hoja de estilos desde la entrada global de estilos de tu aplicación. Crea el elemento en el navegador y alimenta su API con mensajes tipados:

```ts
import "@kroma/ui-component-library/chat/styles.css";
import { KromaChat, type ChatMessage } from "@kroma/ui-component-library/chat";

const host = document.querySelector<HTMLElement>("#chat-host");
if (!host) throw new Error("Falta #chat-host");

const chat = document.createElement("kroma-chat") as KromaChat;
chat.setAttribute("chat-title", "Asistente Kroma");
chat.setAttribute("subtitle", "Estamos aquí para ayudarte");
chat.setAttribute("avatar", "K");
host.replaceChildren(chat);

const welcome: ChatMessage = {
  author: "assistant",
  type: "text",
  text: "Hola. ¿Qué necesitas?",
};
chat.addMessage(welcome);
```

`KromaChat` es un Web Component agnóstico de framework. No lo importes de forma estática en código que Next.js pueda evaluar en SSR: usa un import dinámico desde `useEffect`. El CSS sí se puede importar desde el layout global. No hay wrappers React obligatorios.

## Aplicar identidad y contraste

La identidad de marca y el modo de contraste son independientes. Configura los dos atributos en el elemento raíz:

```html
<html data-kroma-theme="kroma-entrepreneur" data-bs-theme="light">
```

IDs de marca incluidos en la salida actual:

| `data-kroma-theme` | Resultado |
| --- | --- |
| `bootstrap` | Sin overrides de marca Kroma; KromaChat usa los fallbacks de superficie Bootstrap del propio componente. |
| `dracula` | Roles y adaptaciones Dracula. |
| `kroma-entrepreneur` | Roles y adaptaciones Kroma Entrepreneur. |

`data-bs-theme` acepta `light` o `dark`. Es el contraste resuelto que consumen los estilos; no es un nombre de tema. La biblioteca no ejecuta el selector de marca del cheatsheet ni lee preferencias del sistema: la aplicación elige los atributos. Detalles y ejemplos en [Temas](THEMES.md).

La hoja distribuida contiene los CSS de Dracula y Kroma Entrepreneur junto con el chat; no hace falta solicitar hojas internas ni URLs del cheatsheet. Si no se importa `chat/styles.css`, el Web Component queda sin su estilo de presentación.

## Tokens en estilos de la aplicación

Los temas publican contratos Kroma en las propiedades CSS `--kroma-ref-*`, `--kroma-color-*`, `--kroma-font-*`, `--kroma-space-*`, `--kroma-radius-*`, `--kroma-elevation-*` y `--kroma-motion-*`. Se pueden consumir desde componentes de la aplicación con fallbacks:

```css
.mi-panel {
  color: var(--kroma-color-content-primary, #212529);
  background: var(--kroma-color-surface-raised, #fff);
  border: 1px solid var(--kroma-color-border-default, #dee2e6);
  border-radius: var(--kroma-radius-md, .375rem);
  padding: var(--kroma-space-3, 1rem);
}
```

El catálogo de colores que inspecciona primitivas y roles es parte del cheatsheet, no una API runtime exportada por el paquete. La guía de temas explica los contratos y el proceso para añadir una marca.

## Integración con Bootstrap

El paquete no incluye Bootstrap CSS ni sus plugins. Si la aplicación usa clases Bootstrap, debe instalar/importar su propia versión compatible (la matriz del repositorio se verifica contra Bootstrap 5.3.8). Cuando un tema Kroma público está activo, el adaptador genérico de la hoja Kroma enlaza los roles semánticos con los puntos Bootstrap declarados, como botones primarios, tarjetas, formularios, menús, tablas, navegación y acordeones. El scope excluye `data-kroma-theme="bootstrap"`; el adaptador no debe recolorear Bootstrap nativo.

El selector de tema (`[data-theme-dropdown]`), el selector de contraste del catálogo y la paleta de tokens son inicializadores internos del cheatsheet. No se importan desde `@kroma/ui-component-library/...`. En una aplicación propia se eligen `data-kroma-theme`/`data-bs-theme` desde el estado de la aplicación o se construyen controles propios.

## Componentes dentro de KromaChat

Las tarjetas no se instancian por separado. Se pasan como datos a `chat.addMessage(...)`; KromaChat elige el renderer, conserva la conversación y emite eventos DOM. La lógica de negocio (precio, carrito, navegación, persistencia y backend) pertenece a la aplicación anfitriona.

El inventario exhaustivo de layout, navegación, catálogo, comercio, formularios, feedback, mensajes, teclado y sus payloads vive en [KromaChat y sus elementos internos](CHAT.md). Ahí también se documentan los métodos públicos, eventos, atributos, voz y Kitchen Mode.

## Otras guías

- [Instalar como dependencia Git y configurar Next.js](GIT_INSTALLATION.md)
- [Crear y mantener temas](THEMES.md)
- [KromaChat: componentes internos, tipos, métodos y eventos](CHAT.md)
- [Arquitectura y validaciones del repositorio](../README.md#capas)
