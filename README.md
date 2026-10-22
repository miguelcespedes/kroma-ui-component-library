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
- `node_modules/bootstrap/scss/bootstrap.scss`: fuente oficial de Bootstrap. No se debe envolver ni editar desde `src/themes/`.
- `src/cheatsheet/app.scss`: compositor CSS de la aplicación; importa Bootstrap oficial y los estilos generales del cheatsheet.
- `src/components/contrast-dropdown/`: componente Bootstrap encapsulado del combo `light`/`dark`/`auto`.
- `src/components/theme-dropdown/`: componente Bootstrap del selector de theme.
- `src/themes/.gitkeep`: marcador versionado de la carpeta de temas.

## Diseñar Un Theme Para La Aplicación

Esta sección es una instrucción operativa para un LLM que deba diseñar o adaptar un theme. El objetivo no es pintar componentes uno por uno: es construir una semántica visual completa que Bootstrap pueda consumir sin modificar la aplicación base.

### Contrato De Entrada Y Salida

Entrada mínima esperada:

- Nombre kebab-case del theme.
- Referencia visual, paleta o producto que debe representar.
- Requisitos explícitos de light, dark, tipografía, forma o contraste.
- Excepciones de componentes, si existen.

Salida obligatoria:

```text
src/themes/<nombre>/
  _tokens.scss
  _semantic-light.scss
  _semantic-dark.scss
  theme.scss
```

La salida debe compilar como un theme seleccionable sin modificar `app.ts`, `app.scss`, los componentes compartidos, `node_modules` ni `themes-inventary.ts`. Si una decisión no puede expresarse en estas cuatro capas, detente, identifica la limitación y no la resuelvas con un parche global.

Cuando recibas la instrucción "crea un nuevo theme":

1. Inspecciona primero la estructura existente, los encabezados `[INSTRUCCIONES PARA AGENTES/LLM - CONSERVAR]`, los tokens de Bootstrap y los componentes del cheatsheet. No empieces copiando reglas de otro theme.
2. Crea una variante independiente en `src/themes/<nombre>/`. El nombre identifica la marca mediante `data-kroma-theme`; nunca lo uses como valor de `data-bs-theme`.
3. Define el lenguaje visual en `_tokens.scss`: colores, tipografía, espaciado y forma. Los tokens no deben generar CSS ni contener selectores.
4. Traduce esos tokens a roles en `_semantic-light.scss` y `_semantic-dark.scss`. Piensa en roles (`primary`, superficie, contenido, borde, estado), no en nombres de componentes ni en colores aislados.
5. Configura primero las variables Sass oficiales que Bootstrap consume y después añade variables CSS runtime solo para valores que deban cambiar con `data-bs-theme`.
6. Usa selectores completos del theme y del modo para los overrides runtime. Nunca escribas reglas globales que puedan afectar Bootstrap base u otro theme.
7. Revisa la cobertura visual completa del cheatsheet: superficies, texto, links, estados, navegación, formularios, tablas, overlays, iconos, scrollbars y controles del header.
8. Conserva los componentes compartidos agnósticos. Si un componente ya usa clases Bootstrap y variables `--bs-*`, haz que herede la semántica; no dupliques sus colores en el theme.
9. Valida el resultado en el navegador con cada combinación light/dark. El build confirma que el Sass compila, pero solo el CSS computado confirma que la cascada y los estados funcionan.

### Plantilla Mínima

Usa esta forma como punto de partida y sustituye los tokens, no la arquitectura:

`_tokens.scss` debe contener únicamente primitivas:

```scss
$brand-primary: #000000;
$brand-surface: #ffffff;
$brand-content: #000000;
$brand-border: #cccccc;
$brand-radius: .5rem;
```

`_semantic-light.scss` asigna roles y variables Sass antes de Bootstrap:

```scss
@import "./tokens";

$primary: $brand-primary;
$body-bg: $brand-surface;
$body-color: $brand-content;
$border-radius: $brand-radius;

[data-kroma-theme="mi-theme"][data-bs-theme="light"] {
  --bs-body-bg: #{$brand-surface};
  --bs-body-color: #{$brand-content};
  --bs-border-color: #{$brand-border};
}
```

