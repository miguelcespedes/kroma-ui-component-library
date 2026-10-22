# Kroma UI Component Library

Kroma UI Component Library es una implementación Vite/TypeScript de Bootstrap 5.3.8 que reúne componentes reutilizables, estilos y un cheatsheet visual para validar el sistema de interfaz de Kroma.

La biblioteca separa la implementación de Bootstrap de la identidad visual. Los temas definen las primitivas y la semántica de marca; Bootstrap aporta los componentes y utilidades.

El proyecto es privado y se consume como una aplicación del cheatsheet, no como un paquete npm. La salida de Vite se genera directamente en `dist/`; no se mantienen exports de CSS, JavaScript o SCSS que no existan físicamente.

## Estructura De Temas

- `src/themes/kroma-entrepreneur/_tokens.scss`: primitivas de color, tipografía, espaciado y forma.
- `src/themes/kroma-entrepreneur/_semantic-light.scss`: semántica clara y variables Sass que Bootstrap consume.
- `src/themes/kroma-entrepreneur/_semantic-dark.scss`: variables Sass `*-dark` y overrides CSS del modo oscuro.
- `src/themes/kroma-entrepreneur/theme.scss`: entrypoint y composición del tema.
- `src/themes/dracula/`: implementación experimental del theme Dracula basada en su paleta oficial.
- `src/themes/bootstrap.scss`: entrypoint de Bootstrap oficial sin personalizaciones Kroma.
- `src/cheatsheet/app.scss`: compositor CSS de la aplicación; importa Bootstrap oficial y los estilos generales del cheatsheet.
- `src/components/contrast-dropdown/`: componente Bootstrap encapsulado del combo `light`/`dark`/`auto`.
- `src/components/theme-dropdown/`: componente Bootstrap del selector de theme.
- `src/themes/.gitkeep`: marcador versionado de la carpeta de temas.

## Crear Un Theme

Este proyecto está diseñado para que un agente o desarrollador pueda crear una nueva identidad visual sin modificar la aplicación base. Cuando recibas la instrucción "crea un nuevo theme", interpreta que debes crear una variante independiente dentro de `src/themes/<nombre>/`, reutilizar Bootstrap como motor de componentes y cambiar únicamente sus primitivas y capas semánticas. No copies overrides específicos de otro theme sin revisar sus tokens y selectores.

1. Crea una carpeta en `src/themes/` con el nombre de la variante visual.
2. Añade `_tokens.scss` con las primitivas propias del sistema visual.
3. Añade `_semantic-light.scss` para asignar significado a esas primitivas y definir las variables Sass que Bootstrap consume.
4. Añade `_semantic-dark.scss` para declarar las variables `*-dark` antes de Bootstrap y los overrides bajo `[data-bs-theme="dark"]`.
5. Crea `theme.scss` como entrypoint.
6. Importa Bootstrap al final de `theme.scss`.
7. El inventario se actualizará automáticamente al iniciar `dev` o un build.

Los archivos semánticos pueden usar tokens, pero no deben importar otras capas semánticas. No importes Bootstrap antes de declarar las variables que Bootstrap consume.

El resultado debe poder seleccionarse desde el dropdown de themes sin cambiar `app.ts`, `app.scss`, los componentes compartidos ni `node_modules`. El límite del sistema es la estructura y la API de componentes de Bootstrap; dentro de ese límite, cada theme puede tener una paleta, tipografía, superficies, bordes, radios, estados y tratamiento dark completamente diferentes.

### Flujo Recomendado

1. Define primero la paleta y las primitivas reutilizables en `_tokens.scss`.
2. Asigna significado en `_semantic-light.scss`: `primary`, superficies, contenido, bordes y variables de componentes.
3. Declara en `_semantic-dark.scss` las variables oficiales `*-dark` antes del import de Bootstrap.
4. Añade overrides runtime únicamente dentro del selector completo del tema y del modo.
5. Prefiere variables Sass oficiales de Bootstrap para componentes completos; usa CSS runtime solo cuando el componente dependa del modo resuelto en el navegador.
6. Regenera `dist` después de modificar una fuente que participe en el bundle.

La separación entre primitivas y semántica permite cambiar el sistema visual sin reescribir cada componente. Por ejemplo, un token azul puede asignarse a `$primary` en light y a una superficie o borde distinto en dark sin duplicar colores literales en los componentes.

## EntryPoint Del Theme

`theme.scss` debe cargar las capas en este orden:

```scss
@import "./tokens";
@import "./semantic-light";
@import "./semantic-dark";
@import "bootstrap/scss/bootstrap";
```

`app.scss` carga Bootstrap nativo. `theme-dropdown.ts` carga el stylesheet inline del theme seleccionado en `#kroma-theme-stylesheet`; `app.ts` solo orquesta la aplicación y los componentes.

Las variables Sass deben existir antes de importar Bootstrap. Los overrides CSS runtime se aplican mediante `data-bs-theme="light"` o `data-bs-theme="dark"`.

