# Kroma UI Component Library

Kroma UI Component Library es una implementación Vite/TypeScript de Bootstrap 5.3.8 que reúne componentes reutilizables, estilos y un cheatsheet visual para validar el sistema de interfaz de Kroma.

La biblioteca separa la implementación de Bootstrap de la identidad visual. Los temas definen las primitivas y la semántica de marca; Bootstrap aporta los componentes y utilidades.

El proyecto es privado y se consume como una aplicación del cheatsheet, no como un paquete npm. La salida de Vite se genera directamente en `dist/`; no se mantienen exports de CSS, JavaScript o SCSS que no existan físicamente.

## Estructura De Temas

- `src/themes/kroma-entrepreneur/_tokens.scss`: primitivas de color, tipografía, espaciado y forma.
- `src/themes/kroma-entrepreneur/_semantic-light.scss`: semántica clara y variables Sass que Bootstrap consume.
- `src/themes/kroma-entrepreneur/_semantic-dark.scss`: variables Sass `*-dark` y overrides CSS del modo oscuro.
- `src/themes/kroma-entrepreneur/theme.scss`: entrypoint y composición del tema.
- `src/themes/bootstrap.scss`: entrypoint de Bootstrap oficial sin personalizaciones Kroma.
- `src/cheatsheet/app.scss`: compositor CSS de la aplicación; importa Bootstrap oficial y los estilos generales del cheatsheet.
- `src/components/contrast-dropdown/`: componente Bootstrap encapsulado del combo `light`/`dark`/`auto`.
- `src/components/theme-dropdown/`: componente Bootstrap del selector de theme.
- `src/themes/.gitkeep`: marcador versionado de la carpeta de temas.

## Crear Un Theme

1. Crea una carpeta en `src/themes/` con el nombre de la variante visual.
2. Añade `_tokens.scss` con las primitivas propias del sistema visual.
3. Añade `_semantic-light.scss` para asignar significado a esas primitivas y definir las variables Sass que Bootstrap consume.
4. Añade `_semantic-dark.scss` para declarar las variables `*-dark` antes de Bootstrap y los overrides bajo `[data-bs-theme="dark"]`.
5. Crea `theme.scss` como entrypoint.
6. Importa Bootstrap al final de `theme.scss`.
7. El inventario se actualizará automáticamente al iniciar `dev` o un build.

Los archivos semánticos pueden usar tokens, pero no deben importar otras capas semánticas. No importes Bootstrap antes de declarar las variables que Bootstrap consume.

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

El catálogo de themes se genera automáticamente al iniciar `dev` o cualquier build en `src/components/theme-dropdown/themes-inventary.ts`. Cada carpeta bajo `src/themes/` que contenga `theme.scss` se registra automáticamente; Bootstrap se añade siempre como theme base. El inventario importa el CSS inline de cada theme, por lo que un nuevo theme aparece tras reiniciar `dev` o ejecutar un build.

## Scripts

- `npm run test:theme-layers`: valida contratos de capas y rutas de configuración.
- `npm run build:debug`: genera `dist/main.js`, `dist/style.debug.css` y sourcemaps.
- `npm run build:min`: genera `dist/main.min.js` y `dist/style.min.css`.
