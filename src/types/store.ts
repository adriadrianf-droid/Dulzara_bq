export type ProductCategory =
  | 'Rostro'
  | 'Ojos y Cejas'
  | 'Labios'
  | 'Skincare y Cuidado'
  | 'Kits y Accesorios';

export const OFFICIAL_CATEGORIES: ProductCategory[] = [
  'Rostro',
  'Ojos y Cejas',
  'Labios',
  'Skincare y Cuidado',
  'Kits y Accesorios',
];

export type VariantType = 'tono' | 'aroma' | 'estilo';
export type ShadeFinish = 'matte' | 'glossy' | 'shimmer';

export interface ProductShade {
  id: string;
  name: string;
  colorHex: string;
  finish?: ShadeFinish;
  hint?: string;
  stock: number;
  imageUrl?: string;
}

export interface SelectedShade {
  id: string;
  name: string;
  colorHex: string;
  finish?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number; // in COP
  originalPrice?: number; // for showing discount
  category: ProductCategory | string;
  stock: number;
  imageUrl: string;
  isFeatured?: boolean;
  benefits?: string[];
  ingredients?: string;
  howToUse?: string;
  variantType?: VariantType; // por defecto 'tono'
  shades?: ProductShade[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedShade?: SelectedShade;
}

export interface CustomerInfo {
  fullName: string;
  phone: string; // WhatsApp
  department: string;
  city: string;
  address: string;
  neighborhood: string;
  notes?: string;
}

export type OrderStatus = 'pendiente' | 'confirmado' | 'preparando' | 'enviado' | 'entregado';

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  variantType?: VariantType;
  selectedShade?: SelectedShade;
}

export interface Order {
  id: string;
  customer: CustomerInfo;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  status: OrderStatus;
  statusNotes?: string;
  whatsappSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoreSettings {
  brandName: string;
  whatsappNumber: string; // e.g. "573105551234"
  freeShippingThreshold: number; // e.g. 120000 COP
  standardShippingCost: number; // e.g. 12000 COP
  instagramHandle: string;
  contactEmail: string;
  cityOrigin: string;
  // Hero Customization
  heroKicker?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroBadgeText?: string;
  heroImageUrl?: string;
  heroButtonText?: string;
}