`_semantic-dark.scss` declara variables dark y overrides runtime acotados:

```scss
$primary-dark: $brand-primary;
$body-bg-dark: $brand-surface;
$body-color-dark: $brand-content;

[data-kroma-theme="mi-theme"][data-bs-theme="dark"] {
  --bs-body-bg: #{$body-bg-dark};
  --bs-body-color: #{$body-color-dark};
  --bs-border-color: #{$brand-border};
}
```

`theme.scss` solo debe contener estos imports, exactamente en este orden:

```scss
@import "./tokens";
@import "./semantic-light";
@import "./semantic-dark";
@import "bootstrap/scss/bootstrap";
```

La plantilla es deliberadamente pequeña. Antes de completarla, consulta las variables reales de Bootstrap y agrega solo los roles que la matriz visual requiere.

### Tabla De Decisión

| Necesidad | Lugar correcto | Regla |
| --- | --- | --- |
| Color, tamaño, radio o primitiva reutilizable | `_tokens.scss` | No generar selectores CSS |
| `$primary`, `$body-bg`, `$accordion-*` y variables Sass Bootstrap | Capa semántica, antes de Bootstrap | Preferir la API oficial |
| Valor que cambia con light/dark en runtime | Selector completo del theme y modo | Interpolar Sass en custom properties |
| Estado que Bootstrap ya genera | Variable Bootstrap | No crear un selector paralelo |
| Excepción visual de un componente | Capa semántica del theme | Mantener selector pequeño y justificado |
| Estructura, markup o comportamiento | Componente/app existente | No modificarlo desde el theme |
| Inventario de themes | Build/Vite | No editar archivo generado |
| Selector global o parche de cascada | Ninguno por defecto | Detenerse y revisar el diseño |

### Matriz De Cobertura Obligatoria

Antes de declarar terminado un theme, revisa como mínimo:

| Área | Light | Dark | Estados |
| --- | --- | --- | --- |
| Canvas, body, superficies, cards y header | Sí | Sí | normal |
| Texto, headings, links, código y disabled | Sí | Sí | hover, focus, disabled |
| Primary, secondary, danger, warning, success e info | Sí | Sí | hover, active, focus |
| Navbars, tabs, pills, dropdowns y paginación | Sí | Sí | active, selected, disabled |
| Inputs, selects, checks, switches y input groups | Sí | Sí | focus, invalid, disabled |
| Accordion, buttons, modal, toast, popover y tooltip | Sí | Sí | active, expanded, disabled |
| Tablas | Sí | Sí | striped, hover, active |
| Iconos, SVG, indicadores y placeholders | Sí | Sí | contraste |
| Scrollbar global y contenedores con overflow | Sí | Sí | thumb, track |

Si una celda no aplica, indícalo en la revisión; no la omitas accidentalmente.

### Criterios De Aceptación

Un theme está terminado solo si cumple todo lo siguiente:

1. Contiene las cuatro capas obligatorias y `theme.scss` conserva exactamente el orden de imports.
2. Los tokens no generan CSS y las capas semánticas no importan otras capas salvo `_tokens.scss` según el contrato existente.
3. Bootstrap se importa después de todas las variables Sass que consume.
4. Todos los overrides runtime están limitados a `data-kroma-theme` y `data-bs-theme`.
5. El theme no cambia la estructura ni los nombres accesibles del cheatsheet.
6. El selector de themes hereda el botón `btn-primary`; no tiene colores duplicados ni variables autorreferenciadas.
7. La matriz de cobertura fue revisada en light y dark, incluidos estados interactivos.
8. El CSS computado no contiene declaraciones Sass inválidas como `rgba($token, .14)`.
9. `npx tsc --noEmit`, el build relacionado y `git diff --check -- .` terminan correctamente.
10. El theme aparece en el selector después del build y puede activarse sin tocar código de aplicación.

### Errores Prohibidos

No entregues un theme que contenga:

```scss
// Incorrecto: la primitiva pertenece a _tokens.scss.
$brand-red: #ff0000;

// Incorrecto: variable autorreferenciada.
--bs-btn-bg: var(--bs-btn-bg);

// Incorrecto: selector que contamina todos los themes.
[data-bs-theme="dark"] .btn-primary { ... }

// Incorrecto: parche estructural en la aplicación.
// app.scss: .mi-theme .btn { ... }
```

