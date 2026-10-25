import "simple-keyboard/build/css/index.css";
import * as bootstrap from "bootstrap";
import "./app.scss";
import { initializeContrastDropdown } from "../components/contrast-dropdown/contrast-dropdown";
import { initializeThemeDropdown } from "../components/theme-dropdown/theme-dropdown";
import { initializeColorTokenPalette } from "../components/color-token-palette/color-token-palette";
import "../components/chat";
import chatPoloImage from "../assets/chat-polo-v2.png";
import chatJacketImage from "../assets/chat-jacket-v2.png";
import chatBottleImage from "../assets/chat-bottle-v2.png";
import chatSneakerImage from "../assets/chat-sneaker-v2.png";
import chatCapImage from "../assets/chat-cap-v2.png";
import type {
  ChatActionDetail,
  ChatCartItem,
  ChatCategory,
  ChatCustomerDetails,
  ChatFormSubmitDetail,
  ChatMessage,
  ChatMoney,
  ChatOption,
  ChatOptionSelectEventDetail,
  ChatProduct,
  ChatQuantityChangeDetail,
  ChatSendDetail,
  ChatMode,
  JourneyMenuItem,
  KromaChat,
} from "../components/chat";

window.bootstrap = bootstrap;

const themeStylesheet = document.createElement("link");
themeStylesheet.id = "kroma-theme-stylesheet";
themeStylesheet.rel = "stylesheet";
document.head.append(themeStylesheet);

document.documentElement.setAttribute("data-kroma-theme", "bootstrap");
document.documentElement.setAttribute("data-bs-theme", "dark");

initializeThemeDropdown(bootstrap);
initializeContrastDropdown(bootstrap);
initializeColorTokenPalette();
const commerceDemoCleanups = new WeakMap<KromaChat, () => void>();
document.querySelectorAll<KromaChat>("kroma-chat[data-demo='commerce-journey']").forEach((chat) => {
  const modeControl = document.querySelector<HTMLSelectElement>("[data-chat-mode]");
  if (chat.mode === "default") commerceDemoCleanups.set(chat, initializeCommerceJourneyDemo(chat));
  if (!modeControl) return;

  modeControl.value = chat.mode;
  modeControl.addEventListener("change", () => {
    const nextMode: ChatMode = modeControl.value === "kitchen" ? "kitchen" : "default";
    if (nextMode === chat.mode) return;
    commerceDemoCleanups.get(chat)?.();
    commerceDemoCleanups.delete(chat);
    chat.mode = nextMode;
    if (nextMode === "default") commerceDemoCleanups.set(chat, initializeCommerceJourneyDemo(chat));
  });
});

document.querySelectorAll<HTMLElement>('[data-bs-toggle="tooltip"]').forEach((element) => new bootstrap.Tooltip(element));
document.querySelectorAll<HTMLElement>('[data-bs-toggle="popover"]').forEach((element) => new bootstrap.Popover(element));
document.querySelectorAll<HTMLElement>(".toast").forEach((element) => {
  element.classList.remove("fade", "hide");
  element.classList.add("show");
});
document.querySelectorAll<HTMLElement>('[data-bs-spy="scroll"]').forEach((element) => bootstrap.ScrollSpy.getOrCreateInstance(element));
document.querySelectorAll<HTMLAnchorElement>('a[href="#"]').forEach((link) => {
  link.addEventListener("click", (event) => event.preventDefault());
});

type DemoCategoryId = "all" | "clothing" | "accessories";
type DemoCartLine = { readonly id: string; readonly productId: string; readonly variantId?: string; readonly quantity: number };
type JourneyState =
  | { readonly step: "welcome"; readonly cart: readonly DemoCartLine[] }
  | { readonly step: "search-options"; readonly cart: readonly DemoCartLine[] }
  | { readonly step: "search-query"; readonly cart: readonly DemoCartLine[] }
  | { readonly step: "search-results"; readonly cart: readonly DemoCartLine[]; readonly query: string; readonly productIds: readonly string[] }
  | { readonly step: "order-help"; readonly cart: readonly DemoCartLine[] }
  | { readonly step: "advisor-reason"; readonly cart: readonly DemoCartLine[] }
  | { readonly step: "advisor-topic"; readonly cart: readonly DemoCartLine[]; readonly reason: string }
  | { readonly step: "advisor-follow-up"; readonly cart: readonly DemoCartLine[]; readonly reason: string; readonly topic: string }
  | { readonly step: "advisor-note"; readonly cart: readonly DemoCartLine[] }
  | { readonly step: "advisor-note-received"; readonly cart: readonly DemoCartLine[] }
  | { readonly step: "cart-edit"; readonly cart: readonly DemoCartLine[]; readonly draftCart: readonly DemoCartLine[]; readonly revision: number }
  | { readonly step: "categories"; readonly cart: readonly DemoCartLine[] }
  | { readonly step: "products"; readonly cart: readonly DemoCartLine[]; readonly categoryId: DemoCategoryId }
  | { readonly step: "product-detail"; readonly cart: readonly DemoCartLine[]; readonly categoryId: DemoCategoryId; readonly productId: string; readonly variantId?: string; readonly quantity: number }
  | { readonly step: "after-add"; readonly cart: readonly DemoCartLine[]; readonly categoryId: DemoCategoryId; readonly productId: string }
  | { readonly step: "cart"; readonly cart: readonly DemoCartLine[] }
  | { readonly step: "customer-information"; readonly cart: readonly DemoCartLine[]; readonly customer?: ChatCustomerDetails }
  | { readonly step: "order-review"; readonly cart: readonly DemoCartLine[]; readonly customer: ChatCustomerDetails }
  | { readonly step: "completed"; readonly cart: readonly DemoCartLine[]; readonly customer: ChatCustomerDetails; readonly reference: string };

