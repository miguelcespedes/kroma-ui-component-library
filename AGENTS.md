# AGENTS.md — Kroma UI Component Library

## Comandos

Ejecutar desde la raíz de este repositorio:

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

- Las builds limpian `dist`; `build:debug` genera `main.js`, `style.debug.css`, mapas y assets CSS de temas; `build:min` genera `main.min.js`, `style.min.css` y CSS de temas.
- `dist/` está versionado. Regenerarlo al cambiar cualquier fuente del bundle. Ejecutar `build:debug` al final si se desean conservar artefactos debug.
- No levantar `dev` ni `start` salvo solicitud explícita; las pruebas browser solicitadas usan un preview temporal.
- Sass/Bootstrap pueden emitir advertencias de deprecación; un código de salida distinto de cero es error.

## Responsabilidades

- `src/themes/<theme>/_tokens.scss`: primitivas y aliases Sass; nunca nombres `--bs-*`, selectores de componentes ni de cheatsheet.
- `src/themes/<theme>/_semantic-light.scss` y `_semantic-dark.scss`: roles canónicos de Kroma, sin Bootstrap ni layout de aplicación.
- `src/design-system/_runtime.scss`: publica `--kroma-ref-*`, `--kroma-color-*` y contratos visuales de componentes; no depende de Bootstrap ni del cheatsheet.
- `src/adapters/bootstrap/_adapter.scss`: traduce contratos Kroma a API CSS Bootstrap real y overrides acotados de componentes. La matriz de compatibilidad vive en `compatibility.json`.
- `src/adapters/bootstrap/themes/<theme>/`: adaptaciones de los themes existentes; no contienen selectores `.bd-*` del cheatsheet. No agregar aquí nuevas reglas `.bd-*`: su destino es `src/cheatsheet/app.scss` y deben consumir `--kroma-*`.
- `src/themes/<theme>/theme.scss`: compone tokens, semántica y adaptaciones; **no importa Bootstrap**. Vite emite un CSS ligero por theme.
- `src/cheatsheet/app.scss`: única compilación completa de Bootstrap 5.3.8 y estilos del catálogo.
- `src/cheatsheet/app.ts`: inicialización de componentes; `theme-dropdown` carga el CSS activo, `contrast-dropdown` resuelve `auto` a light/dark.
- `scripts/generate-theme-tokens.mjs`: evalúa los mapas Sass con Dart Sass (no inferir roles por nombres ni parsear expresiones Sass con regex).

El cheatsheet sigue siendo privado; no añadir exports npm ni infraestructura de publicación sin autorización. El núcleo Kroma no debe importar el cheatsheet ni usar nombres de Bootstrap como API propia. `data-kroma-theme` identifica marca y `data-bs-theme` solo contraste resuelto. Bootstrap nativo no recibe overrides de Kroma.

## Cambios y seguridad

- Las cabeceras `[INSTRUCCIONES PARA AGENTES/LLM - CONSERVAR]` expresan el contrato de su archivo; actualizar su texto si se modifica su responsabilidad, no dejarlas obsoletas.
- No editar `node_modules/bootstrap` ni archivos fuera del repositorio.
- Antes de modificar un tema, leer sus cabeceras y validar el impacto en light y dark.
- No hacer commit, push ni PR salvo petición explícita; revisar `git status --short` y `git diff --check -- .`.
- Las pruebas de build y arquitectura no sustituyen a la verificación en navegador de computed styles, selector activo y estados visuales.
- No colocar únicamente CSS Kroma en `@layer` mientras Bootstrap permanezca sin capa; documentar y ensayar cualquier adopción futura de Cascade Layers de forma integral.

## Contratos nuevos

- El adaptador compartido es genérico (`[data-kroma-theme]:not([data-kroma-theme="bootstrap"])`); no debe nombrar temas. Los nombres de tema pertenecen a `src/themes/`.
- `src/themes/<theme>/theme.json` puede marcar `fixture: true`; esos temas se excluyen del manifiesto y del catálogo, pero deben compilar y pasar el contrato.
- `src/design-system/_runtime.scss` publica tokens de tipografía, espaciado, forma, elevación y movimiento además de color. Todo tema debe aportar las primitivas correspondientes.
- `src/adapters/bootstrap/compatibility.json` es un contrato verificado: component, scope, mechanism, expansion y mappings source/target/state. Cada destino `--bs-*` debe existir en Bootstrap 5.3.8.
- `scripts/report-architecture-metrics.mjs` compara contra `metrics/architecture-baseline.json`, no contra `HEAD`. Actualizar el baseline solo con autorización explícita.
- `scripts/test-theme-browser.mjs` usa `os.tmpdir()` y `KROMA_BROWSERS`/`--all`; no introducir rutas absolutas de usuario.