import { p as poloImage, s as sneakerImage, c as capImage } from "./app-IuMFl7TV.js";
const kitchenProducts = [
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
      { id: "kitchen-polo-xl", label: "XL · agotado", value: "XL", disabled: true }
    ]
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
      { id: "kitchen-shoe-42", label: "42", value: "42" }
    ]
  },
  {
    id: "kitchen-sport-cap",
    name: "Gorra deportiva",
    summary: "Algodón con ajuste posterior.",
    description: "Gorra de algodón azul noche con ajuste regulable.",
    image: { src: capImage, alt: "Gorra deportiva azul noche" },
    price: { amount: 39, currency: "PEN", label: "S/ 39.00" },
    features: ["Algodón tejido", "Ajuste regulable"]
  }
];
const kitchenCategories = [
  { id: "all", label: "Todos", description: "Ver todo el catálogo", icon: "all" },
  { id: "clothing", label: "Ropa", description: "Moda y básicos", icon: "clothing" },
  { id: "footwear", label: "Calzado", description: "Zapatillas y más", icon: "search" },
  { id: "accessories", label: "Accesorios", description: "Complementos", icon: "accessories" }
];
const kitchenJourneyItems = [
  { id: "browse", label: "Explorar productos", description: "Ver categorías y productos", icon: "browse" },
  { id: "search", label: "Buscar un producto", description: "Encuentra un artículo específico", icon: "search" },
  { id: "orders", label: "Consultar un pedido", description: "Revisa el estado de una solicitud", icon: "orders" },
  { id: "advisor", label: "Hablar con un asesor", description: "Recibe ayuda personalizada", icon: "advisor" }
];
const kitchenQuickReplies = [
  { id: "categories", label: "Ver categorías", value: "categories" },
  { id: "offers", label: "Ofertas", value: "offers" },
  { id: "help", label: "Ayuda", value: "help" },
  { id: "unavailable", label: "Deshabilitada", value: "unavailable", disabled: true }
];
const kitchenChoices = [
  { id: "delivery", title: "Entrega a domicilio", description: "Recibe tu pedido en casa.", value: "delivery" },
  { id: "pickup", title: "Recojo en tienda", description: "Pasa por tu tienda más cercana.", value: "pickup" },
  { id: "later", title: "No disponible", description: "Ejemplo de una opción deshabilitada.", value: "later", disabled: true }
];
const kitchenVariants = [
  { id: "kitchen-variant-s", label: "S", value: "S" },
  { id: "kitchen-variant-m", label: "M", value: "M" },
  { id: "kitchen-variant-l", label: "L", value: "L" },
  { id: "kitchen-variant-xl", label: "XL · agotado", value: "XL", disabled: true }
];
const kitchenSubtotal = { amount: 178, currency: "PEN", label: "S/ 178.00" };
const kitchenCartItems = [
  {
    id: "kitchen-line-polo",
    product: kitchenProducts[0],
    variantLabel: "Talla M",
    quantity: 1,
    unitPrice: kitchenProducts[0].price,
    lineTotal: kitchenProducts[0].price,
    actions: [{ id: "remove-polo", label: "Quitar", value: "kitchen-line-polo" }]
  },
  {
    id: "kitchen-line-sneaker",
    product: kitchenProducts[1],
    variantLabel: "Talla 40",
    quantity: 1,
    unitPrice: kitchenProducts[1].price,
    lineTotal: kitchenProducts[1].price,
    actions: [{ id: "remove-sneaker", label: "Quitar", value: "kitchen-line-sneaker" }]
  }
];
const kitchenLine = kitchenCartItems[0];
const kitchenCatalog = [
  {
    title: "Layout · Chat Header, Chat Message List y Chat Composer",
    description: "El encabezado, el historial desplazable y el composer deshabilitado con teclado virtual son las instancias reales del componente.",
    examples: []
  },
  {
    title: "Virtual Keyboard & Composer",
    description: "Presenta las variantes alfabética, Shift y numérica, además de estados de composer vacío, con texto y deshabilitado.",
    examples: []
  },
  {
    title: "Chat Message",
    description: "Presenta mensajes del asistente y de la persona usuaria con sus horarios.",
    examples: [
      { author: "assistant", type: "text", text: "Hola, soy Kroma. Te acompaño a encontrar lo que necesitas." },
      { author: "user", type: "text", text: "Busco algo cómodo para todos los días." },
      { author: "assistant", type: "text", text: "Claro. Puedo mostrarte algunas opciones." }
    ]
  },
  {
    title: "Rich Message",
    description: "Combina un título, una explicación y una acción accesible.",
    examples: [{
      author: "assistant",
      type: "rich",
      title: "Atención personalizada",
      description: "Nuestro equipo puede ayudarte a elegir una talla o revisar los detalles de un producto.",
      action: { id: "kitchen-help", label: "Ver opciones de ayuda", value: "help" }
    }]
  },
  {
    title: "Quick Replies",
    description: "Ofrece respuestas compactas, incluida una opción deshabilitada.",
    examples: [{ author: "assistant", type: "quick-replies", text: "¿Qué te gustaría explorar?", replies: kitchenQuickReplies }]
  },
  {
    title: "Choice List",
    description: "Presenta alternativas conversacionales con título y detalle.",
    examples: [{ author: "assistant", type: "choice-list", text: "¿Cómo prefieres recibir ayuda?", choices: kitchenChoices }]
  },
  {
    title: "Typing Indicator",
    description: "Muestra el indicador de respuesta del asistente dentro del historial.",
    examples: [{ author: "assistant", type: "typing", label: "Kroma está preparando una respuesta" }]
  },
  {
    title: "Journey Menu",
    description: "Agrupa opciones principales con icono, título, descripción y acceso.",
    examples: [{ author: "assistant", type: "journey-menu", text: "¿En qué puedo ayudarte?", items: kitchenJourneyItems }]
  },
  {
    title: "Journey Option",
    description: "Es una opción individual del menú y conserva el mismo renderer compartido.",
    examples: [{ author: "assistant", type: "journey-menu", text: "Una opción de navegación", items: [kitchenJourneyItems[0]] }]
  },
  {
    title: "Category Picker",
    description: "Distribuye categorías en una cuadrícula adaptable.",
    examples: [{ author: "assistant", type: "category-picker", text: "Explora por categoría.", categories: kitchenCategories }]
  },
  {
    title: "Category Tile",
    description: "Representa una categoría con icono, nombre y descripción.",
    examples: [{ author: "assistant", type: "category-picker", text: "Una categoría individual", categories: [kitchenCategories[1]] }]
  },
  {
    title: "Feature List",
    description: "Resume beneficios del producto con marcas de estado discretas.",
    examples: [{ author: "assistant", type: "product-detail", product: kitchenProducts[0], selectedVariantId: "kitchen-polo-m", variantLabel: "Talla", addActionLabel: "Agregar a selección" }]
  },
  {
    title: "Product Card",
    description: "Destaca un producto individual con imagen, precio y acción.",
    examples: [{ author: "assistant", type: "product-card", product: kitchenProducts[1], actionLabel: "Ver producto" }]
  },
  {
    title: "Product Carousel",
    description: "Permite recorrer una selección horizontal con controles accesibles.",
    examples: [{ author: "assistant", type: "product-carousel", text: "Recomendados", products: kitchenProducts, previousLabel: "Productos anteriores", nextLabel: "Productos siguientes", productActionLabel: "Ver producto" }]
  },
  {
    title: "Product Detail",
    description: "Ordena imagen, información, características, variantes y acción principal.",
    examples: [{ author: "assistant", type: "product-detail", product: kitchenProducts[0], selectedVariantId: "kitchen-polo-m", variantLabel: "Selecciona una talla", quantity: 1, quantityLabel: "Cantidad", minimumQuantity: 1, maximumQuantity: 8, requiresVariant: true, addActionLabel: "Agregar a selección", backActionLabel: "Ver otros productos" }]
  },
  {
    title: "Product List",
    description: "Organiza varias filas de catálogo dentro del flujo conversacional.",
    examples: [{ author: "assistant", type: "product-list", text: "Productos disponibles", products: kitchenProducts, productActionLabel: "Ver producto" }]
  },
  {
    title: "Product List Item",
    description: "Es la fila reutilizable que forma cada elemento de la lista.",
    examples: [{ author: "assistant", type: "product-list", text: "Una fila de catálogo", products: [kitchenProducts[2]], productActionLabel: "Ver gorra" }]
  },
  {
    title: "Product Variant Selector",
    description: "Permite seleccionar una variante y comunica una opción no disponible.",
    examples: [{ author: "assistant", type: "product-variant-selector", controlId: "kitchen-standalone-variants", productId: kitchenProducts[0].id, label: "Talla", variants: kitchenVariants, selectedVariantId: "kitchen-variant-m" }]
  },
  {
    title: "Quantity Selector",
    description: "Ajusta cantidades con límites y acciones accesibles.",
    examples: [{ author: "assistant", type: "quantity-selector", controlId: "kitchen-standalone-quantity", productId: kitchenProducts[0].id, label: "Cantidad", value: 2, minimum: 1, maximum: 5, decreaseLabel: "Reducir cantidad", increaseLabel: "Aumentar cantidad" }]
  },
  {
    title: "Cart Summary",
    description: "Agrupa líneas de selección y acciones del resumen.",
    examples: [{ author: "assistant", type: "cart-summary", text: "Resumen de la selección", items: kitchenCartItems, subtotal: kitchenSubtotal, subtotalTitle: "Subtotal", continueLabel: "Continuar", removeItemLabel: "Quitar" }]
  },
  {
    title: "Cart Summary · estado vacío",
    description: "Comunica que aún no hay productos en la selección.",
    examples: [{ author: "assistant", type: "cart-summary", text: "Una selección vacía", items: [], emptyLabel: "Tu selección está vacía. Puedes seguir explorando productos." }]
  },
  {
    title: "Cart Line Item",
    description: "Muestra miniatura, variante, cantidad, importe y acción secundaria.",
    examples: [{ author: "assistant", type: "cart-summary", text: "Una línea de selección", items: [kitchenLine], subtotal: kitchenLine.lineTotal, subtotalTitle: "Subtotal", removeItemLabel: "Quitar" }]
  },
  {
    title: "Price Summary",
    description: "Alinea importes y destaca el total sin decoraciones adicionales.",
    examples: [{ author: "assistant", type: "cart-summary", text: "Desglose de importes", items: kitchenCartItems, priceSummary: { entries: [
      { id: "subtotal", label: "Subtotal", amountLabel: "S/ 178.00" },
      { id: "delivery", label: "Envío", amountLabel: "S/ 10.00" },
      { id: "total", label: "Total de ejemplo", amountLabel: "S/ 188.00", emphasis: "strong" }
    ] }, removeItemLabel: "Quitar" }]
  },
  {
    title: "Order Review",
    description: "Combina los datos de contacto y el resumen antes de una confirmación simulada.",
    examples: [{
      author: "assistant",
      type: "order-review",
      text: "Revisa los datos del ejemplo.",
      customer: { name: "A. Lovelace", contact: "ada@example.test", city: "Centro" },
      customerLabels: { name: "Cliente", contact: "Contacto", city: "Ciudad" },
      items: kitchenCartItems,
      priceSummary: { entries: [
        { id: "review-subtotal", label: "Subtotal", amountLabel: "S/ 178.00" },
        { id: "review-total", label: "Total de ejemplo", amountLabel: "S/ 188.00", emphasis: "strong" }
      ] },
      confirmLabel: "Confirmar ejemplo",
      editLabel: "Editar datos",
      removeItemLabel: "Quitar"
    }]
  },
  {
    title: "Conversational Form",
    description: "Integra campos etiquetados en el flujo, con validación nativa.",
    examples: [{ author: "assistant", type: "conversational-form", text: "Formulario de demostración", title: "Datos de contacto", fields: [
      { id: "kitchen-name", name: "kitchen-name", label: "Nombre", type: "text", placeholder: "Tu nombre", autocomplete: "name", required: true },
      { id: "kitchen-email", name: "kitchen-email", label: "Correo electrónico", type: "email", placeholder: "nombre@correo.com", autocomplete: "email", required: true },
      { id: "kitchen-city", name: "kitchen-city", label: "Ciudad o zona de entrega", type: "text", value: "Lima", disabled: true }
    ], submitLabel: "Revisar solicitud" }]
  },
  {
    title: "Confirmation Card",
    description: "Cierra el flujo con un símbolo semántico y una referencia.",
    examples: [{ author: "assistant", type: "confirmation", status: "success", title: "Solicitud simulada", description: "La selección se guardó correctamente.", reference: "Referencia de muestra · SIM-000", summary: ["Polo de algodón × 1", "S/ 49.00"], action: { id: "kitchen-restart", label: "Volver al inicio", value: "restart" } }]
  },
  {
    title: "Status Message",
    description: "Comunica información, éxito, advertencia y error con icono y texto.",
    examples: [
      { author: "system", type: "status", status: "neutral", text: "Información: el catálogo es una demostración." },
      { author: "system", type: "status", status: "success", text: "Éxito: la selección se guardó." },
      { author: "system", type: "status", status: "warning", text: "Advertencia: queda poca disponibilidad." },
      { author: "system", type: "status", status: "error", text: "Error: no se pudo completar la operación." }
    ]
  }
];
function createKitchenMessages() {
  return kitchenCatalog.flatMap((section, index) => [
    {
      author: "assistant",
      type: "text",
      text: `${String(index + 1).padStart(2, "0")}. ${section.title}. ${section.description}`
    },
    ...section.examples
  ]);
}
export {
  createKitchenMessages
};
//# sourceMappingURL=kitchen.messages-CC5ny4Xe.js.map
