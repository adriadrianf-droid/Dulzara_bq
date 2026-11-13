import { CustomerInfo, OrderItem, VariantType } from '../types/store';

/**
 * Returns the capitalized Spanish label for a product's variantType
 */
export function getVariantLabel(variantType?: VariantType): string {
  switch (variantType) {
    case 'aroma':
      return 'Aroma';
    case 'estilo':
      return 'Estilo';
    case 'tono':
    default:
      return 'Tono';
  }
}

/**
 * Generates the unique key for a cart item combining product.id and selectedShade.id
 */
export function getCartItemKey(productId: string, shadeId?: string): string {
  return `${productId}_${shadeId || 'default'}`;
}

/**
 * Format numbers into currency format ($ XX.XXX)
 * Example: 45000 -> "$ 45.000"
 */
export function formatCOP(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '$ 0';
  }
  const formatted = new Intl.NumberFormat('es-CO', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(Math.round(amount));

  return `$ ${formatted}`;
}

/**
 * List of Colombian Departments and representative capital cities
 */
export const COLOMBIAN_DEPARTMENTS: { department: string; cities: string[] }[] = [
  { department: 'Bogotá D.C.', cities: ['Bogotá'] },
  { department: 'Antioquia', cities: ['Medellín', 'Envigado', 'Bello', 'Itagüí', 'Rionegro', 'Sabaneta'] },
  { department: 'Valle del Cauca', cities: ['Cali', 'Palmira', 'Buga', 'Tuluá', 'Buenaventura', 'Jamundí'] },
  { department: 'Cundinamarca', cities: ['Chía', 'Soacha', 'Zipaquirá', 'Facatativá', 'Fusagasugá', 'Madrid', 'Mosquera'] },
  { department: 'Atlántico', cities: ['Barranquilla', 'Soledad', 'Puerto Colombia', 'Malambo'] },
  { department: 'Santander', cities: ['Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta', 'Barrancabermeja'] },
  { department: 'Bolívar', cities: ['Cartagena', 'Magangué', 'Turbaco'] },
  { department: 'Caldas', cities: ['Manizales', 'Villamaría', 'Chinchiná'] },
  { department: 'Risaralda', cities: ['Pereira', 'Dosquebradas', 'Santa Rosa de Cabal'] },
  { department: 'Quindío', cities: ['Armenia', 'Calarcá', 'Montenegro', 'Quimbaya'] },
  { department: 'Tolima', cities: ['Ibagué', 'Espinal', 'Melgar'] },
  { department: 'Huila', cities: ['Neiva', 'Pitalito', 'Garzón'] },
  { department: 'Norte de Santander', cities: ['Cúcuta', 'Los Patios', 'Villa del Rosario', 'Ocaña'] },
  { department: 'Meta', cities: ['Villavicencio', 'Acacías', 'Granada'] },
  { department: 'Boyacá', cities: ['Tunja', 'Duitama', 'Sogamoso', 'Chiquinquirá', 'Villa de Leyva'] },
  { department: 'Nariño', cities: ['Pasto', 'Ipiales', 'Tumaco'] },
  { department: 'Córdoba', cities: ['Montería', 'Cereté', 'Lorica'] },
  { department: 'Magdalena', cities: ['Santa Marta', 'Ciénaga', 'Fundación'] },
  { department: 'Cesar', cities: ['Valledupar', 'Aguachica'] },
  { department: 'Sucre', cities: ['Sincelejo', 'Corozal'] },
  { department: 'Cauca', cities: ['Popayán', 'Santander de Quilichao'] },
  { department: 'La Guajira', cities: ['Riohacha', 'Maicao'] },
  { department: 'Casanare', cities: ['Yopal', 'Aguazul'] },
  { department: 'San Andrés y Providencia', cities: ['San Andrés'] },
];

/**
 * Builds a clear, professional WhatsApp message for finalizing the order
 */
