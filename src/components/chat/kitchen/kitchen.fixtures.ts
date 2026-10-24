import type { ChatCartItem, ChatCategory, ChatChoice, ChatMoney, ChatOption, ChatProduct, ChatProductVariant, JourneyMenuItem } from "../core/chat.types";
import poloImage from "../../../assets/chat-polo-v2.png";
import sneakerImage from "../../../assets/chat-sneaker-v2.png";
import capImage from "../../../assets/chat-cap-v2.png";

export const kitchenProducts: ChatProduct[] = [
  {
    id: "kitchen-cotton-polo",
    name: "Polo de algodón",
    summary: "Algodón suave y cómodo.",
    description: "Polo de algodón premium con un acabado suave para el uso diario.",
    image: { src: poloImage, alt: "Polo blanco de algodón" },
    price: { amount: 49, currency: "PEN", label: "S/ 49.00" },
    features: ["Algodón premium", "Corte clásico", "Lavable a máquina"],
    variants: [
      { id: "kitchen-polo-s", label: "S", value: "S" },
      { id: "kitchen-polo-m", label: "M", value: "M" },
      { id: "kitchen-polo-l", label: "L", value: "L" },
      { id: "kitchen-polo-xl", label: "XL · agotado", value: "XL", disabled: true },
    ],
  },
  {
    id: "kitchen-urban-sneaker",
    name: "Zapatilla urbana",
    summary: "Diseño ligero para todos los días.",
    description: "Zapatilla urbana blanca con detalles grafito y suela flexible.",
    image: { src: sneakerImage, alt: "Zapatilla urbana blanca" },
    price: { amount: 129, currency: "PEN", label: "S/ 129.00" },
    features: ["Malla transpirable", "Suela flexible"],
    variants: [
      { id: "kitchen-shoe-38", label: "38", value: "38" },
      { id: "kitchen-shoe-40", label: "40", value: "40" },
      { id: "kitchen-shoe-42", label: "42", value: "42" },
    ],
  },
  {
    id: "kitchen-sport-cap",
    name: "Gorra deportiva",
    summary: "Algodón con ajuste posterior.",
    description: "Gorra de algodón azul noche con ajuste regulable.",
    image: { src: capImage, alt: "Gorra deportiva azul noche" },
    price: { amount: 39, currency: "PEN", label: "S/ 39.00" },
    features: ["Algodón tejido", "Ajuste regulable"],
  },
];

export const kitchenCategories: ChatCategory[] = [
  { id: "all", label: "Todos", description: "Ver todo el catálogo", icon: "all" },
  { id: "clothing", label: "Ropa", description: "Moda y básicos", icon: "clothing" },
  { id: "footwear", label: "Calzado", description: "Zapatillas y más", icon: "search" },
  { id: "accessories", label: "Accesorios", description: "Complementos", icon: "accessories" },
];

export const kitchenJourneyItems: JourneyMenuItem[] = [
  { id: "browse", label: "Explorar productos", description: "Ver categorías y productos", icon: "browse" },
  { id: "search", label: "Buscar un producto", description: "Encuentra un artículo específico", icon: "search" },
  { id: "orders", label: "Consultar un pedido", description: "Revisa el estado de una solicitud", icon: "orders" },
  { id: "advisor", label: "Hablar con un asesor", description: "Recibe ayuda personalizada", icon: "advisor" },
];

export const kitchenQuickReplies: ChatOption[] = [
  { id: "categories", label: "Ver categorías", value: "categories" },
  { id: "offers", label: "Ofertas", value: "offers" },
  { id: "help", label: "Ayuda", value: "help" },
  { id: "unavailable", label: "Deshabilitada", value: "unavailable", disabled: true },
];

export const kitchenChoices: ChatChoice[] = [
  { id: "delivery", title: "Entrega a domicilio", description: "Recibe tu pedido en casa.", value: "delivery" },
  { id: "pickup", title: "Recojo en tienda", description: "Pasa por tu tienda más cercana.", value: "pickup" },
  { id: "later", title: "No disponible", description: "Ejemplo de una opción deshabilitada.", value: "later", disabled: true },
];

export const kitchenVariants: ChatProductVariant[] = [
  { id: "kitchen-variant-s", label: "S", value: "S" },
  { id: "kitchen-variant-m", label: "M", value: "M" },
  { id: "kitchen-variant-l", label: "L", value: "L" },
  { id: "kitchen-variant-xl", label: "XL · agotado", value: "XL", disabled: true },
];

export const kitchenSubtotal: ChatMoney = { amount: 178, currency: "PEN", label: "S/ 178.00" };

export const kitchenCartItems: ChatCartItem[] = [
  {
    id: "kitchen-line-polo",
    product: kitchenProducts[0],
    variantLabel: "Talla M",
    quantity: 1,
    unitPrice: kitchenProducts[0].price,
    lineTotal: kitchenProducts[0].price,
    actions: [{ id: "remove-polo", label: "Quitar", value: "kitchen-line-polo" }],
  },
  {
    id: "kitchen-line-sneaker",
    product: kitchenProducts[1],
    variantLabel: "Talla 40",
    quantity: 1,
    unitPrice: kitchenProducts[1].price,
    lineTotal: kitchenProducts[1].price,
    actions: [{ id: "remove-sneaker", label: "Quitar", value: "kitchen-line-sneaker" }],
  },
];
