# KromaChat: componentes y contratos

Este documento es el inventario de los elementos que KromaChat compone. Los elementos internos (header, burbujas, opciones, tarjetas, formularios, controles de cantidad, etc.) no se exportan ni se montan individualmente: la API pública recibe un `ChatMessage`, escoge el renderer por `type` y emite eventos DOM. Consulta también [Componentes Kroma UI](COMPONENTS.md), [Temas](THEMES.md) y [Instalación Git/Next.js](GIT_INSTALLATION.md).

## Instalar, importar y montar

Instala una referencia Git fijada según [la guía de instalación](GIT_INSTALLATION.md). Importa la hoja de estilos una vez desde el punto de entrada global:

```ts
import "@kroma/ui-component-library/chat/styles.css";
import { KromaChat, type ChatMessage } from "@kroma/ui-component-library/chat";

const host = document.querySelector<HTMLElement>("#chat-host")!;
const chat = document.createElement("kroma-chat") as KromaChat;
chat.setAttribute("chat-title", "Asistente Kroma");
chat.setAttribute("subtitle", "Atención al cliente");
chat.setAttribute("avatar", "K");
host.append(chat);

const welcome: ChatMessage = { author: "assistant", type: "text", text: "Hola, ¿cómo te ayudo?" };
chat.addMessage(welcome);
```

El entry registra el tag `kroma-chat` idempotentemente. En aplicaciones SSR, no importes el entry de ejecución desde módulos evaluados en el servidor: impórtalo dinámicamente en `useEffect`. El import de CSS sí va en la hoja global de Next.js.

## Arquitectura en ejecución

```text
KromaChat (custom element)
├── ChatHeader           título, avatar, estado, acciones y toggle de lectura
├── ChatMessageList      historial, empty state, mensajes y typing indicator
│   └── ChatMessage      bubble/tiempo + renderer elegido por ChatMessage.type
└── ChatComposer         draft, texto virtual, dictado, teclado virtual y errores
```

Los controles de navegación, catálogo, comercio, formularios y feedback son renderers embebidos en los mensajes; no son tags independientes ni React components. Pasa el modelo a `addMessage` en lugar de crear markup interno o depender de clases CSS privadas.

## Modelo base y tipos compartidos

Cada mensaje tiene `author: "assistant" | "user" | "system"`; `id` y `time` son opcionales. Si omites `id`, `addMessage()` genera uno estable y lo devuelve. `type` suele ser obligatorio; los mensajes text heredados pueden omitirlo. El paquete exporta `ChatMessage` y sus tipos discriminados, además de:

- `ChatOption`, `ChatChoice`, `ChatLink`, `ChatAction`, `ChatImage`, `ChatMoney`.
- `JourneyMenuItem`, `ChatCategory`, `ChatProduct`, `ChatProductVariant`.
- `ChatCartItem`, `ChatPriceEntry`, `ChatPriceSummary`, `ChatCustomerDetails`, `ChatFormField`.
- Un tipo específico por contrato de mensaje y los payloads `ChatSendDetail`, `ChatOptionSelectEventDetail`, `ChatActionDetail`, `ChatRichActionDetail`, `ChatQuantityChangeDetail`, `ChatFormSubmitDetail` y `KromaChatEventMap`.

Precios usan `{ amount: number, currency: string, label?: string }`. El formato/render es de presentación; la aplicación debe validar y calcular valores comerciales autoritativos.

## Inventario completo de mensajes y elementos internos

### Layout, mensajes y entrada