type JourneyEvent =
  | { readonly type: "explore-products" }
  | { readonly type: "search-products" }
  | { readonly type: "search-query" }
  | { readonly type: "search-results"; readonly query: string; readonly productIds: readonly string[] }
  | { readonly type: "show-order-help" }
  | { readonly type: "start-advisor" }
  | { readonly type: "advisor-reason"; readonly reason: string }
  | { readonly type: "advisor-topic"; readonly reason: string; readonly topic: string }
  | { readonly type: "advisor-note" }
  | { readonly type: "advisor-note-received" }
  | { readonly type: "home" }
  | { readonly type: "choose-category"; readonly categoryId: DemoCategoryId }
  | { readonly type: "choose-product"; readonly productId: string }
  | { readonly type: "choose-variant"; readonly productId?: string; readonly variantId?: string }
  | { readonly type: "change-quantity"; readonly productId?: string; readonly quantity: number }
  | { readonly type: "add-product"; readonly productId?: string; readonly variantId?: string; readonly quantity?: number }
  | { readonly type: "back-to-products" }
  | { readonly type: "back-to-categories" }
  | { readonly type: "continue-shopping" }
  | { readonly type: "view-cart" }
  | { readonly type: "edit-cart-quantities"; readonly revision: number }
  | { readonly type: "change-cart-quantity"; readonly lineId: string; readonly quantity: number; readonly revision: number }
  | { readonly type: "save-cart-quantities"; readonly revision: number }
  | { readonly type: "cancel-cart-quantities"; readonly revision: number }
  | { readonly type: "remove-item"; readonly lineId?: string }
  | { readonly type: "checkout" }
  | { readonly type: "back-to-cart" }
  | { readonly type: "submit-customer"; readonly customer: ChatCustomerDetails }
  | { readonly type: "edit-customer" }
  | { readonly type: "confirm-order" }
  | { readonly type: "restart" };

const demoCategories: ChatCategory[] = [
  { id: "all", label: "Todos", icon: "all" },
  { id: "clothing", label: "Ropa", icon: "clothing" },
  { id: "accessories", label: "Accesorios", icon: "accessories" },
];

const demoProducts: ChatProduct[] = [
  {
    id: "cotton-polo",
    name: "Polo de algodón",
    summary: "Algodón suave, cuello redondo y corte clásico.",
    description: "Polo de algodón suave, con cuello redondo y un corte clásico para el uso diario.",
    image: { src: chatPoloImage, alt: "Polo blanco de algodón" },
    price: { amount: 49, currency: "PEN", label: "S/ 49.00" },
    features: ["Algodón suave", "Colores blanco y negro", "Lavable a máquina"],
    variants: [
      { id: "polo-size-s", label: "Talla S", value: "S" },
      { id: "polo-size-m", label: "Talla M", value: "M" },
      { id: "polo-size-l", label: "Talla L", value: "L" },
    ],
  },
  {
    id: "light-jacket",
    name: "Casaca ligera",
    summary: "Una capa versátil para días frescos.",
    description: "Casaca ligera y versátil para usar durante los días frescos.",
    image: { src: chatJacketImage, alt: "Casaca ligera color grafito" },
    price: { amount: 129, currency: "PEN", label: "S/ 129.00" },
    features: ["Tela ligera", "Bolsillos laterales", "Cierre frontal"],
    variants: [
      { id: "jacket-size-s", label: "Talla S", value: "S" },
      { id: "jacket-size-m", label: "Talla M", value: "M" },
    ],
  },
  {
    id: "folding-bottle",
    name: "Botella reutilizable",
    summary: "Formato compacto para llevar contigo.",
    description: "Botella reutilizable de formato compacto para llevar contigo.",
    image: { src: chatBottleImage, alt: "Botella reutilizable de acero grafito" },
    price: { amount: 35, currency: "PEN", label: "S/ 35.00" },
    features: ["Tapa a rosca", "Fácil de transportar"],
  },
  {
    id: "urban-sneaker",
    name: "Zapatilla urbana",
    summary: "Diseño ligero para todos los días.",
    description: "Zapatilla urbana ligera en blanco con detalles grafito.",
    image: { src: chatSneakerImage, alt: "Zapatilla urbana blanca" },
    price: { amount: 129, currency: "PEN", label: "S/ 129.00" },
    features: ["Suela flexible", "Malla transpirable"],
    variants: [
      { id: "sneaker-size-38", label: "Talla 38", value: "38" },
      { id: "sneaker-size-40", label: "Talla 40", value: "40" },
      { id: "sneaker-size-42", label: "Talla 42", value: "42" },
    ],
  },
  {
    id: "classic-cap",
    name: "Gorra clásica",
    summary: "Algodón con ajuste posterior.",
    description: "Gorra de algodón azul noche con ajuste posterior.",
    image: { src: chatCapImage, alt: "Gorra azul noche" },
    price: { amount: 39, currency: "PEN", label: "S/ 39.00" },
    features: ["Algodón tejido", "Ajuste regulable"],
  },
];