export function buildWhatsAppMessage(
  orderId: string,
  customer: CustomerInfo,
  items: OrderItem[],
  subtotal: number,
  shippingCost: number,
  total: number
): string {
  const itemsText = items
    .map((item) => {
      const shadeInfo = item.selectedShade
        ? ` (${getVariantLabel(item.variantType)}: ${item.selectedShade.name})`
        : '';
      return `• ${item.quantity}x ${item.name}${shadeInfo} - ${formatCOP(item.price * item.quantity)}`;
    })
    .join('\n');

  const shippingText =
    shippingCost === 0 ? '¡GRATIS! (Superó monto mínimo)' : formatCOP(shippingCost);

  const notesText = customer.notes && customer.notes.trim()
    ? `\n*Observaciones:* ${customer.notes.trim()}`
    : '';

  return `*NUEVO PEDIDO DULZARA*
Ref: *#${orderId}*
*----------------------------------------*

*DATOS DE ENTREGA:*
*Cliente:* ${customer.fullName}
*Teléfono:* ${customer.phone}
*Departamento:* ${customer.department}
*Ciudad:* ${customer.city}
*Dirección:* ${customer.address}
*Barrio:* ${customer.neighborhood}${notesText}

*----------------------------------------*
*RESUMEN DE PRODUCTOS:*

${itemsText}

*----------------------------------------*
*TOTALES:*
• *Subtotal:* ${formatCOP(subtotal)}
• *Envío:* ${shippingText}
• *TOTAL A PAGAR:* *${formatCOP(total)}*

*----------------------------------------*
*Hola equipo Dulzara,* he creado mi pedido a través de la tienda web y deseo confirmarlo. ¡Quedo atento(a) para coordinar el envío!`;
}

/**
 * Creates the direct wa.me URL with normalized international prefix
 */
export function createWhatsAppUrl(phoneNumber: string, message: string): string {
  // Clean phone number: keep only digits
  let cleanPhone = (phoneNumber || '').replace(/[^0-9]/g, '');

  // If starts with 0 (e.g. Colombian trunk prefix mistake), strip leading zeros
  cleanPhone = cleanPhone.replace(/^0+/, '');

  // If 10 digits starting with 3 (Colombian mobile e.g. 3001234567, 3124567890), prepend Colombia country code 57
  if (cleanPhone.length === 10 && cleanPhone.startsWith('3')) {
    cleanPhone = `57${cleanPhone}`;
  }

  // Fallback if empty or invalid
  if (!cleanPhone) {
    cleanPhone = '573124567890';
  }

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

/**
 * Format date in Colombian locale
 */
export function formatDateCO(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Normalizes text by removing diacritical marks (tildes), casing, and excess whitespace.
 * Example: "Tónico Facial" -> "tonico facial"
 */
export function normalizeSearchText(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Spanish word variants for singular and plural matching.
 * Handles "labiales" <-> "labial", "tonicos" <-> "tonico", "brochas" <-> "brocha".
 */
export function getSpanishWordVariants(word: string): string[] {
  const normalized = normalizeSearchText(word);
  if (normalized.length <= 2) return [normalized];

  const variants = new Set<string>([normalized]);

  // Plural ending in "es" (e.g. labiales -> labial, exfoliantes -> exfoliante)
  if (normalized.endsWith('es')) {
    variants.add(normalized.slice(0, -2));
    variants.add(normalized.slice(0, -1));
  }
  // Plural ending in "s" (e.g. tonicos -> tonico, brochas -> brocha)
  else if (normalized.endsWith('s')) {
    variants.add(normalized.slice(0, -1));
  } else {
    // Singular to plural candidates
    variants.add(`${normalized}s`);
    variants.add(`${normalized}es`);
  }

  return Array.from(variants);
}

/**
 * Checks if target text matches the search query, ignoring accents, casing,
 * and matching singular or plural variants.
 */
export function matchesSearchQuery(targetText: string, query: string): boolean {
  const normQuery = normalizeSearchText(query);
  if (!normQuery) return true;

  const normTarget = normalizeSearchText(targetText);
  if (normTarget.includes(normQuery)) return true;

  const queryWords = normQuery.split(/\s+/).filter(Boolean);
  if (queryWords.length === 0) return true;

  return queryWords.every((word) => {
    const variants = getSpanishWordVariants(word);
    return variants.some((v) => normTarget.includes(v));
  });
}