La corrección es mover la primitiva a `_tokens.scss`, mapearla a una variable Bootstrap en la capa semántica y limitar cualquier excepción al selector completo del theme y modo.

1. Crea una carpeta en `src/themes/` con el nombre de la variante visual.
2. Añade `_tokens.scss` con las primitivas propias del sistema visual.
3. Añade `_semantic-light.scss` para asignar significado a esas primitivas y definir las variables Sass que Bootstrap consume.
4. Añade `_semantic-dark.scss` para declarar las variables `*-dark` antes de Bootstrap y los overrides bajo el selector completo del theme en modo dark.
5. Crea `theme.scss` como entrypoint con los cuatro imports obligatorios y en el orden documentado.
6. Deja que el inventario se actualice automáticamente al iniciar `dev` o un build; no edites `themes-inventary.ts` manualmente.

Los archivos semánticos pueden usar tokens, pero no deben importar otras capas semánticas. No importes Bootstrap antes de declarar las variables que Bootstrap consume.

El resultado debe poder seleccionarse desde el dropdown de themes sin cambiar `app.ts`, `app.scss`, los componentes compartidos ni `node_modules`. El límite del sistema es la estructura y la API de componentes de Bootstrap; dentro de ese límite, cada theme puede tener una paleta, tipografía, superficies, bordes, radios, estados y tratamiento dark completamente diferentes.

### Flujo Recomendado Para El LLM

1. Define primero la paleta y las primitivas reutilizables en `_tokens.scss`.
2. Construye un mapa de roles en `_semantic-light.scss`: `primary`, `secondary`, canvas, superficies elevadas, contenido, contenido secundario, disabled, bordes, focus y estados.
3. Construye el equivalente dark en `_semantic-dark.scss`; no supongas que invertir light produce contraste correcto.
4. Configura Bootstrap antes de importarlo y deja que sus componentes generen los estados derivados.
5. Añade overrides runtime únicamente para excepciones verificadas y siempre dentro del selector completo del theme y del modo.
6. Comprueba cada excepción contra el componente real: identifica qué token consume, qué regla gana en la cascada y qué ocurre en hover, focus, active, selected y disabled.
7. Regenera `dist` después de modificar una fuente que participe en el bundle.

La separación entre primitivas y semántica permite cambiar el sistema visual sin reescribir cada componente. Por ejemplo, un token azul puede asignarse a `$primary` en light y a una superficie o borde distinto en dark sin duplicar colores literales en los componentes.

## EntryPoint Del Theme

`theme.scss` debe cargar las capas en este orden:

```scss
@import "./tokens";
@import "./semantic-light";
@import "./semantic-dark";
@import "bootstrap/scss/bootstrap";
```

`app.scss` carga Bootstrap nativo directamente desde `node_modules`. `theme-dropdown.ts` carga el stylesheet inline del theme seleccionado en `#kroma-theme-stylesheet`; `app.ts` solo orquesta la aplicación y los componentes. No existe un wrapper local de Bootstrap.

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

## Reglas Para Diseñar Y Revisar

Conserva la estructura y sustituye las primitivas y las capas semánticas según la necesidad del sistema visual. No edites `node_modules/bootstrap`, no mezcles responsabilidades entre capas y regenera `dist` cuando cambie una fuente que afecte al bundle.