`data-kroma-theme` identifica la variante de marca. No debe utilizarse como valor de `data-bs-theme`, que solo controla el modo `light` o `dark`.

## Aislamiento De Modos

Los overrides de modo deben estar limitados a ambos atributos:

```scss
[data-kroma-theme="mi-theme"][data-bs-theme="dark"] {
  --bs-body-bg: #{$surface-canvas-dark};
  --bs-body-color: #{$content-primary-dark};
}
```

No uses selectores globales como `.dark`, `body.dark` o `[data-bs-theme="dark"]` sin el identificador del theme. Así, un theme no contamina Bootstrap nativo ni otras variantes. El modo `auto` debe resolverse a `light` o `dark` por el componente de contraste; los themes solo consumen el modo resultante.

## Componentes Y Estados

Para personalizar un componente Bootstrap, sigue este orden:

- Define la variable Sass oficial antes de importar Bootstrap cuando exista, por ejemplo `$accordion-button-active-bg`.
- Define las variables CSS runtime del componente dentro del selector dark o light cuando el valor dependa del modo.
- Añade un override de clase solo si Bootstrap no expone una variable suficiente.
- Incluye estados `hover`, `focus`, `active` y `disabled` cuando el componente sea interactivo.

Los botones secundarios son un ejemplo de override runtime acotado:

```scss
[data-kroma-theme="mi-theme"][data-bs-theme="dark"] .btn-secondary {
  --bs-btn-color: #{$white};
  --bs-btn-bg: #{$blue-dark-700};
  --bs-btn-border-color: #{$blue-dark-600};
}
```

Los pseudo-elementos SVG con `content: url(...)` no siempre heredan visualmente `color`. En esos casos, usa el filtro o el recurso SVG apropiado dentro del selector del modo, sin modificar el SVG global ni el modo light.

## Scrollbars

Las barras nativas deben resolverse con CSS, no con JavaScript ni con un componente visual paralelo. Usa `::-webkit-scrollbar` para Chromium/WebKit y `scrollbar-color` como fallback para Firefox. No combines ambos mecanismos sin una feature query: en navegadores que soportan `scrollbar-color`, sus valores pueden sobrescribir los pseudo-elementos WebKit.

```scss
[data-kroma-theme="mi-theme"][data-bs-theme="dark"] {
  @supports selector(::-webkit-scrollbar) {
    html::-webkit-scrollbar,
    body::-webkit-scrollbar,
    .scrollable-example::-webkit-scrollbar {
      width: .625rem;
      height: .625rem;
    }

    html::-webkit-scrollbar-track,
    body::-webkit-scrollbar-track,
    .scrollable-example::-webkit-scrollbar-track {
      background: $blue-dark-950;
    }

    html::-webkit-scrollbar-thumb,
    body::-webkit-scrollbar-thumb,
    .scrollable-example::-webkit-scrollbar-thumb {
      border: .125rem solid $blue-dark-950;
      border-radius: $radius-sm;
      background: $blue-dark-600;
    }
  }

  @supports not selector(::-webkit-scrollbar) {
    html,
    body,
    .scrollable-example {
      scrollbar-color: $blue-dark-600 $blue-dark-950;
      scrollbar-width: thin;
    }
  }
}
```

Incluye todos los contenedores que tengan `overflow: auto` o `overflow-y: auto`; personalizar solo `body` no afecta a un scroll interno como `.scrollspy-example`.

## Reglas

Conserva la estructura y sustituye las primitivas y las capas semánticas según la necesidad del sistema visual. No edites `node_modules/bootstrap`, no mezcles responsabilidades entre capas y regenera `dist` cuando cambie una fuente que afecte al bundle.

## Validar Responsabilidades

Ejecuta `npm run test:theme-layers` para comprobar que las capas respetan su contrato. El test falla indicando archivo y línea si, por ejemplo, se declara una primitiva de color fuera de `_tokens.scss`, se añade un import dentro de una capa o se altera el orden del entrypoint.

El contrato es el siguiente:

- `_tokens.scss` declara únicamente variables Sass primitivas y no genera selectores CSS.
- `_semantic-light.scss` asigna significado a los tokens y puede declarar variables CSS bajo `[data-kroma-theme="kroma-entrepreneur"][data-bs-theme="light"]`.
- `_semantic-dark.scss` declara únicamente variables Sass `*-dark` y variables CSS bajo `[data-kroma-theme="kroma-entrepreneur"][data-bs-theme="dark"]`.
- `theme.scss` solo compone las capas y Bootstrap mediante los cuatro imports obligatorios.
- Cada theme debe contener las tres capas semánticas obligatorias y `theme.scss`; el test verifica que no falte ninguna.
- La cobertura de componentes debe resolverse con variables Sass oficiales de Bootstrap y overrides runtime semánticos; `app.scss` no debe incorporar parches específicos de una marca.

Por ejemplo, el test debe rechazar `$brand-red: #ff0000;` dentro de `_semantic-light.scss`: el color debe vivir en `_tokens.scss` y la capa semántica debe consumirlo mediante una referencia como `$primary: $brand-red;`.

