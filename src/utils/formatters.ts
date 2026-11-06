import { CustomerInfo, OrderItem } from '../types/store';

/**
 * Format numbers into Colombian Pesos (COP)
 * Example: 45000 -> "$ 45.000 COP"
 */
export function formatCOP(amount: number, includeCurrency = true): string {
  const formatted = new Intl.NumberFormat('es-CO', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(Math.round(amount));

  return includeCurrency ? `$ ${formatted} COP` : `$ ${formatted}`;
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
    .map(
      (item, idx) =>
        `${idx + 1}. *${item.name}*\n   *Cantidad:* ${item.quantity} | *Unitario:* ${formatCOP(item.price)}\n   *Subtotal:* ${formatCOP(item.price * item.quantity)}`
    )
    .join('\n\n');

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