const productsByCategory: Record<DemoCategoryId, readonly string[]> = {
  all: demoProducts.map((product) => product.id),
  clothing: ["cotton-polo", "light-jacket", "urban-sneaker"],
  accessories: ["folding-bottle", "classic-cap"],
};

function getDemoProduct(productId: string) {
  return demoProducts.find((product) => product.id === productId);
}

function makeMoney(amount: number): ChatMoney {
  return { amount, currency: "PEN", label: `S/ ${amount.toFixed(2)}` };
}

function toCartItems(lines: readonly DemoCartLine[]): ChatCartItem[] {
  return lines.flatMap((line) => {
    const product = getDemoProduct(line.productId);
    if (!product) return [];
    const variant = product.variants?.find((item) => item.id === line.variantId);
    return [{
      id: line.id,
      product,
      variantLabel: variant?.label,
      quantity: line.quantity,
      unitPrice: product.price,
      lineTotal: product.price ? makeMoney(product.price.amount * line.quantity) : undefined,
    }];
  });
}

function calculateSubtotal(lines: readonly DemoCartLine[]) {
  return makeMoney(lines.reduce((sum, line) => sum + (getDemoProduct(line.productId)?.price?.amount || 0) * line.quantity, 0));
}

function freshJourney(): JourneyState {
  return { step: "welcome", cart: [] };
}

function welcomeMessage(): ChatMessage {
  const items: JourneyMenuItem[] = [
    { id: "browse-products", label: "Explorar productos", description: "Ver categorías y productos", icon: "browse" },
    { id: "search-product", label: "Buscar un producto", description: "Encuentra un artículo específico", icon: "search" },
    { id: "order-status", label: "Consultar un pedido", description: "Consulta el estado de una solicitud", icon: "orders" },
    { id: "advisor", label: "Hablar con un asesor", description: "Recibe ayuda personalizada", icon: "advisor" },
  ];
  return { author: "assistant", type: "journey-menu", text: "¡Hola! Bienvenido. ¿Qué te gustaría hacer hoy?", items };
}

function categoriesMessage(): ChatMessage {
  return { author: "assistant", type: "category-picker", text: "Estas son nuestras categorías. Selecciona una para explorar los productos.", categories: demoCategories };
}

function quickReplies(text: string, replies: ChatOption[]): ChatMessage {
  return { author: "assistant", type: "quick-replies", text, replies };
}

