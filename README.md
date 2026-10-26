# Kroma UI Component Library

Kroma es un sistema de diseño con tokens propios; Bootstrap 5.3.8 implementa los componentes del cheatsheet mediante un adaptador. El repositorio es privado y el paquete mantiene `private: true`: KromaChat no se publica en npm Registry. Para instalarlo, el consumidor necesita acceso SSH concedido al repositorio de GitHub.

## Guías de uso

Elige la guía según lo que necesitas hacer. El README resume el proyecto y ofrece un inicio rápido; las guías enlazadas detallan contratos y ejemplos completos.

| Guía | Contenido |
| --- | --- |
| [Usar los componentes de Kroma UI](docs/COMPONENTS.md) | Qué APIs se distribuyen, estilos, temas, tokens, Bootstrap y cómo se conectan los componentes. |
| [Crear y aplicar temas](docs/THEMES.md) | `data-kroma-theme` y contraste, capas Sass, contrato de tokens, estructura de tema, registro y validaciones. |
| [KromaChat y su inventario interno](docs/CHAT.md) | Inventario de layout, mensajes, navegación, catálogo, comercio, formularios, teclado, métodos, tipos y eventos. |
| [Instalación Git y Next.js](docs/GIT_INSTALLATION.md) | Instalar con tags/commits, importación SSR segura, recursos y actualización controlada. |

La API de paquete actual publica `@kroma/ui-component-library/chat` y `@kroma/ui-component-library/chat/styles.css`; los dropdowns de tema/contraste y la paleta de tokens del cheatsheet son herramientas internas del catálogo, no imports públicos.

## Usar KromaChat

Instala desde la rama predeterminada o fija una versión mediante un tag/commit:

```bash
npm install "git+ssh://git@github.com/miguelcespedes/kroma-ui-component-library.git"
# Recomendado para despliegues reproducibles:
npm install "git+ssh://git@github.com/miguelcespedes/kroma-ui-component-library.git#v1.0.0"
```

Importa los estilos una vez desde la hoja global de la aplicación. El módulo registra el Web Component `kroma-chat` y expone su API y tipos:

```ts
import "@kroma/ui-component-library/chat/styles.css";
import { KromaChat } from "@kroma/ui-component-library/chat";

const chat = document.createElement("kroma-chat") as KromaChat;
chat.setAttribute("chat-title", "Asistente Kroma");
document.querySelector("#chat")?.append(chat);
chat.addMessage({ author: "assistant", type: "text", text: "Hola." });
chat.addEventListener("kroma-chat-send", (event) => {
  console.log((event as CustomEvent<{ message: string }>).detail.message);
});
```

En Next.js, importa el CSS desde `app/layout.tsx`, pero carga el módulo del componente con `import()` dentro de `useEffect` para que `HTMLElement` no se evalúe durante SSR. El ejemplo completo de App Router, eventos, cleanup, actualización por tags/SHA y solución de problemas está en [`docs/GIT_INSTALLATION.md`](docs/GIT_INSTALLATION.md).

### Controles y mensajes del chat

Las tarjetas y controles del chat no se importan ni se montan por separado: son renderers internos de `<kroma-chat>`. La API pública es `addMessage(ChatMessage)`; el campo `type` elige qué renderer se muestra. El host escucha las selecciones, aplica la lógica de negocio y agrega la respuesta siguiente.