| Elemento/`type` | Cómo se usa | Contenido/función |
| --- | --- | --- |
| **Chat Header** (interno) | Atributos `chat-title`, `avatar`, `subtitle`, `status`; métodos `setStatus()` y `setHeaderActions()` | Identidad del chat, texto de estado, botones proporcionados por el host y toggle accesible de síntesis. |
| **Chat Message List** (interno) | El host añade datos con `addMessage()` | Historial ordenado, empty state, anuncios accesibles, controles asociados a mensajes y región desplazable. No tiene API pública de montaje propio. |
| **Chat Message** / `text` | `{ author, type?: "text", text, time?, id? }` | Burbuja de texto, autor y hora opcional. No renderiza HTML arbitrario. |
| **Rich Message** / `rich` | `{ title?, description, link?, action? }`; el legado `info` usa `{ title, description, link?, action? }` | Tarjeta informativa con texto escapado y link/action opcional. Una acción emite `kroma-chat-rich-action`. |
| **Status Message** / `status` | `{ status?: "neutral" | "success" | "warning" | "error", text }` | Aviso visual con semántica de estado. Usa `author: "system"` en ejemplos. |
| **Typing Indicator** / `typing` | Legado `{ label? }`; recomendado `setTyping(active, label?)` | Indicador de escritura asociado al historial. No es una respuesta de negocio. |
| **Chat Composer** (interno) | `interactionMode`, `setComposerDisabled()`, `setError()` | Mantiene el borrador, expone área de texto virtual, dictado, errores y acciones de composer. No existe botón send independiente: Enter virtual envía. |
| **Virtual Text Display** (interno) | Se administra desde el composer | Proyección accesible del texto/caret; no guarda la fuente autoritativa por separado. |
| **Virtual Keyboard** (interno) | Se abre explícitamente al entrar en texto libre o enfocar un campo de formulario | Una instancia simple-keyboard por composer; incluye layouts alfabético, shift, numérico y símbolos. No abre teclado nativo de teléfono. |
| **Speech dictation/output** (interno) | Toggle de micrófono y altavoz si el navegador soporta las APIs | Web Speech API; no tiene dependencias de backend. Ver [voz](#dictado-de-voz-y-lectura-automática). |

### Opciones y navegación

| `type` | Payload específico requerido | Renderer interno / evento |
| --- | --- | --- |
| `quick-replies` | `text`, `replies: ChatOption[]` | Botones compactos; selección emite `kroma-chat-option-select` con `control: "quick-replies"`. Cada option: `id?`, `label`, `value?`, `disabled?`. |
| `options` (legado) | `text`, `options: ChatOption[]` | Alias compatible de Quick Replies. Preferir `quick-replies`. |
| `choice-list` | `text`, `choices: ChatChoice[]` | Opciones ricas con título y descripción; selección emite `kroma-chat-option-select` con `control: "choice-list"`. Choice: `id?`, `title`, `description`, `value?`, `disabled?`. |
| `journey-menu` | `text`, `items: JourneyMenuItem[]` | Menú de rutas principales; selección emite `kroma-chat-action` con `control: "journey-menu"`. Item: `id`, `label`, `description?`, `icon?`, `value?`, `disabled?`. |
| `category-picker` | `text`, `categories: ChatCategory[]` | Cuadrícula adaptable; selección emite `kroma-chat-action` con `control: "category-picker"`. Category: `id`, `label`, `description?`, `icon?`, `disabled?`. |

### Catálogo y selección de producto

`ChatProduct` común: `id`, `name`, `description`, `summary?`, `image?: { src, alt }`, `price?: ChatMoney`, `priceLabel?`, `tags?`, `features?`, `variants?: ChatProductVariant[]`. Variante: `id`, `label`, `value`, `disabled?`.

| `type` | Campos además del producto | Renderer / evento |
| --- | --- | --- |
| `product-card` | `product`, `actionLabel?` | Tarjeta destacada con imagen/precio/CTA; `kroma-chat-action`, `control: "product-card"`. |
| `product-list` | `text`, `products`, `productActionLabel?` | Lista vertical de filas de producto; cada Product List Item usa el renderer común de producto; acción `control: "product-list"`. |
| `product-carousel` | `text`, `products`, `previousLabel?`, `nextLabel?`, `productActionLabel?` | Carrusel desplazable y controles accesibles; acción `control: "product-carousel"`. |
| `product-detail` | `product`, `variants?`, `selectedVariantId?`, `variantLabel?`, `quantity?`, `quantityLabel?`, `decreaseQuantityLabel?`, `increaseQuantityLabel?`, `minimumQuantity?`, `maximumQuantity?`, `requiresVariant?`, `addActionLabel?`, `backActionLabel?`, `actionMessage?` | Imagen, detalles, features, selector de variante/cantidad y CTAs. Cantidad emite `kroma-chat-quantity-change`; acciones emiten `kroma-chat-action`, `control: "product-detail"`. |
| `product-variant-selector` | `controlId`, `label`, `variants`, `productId?`, `selectedVariantId?` | Selector independiente; cambios/selecciones se notifican como `kroma-chat-action`, `control: "product-variant-selector"`. |
| `quantity-selector` | `controlId`, `label`, `value`, `productId?`, `minimum?`, `maximum?`, `decreaseLabel?`, `increaseLabel?` | Control independiente; cambio emite `kroma-chat-quantity-change`. |

### Comercio, formularios y feedback

| `type` | Campos específicos | Renderer / evento |
| --- | --- | --- |
| `cart-summary` | `text`, `items: ChatCartItem[]`, `subtotal?`, `subtotalTitle?`, `subtotalLabel?`, `priceSummary?`, `continueLabel?`, `emptyLabel?`, `removeItemLabel?` | Resumen no editable por sí solo, con Cart Line Items y Price Summary. Acciones emiten `kroma-chat-action`, `control: "cart-summary"`. `ChatCartItem` tiene `id`, `product`, `quantity`, y opcionalmente variante, acciones, precio unitario y total. |
| `order-review` | `text`, `customer`, `items`, `confirmLabel`, `customerLabels?`, `subtotal?`, `subtotalTitle?`, `subtotalLabel?`, `priceSummary?`, `removeItemLabel?`, `editLabel?` | Revisión de datos e items antes de confirmar; las acciones emiten `control: "order-review"`. |
| `conversational-form` | `text`, `fields: ChatFormField[]`, `submitLabel`, `title?` | Formulario validado integrado al composer/teclado virtual. Campo: `id`, `name`, `label`, `type`, opcionalmente value, required, disabled, placeholder, autocomplete, min, max, pattern, errorMessage. Submit válido emite `kroma-chat-form-submit`. |
| `confirmation` / `confirmation-card` | `title`, `description`, `status?`, `reference?`, `summary?`, `action?` | Confirmación reutilizable con estado opcional; action emite `kroma-chat-action`, `control: "confirmation"`. |

### Inventario de piezas internas compuestas

Estos nombres también aparecen como piezas del catálogo Kitchen Mode. No corresponden a imports/tags independientes: se crean desde el renderer padre y los datos de su mensaje.

| Elemento del inventario | Dónde se compone | Contrato que lo alimenta |
| --- | --- | --- |
| Chat Header | `<kroma-chat>` | Atributos de cabecera, `setStatus()` y `setHeaderActions()`. |
| Chat Message List | `<kroma-chat>` | Secuencia de `addMessage()`, empty state y typing. |
| Chat Message | Historial | `ChatTextMessage`; bubble de autor y hora opcional. |
| Chat Composer | `<kroma-chat>` | Propiedad `interactionMode`, setters de composer y entrada. |
| Virtual Text Display | Chat Composer | Estado del borrador y caret manejados por el composer. |
| Virtual Keyboard | Chat Composer y formularios | `simple-keyboard` interno; no se construye con `ChatMessage`. |
| Rich Message | Mensaje `rich` / legado `info` | `title`, `description`, `link?`, `action?`. |
| Quick Replies | `quick-replies` / legado `options` | `replies[]` / `options[]`. |
| Choice List | `choice-list` | `choices[]`. |
| Typing Indicator | `setTyping()` / `typing` legado | `label?`; usar el setter para controlar el estado. |
| Journey Menu | `journey-menu` | `items[]`. |
| Journey Option | Cada item de Journey Menu | `JourneyMenuItem`. |
| Category Picker | `category-picker` | `categories[]`. |
| Category Tile | Cada elemento de Category Picker | `ChatCategory`. |
| Feature List | `product-detail` | `product.features?: string[]`. |
| Product Card | `product-card`, o fila en lista/carrusel | `ChatProduct` y etiqueta de acción opcional. |
| Product Carousel | `product-carousel` | `products[]` y etiquetas de navegación/acción. |
| Product Detail | `product-detail` | `ChatProduct`, variantes, cantidad y CTA opcionales. |
| Product List | `product-list` | `products[]`. |
| Product List Item | Cada producto de Product List/Carousel | `ChatProduct`; acción delegada al host. |
| Product Variant Selector | `product-variant-selector` o sección de `product-detail` | `ChatProductVariant[]`; selección comunicada como acción. |
| Quantity Selector | `quantity-selector` o sección de `product-detail` | Valor, límites e ID del control/producto. |
| Cart Summary | `cart-summary` | `items[]`, subtotal o tabla `priceSummary`. |
| Cart Line Item | Cada entrada de Cart Summary/Order Review | `ChatCartItem`. |
| Price Summary | Cart Summary/Order Review | `ChatPriceSummary.entries[]`. |
| Order Review | `order-review` | Cliente, items, importes y labels de confirmación/edición. |
| Conversational Form | `conversational-form` | `fields[]`; controles ligados al keyboard del composer. |
| Confirmation Card | `confirmation` / `confirmation-card` | Estado, título, descripción, referencia, resumen y acción opcionales. |
| Status Message | `status` | Texto y estado neutral/success/warning/error. |

Kitchen Mode ofrece ejemplos visuales ordenados de estos renderers y estados. Es un catálogo de inspección, no una colección de componentes independiente ni un flujo productivo.

Para campos de formulario, `type` acepta `text`, `email`, `tel`, `number`, `date`, `url`, `search` o `password`. Los targets son de entrada virtual de solo lectura desde el teclado del dispositivo; no se envía ningún dato salvo mediante el evento de submit.

## Ejemplos de controles

### Quick Replies y Choice List

```ts
chat.addMessage({
  author: "assistant",
  type: "quick-replies",
  text: "¿Qué deseas hacer?",
  replies: [
    { id: "browse", label: "Ver productos", value: "browse" },
    { id: "support", label: "Hablar con soporte", value: "support" },
  ],
});

chat.addMessage({
  author: "assistant",
  type: "choice-list",
  text: "Elige una categoría",
  choices: [
    { id: "gas", title: "Gas", description: "Balones y recargas", value: "gas" },
    { id: "water", title: "Agua", description: "Bidones y botellas", value: "water", disabled: true },
  ],
});
```

### Producto, carrito y cantidades

```ts
const gasProduct = {
  id: "gas-10kg",
  name: "Gas doméstico 10 kg",
  description: "Balón para uso doméstico",
  image: { src: "/images/gas-10kg.webp", alt: "Balón de gas de 10 kg" },
  price: { amount: 55, currency: "PEN" },
  features: ["Entrega a domicilio", "Envase retornable"],
};

chat.addMessage({
  author: "assistant",
  type: "product-detail",
  product: gasProduct,
  quantity: 1,
  minimumQuantity: 1,
  maximumQuantity: 8,
  addActionLabel: "Agregar al carrito",
});
```

La imagen debe usar una URL disponible al consumidor (o un asset incluido por su aplicación). KromaChat no valida disponibilidad, suma precios ni agrega productos al carrito por cuenta propia.

### Formulario conversacional

```ts
chat.addMessage({
  author: "assistant",
  type: "conversational-form",
  text: "Completa tus datos para continuar.",
  title: "Contacto",
  fields: [
    { id: "name", name: "name", label: "Nombre", type: "text", autocomplete: "name", required: true },
    { id: "email", name: "email", label: "Correo electrónico", type: "email", autocomplete: "email", required: true },
  ],
  submitLabel: "Continuar",
});
```

## Conectar los eventos al estado de la aplicación

Los eventos públicos son bubbling y composed; se pueden escuchar en `<kroma-chat>` o un ancestro. El host decide la transición y llama otra vez a `addMessage()`:

```ts
import type { KromaChatEventMap } from "@kroma/ui-component-library/chat";

const listeners = new AbortController();
chat.addEventListener("kroma-chat-option-select", (event) => {
  const detail = (event as CustomEvent<KromaChatEventMap["kroma-chat-option-select"]>).detail;
  if (detail.value === "browse") {
    chat.addMessage({ author: "assistant", type: "text", text: "Te mostraré el catálogo." });
  }
}, { signal: listeners.signal });

chat.addEventListener("kroma-chat-quantity-change", (event) => {
  const detail = (event as CustomEvent<KromaChatEventMap["kroma-chat-quantity-change"]>).detail;
  // Actualiza el estado de carrito autoritativo en tu aplicación.
  console.log(detail.productId, detail.quantity);
}, { signal: listeners.signal });
```

| Evento | Detail | Se dispara cuando |
| --- | --- | --- |
| `kroma-chat-send` | `ChatSendDetail`: `{ message, source? }` | Se envía el texto del composer. El bubble de usuario ya está en historial. |
| `kroma-chat-option-select` | `ChatOptionSelectEventDetail`: `message`, `messageId`, `optionId`, `value`, `label`, `control`, `option` | Se selecciona Quick Reply o Choice List. No emite también `kroma-chat-send`. |
| `kroma-chat-action` | `ChatActionDetail`: `messageId`, `control`, `actionId`, `label`, `value?`, `data?` | Se usa una acción de header, journey, category, producto, carrito, order review o confirmación. |
| `kroma-chat-rich-action` | `ChatRichActionDetail`: `messageId`, `actionId`, `value?` | Se activa la acción de Rich Message. |
| `kroma-chat-quantity-change` | `ChatQuantityChangeDetail`: `messageId`, `controlId`, `productId?`, `quantity` | Aumenta/disminuye una cantidad; el host debe guardar y validar el nuevo valor. |
| `kroma-chat-form-submit` | `ChatFormSubmitDetail`: `messageId`, `values: Record<string,string>` | El formulario pasa validación nativa y se envía. Los valores no se persisten automáticamente. |

`ChatActionControl` puede ser `header`, `journey-menu`, `category-picker`, `product-card`, `product-list`, `product-carousel`, `product-detail`, `product-variant-selector`, `conversational-form`, `cart-summary`, `order-review` o `confirmation`. `data` puede incluir `productId`, `categoryId`, `variantId`, `quantity` o `lineId` cuando aplica.

## Métodos, propiedades y atributos del host

| API | Uso |
| --- | --- |
| `addMessage(message): string` | Añade un `ChatMessage` y devuelve su ID estable. Para `author: "assistant"`, puede iniciar lectura automática. |
| `setTyping(active, label?)` | Muestra u oculta typing indicator controlado por el host. |
| `setStatus(status: string \| null)` | Cambia el estado textual del header. |
| `setHeaderActions(actions)` | Configura botones en el header. Su selección emite `kroma-chat-action` con `control: "header"`. `ChatHeaderAction`: `id`, `label`, `value?`, `disabled?`. |
| `setComposerDisabled(disabled)` | Deshabilita/habilita el composer. |
| `setOptionsDisabled(messageId, disabled)` | Deshabilita QuickReplies/ChoiceList de un mensaje identificado. |
| `disableHistoryControls()` | Completa/deshabilita controles históricos después de avanzar la conversación. |
| `setError(message: string \| null)` | Muestra o limpia el error del composer. |
| `mode: "default" \| "kitchen"` | Propiedad tipada/reflejada en el atributo `mode`; cambiarla reinicia el historial. |
| `interactionMode: "guided" \| "free-text"` | Modo de composer; cambia sin reconstruir los mensajes. Por defecto `guided`. |

Atributos del elemento: `mode`, `chat-title`, `subtitle`, `avatar`, `status`, `messages-label`, `empty-state`, `input-label`, `placeholder` y `typing-label`. Configura atributos antes de adjuntar el elemento cuando deban estar desde el primer render.

Header action:

```ts
chat.setHeaderActions([
  { id: "help", label: "Ayuda", value: "help" },
  { id: "close", label: "Cerrar", disabled: false },
]);
```

Al desconectar el elemento, KromaChat destruye los listeners/controladores internos; al reconectarlo, reinicializa el DOM. Los listeners puestos por la aplicación también deben quitarse (por ejemplo, con `AbortController`) y las actualizaciones de red deben ignorar respuestas tardías.

## Dictado de voz y lectura automática

- El composer usa SpeechRecognition o su alias prefijado si el browser lo ofrece, idioma `es-PE`; el micrófono se oculta si la API no está disponible.
- El texto reconocido se añade al borrador existente. Editar/focalizar para escribir detiene el reconocimiento para evitar que resultados tardíos reemplacen cambios.
- El borrador se conserva en session storage del tab; el chat no persiste el historial del backend.
- Si SpeechSynthesis está disponible, el header muestra un toggle accesible, activo inicialmente. Lee nuevas respuestas del asistente y la selección; el usuario puede apagarlo.
- Los errores de reconocimiento se registran en la consola, no se insertan en la interfaz.

No se debe suponer disponibilidad de APIs de voz; el host puede seguir utilizando los eventos sin ellas.

## Kitchen Mode

Kitchen Mode es un catálogo estático de ejemplos, no un flujo de comercio ejecutable:

```html
<kroma-chat mode="kitchen" chat-title="Catálogo de componentes" avatar="K"></kroma-chat>
```

El modo carga ejemplos del catálogo interno (ficticios), deshabilita composer y suprime eventos host de send/action/quantity/form-submit. No llama servicios ni actualiza carrito. El historial real del journey comercial se muestra en `mode="default"`; cambiar `mode` reconstruye la conversación, por lo que la aplicación no debe usarlo como mecanismo de persistencia.

Para inspeccionar todos los controles en el sitio, visita las páginas de chat del cheatsheet. La lista secuencial completa se mantiene en `src/components/chat/kitchen/kitchen.catalog.ts`; los contratos reales se definen en `core/chat.types.ts`.

## Limitaciones y responsabilidades del host

KromaChat es una capa de presentación, no un agente conversacional ni un motor de ecommerce. El host debe:

1. Procesar `kroma-chat-send`, consultar su servicio y añadir respuesta con `addMessage()`.
2. Resolver opciones/acciones y decidir el siguiente paso.
3. Validar precios, disponibilidad, cantidades, carrito y autorización en su propio estado/backend.
4. Gestionar sesión/persistencia y datos sensibles recibidos de formularios.
5. Escapar/validar URLs e imágenes antes de entregarlas como datos de producto.

KromaChat no ofrece una API para modificar/eliminar mensajes existentes o montar cada renderer independientemente. Use la API tipada y los eventos, no el DOM/CSS privado, para integrar la lógica.