- Diseña por roles semánticos, no por capturas ni por componentes aislados.
- Reutiliza un token existente antes de crear una primitiva nueva; crea otra solo si representa un rol visual realmente distinto.
- No hardcodees el mismo color en varias capas. El valor nace en `_tokens.scss`, se asigna a un rol en la semántica y Bootstrap lo consume.
- No uses variables CSS autorreferenciadas, por ejemplo `--bs-btn-bg: var(--bs-btn-bg)`; esa declaración no hereda el valor anterior y puede invalidar el estilo.
- No conviertas un componente compartido en una variante de marca si puede resolverse mediante variables Bootstrap.
- No uses `!important` para tapar una cascada que todavía no has inspeccionado.
- No añadas un selector porque aparece en una captura: primero identifica el componente, el estado y el token responsable.
- Si un override es inevitable, hazlo pequeño, específico, documentable y limitado al theme y modo que lo necesitan.
- Trata el contraste como requisito funcional. Valida texto, iconos, bordes, focus indicators y estados disabled, no solo el color de fondo.

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
- Navs disabled y cursor: seguir el patrón que funciona en Kroma Dark. El estado debe definir en el theme el color disabled, `cursor: not-allowed` y `pointer-events: auto`; no usar `pointer-events: none`, porque impide que el cursor de no disponible se muestre sobre el elemento. Cubrir `.nav-link.disabled`, `.navbar .nav-link.disabled`, `.navbar .disabled`, botones disabled y `[aria-disabled="true"]` cuando corresponda. Verificar también que las reglas posteriores no vuelvan a sobrescribir el cursor o el pointer-events.
- Patrones compartidos de estados disabled: no duplicar en cada nuevo theme las reglas de comportamiento para hover, focus, `cursor: not-allowed`, `pointer-events: auto`, `text-decoration` u `outline`. Esas reglas deben extraerse a una capa compartida de navegación/componentes cuando se consolide la arquitectura. Cada theme solo debe aportar los valores visuales propios mediante variables como `--bs-nav-link-disabled-color` y `--bs-navbar-disabled-color`. `app.scss` no es el lugar para esa capa compartida porque no debe definir apariencia de marca ni estados temáticos.
- Prueba visual obligatoria: no asumir que el build demuestra el resultado. Seleccionar el theme en el navegador, confirmar `data-kroma-theme` y `data-bs-theme` en `<html>`, inspeccionar el CSS computado de los elementos y comprobar visualmente color, hover, focus, disabled y cursor. Si el valor computado contiene Sass literal como `rgba($token, .14)`, la declaración es inválida y debe interpolarse o convertirse a CSS válido.
- Tablas Bootstrap: las clases HTML (`table-primary`, `table-secondary`, etc.) ya son las responsables de identificar la variante. Los colores deben definirse en la capa semántica del theme mediante los tokens `--bs-table-*`; no añadir clases de marca al HTML. En custom properties no interpoladas, Sass puede dejar literales inválidos: comprobar el valor computado y usar `#{$token}` o valores CSS válidos. Revisar `--bs-table-bg`, `--bs-table-color`, `--bs-table-border-color`, estados striped, active y hover.
- Header global: el header `.bd-header` y el selector `[data-theme-selector]` son distintos de los navbars Bootstrap. Cada theme debe declarar sus tokens `--bs-header-*` (`bg`, `color`, `border` y controles) y aplicar las reglas visuales bajo su selector completo de theme. Definir únicamente los tokens no basta si no existen reglas para consumirlos en `.bd-header` y `[data-theme-selector]`. La solución debe permanecer en las capas semánticas, nunca en `app.scss`.
- Naming de navbars: los ejemplos deben identificarse de forma accesible y consistente como `Primary navbar` para `.navbar.bg-body-tertiary` y `Alternative navbar` para `.navbar.bg-primary`, usando `aria-label` en el `<nav>` y un encabezado visualmente oculto cuando el contexto lo requiera. Estos nombres permiten referirse a cada variante sin depender de su color.
- Contrato de variantes: el cheatsheet solo expone dos tipos de navbar. `Primary navbar` es la variante clara basada en `bg-body-tertiary` y `Alternative navbar` es la variante de marca basada en `bg-primary`. No crear una tercera variante ni cambiar la semántica de estas clases según el modo de contraste; cada theme debe adaptar los mismos dos contratos.
- Isotipo del header: el asset compartido del cheatsheet es `bootstrap-logo-white.svg`, por lo que cada theme debe adaptar su apariencia dentro de su capa semántica. En Kroma Light, `.bd-header-logo` usa `filter: brightness(0)` para producir el isotipo negro sobre el header claro; no modificar `app.scss` ni crear una tercera variante de navbar para resolverlo.
- Componentes con tokens propios: no asumir que un patrón se propaga automáticamente entre componentes. `.navbar` consume `--bs-navbar-*`, mientras `.bd-header` consume `--bs-header-*`; ambos necesitan semántica explícita aunque compartan colores. Verificar cada componente mediante estilos computados después de seleccionar el theme.
- Combo de themes: el disparador `[data-theme-selector]` es un botón Bootstrap independiente del menú `.dropdown-menu`. Un theme debe definir explícitamente `--bs-btn-color`, `--bs-btn-bg`, `--bs-btn-border-color` y sus variantes hover cuando el fondo del header pueda producir bajo contraste. El item seleccionado del menú usa por separado `--bs-dropdown-link-active-color` y `--bs-dropdown-link-active-bg`; no mezclar ambos contratos.
- Herencia de componentes: los componentes compartidos deben definir únicamente estructura, comportamiento y estados funcionales mínimos. Sus colores y apariencia deben consumir variables Bootstrap (`--bs-*`) para heredar automáticamente la semántica del theme activo. Un theme solo debe sobrescribir un componente cuando requiera una variante visual intencional; no duplicar en el componente ni en el theme los mismos valores.
- Botón del theme-dropdown: el selector se construye como `btn btn-primary dropdown-toggle` y debe heredar el botón primario generado por Bootstrap. No añadir overrides específicos de `[data-theme-selector]` en un theme salvo una variante visual intencional. Nunca usar variables autorreferenciadas como `--bs-btn-bg: var(--bs-btn-bg)` ni convertirlo en outline; si el botón primario del theme cambia, el selector debe cambiar automáticamente.
- Orden de compilación: `theme.scss` debe mantener exactamente cuatro imports, en este orden: tokens, semantic-light, semantic-dark y Bootstrap. No duplicar las capas después de Bootstrap para resolver cascada; los overrides runtime deben tener selectores completos del theme y deben validarse en el stylesheet inline realmente cargado por el navegador.

