# Kroma UI Component Library

Kroma es un sistema de diseño con tokens propios; Bootstrap 5.3.8 implementa los componentes del cheatsheet mediante un adaptador. La aplicación de documentación sigue siendo privada (`package.json` tiene `private: true`). No hay exports npm.

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
| `src/components/theme-dropdown/` | Carga de assets CSS de marca con intercambio después de `load`; Bootstrap base no carga ningún asset Kroma. |
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

`build:debug` y `build:min` borran `dist` antes de generar; ejecutar `build:debug` al final para conservar los artefactos debug versionados. El test arquitectónico compila en memoria y compara roles del catálogo con CSS efectivo. La prueba browser levanta temporalmente `vite preview` y prueba tres viewports, tres temas, tres modos y un cambio de preferencia del sistema.

## Integración con Bootstrap

La matriz `src/adapters/bootstrap/compatibility.json` distingue variables globales de las locales (`.btn-primary`, `.card`, `.dropdown-menu`, `.table`) y de propiedades compiladas desde Sass (`.form-control` y `.form-select`). No asumir que una custom property `--bs-*` arbitraria sea consumida por Bootstrap. Los overrides de componentes deben ser acotados a las marcas Kroma y no afectar `data-kroma-theme=bootstrap`.

Los estilos nuevos del cheatsheet se definen en `src/cheatsheet/app.scss`, consumiendo roles Kroma con fallback Bootstrap. El sidebar ocupa la columna `.bd-sidebar` del grid; `.bd-aside` es solo contenido. Poner el fondo únicamente en el acordeón o usar pseudo-elementos `100vw` no pinta toda la columna y puede provocar scroll interno. Validar el área completa en desktop y móvil mediante estilos computados, no solo con un build correcto.

No introducir `@layer` solo en CSS Kroma dejando Bootstrap sin capa: reglas sin capa ganarían sobre declaraciones normales dentro de capas. Una adopción futura requerirá integrar y comprobar Bootstrap, adaptador y cheatsheet juntos, incluidos estilos `!important`.

## Estado de la migración

Los selectores propios del catálogo (`.bd-*`, `.scrollspy-example`) se concentran en `src/cheatsheet/app.scss` y consumen `--kroma-*` con fallback Bootstrap. `src/adapters/bootstrap/themes/` conserva únicamente adaptaciones de variables y componentes Bootstrap por tema. La semántica canónica en `src/themes/` y el runtime de `src/design-system/` no dependen de Bootstrap.

## Contrato de temas y tokens

Cada tema declara primitivas en `_tokens.scss` y roles en `_semantic-{light,dark}.scss`. El runtime publica, además de colores, tokens estables de tipografía (`--kroma-font-*`), espaciado (`--kroma-space-*`), forma (`--kroma-radius-*`), elevación (`--kroma-elevation-*`) y movimiento (`--kroma-motion-*`). Los adaptadores por tema pueden seguir afinando componentes, pero el adaptador compartido es genérico: aplica a cualquier `data-kroma-theme` distinto de `bootstrap`.

La matriz `compatibility.json` declara componente, scope, fuente Kroma, destino Bootstrap, estado, mecanismo y estrategia de expansión. `npm run test:theme-layers` compila el adaptador, comprueba que cada mapping llega a una declaración real y que cada destino `--bs-*` existe en Bootstrap 5.3.8.

`src/themes/kroma-certification/` es un fixture: `theme.json` lo excluye del manifiesto y del catálogo, pero se compila en los tests para demostrar que un tema nuevo funciona sin tocar el adaptador. La prueba browser lo inyecta, valida light/dark y verifica que un tema no registrado no hereda tokens Kroma.

## CI

`.github/workflows/quality.yml` ejecuta TypeScript, arquitectura y pruebas negativas de compatibilidad, builds, matriz Playwright (Chromium, Firefox y WebKit), métricas y whitespace. El workflow de Pages usa esa verificación como job previo antes de desplegar. `metrics/architecture-baseline.json` fija el baseline en `945129a`; las métricas comparan contra ese archivo, no contra `HEAD`.