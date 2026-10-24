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
  | { readonly step: "unavailable"; readonly cart: readonly DemoCartLine[]; readonly service: string }
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
  | { readonly type: "unavailable"; readonly service: string }
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

function renderJourney(chat: KromaChat, state: JourneyState) {
  switch (state.step) {
    case "welcome":
      chat.addMessage(welcomeMessage());
      return;
    case "unavailable":
      chat.addMessage({ author: "system", type: "status", status: "neutral", text: `${state.service} no está conectado en esta demostración.` });
      chat.addMessage(quickReplies("Puedes explorar el catálogo ficticio o volver al menú.", [
        { id: "browse", label: "Explorar productos", value: "explore-products" },
        { id: "home", label: "Volver al inicio", value: "home" },
      ]));
      return;
    case "categories":
      chat.addMessage(categoriesMessage());
      chat.addMessage(quickReplies("En cualquier momento puedes volver al menú inicial.", [{ id: "home", label: "Volver al inicio", value: "home" }]));
      return;
    case "products": {
      const products = productsByCategory[state.categoryId].map(getDemoProduct).filter((product): product is ChatProduct => Boolean(product));
      const prompt = state.categoryId === "clothing"
        ? "Estos son los productos de ropa. Selecciona uno para conocer sus características."
        : state.categoryId === "accessories"
          ? "Este es un accesorio de ejemplo. Selecciónalo para ver sus características."
          : "Explora los productos ficticios disponibles en esta demostración.";
      chat.addMessage({ author: "assistant", type: "product-list", text: prompt, products, productActionLabel: "Ver producto" });
      const replies: ChatOption[] = [
        { id: "categories", label: "Cambiar categoría", value: "back-categories" },
        { id: "home", label: "Volver al inicio", value: "home" },
      ];
      if (state.cart.length) replies.unshift({ id: "cart", label: `Ver mi selección (${state.cart.length})`, value: "view-cart" });
      chat.addMessage(quickReplies("También puedes navegar por las opciones anteriores.", replies));
      return;
    }
    case "product-detail": {
      const product = getDemoProduct(state.productId);
      if (!product) {
        chat.addMessage({ author: "system", type: "status", status: "error", text: "No encontramos ese producto en el catálogo de ejemplo." });
        return;
      }
      chat.addMessage({
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
      if (state.cart.length) chat.addMessage(quickReplies("También puedes revisar lo que ya elegiste.", [{ id: "cart", label: `Revisar selección (${state.cart.length})`, value: "view-cart" }]));
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
        items: toCartItems(state.cart),
        subtotal: state.cart.length ? calculateSubtotal(state.cart) : undefined,
        subtotalTitle: "Subtotal de ejemplo",
        continueLabel: state.cart.length ? "Continuar con mis datos" : undefined,
        removeItemLabel: "Quitar",
        emptyLabel: "Tu selección está vacía. Puedes seguir explorando productos.",
      });
      chat.addMessage(quickReplies("Puedes agregar más productos antes de continuar.", [
        { id: "browse", label: "Agregar más productos", value: "continue-shopping" },
        { id: "home", label: "Volver al inicio", value: "home" },
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
  renderJourney(chat, state);
  let pendingReply = 0;

  const transition = (event: JourneyEvent, delayed = true, renderResult = true) => {
    const next = reduceJourney(state, event);
    if (next === state) return;
    state = next;
    const revision = ++pendingReply;
    if (!delayed) {
      if (renderResult) renderJourney(chat, state);
      return;
    }
    chat.setTyping(true, "El asistente está escribiendo");
    window.setTimeout(() => {
      if (revision !== pendingReply) return;
      chat.setTyping(false);
      renderJourney(chat, state);
    }, 420);
  };

  chat.addEventListener("kroma-chat-action", (event) => {
    const detail = (event as CustomEvent<ChatActionDetail>).detail;
    switch (detail.control) {
      case "journey-menu":
        if (detail.value === "browse-products") transition({ type: "explore-products" });
        else transition({ type: "unavailable", service: detail.value === "search-product" ? "La búsqueda de productos" : detail.value === "order-status" ? "La consulta de pedidos" : "La atención con asesor" });
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
        if (detail.actionId === "back-to-products") transition({ type: "back-to-products" });
        else if (detail.actionId === "add-to-cart") transition({ type: "add-product", productId: detail.data?.productId, variantId: detail.data?.variantId, quantity: detail.data?.quantity });
        break;
      case "product-variant-selector":
        transition({ type: "choose-variant", productId: detail.data?.productId, variantId: detail.data?.variantId }, false, false);
        break;
      case "cart-summary":
        if (detail.actionId === "remove-item") transition({ type: "remove-item", lineId: detail.data?.lineId || detail.value });
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
    transition({ type: "change-quantity", productId: detail.productId, quantity: detail.quantity }, false, false);
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
    switch (detail.value) {
      case "continue-shopping":
        transition({ type: "continue-shopping" });
        break;
      case "view-cart":
        transition({ type: "view-cart" });
        break;
      case "browse-more":
        transition({ type: "continue-shopping" });
        break;
      case "back-to-cart":
        transition({ type: "back-to-cart" });
        break;
      case "back-categories":
        transition({ type: "back-to-categories" });
        break;
      case "back-home":
        transition({ type: "home" });
        break;
      case "explore-products":
        transition({ type: "explore-products" });
        break;
      default:
        break;
    }
  }, { signal: listeners.signal });

  chat.addEventListener("kroma-chat-send", () => {
    const revision = ++pendingReply;
    chat.setTyping(true, "El asistente está escribiendo");
    window.setTimeout(() => {
      if (revision !== pendingReply) return;
      chat.setTyping(false);
      chat.addMessage({ author: "assistant", text: "Gracias por tu mensaje. Puedo ayudarte a explorar productos o revisar tu selección." });
      chat.addMessage(quickReplies("¿Qué te gustaría hacer?", [
        { id: "browse", label: "Explorar productos", value: "explore-products" },
        { id: "cart", label: "Ver mi selección", value: "view-cart" },
      ]));
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
      return { step: "categories", cart: state.cart };
    case "unavailable":
      return { step: "unavailable", cart: state.cart, service: event.service };
    case "home":
      return { step: "welcome", cart: state.cart };
    case "choose-category":
      return { step: "products", cart: state.cart, categoryId: event.categoryId };
    case "choose-product": {
      if (state.step !== "products") return state;
      const product = getDemoProduct(event.productId);
      if (!product) return state;
      return { step: "product-detail", cart: state.cart, categoryId: state.categoryId, productId: product.id, variantId: product.variants?.[0]?.id, quantity: 1 };
    }
    case "choose-variant":
      if (state.step !== "product-detail" || (event.productId && event.productId !== state.productId)) return state;
      return { ...state, variantId: event.variantId };
    case "change-quantity":
      if (state.step !== "product-detail" || (event.productId && event.productId !== state.productId)) return state;
      return { ...state, quantity: Math.max(1, Math.min(10, Math.floor(event.quantity))) };
    case "add-product": {
      if (state.step !== "product-detail" || (event.productId && event.productId !== state.productId)) return state;
      const productId = state.productId;
      const variantId = event.variantId || state.variantId;
      const lineId = `${productId}:${variantId || "default"}`;
      const quantity = Math.max(1, Math.min(10, Math.floor(event.quantity || state.quantity)));
      const existing = state.cart.find((line) => line.id === lineId);
      const cart = existing
        ? state.cart.map((line) => line.id === lineId ? { ...line, quantity: line.quantity + quantity } : line)
        : [...state.cart, { id: lineId, productId, variantId, quantity }];
      return { step: "after-add", cart, categoryId: state.categoryId, productId };
    }
    case "back-to-products":
      if (state.step !== "product-detail") return state;
      return { step: "products", cart: state.cart, categoryId: state.categoryId };
    case "back-to-categories":
      if (state.step !== "products") return state;
      return { step: "categories", cart: state.cart };
    case "continue-shopping":
      if (state.step === "after-add") return { step: "products", cart: state.cart, categoryId: state.categoryId };
      if (state.step === "cart" || state.step === "customer-information") return { step: "categories", cart: state.cart };
      return state;
    case "view-cart":
      return state.cart.length ? { step: "cart", cart: state.cart } : state;
    case "remove-item":
      if (state.step !== "cart" || !event.lineId) return state;
      return { step: "cart", cart: state.cart.filter((line) => line.id !== event.lineId) };
    case "checkout":
      return state.step === "cart" && state.cart.length ? { step: "customer-information", cart: state.cart } : state;
    case "back-to-cart":
      if (state.step === "customer-information" || state.step === "order-review") return { step: "cart", cart: state.cart };
      return state;
    case "submit-customer":
      if (state.step !== "customer-information") return state;
      return { step: "order-review", cart: state.cart, customer: event.customer };
    case "edit-customer":
      if (state.step !== "order-review") return state;
      return { step: "customer-information", cart: state.cart, customer: state.customer };
    case "confirm-order":
      if (state.step !== "order-review") return state;
      return { step: "completed", cart: state.cart, customer: state.customer, reference: "SIM-001" };
    case "restart":
      return { step: "welcome", cart: [] };
    default:
      return state;
  }
}