```ts
import type { ChatMessage, KromaChat } from "@kroma/ui-component-library/chat";

const chat = document.querySelector<KromaChat>("kroma-chat")!;
const messages: ChatMessage[] = [
  {
    author: "assistant",
    type: "quick-replies",
    text: "¿Qué necesitas?",
    replies: [
      { id: "catalog", label: "Ver productos", value: "catalog" },
      { id: "help", label: "Necesito ayuda", value: "help" },
    ],
  },
  {
    author: "assistant",
    type: "choice-list",
    text: "Elige una categoría",
    choices: [
      { id: "gas", title: "Gas", description: "Balones y recargas", value: "gas" },
      { id: "water", title: "Agua", description: "Bidones y botellas", value: "water" },
    ],
  },
  {
    author: "assistant",
    type: "product-detail",
    product: {
      id: "gas-10kg",
      name: "Gas doméstico 10 kg",
      description: "Balón para uso doméstico",
      price: { amount: 55, currency: "PEN" },
    },
    quantity: 1,
    minimumQuantity: 1,
    maximumQuantity: 10,
    addActionLabel: "Agregar al pedido",
  },
  {
    author: "assistant",
    type: "conversational-form",
    text: "Déjanos tus datos",
    title: "Contacto",
    fields: [
      { id: "customer-name", name: "name", label: "Nombre", type: "text", required: true },
      { id: "customer-email", name: "email", label: "Correo", type: "email", required: true },
    ],
    submitLabel: "Continuar",
  },
];

messages.forEach((message) => chat.addMessage(message));
chat.addEventListener("kroma-chat-option-select", (event) => {
  const { value } = (event as CustomEvent<{ value: string }>).detail;
  // Aquí la aplicación decide el siguiente paso y llama a addMessage().
  console.log("Opción elegida:", value);
});
chat.addEventListener("kroma-chat-quantity-change", (event) => {
  const { productId, quantity } = (event as CustomEvent<{ productId?: string; quantity: number }>).detail;
  console.log("Actualizar cantidad en el estado del host:", productId, quantity);
});
chat.addEventListener("kroma-chat-action", (event) => {
  const { actionId, data } = (event as CustomEvent<{ actionId: string; data?: unknown }>).detail;
  console.log("Procesar acción comercial:", actionId, data);
});
chat.addEventListener("kroma-chat-form-submit", (event) => {
  const { values } = (event as CustomEvent<{ values: Record<string, string> }>).detail;
  console.log("Validar/enviar datos desde la aplicación:", values);
});
```

Los `type` disponibles incluyen `text`, `status`, `rich`, `quick-replies`, `choice-list`, `journey-menu`, `category-picker`, `product-card`, `product-list`, `product-carousel`, `product-detail`, `product-variant-selector`, `quantity-selector`, `cart-summary`, `conversational-form`, `order-review` y `confirmation`. `options` es el alias legado de `quick-replies`. Los contratos `ChatProduct`, `ChatCartItem`, `ChatFormField`, `ChatMoney` y los tipos de cada mensaje también se exportan desde `/chat`.

Los controles notifican interacciones mediante eventos DOM (`kroma-chat-option-select`, `kroma-chat-action`, `kroma-chat-quantity-change` y `kroma-chat-form-submit`, entre otros); **no** gestionan carrito, precios, navegación, persistencia ni llamadas al backend. Consulta el [contrato completo de KromaChat](src/components/chat/README.md) para la lista de métodos, atributos y detalles de eventos.

## Capas

| Ruta | Responsabilidad |
| --- | --- |
| `src/themes/<theme>/_tokens.scss` | Valores primitivos Sass y mapas `shared`, `light`, `dark`. |
| `src/themes/<theme>/_semantic-{light,dark}.scss` | Mapas de roles cromáticos Kroma, sin Bootstrap ni layout. |
| `src/design-system/_runtime.scss` | Publicación de `--kroma-ref-*`, `--kroma-color-*`, colores `on-*` calculados por contraste y contratos de componentes. |
| `src/adapters/bootstrap/_adapter.scss` | Traducción de roles a variables y propiedades Bootstrap verificadas en `compatibility.json`. |
| `src/adapters/bootstrap/themes/<theme>/` | Adaptaciones de variables y componentes Bootstrap por tema; sin selectores `.bd-*` del catálogo. |
| `src/themes/<theme>/theme.scss` | CSS runtime de cada marca; nunca importa Bootstrap. |
| `src/cheatsheet/app.scss` | Única compilación completa Bootstrap y estilos propios del catálogo. |
| `src/components/theme-dropdown/` | Carga transaccional de assets CSS de marca: valida reglas, confirma tema y persiste solo al final; Bootstrap base no carga ningún asset Kroma. |
| `src/components/contrast-dropdown/` | Traducción de `auto` a `data-bs-theme=light/dark`; responde a la preferencia del sistema. |
| `src/components/color-token-palette/` | Visualización de primitivas específicas y semántica del contraste efectivo. |

Los roles visuales no incluyen el modo en su nombre: el selector de tema y contraste decide su valor. No existe correspondencia uno a uno entre primitivas y roles. `data-kroma-theme` expresa identidad; `data-bs-theme` expresa contraste resuelto.

## Inventario y compilación