function renderJourney(chat: KromaChat, state: JourneyState, onProductDetail?: (messageId: string) => void) {
  switch (state.step) {
    case "welcome":
      chat.addMessage(welcomeMessage());
      return;
    case "search-options":
      chat.addMessage(quickReplies("¿Cómo prefieres buscar?", [
        { id: "search-categories", label: "Explorar categorías", value: "explore-products" },
        { id: "search-all", label: "Ver productos disponibles", value: "browse-all" },
        { id: "search-name", label: "Escribir el nombre", value: "write-product-name" },
      ]));
      return;
    case "search-query":
      chat.addMessage({ author: "assistant", text: "Escribe un nombre del catálogo ficticio de esta demostración." });
      chat.addMessage(quickReplies("También puedes explorar por categoría.", [{ id: "search-back", label: "Explorar categorías", value: "explore-products" }]));
      return;
    case "search-results": {
      const products = state.productIds.map(getDemoProduct).filter((product): product is ChatProduct => Boolean(product));
      if (products.length) {
        const prompt = state.query ? `Coincidencias de ejemplo para “${state.query}”.` : "Estos son los productos ficticios disponibles en la demostración.";
        chat.addMessage({ author: "assistant", type: "product-list", text: prompt, products, productActionLabel: "Ver producto" });
        const replies: ChatOption[] = [
          { id: "search-again", label: "Cambiar búsqueda", value: "search-again" },
          { id: "search-categories", label: "Explorar categorías", value: "explore-products" },
        ];
        if (state.cart.length) replies.push({ id: "cart", label: `Ver mi selección (${state.cart.length})`, value: "view-cart" });
        chat.addMessage(quickReplies("El catálogo de la demostración es ficticio y limitado.", replies));
      } else {
        chat.addMessage({ author: "system", type: "status", status: "neutral", text: `No hay coincidencias de ejemplo para “${state.query}”.` });
        chat.addMessage(quickReplies("Puedes probar otra búsqueda o explorar las categorías.", [
          { id: "search-again", label: "Cambiar búsqueda", value: "search-again" },
          { id: "search-categories", label: "Explorar categorías", value: "explore-products" },
        ]));
      }
      return;
    }
    case "order-help":
      chat.addMessage({ author: "system", type: "status", status: "neutral", text: "La consulta de pedidos no está conectada en esta demostración. No se consultan ni se inventan estados de pedidos." });
      chat.addMessage(quickReplies("Puedes continuar con el catálogo de ejemplo.", [
        { id: "order-browse", label: "Explorar productos", value: "explore-products" },
        { id: "order-home", label: "Volver al inicio", value: "home" },
      ]));
      return;
    case "advisor-reason":
      chat.addMessage({ author: "assistant", type: "choice-list", text: "¿Sobre qué necesitas orientación?", choices: [
        { id: "advisor-product", title: "Un producto", description: "Características o variantes", value: "product" },
        { id: "advisor-selection", title: "Mi selección", description: "Cantidades o productos guardados", value: "selection" },
        { id: "advisor-order", title: "Un pedido", description: "La consulta real no está disponible en la demo", value: "order" },
      ] });
      return;
    case "advisor-topic":
      chat.addMessage(quickReplies("Elige el tema que mejor describe tu consulta.", state.reason === "product" ? [
        { id: "advisor-features", label: "Características", value: "features" },
        { id: "advisor-variants", label: "Tallas y variantes", value: "variants" },
      ] : state.reason === "selection" ? [
        { id: "advisor-quantities", label: "Modificar cantidades", value: "quantities" },
        { id: "advisor-review", label: "Revisar mi selección", value: "review" },
      ] : [
        { id: "advisor-order-status", label: "Estado de un pedido", value: "order-status" },
        { id: "advisor-other", label: "Otro motivo", value: "other" },
      ]));
      return;
    case "advisor-follow-up":
      chat.addMessage({ author: "system", type: "status", status: "neutral", text: "La atención humana no está conectada en esta demostración. No se ha contactado a ningún asesor." });
      chat.addMessage(quickReplies("Si quieres, puedes añadir contexto localmente o volver a las opciones.", [
        { id: "advisor-note", label: "Añadir información", value: "advisor-note" },
        { id: "advisor-home", label: "Volver al inicio", value: "home" },
      ]));
      return;
    case "advisor-note":
      chat.addMessage({ author: "assistant", text: "Escribe información adicional. Permanecerá en esta demostración y no se enviará a un asesor." });
      return;
    case "advisor-note-received":
      chat.addMessage({ author: "system", type: "status", status: "neutral", text: "La información solo quedó en el historial local. No se envió a un asesor ni a un servidor." });
      chat.addMessage(quickReplies("Puedes continuar con el catálogo de ejemplo.", [
        { id: "advisor-browse", label: "Explorar productos", value: "explore-products" },
        { id: "advisor-home", label: "Volver al inicio", value: "home" },
      ]));
      return;
    case "cart-edit":
      chat.addMessage({ author: "assistant", text: "Ajusta las cantidades. Los cambios se aplicarán al guardar." });
      state.draftCart.forEach((line) => {
        const product = getDemoProduct(line.productId);
        if (!product) return;
        const variant = product.variants?.find((item) => item.id === line.variantId);
        chat.addMessage({ author: "assistant", type: "quantity-selector", controlId: `cart-edit:${state.revision}:${line.id}`, productId: line.id, label: [product.name, variant?.label].filter(Boolean).join(" · "), value: line.quantity, minimum: 1, maximum: 99, decreaseLabel: "Reducir cantidad", increaseLabel: "Aumentar cantidad" });
      });
      chat.addMessage(quickReplies("¿Listo?", [
        { id: "save-cart-edits", label: "Guardar cambios", value: `save-cart:${state.revision}` },
        { id: "cancel-cart-edits", label: "Cancelar", value: `cancel-cart:${state.revision}` },
      ]));
      return;
    case "categories":
      chat.addMessage(categoriesMessage());
      return;
    case "products": {
      const products = productsByCategory[state.categoryId].map(getDemoProduct).filter((product): product is ChatProduct => Boolean(product));
      const prompt = state.categoryId === "clothing"
        ? "Estos son los productos de ropa. Selecciona uno para conocer sus características."
        : state.categoryId === "accessories"
          ? "Este es un accesorio de ejemplo. Selecciónalo para ver sus características."
          : "Explora los productos ficticios disponibles en esta demostración.";
      chat.addMessage({ author: "assistant", type: "product-list", text: prompt, products, productActionLabel: "Ver producto" });
      const replies: ChatOption[] = state.cart.length
        ? [
          { id: "categories", label: "Cambiar categoría", value: "back-categories" },
          { id: "cart", label: `Ver mi selección (${state.cart.length})`, value: "view-cart" },
        ]
        : [
          { id: "categories", label: "Cambiar categoría", value: "back-categories" },
          { id: "home", label: "Volver al inicio", value: "home" },
        ];
      chat.addMessage(quickReplies("También puedes navegar por las opciones anteriores.", replies));
      return;
    }
    case "product-detail": {
      const product = getDemoProduct(state.productId);
      if (!product) {
        chat.addMessage({ author: "system", type: "status", status: "error", text: "No encontramos ese producto en el catálogo de ejemplo." });
        return;
      }
      const messageId = chat.addMessage({
        author: "assistant",
        type: "product-detail",
        product,
        selectedVariantId: state.variantId,
        variantLabel: "Selecciona una talla",
        quantity: state.quantity,
        quantityLabel: "Cantidad",
        decreaseQuantityLabel: "Reducir cantidad",
        increaseQuantityLabel: "Aumentar cantidad",
        minimumQuantity: 1,
        maximumQuantity: 10,
        requiresVariant: Boolean(product.variants?.length),
        addActionLabel: "Agregar a mi selección",
        backActionLabel: "Ver otros productos",
        actionMessage: "Agregar producto a mi selección",
      });
      onProductDetail?.(messageId);
      const detailActions: ChatOption[] = [{ id: "change-category", label: "Cambiar categoría", value: "back-categories" }];
      if (state.cart.length) detailActions.unshift({ id: "cart", label: `Revisar selección (${state.cart.length})`, value: "view-cart" });
      chat.addMessage(quickReplies(state.cart.length ? "También puedes cambiar de categoría o revisar lo que llevas." : "Puedes cambiar de categoría o volver a la lista.", detailActions));
      return;
    }
    case "after-add":
      chat.addMessage({ author: "assistant", text: "Producto agregado a tu selección. Puedes seguir explorando o revisar lo que llevas." });
      chat.addMessage(quickReplies("¿Qué prefieres hacer?", [
        { id: "continue", label: "Seguir explorando", value: "continue-shopping" },
        { id: "cart", label: `Revisar selección (${state.cart.length})`, value: "view-cart" },
      ]));
      return;
    case "cart":
      chat.addMessage({
        author: "assistant",
        type: "cart-summary",
        text: "Este es el resumen de los productos seleccionados.",
        items: toCartItems(state.cart).map((item) => ({
          ...item,
          actions: [
            { id: "edit-quantity", label: "Editar cantidad", value: item.id, messageText: "Editar cantidades" },
            { id: "remove-item", label: "Quitar", value: item.id, messageText: `Quitar ${item.product.name}` },
          ],
        })),
        subtotal: state.cart.length ? calculateSubtotal(state.cart) : undefined,
        subtotalTitle: "Subtotal de ejemplo",
        continueLabel: state.cart.length ? "Continuar con mis datos" : undefined,
        removeItemLabel: "Quitar",
        emptyLabel: "Tu selección está vacía. Puedes seguir explorando productos.",
      });
      chat.addMessage(quickReplies("Puedes seguir explorando o solicitar orientación.", [
        { id: "browse", label: "Seguir explorando", value: "continue-shopping" },
        { id: "advisor", label: "Solicitar atención", value: "start-advisor" },
      ]));
      return;
    case "customer-information":
      chat.addMessage({
        author: "assistant",
        type: "conversational-form",
        text: "Para preparar tu solicitud de ejemplo, necesitamos algunos datos.",
        fields: [
          { id: "name", name: "name", label: "Nombre", type: "text", required: true, placeholder: "Tu nombre", autocomplete: "name", value: state.customer?.name },
          { id: "contact", name: "contact", label: "Correo o teléfono", type: "text", required: true, placeholder: "Dato de contacto", value: state.customer?.contact },
          { id: "delivery", name: "delivery", label: "Dirección o zona de entrega", type: "text", required: true, placeholder: "Zona de entrega", autocomplete: "street-address", value: state.customer?.delivery },
        ],
        submitLabel: "Revisar solicitud",
      });
      chat.addMessage(quickReplies("Los datos solo permanecen en esta demostración.", [{ id: "back-cart", label: "Volver al resumen", value: "back-to-cart" }]));
      return;
    case "order-review":
      chat.addMessage({
        author: "assistant",
        type: "order-review",
        text: "Revisa los datos antes de confirmar tu solicitud de ejemplo.",
        customer: state.customer,
        customerLabels: { name: "Cliente", contact: "Contacto", delivery: "Entrega" },
        items: toCartItems(state.cart),
        subtotal: calculateSubtotal(state.cart),
        subtotalTitle: "Subtotal de ejemplo",
        confirmLabel: "Confirmar solicitud simulada",
        editLabel: "Editar datos",
        removeItemLabel: "Quitar",
      });
      return;
    case "completed":
      chat.addMessage({
        author: "assistant",
        type: "confirmation",
        title: "Solicitud simulada",
        description: "Has completado el recorrido de ejemplo. No se ha registrado ningún pedido real ni enviado información a un servidor.",
        reference: `Referencia de simulación #${state.reference}`,
        summary: state.cart.map((line) => `${getDemoProduct(line.productId)?.name || line.productId} × ${line.quantity}`),
        action: { id: "restart-journey", label: "Iniciar otra conversación", value: "restart", messageText: "Iniciar otra conversación" },
      });
  }
}