El aprendizaje importante es que crear los cuatro archivos permite compilar el theme, pero no garantiza cobertura visual completa. La matriz anterior debe completarse durante la revisión visual del cheatsheet y documentarse cuando un theme necesite una excepción o una nueva primitiva.

El theme aparece automáticamente en el selector después de ejecutar un build. Su modo light es una adaptación de la misma paleta, mientras que el modo dark conserva los colores oficiales de Dracula como referencia principal. Esto demuestra que un nuevo theme puede tener una semántica completamente distinta de `kroma-entrepreneur` sin tocar `app.ts`, `app.scss`, los componentes compartidos ni `node_modules`.

## Checklist De Diseño Para El LLM

- ¿Leíste los contratos y encabezados de las capas antes de editarlas?
- ¿Las nuevas primitivas están solo en `_tokens.scss`?
- ¿Cada token nuevo tiene un rol semántico claro?
- ¿Las variables Sass se declaran antes de importar Bootstrap?
- ¿Los overrides light y dark usan el selector completo del theme?
- ¿Se mantienen separados `data-kroma-theme` y `data-bs-theme`?
- ¿El theme cubre superficies, contenido, estados, navegación, formularios, tablas, overlays, gráficos y scroll interno?
- ¿El selector de themes hereda `btn-primary` y el menú hereda los tokens de dropdown, sin colores duplicados?
- ¿Los estados interactivos y disabled tienen contraste, cursor y pointer-events correctos?
- ¿`app.scss`, `app.ts` y los componentes compartidos siguen siendo agnósticos de la marca?
- ¿Se inspeccionó el CSS computado en light y dark, incluidos hover, focus, active y disabled?
- ¿Se ejecutaron `npx tsc --noEmit`, el build relacionado y `git diff --check -- .`?

El catálogo de themes se genera automáticamente al iniciar `dev` o cualquier build en `src/components/theme-dropdown/themes-inventary.ts`. Cada carpeta bajo `src/themes/` que contenga `theme.scss` se registra automáticamente; Bootstrap se añade siempre como theme base. El inventario importa el CSS inline de cada theme, por lo que un nuevo theme aparece tras reiniciar `dev` o ejecutar un build.

## Scripts

- `npm run test:theme-layers`: valida contratos de capas y rutas de configuración.
- `npm run build:debug`: genera `dist/main.js`, `dist/style.debug.css` y sourcemaps.
- `npm run build:min`: genera `dist/main.min.js` y `dist/style.min.css`.