`scripts/generate-theme-tokens.mjs` usa el evaluador Dart Sass de la dependencia instalada: captura los mapas después de evaluar referencias y aliases, valida los colores semánticos y emite `theme-tokens.ts` con tipos explícitos. `scripts/generate-theme-manifest.mjs` descubre `theme.scss` y genera URLs de assets CSS; Vite los emite como `dist/themes/<theme>.css`. No se incrustan compilaciones de Bootstrap en JavaScript.

```bash
npx tsc --noEmit
npm run test:theme-layers
npm run build:debug
npm run test:theme-browser
npm run test:theme-browser:all
npm run test:negative
npm run metrics:architecture
npm run build:min
git diff --check -- .
```

`build:debug` y `build:min` borran `dist` antes de generar; ejecutar `build:debug` al final para conservar los artefactos debug versionados. El test arquitectónico compila en memoria y compara roles del catálogo con CSS efectivo. La prueba browser levanta temporalmente `vite preview` y prueba tres navegadores, tres viewports, tres temas, tres modos, estados hover/active, accesibilidad, fixture, movimiento reducido y fallos/concurrencia del selector de temas.

## Integración con Bootstrap

La matriz `src/adapters/bootstrap/compatibility.json` distingue variables globales de las locales (`.btn-primary`, `.card`, `.dropdown-menu`, `.table`) y de propiedades compiladas desde Sass (`.form-control` y `.form-select`). No asumir que una custom property `--bs-*` arbitraria sea consumida por Bootstrap. Los overrides de componentes deben ser acotados a las marcas Kroma y no afectar `data-kroma-theme=bootstrap`.

Los estilos nuevos del cheatsheet se definen en `src/cheatsheet/app.scss`, consumiendo roles Kroma con fallback Bootstrap. El sidebar ocupa la columna `.bd-sidebar` del grid; `.bd-aside` es solo contenido. Poner el fondo únicamente en el acordeón o usar pseudo-elementos `100vw` no pinta toda la columna y puede provocar scroll interno. Validar el área completa en desktop y móvil mediante estilos computados, no solo con un build correcto.

No introducir `@layer` solo en CSS Kroma dejando Bootstrap sin capa: reglas sin capa ganarían sobre declaraciones normales dentro de capas. Una adopción futura requerirá integrar y comprobar Bootstrap, adaptador y cheatsheet juntos, incluidos estilos `!important`.

## Estado de la migración

Los selectores propios del catálogo (`.bd-*`, `.scrollspy-example`) se concentran en `src/cheatsheet/app.scss` y consumen `--kroma-*` con fallback Bootstrap. `src/adapters/bootstrap/themes/` conserva únicamente adaptaciones de variables y componentes Bootstrap por tema. La semántica canónica en `src/themes/` y el runtime de `src/design-system/` no dependen de Bootstrap.

## Contrato de temas y tokens

Cada tema declara primitivas en `_tokens.scss` y roles en `_semantic-{light,dark}.scss`. El runtime publica, además de colores, tokens estables de tipografía (`--kroma-font-*`), espaciado (`--kroma-space-*`), forma (`--kroma-radius-*`), elevación (`--kroma-elevation-*`), movimiento (`--kroma-motion-*`), estados interactivos de botón, colores legibles y scrollbar. Los adaptadores por tema pueden seguir afinando componentes, pero el adaptador compartido es genérico: aplica a cualquier `data-kroma-theme` distinto de `bootstrap`.

La matriz `compatibility.json` declara componente, scope, fuente Kroma, destino Bootstrap, estado, mecanismo y estrategia de expansión. `npm run test:theme-layers` compila el adaptador, comprueba que cada mapping llega a una declaración real, que cada destino `--bs-*` existe en Bootstrap 5.3.8 y que no quedan selectores raíz inalcanzables.

`src/themes/kroma-certification/` es un fixture: `theme.json` lo excluye del manifiesto y del catálogo, pero se compila en los tests para demostrar que un tema nuevo funciona sin tocar el adaptador. La prueba browser lo inyecta, valida light/dark y verifica que un tema no registrado no hereda tokens Kroma.

## CI

`.github/workflows/quality.yml` ejecuta TypeScript, arquitectura y pruebas negativas de compatibilidad, builds, matriz Playwright (Chromium, Firefox y WebKit), métricas y whitespace. El workflow de Pages usa esa verificación como job previo antes de desplegar. `metrics/architecture-baseline.json` fija el baseline en `945129a`; las métricas comparan contra ese archivo, no contra `HEAD`.