function initializeCommerceJourneyDemo(chat: KromaChat) {
  const listeners = new AbortController();
  let state = freshJourney();
  let pendingReply = 0;
  let productDetailMessageId: string | null = null;
  let cartEditRevision = 0;
  const render = () => renderJourney(chat, state, (messageId) => { productDetailMessageId = messageId; });
  render();

  const transition = (event: JourneyEvent, delayed = true, renderResult = true) => {
    const next = reduceJourney(state, event);
    if (next === state) return;
    const keepProductDetailMessage = state.step === "product-detail" && next.step === "product-detail";
    state = next;
    if (!keepProductDetailMessage) productDetailMessageId = null;
    chat.interactionMode = "guided";
    const revision = ++pendingReply;
    if (renderResult) chat.disableHistoryControls();
    if (!delayed) {
      if (renderResult) render();
      return;
    }
    chat.setTyping(true, "El asistente está escribiendo");
    window.setTimeout(() => {
      if (revision !== pendingReply) return;
      chat.setTyping(false);
      render();
    }, 420);
  };

  chat.addEventListener("kroma-chat-action", (event) => {
    const detail = (event as CustomEvent<ChatActionDetail>).detail;
    switch (detail.control) {
      case "journey-menu":
        if (detail.value === "browse-products") transition({ type: "explore-products" });
        else if (detail.value === "search-product") transition({ type: "search-products" });
        else if (detail.value === "order-status") transition({ type: "show-order-help" });
        else if (detail.value === "advisor") transition({ type: "start-advisor" });
        break;
      case "category-picker":
        if (detail.value === "all" || detail.value === "clothing" || detail.value === "accessories") transition({ type: "choose-category", categoryId: detail.value });
        break;
      case "product-card":
      case "product-list":
      case "product-carousel":
        if (detail.data?.productId) transition({ type: "choose-product", productId: detail.data.productId });
        break;
      case "product-detail":
        if (detail.messageId !== productDetailMessageId) break;
        if (detail.actionId === "back-to-products") transition({ type: "back-to-products" });
        else if (detail.actionId === "add-to-cart") transition({ type: "add-product", productId: detail.data?.productId, variantId: detail.data?.variantId, quantity: detail.data?.quantity });
        break;
      case "product-variant-selector":
        if (detail.messageId === productDetailMessageId) transition({ type: "choose-variant", productId: detail.data?.productId, variantId: detail.data?.variantId }, false, false);
        break;
      case "cart-summary":
        if (detail.actionId === "remove-item") transition({ type: "remove-item", lineId: detail.data?.lineId || detail.value });
        else if (detail.actionId === "edit-quantity") transition({ type: "edit-cart-quantities", revision: ++cartEditRevision });
        else if (detail.actionId === "continue") transition({ type: "checkout" });
        break;
      case "order-review":
        if (detail.actionId === "confirm") transition({ type: "confirm-order" });
        else if (detail.actionId === "edit") transition({ type: "edit-customer" });
        break;
      case "confirmation":
        if (detail.actionId === "restart-journey") transition({ type: "restart" });
        break;
      default:
        break;
    }
  }, { signal: listeners.signal });

  chat.addEventListener("kroma-chat-quantity-change", (event) => {
    const detail = (event as CustomEvent<ChatQuantityChangeDetail>).detail;
    if (state.step === "product-detail" && detail.messageId === productDetailMessageId) {
      transition({ type: "change-quantity", productId: detail.productId, quantity: detail.quantity }, false, false);
      return;
    }
    if (state.step === "cart-edit") {
      const match = /^cart-edit:(\d+):(.+)$/.exec(detail.controlId);
      if (match) transition({ type: "change-cart-quantity", revision: Number(match[1]), lineId: match[2], quantity: detail.quantity }, false, false);
    }
  }, { signal: listeners.signal });

  chat.addEventListener("kroma-chat-form-submit", (event) => {
    const detail = (event as CustomEvent<ChatFormSubmitDetail>).detail;
    transition({
      type: "submit-customer",
      customer: { name: detail.values.name || "", contact: detail.values.contact || "", delivery: detail.values.delivery || "" },
    });
  }, { signal: listeners.signal });

  chat.addEventListener("kroma-chat-option-select", (event) => {
    const detail = (event as CustomEvent<ChatOptionSelectEventDetail>).detail;
    const saveRevision = /^save-cart:(\d+)$/.exec(detail.value);
    if (saveRevision) {
      transition({ type: "save-cart-quantities", revision: Number(saveRevision[1]) });
      return;
    }
    const cancelRevision = /^cancel-cart:(\d+)$/.exec(detail.value);
    if (cancelRevision) {
      transition({ type: "cancel-cart-quantities", revision: Number(cancelRevision[1]) });
      return;
    }
    switch (detail.value) {
      case "continue-shopping":
        transition({ type: "continue-shopping" });
        break;
      case "view-cart":
        transition({ type: "view-cart" });
        break;
      case "browse-all":
        transition({ type: "search-results", query: "", productIds: demoProducts.map((product) => product.id) });
        break;
      case "write-product-name":
      case "search-again":
        transition({ type: "search-query" });
        chat.interactionMode = "free-text";
        break;
      case "start-advisor":
        transition({ type: "start-advisor" });
        break;
      case "advisor-note":
        transition({ type: "advisor-note" });
        chat.interactionMode = "free-text";
        break;
      case "back-to-cart":
        transition({ type: "back-to-cart" });
        break;
      case "back-categories":
        transition({ type: "back-to-categories" });
        break;
      case "back-home":
      case "home":
        transition({ type: "home" });
        break;
      case "explore-products":
        transition({ type: "explore-products" });
        break;
      default:
        if (state.step === "advisor-reason" && ["product", "selection", "order"].includes(detail.value)) {
          transition({ type: "advisor-reason", reason: detail.value });
        } else if (state.step === "advisor-topic") {
          transition({ type: "advisor-topic", reason: state.reason, topic: detail.value });
        }
        break;
    }
  }, { signal: listeners.signal });

  chat.addEventListener("kroma-chat-send", (event) => {
    const detail = (event as CustomEvent<ChatSendDetail>).detail;
    if (state.step === "search-query") {
      const query = detail.message.trim();
      const normalizedQuery = normalizeSearchText(query);
      const productIds = demoProducts.filter((product) => [product.name, product.summary, product.description, ...(product.features || [])]
        .some((text) => normalizeSearchText(text || "").includes(normalizedQuery)))
        .map((product) => product.id);
      transition({ type: "search-results", query, productIds });
      return;
    }
    if (state.step === "advisor-note") {
      transition({ type: "advisor-note-received" });
      return;
    }
    const revision = ++pendingReply;
    chat.setTyping(true, "El asistente está escribiendo");
    window.setTimeout(() => {
      if (revision !== pendingReply) return;
      chat.setTyping(false);
      chat.addMessage({ author: "system", type: "status", status: "neutral", text: "La escritura libre no está conectada a un asistente en esta demostración. Usa las opciones guiadas para explorar el catálogo de ejemplo." });
      const replies: ChatOption[] = [{ id: "browse", label: "Explorar categorías", value: "explore-products" }];
      if (state.cart.length) replies.push({ id: "cart", label: `Ver mi selección (${state.cart.length})`, value: "view-cart" });
      chat.addMessage(quickReplies("¿Qué prefieres hacer?", replies));
    }, 420);
  }, { signal: listeners.signal });

  return () => {
    pendingReply++;
    listeners.abort();
  };
}

