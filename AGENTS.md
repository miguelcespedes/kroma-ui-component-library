# AGENTS.md — guía local del componente

Esta carpeta contiene una implementación Vite/TypeScript de Bootstrap 5.3.8 y un cheatsheet de componentes. Estas instrucciones complementan el `AGENTS.md` raíz; si existe un conflicto, prevalece la regla más específica de esta carpeta.

## Comandos

Ejecutar desde `docs/kroma-ui-component-library`:

```bash
npx tsc --noEmit
npm run test:theme-layers
npm run build:debug
npm run build:min
git diff --check -- .
```

- `build:debug` limpia `dist`, genera `main.js`, `style.debug.css` y sourcemaps.
- `build:min` limpia `dist`, genera `main.min.js` y `style.min.css`.
- `test:theme-layers` valida que cada capa SCSS respete su responsabilidad.
- Vite genera `src/components/theme-dropdown/themes-inventary.ts` al iniciar `dev` o cualquier build, a partir de las carpetas de `src/themes/`; no editar ese archivo manualmente.
- El build puede mostrar advertencias deprecadas de Sass/Bootstrap; debe terminar con código `0`.
- No levantar `dev` ni `start` salvo solicitud explícita.

## Estructura

```text
src/cheatsheet/                         # Entrada HTML, TypeScript y estilos del catálogo
  app.ts                                # Orquestación de la aplicación y theme de marca
src/components/contrast-dropdown/      # Componente Bootstrap del modo light/dark/auto
  contrast-dropdown.ts
  contrast-dropdown.scss
src/components/theme-dropdown/         # Componente Bootstrap del selector de theme
  theme-dropdown.ts
  theme-dropdown.scss
src/themes/kroma-entrepreneur/
  _tokens.scss                           # Primitivas del sistema visual
  _semantic-light.scss                   # Semántica clara y variables Sass base
  _semantic-dark.scss                    # Semántica dark y overrides runtime
  theme.scss                             # Entry point del tema
node_modules/bootstrap/scss/bootstrap.scss # Fuente oficial de Bootstrap
dist/                                    # Artefactos generados y versionados
```

El proyecto es una aplicación privada del cheatsheet, no un paquete npm distribuible. Vite genera directamente en `dist/` el `index.html`, `main.js` o `main.min.js`, el CSS del modo de build y sus sourcemaps de debug. Los themes fuente viven únicamente en `src/themes/`.

## Arquitectura SCSS

El orden obligatorio de `theme.scss` es:

```scss
@import "./tokens";
@import "./semantic-light";
@import "./semantic-dark";
@import "bootstrap/scss/bootstrap";
```

- `_tokens.scss` contiene únicamente primitivas: color, tipografía, espaciado y forma.
- `_semantic-light.scss` asigna significado claro y define las variables Sass que Bootstrap consume.
- `_semantic-dark.scss` define las variables Sass oficiales `*-dark` y los overrides CSS bajo `[data-bs-theme="dark"]`.
- Bootstrap debe importarse después de todas las variables Sass que consume.
- `src/cheatsheet/app.scss` importa directamente Bootstrap oficial para el catálogo base.
- Cada `src/themes/<theme>/theme.scss` debe importar Bootstrap después de sus capas semánticas para generar su propia compilación completa.
- `src/cheatsheet/app.scss` compone Bootstrap nativo y los estilos generales de la aplicación; no debe importar themes de marca.
- `theme-dropdown.ts` activa el stylesheet inline del theme seleccionado mediante `#kroma-theme-stylesheet`.
- Los archivos semánticos pueden usar primitivas de `_tokens.scss`, pero no deben importar otras capas.
- Los tokens de tablas `--bs-table-*` deben mantenerse en las capas semánticas porque Bootstrap los utiliza directamente.
- No editar `node_modules/bootstrap`.
- No crear nuevas capas SCSS ni mover responsabilidades sin autorización explícita.

## Tema Y Modo

- `data-kroma-theme` identifica la variante de marca o sistema visual.
- `data-bs-theme` controla únicamente `light`, `dark` o el modo resuelto por `auto`.
- No usar el nombre de una variante de marca como valor de `data-bs-theme`.
- Las variables Sass `*-dark` deben declararse antes de importar Bootstrap.
- Los overrides CSS dark deben reutilizar las primitivas existentes, evitar colores literales duplicados y estar limitados a `[data-kroma-theme="kroma-entrepreneur"][data-bs-theme="dark"]`.

## Agentes Y Documentación

- Las cabeceras marcadas como `[INSTRUCCIONES PARA AGENTES/LLM - CONSERVAR]` son parte del contrato de cada capa. No borrarlas, resumirlas ni moverlas.
- Antes de cambiar una capa, leer su cabecera y respetar sus límites.
- No añadir comentarios de implementación fuera de los solicitados o de estas cabeceras.
- Mantener la documentación agnóstica: debe poder copiarse a otro tema sustituyendo sus primitivas y semántica.

## Cambios Y Verificación

- No incluir en un commit cambios fuera de `docs/kroma-ui-component-library` salvo solicitud explícita.
- Si cambia una fuente que afecta al bundle, regenerar `dist` con el build correspondiente.
- Antes de afirmar que el cambio funciona, ejecutar al menos `npx tsc --noEmit` y el build relacionado.
- Revisar `git status --short` para confirmar que no se mezclaron cambios ajenos.