El theme Bootstrap no recibe estos overrides. Cuando el usuario selecciona `Bootstrap`, solo se cargan los estilos oficiales de Bootstrap 5.3.8; los overrides Kroma quedan inactivos porque requieren `data-kroma-theme="kroma-entrepreneur"`.

## Theme Dracula

Se añadió `src/themes/dracula/` como prueba de que la arquitectura puede reproducir una identidad visual externa sin cambiar la aplicación. La implementación usa la paleta oficial publicada por Dracula en [draculatheme.com/contribute](https://draculatheme.com/contribute):

| Rol Dracula | Color | Uso en el theme |
| --- | --- | --- |
| Background | `#282A36` | Canvas dark y superficies principales |
| Current Line | `#6272A4` | Secondary, controles y scrollbar |
| Selection | `#44475A` | Superficies elevadas y estados activos |
| Foreground | `#F8F8F2` | Texto principal |
| Red | `#FF5555` | Danger y validación negativa |
| Orange | `#FFB86C` | Acentos cálidos |
| Yellow | `#F1FA8C` | Warning y marcas |
| Green | `#50FA7B` | Success |
| Cyan | `#8BE9FD` | Info y enlaces |
| Purple | `#BD93F9` | Primary y selección |
| Pink | `#FF79C6` | Hover, enlaces y código |

El resultado confirma que los tokens actuales soportan una nueva identidad sin cambios de arquitectura. Fue suficiente crear las cuatro capas obligatorias y mapear la paleta Dracula a las variables oficiales de Bootstrap. Los valores derivados, como `--bs-primary-rgb` y `--bs-secondary-rgb`, se mantienen en la capa semántica porque Bootstrap los necesita para transparencias y estados.

La cobertura no debe limitarse a los colores principales. La implementación de Dracula sirve como matriz de aprendizaje para revisar, además, superficies, contenido, bordes, estados y componentes secundarios. Para cada nuevo theme hay que revisar explícitamente:

- Superficies: canvas, body, tertiary, cards, headers, footers, offcanvas y toasts.
- Contenido: texto principal, secundario, disabled, headings, links, código y marcadores.
- Estados: hover, focus, active, selected, expanded, disabled y `aria-disabled`.
- Navegación: nav, navbar, tabs, pills, dropdowns, paginación y sidebar del cheatsheet.
- Formularios: inputs, selects, placeholders, file inputs, input groups, checks, switches y focus rings.
- Componentes: accordion, buttons, modal, popover, tooltip, progress, carousel, list group y tablas.
- Recursos gráficos: iconos SVG, indicadores, placeholders y controles con `currentColor` o filtros.
- Overflow: scrollbar global y cada contenedor con `overflow: auto` o `overflow-y: auto`.
- Navegación dark: los links inactivos de `.nav-tabs` y `.nav-pills` deben conservar contraste propio; no basta con definir solamente los tokens globales de `nav-link`, porque la cascada de Bootstrap y los estilos del cheatsheet pueden dejarlos demasiado oscuros. Revisar también `:hover`, `.active` y `.disabled`.

El aprendizaje importante es que crear los cuatro archivos permite compilar el theme, pero no garantiza cobertura visual completa. La matriz anterior debe completarse durante la revisión visual del cheatsheet y documentarse cuando un theme necesite una excepción o una nueva primitiva.

El theme aparece automáticamente en el selector después de ejecutar un build. Su modo light es una adaptación de la misma paleta, mientras que el modo dark conserva los colores oficiales de Dracula como referencia principal. Esto demuestra que un nuevo theme puede tener una semántica completamente distinta de `kroma-entrepreneur` sin tocar `app.ts`, `app.scss`, los componentes compartidos ni `node_modules`.

## Checklist De Cambios

- ¿Las nuevas primitivas están solo en `_tokens.scss`?
- ¿Las variables Sass se declaran antes de importar Bootstrap?
- ¿Los overrides light y dark usan el selector completo del theme?
- ¿Se mantienen separados `data-kroma-theme` y `data-bs-theme`?
- ¿Los estados interactivos tienen contraste suficiente?
- ¿Los contenedores con scroll interno también están cubiertos?
- ¿`app.scss` y `app.ts` siguen siendo agnósticos de la marca?
- ¿Se ejecutaron `npx tsc --noEmit`, el build relacionado y `git diff --check -- .`?

El catálogo de themes se genera automáticamente al iniciar `dev` o cualquier build en `src/components/theme-dropdown/themes-inventary.ts`. Cada carpeta bajo `src/themes/` que contenga `theme.scss` se registra automáticamente; Bootstrap se añade siempre como theme base. El inventario importa el CSS inline de cada theme, por lo que un nuevo theme aparece tras reiniciar `dev` o ejecutar un build.

## Scripts

- `npm run test:theme-layers`: valida contratos de capas y rutas de configuración.
- `npm run build:debug`: genera `dist/main.js`, `dist/style.debug.css` y sourcemaps.
- `npm run build:min`: genera `dist/main.min.js` y `dist/style.min.css`.