function reduceJourney(state: JourneyState, event: JourneyEvent): JourneyState {
  switch (event.type) {
    case "explore-products":
      return ["welcome", "search-options", "search-query", "search-results", "order-help", "after-add", "cart", "customer-information", "advisor-reason", "advisor-topic", "advisor-follow-up", "advisor-note-received"].includes(state.step)
        ? { step: "categories", cart: state.cart }
        : state;
    case "search-products":
      return ["welcome", "search-options", "search-query", "search-results"].includes(state.step) ? { step: "search-options", cart: state.cart } : state;
    case "search-query":
      return ["search-options", "search-results"].includes(state.step) ? { step: "search-query", cart: state.cart } : state;
    case "search-results":
      return ["search-options", "search-query"].includes(state.step)
        ? { step: "search-results", cart: state.cart, query: event.query, productIds: event.productIds }
        : state;
    case "show-order-help":
      return state.step === "welcome" ? { step: "order-help", cart: state.cart } : state;
    case "start-advisor":
      return ["welcome", "cart", "after-add"].includes(state.step) ? { step: "advisor-reason", cart: state.cart } : state;
    case "advisor-reason":
      return state.step === "advisor-reason" ? { step: "advisor-topic", cart: state.cart, reason: event.reason } : state;
    case "advisor-topic":
      return state.step === "advisor-topic" && state.reason === event.reason
        ? { step: "advisor-follow-up", cart: state.cart, reason: event.reason, topic: event.topic }
        : state;
    case "advisor-note":
      return state.step === "advisor-follow-up" ? { step: "advisor-note", cart: state.cart } : state;
    case "advisor-note-received":
      return state.step === "advisor-note" ? { step: "advisor-note-received", cart: state.cart } : state;
    case "home":
      return { step: "welcome", cart: state.cart };
    case "choose-category":
      return state.step === "categories" && demoCategories.some((category) => category.id === event.categoryId)
        ? { step: "products", cart: state.cart, categoryId: event.categoryId }
        : state;
    case "choose-product": {
      if (state.step !== "products" && state.step !== "search-results") return state;
      const allowedProducts = state.step === "products" ? productsByCategory[state.categoryId] : state.productIds;
      if (!allowedProducts.includes(event.productId)) return state;
      const product = getDemoProduct(event.productId);
      if (!product) return state;
      const categoryId = state.step === "products"
        ? state.categoryId
        : productsByCategory.clothing.includes(product.id) ? "clothing" : productsByCategory.accessories.includes(product.id) ? "accessories" : "all";
      return { step: "product-detail", cart: state.cart, categoryId, productId: product.id, quantity: 1 };
    }
    case "choose-variant": {
      if (state.step !== "product-detail" || (event.productId && event.productId !== state.productId)) return state;
      const variants = getDemoProduct(state.productId)?.variants || [];
      return event.variantId && variants.some((variant) => variant.id === event.variantId) ? { ...state, variantId: event.variantId } : state;
    }
    case "change-quantity":
      if (state.step !== "product-detail" || (event.productId && event.productId !== state.productId)) return state;
      return { ...state, quantity: Math.max(1, Math.min(10, Math.floor(event.quantity))) };
    case "add-product": {
      if (state.step !== "product-detail" || (event.productId && event.productId !== state.productId)) return state;
      const productId = state.productId;
      const product = getDemoProduct(productId);
      const variantId = event.variantId || state.variantId;
      if (!product || (product.variants?.length && !product.variants.some((variant) => variant.id === variantId))) return state;
      const lineId = `${productId}:${variantId || "default"}`;
      const quantity = Math.max(1, Math.min(10, Math.floor(event.quantity || state.quantity)));
      const existing = state.cart.find((line) => line.id === lineId);
      const cart = existing
        ? state.cart.map((line) => line.id === lineId ? { ...line, quantity: Math.min(99, line.quantity + quantity) } : line)
        : [...state.cart, { id: lineId, productId, variantId, quantity }];
      return { step: "after-add", cart, categoryId: state.categoryId, productId };
    }
    case "back-to-products":
      return state.step === "product-detail" ? { step: "products", cart: state.cart, categoryId: state.categoryId } : state;
    case "back-to-categories":
      return state.step === "products" || state.step === "product-detail" ? { step: "categories", cart: state.cart } : state;
    case "continue-shopping":
      if (state.step === "after-add") return { step: "products", cart: state.cart, categoryId: state.categoryId };
      if (state.step === "cart" || state.step === "customer-information") return { step: "categories", cart: state.cart };
      return state;
    case "view-cart":
      return state.cart.length && ["welcome", "search-results", "products", "product-detail", "after-add", "advisor-topic", "advisor-follow-up", "advisor-note-received"].includes(state.step)
        ? { step: "cart", cart: state.cart }
        : state;
    case "edit-cart-quantities":
      return state.step === "cart" && state.cart.length
        ? { step: "cart-edit", cart: state.cart, draftCart: state.cart.map((line) => ({ ...line })), revision: event.revision }
        : state;
    case "change-cart-quantity":
      if (state.step !== "cart-edit" || state.revision !== event.revision || !state.draftCart.some((line) => line.id === event.lineId)) return state;
      return { ...state, draftCart: state.draftCart.map((line) => line.id === event.lineId ? { ...line, quantity: Math.max(1, Math.min(99, Math.floor(event.quantity))) } : line) };
    case "save-cart-quantities":
      return state.step === "cart-edit" && state.revision === event.revision ? { step: "cart", cart: state.draftCart } : state;
    case "cancel-cart-quantities":
      return state.step === "cart-edit" && state.revision === event.revision ? { step: "cart", cart: state.cart } : state;
    case "remove-item":
      if (state.step !== "cart" || !event.lineId || !state.cart.some((line) => line.id === event.lineId)) return state;
      return { step: "cart", cart: state.cart.filter((line) => line.id !== event.lineId) };
    case "checkout":
      return state.step === "cart" && state.cart.length ? { step: "customer-information", cart: state.cart } : state;
    case "back-to-cart":
      return state.step === "customer-information" || state.step === "order-review" ? { step: "cart", cart: state.cart } : state;
    case "submit-customer":
      return state.step === "customer-information" ? { step: "order-review", cart: state.cart, customer: event.customer } : state;
    case "edit-customer":
      return state.step === "order-review" ? { step: "customer-information", cart: state.cart, customer: state.customer } : state;
    case "confirm-order":
      return state.step === "order-review" ? { step: "completed", cart: state.cart, customer: state.customer, reference: "SIM-001" } : state;
    case "restart":
      return { step: "welcome", cart: [] };
    default:
      return state;
  }
}

function normalizeSearchText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").trim();
}
