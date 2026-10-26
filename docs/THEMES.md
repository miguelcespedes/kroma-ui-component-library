# Temas Kroma: uso y creación

Esta guía cubre el contrato de temas y su uso tanto en aplicaciones consumidoras como dentro del cheatsheet. Un tema define una identidad de marca y sus roles; el atributo de contraste selecciona el modo claro u oscuro.

## Usar un tema incluido

En aplicaciones instaladas desde Git, importa `@kroma/ui-component-library/chat/styles.css` una vez. Esa salida incluye KromaChat, Inter Variable, simple-keyboard y las hojas de los temas públicos actuales. Después, establece la identidad y el contraste en el elemento raíz:

```html
<html lang="es" data-kroma-theme="kroma-entrepreneur" data-bs-theme="light">
```

Temas públicos actuales:

| ID | Identidad |
| --- | --- |
| `dracula` | Paleta Dracula |
| `kroma-entrepreneur` | Marca Kroma Entrepreneur |
| `bootstrap` | Fallback de la aplicación; no activa overrides de marca del adaptador |

Contraste disponible: `data-bs-theme="light"` o `data-bs-theme="dark"`. Cambiar `data-kroma-theme` no implica cambiar el contraste y viceversa. En KromaChat, las superficies y el contenido consumen los roles activos; también se adaptan los componentes Bootstrap cubiertos por el adaptador cuando Bootstrap CSS está presente.

`data-bs-theme="auto"` no es un modo CSS resuelto de los temas. El selector del cheatsheet interpreta la preferencia del sistema y escribe `light`/`dark`; una aplicación consumidora que ofrezca “auto” debe resolver `matchMedia("(prefers-color-scheme: dark)")` y actualizar el atributo.

## Modelo de capas

Los temas se mantienen desacoplados en tres capas. Los nombres Bootstrap, selectores de componentes y reglas de layout no pertenecen a los tokens ni a la semántica.

| Archivo | Responsabilidad | Evitar |
| --- | --- | --- |
| `src/themes/<id>/_tokens.scss` | Primitivas Sass disponibles como compartidas, claras u oscuras; aliases de primitivas | `--bs-*`, selectores CSS, nombres de componentes, layout |
| `src/themes/<id>/_semantic-light.scss` y `_semantic-dark.scss` | Asignar significado a primitivas mediante roles canónicos Kroma | Bootstrap, layout, inferir roles por regex/nombres |
| `src/themes/<id>/theme.scss` | Componer imports en el orden tokens → semántica → adaptaciones del tema → runtime Kroma; emitir variables con `kroma-mode()` | Bootstrap completo, cheatsheet, reglas de página |
| `src/adapters/bootstrap/themes/<id>/_light.scss` y `_dark.scss` | Adaptaciones de componentes/variables Bootstrap específicas de la marca, si se necesitan | Selectores `.bd-*` del catálogo |
| `src/adapters/bootstrap/_adapter.scss` | Contrato compartido genérico para temas no Bootstrap | Nombres de temas concretos |

El runtime `src/design-system/_runtime.scss` publica roles y dimensiones visuales: color, tipografía, espaciado, radios, elevación, movimiento, acciones y estados legibles. El adaptador de Bootstrap traduce esos contratos a variables reales y scopes comprobados en `compatibility.json`.

## Crear un tema público

### 1. Crear los archivos

Usa un ID en kebab-case, por ejemplo `acme-store`, y crea:

```text
src/themes/acme-store/
  _tokens.scss
  _semantic-light.scss
  _semantic-dark.scss
  theme.scss
  theme.json                 # opcional
src/adapters/bootstrap/themes/acme-store/
  _light.scss                # opcional si requiere ajustes Bootstrap específicos
  _dark.scss                 # opcional si requiere ajustes Bootstrap específicos
```

El tema de certificación demuestra que los archivos de entrada y mapas pueden compilar sin una adaptación específica de Bootstrap.

### 2. Definir primitivas Sass

En `_tokens.scss`, define los mapas `$primitive-shared`, `$primitive-light` y `$primitive-dark`. Las primitivas se pueden compartir cuando el mismo valor sirve para ambos modos o mantenerse específicas del modo. Declara también los aliases Sass que usarán los mapas semánticos.

Cada tema debe aportar primitivas para estas dimensiones (el contrato verifica sus aliases CSS compilados en ambos modos):

| Familia | Claves esperadas en `$primitive-shared` |
| --- | --- |
| Tipografía | `font-family-system`, `font-size-100`, `font-weight-400`, `font-weight-600`, `font-weight-700`, `line-height-normal` |
| Espaciado | `space-1`, `space-2`, `space-3`, `space-4` |
| Forma | `radius-sm`, `radius-md`, `radius-lg` |
| Elevación | `shadow-1`, `shadow-2` |
| Movimiento | `duration-fast`, `duration-normal`, `easing-standard`, `easing-emphasized` |

Además, cada modo debe definir sus primitivas de color necesarias. Mantén los nombres como valores primitivos; asigna su función en la capa semántica, no en el nombre del token.

### 3. Definir los roles light y dark

Los dos mapas semánticos deben proporcionar estos once roles cromáticos, todos Sass colors:

```scss
$theme-semantic-light-color-tokens: (
  "primary": $brand-primary,
  "link": $brand-link,
  "success": $brand-success,
  "info": $brand-info,
  "warning": $brand-warning,
  "danger": $brand-danger,
  "body": $canvas,
  "surface": $surface,
  "content": $content,
  "muted-content": $muted-content,
  "border": $border
);
```

Repite el mapa en `_semantic-dark.scss` con los valores del modo oscuro. Los nombres canónicos requeridos son `primary`, `link`, `success`, `info`, `warning`, `danger`, `body`, `surface`, `content`, `muted-content` y `border`. El runtime deriva, entre otros, `--kroma-color-surface-canvas`, `--kroma-color-surface-raised`, colores `on-*`, colores legibles, y contratos de botones, tarjetas e inputs. No codifiques estos roles en el adaptador compartido.

### 4. Componer la entrada del tema

El orden de imports es parte del contrato. Ejemplo sin adaptación específica de Bootstrap:

```scss
@import "./tokens";
@import "./semantic-light";
@import "./semantic-dark";
@import "../../design-system/runtime";

[data-kroma-theme="acme-store"] {
  @include kroma-mode(light, $theme-semantic-light-color-tokens, $primitive-light, $primitive-shared);
  @include kroma-mode(dark, $theme-semantic-dark-color-tokens, $primitive-dark, $primitive-shared);
}
```

Si la marca necesita adaptaciones específicas de componentes Bootstrap, importa las hojas de adaptación light/dark entre semántica y runtime, tal como hacen `dracula/theme.scss` y `kroma-entrepreneur/theme.scss`. No importes `bootstrap/scss/bootstrap` desde el tema: la única compilación completa de Bootstrap pertenece a `src/cheatsheet/app.scss`.

Las reglas emitidas por un tema deben estar bajo su scope `[data-kroma-theme="acme-store"]`, incluyendo ambos valores `data-bs-theme`. No crees selectores globales que afecten a `data-kroma-theme="bootstrap"`.

### 5. Registrar etiqueta o marcar un fixture

`theme.json` es opcional. Su propiedad `label` cambia el nombre mostrado por el selector del cheatsheet; por omisión, se deriva del ID:

```json
{
  "label": "Acme Store"
}
```

Un tema de prueba puede quedar fuera del selector y del catálogo generado con:

```json
{
  "fixture": true,
  "description": "Tema usado solo en certificación automática."
}
```

Todo directorio con `theme.scss` se compila y valida. Los temas con `fixture: true` se excluyen del manifiesto público y de la paleta del cheatsheet, pero siguen sujetos al contrato de compilación.

### 6. Generar y validar

Desde la raíz del repositorio:

```bash
node scripts/generate-theme-manifest.mjs
node scripts/generate-theme-tokens.mjs
npm run test:theme-layers
npx tsc --noEmit
npm run build:debug
npm run test:theme-browser:all
```

El manifiesto descubre `theme.scss`, omite fixtures y genera la lista de hojas cargables. El generador de tokens evalúa los mapas con Dart Sass y produce `theme-tokens.ts`; no edites manualmente esos archivos generados ni intentes inferir roles por nombres/reglas regex. `theme-layers` valida roles, dimensiones, scopes, Sass compilado, adaptador y compatibilidad Bootstrap. La prueba de navegador debe comprobar light y dark, selector activo, estilos computados, estados y recursos cargados.

Si el nuevo tema debe distribuirse con KromaChat, añade su import explícito a `src/library/chat/styles.scss` y vuelve a ejecutar `npm run build:lib`. El generador del cheatsheet y el bundle del paquete tienen entradas distintas; que el tema aparezca en el catálogo no basta para incluirlo en el CSS distribuido.

No actualices `metrics/architecture-baseline.json` para hacer pasar las métricas salvo autorización explícita. No hagas que el adaptador compartido nombre `acme-store`: las marcas viven en `src/themes/` y en sus adaptaciones específicas.

## Selector y paleta del cheatsheet

El cheatsheet tiene tres herramientas de inspección, no exportadas como componentes de la API Git:

- **Theme dropdown** cambia `data-kroma-theme`, carga la hoja de marca de forma transaccional y persiste la selección localmente.
- **Contrast dropdown** interpreta `auto` y resuelve a `data-bs-theme="light"` o `"dark"` según `prefers-color-scheme`.
- **Color token palette** muestra primitivas y roles Sass evaluados del tema/mode activos.

En una app consumidora, cambia los atributos con el router/estado de la aplicación o crea tus propios controles. La hoja del paquete contiene los estilos de los temas incluidos, pero no el código de esos dropdowns/paleta del cheatsheet.

## Arquitectura relacionada

- `src/design-system/_runtime.scss`: contrato de tokens Kroma, sin Bootstrap.
- `src/adapters/bootstrap/compatibility.json`: matriz verificable de mappings, scopes y estados; cada `--bs-*` de destino debe existir en Bootstrap 5.3.8.
- `src/cheatsheet/app.scss`: una sola compilación completa de Bootstrap y estilos del catálogo.
- `src/themes/<id>/theme.scss`: salida CSS runtime ligera por tema para Pages.
- `src/library/chat/styles.scss`: conjunto de estilos que se integra al paquete de KromaChat.

No uses `@layer` solo para CSS Kroma mientras Bootstrap siga sin capa. Revisa [`README.md`](../README.md) para arquitectura general y [`COMPONENTS.md`](COMPONENTS.md) para integrarlo en una aplicación.
