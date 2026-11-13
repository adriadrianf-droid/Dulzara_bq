import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  Product,
  Order,
  CustomerInfo,
  StoreSettings,
  OrderStatus,
  SelectedShade,
  ProductShade,
} from '../types/store';

export function computeProductStock(
  shades?: ProductShade[],
  fallbackStock?: number
): number {
  if (Array.isArray(shades) && shades.length > 0) {
    return shades.reduce((sum, s) => sum + Math.max(0, Number(s.stock) || 0), 0);
  }
  return Math.max(0, Number(fallbackStock) || 0);
}

export const DEFAULT_HERO_SETTINGS = {
  heroKicker: '✦ BIENVENIDA A TU LUGAR FELIZ',
  heroTitle: 'Brilla a tu manera, nosotros ponemos la magia.',
  heroSubtitle: 'Maquillaje y cuidado personal elegido con amor para resaltar lo linda que eres. Arma tu bolsita a tu ritmo y pide fácil por WhatsApp.',
  heroBadgeText: 'Hecho con amor para ti 💕',
  heroButtonText: 'Explorar Catálogo ✦',
  heroImageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80',
};

export const DEFAULT_SETTINGS: StoreSettings = {
  brandName: 'DULZARA',
  whatsappNumber: '573124567890',
  freeShippingThreshold: 120000,
  standardShippingCost: 12000,
  instagramHandle: '@dulzara_bq',
  contactEmail: 'contacto@dulzara.com',
  cityOrigin: 'Barranquilla Atlántico, Colombia',
  ...DEFAULT_HERO_SETTINGS,
};

export function normalizeCategory(cat: string): string {
  switch (cat) {
    case 'Rostro':
    case 'maquillaje':
      return 'Rostro';
    case 'Ojos y Cejas':
    case 'ojos':
      return 'Ojos y Cejas';
    case 'Labios':
    case 'labios':
      return 'Labios';
    case 'Skincare y Cuidado':
    case 'skincare':
    case 'cuidado-corporal':
      return 'Skincare y Cuidado';
    case 'Kits y Accesorios':
    case 'accesorios':
      return 'Kits y Accesorios';
    default:
      return cat || 'Rostro';
  }
}

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    name: 'Suero Iluminador Niacinamida 10% & Rosa Damascena',
    slug: 'suero-iluminador-niacinamida-rosa',
    shortDescription: 'Unifica el tono, minimiza poros y da brillo natural.',
    description: 'Nuestra fórmula estrella combina Niacinamida pura al 10% con extracto orgánico destilado de Rosa Damascena y Zinc PCA. Ayuda a calmar rojeces, suavizar la textura de la piel y devolver el brillo saludable desde la primera semana de uso.',
    price: 58000,
    originalPrice: 72000,
    category: 'Skincare y Cuidado',
    stock: 24,
    imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
    isFeatured: true,
    benefits: [
      'Disminuye manchas y rojeces superficiales',
      'Regula la producción de sebo sin resecar',
      'Textura acuosa de rápida absorción',
      'Apta para todo tipo de piel, incluso sensible'
    ],
    ingredients: 'Agua de Rosa Damascena, Niacinamida (10%), Glicerina vegetal, Zinc PCA, Ácido Hialurónico vegetal, Alantoína, Extracto de Camomila.',
    howToUse: 'Aplica 3 a 4 gotas en rostro limpio y seco mañana y noche antes de tu crema hidratante. Masajea suavemente con movimientos ascendentes.',
    createdAt: '2026-01-10T10:00:00.000Z',
    updatedAt: '2026-01-10T10:00:00.000Z',
  },
  {
    id: 'prod-002',
    name: 'Labial Velvet Matte "Rosa Salvaje"',
    slug: 'labial-velvet-matte-rosa-salvaje',
    shortDescription: 'Acabado mate aterciopelado con karité hidratante.',
    description: 'Un tono rosa empolvado sofisticado y versátil para cualquier ocasión. Su textura cremosa se desliza con facilidad y fija un color uniforme que no reseca los labios gracias a su infusión de manteca de karité y vitamina E.',
    price: 36000,
    originalPrice: 42000,
    category: 'Labios',
    stock: 18,
    imageUrl: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=80',
    isFeatured: true,
    benefits: [
      'Duración hasta por 8 horas sin transferencias severas',
      'Pigmento ultra saturado de una sola pasada',
      'No cuartea ni acentúa líneas de expresión',
      'Libre de parabenos y no testeado en animales'
    ],
    ingredients: 'Dimethicone, Isododecane, Manteca de Karité, Cera de Candelilla, Vitamina E (Tocoferol), Aceite de Jojoba, Pigmentos minerales certificados.',
    howToUse: 'Delinea suavemente el contorno de los labios y rellena desde el centro hacia las comisuras. Espera 60 segundos para secado óptimo.',
    createdAt: '2026-01-12T10:00:00.000Z',
    updatedAt: '2026-01-12T10:00:00.000Z',
  },
  {
    id: 'prod-003',
    name: 'Paleta de Sombras "Dulzara Rose Gold" (12 Tonos)',
    slug: 'paleta-sombras-dulzara-rose-gold',
    shortDescription: '12 sombras entre mates sedosos y destellos rosa.',
    description: 'Inspirada en los atardeceres andinos, esta paleta ofrece una transición armoniosa desde tonos nude neutros hasta bronces cálidos y rosas satinados. Fórmula micro-pulverizada de alta adherencia y fácil difuminado.',
    price: 78000,
    originalPrice: 95000,
    category: 'Ojos y Cejas',
    stock: 14,
    imageUrl: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80',
    isFeatured: true,
    benefits: [
      '6 tonos mates mantecosos + 6 shimmers reflectivos',
      'No produce caída de pigmento bajo el ojo (zero fall-out)',
      'Espejo de alta definición incorporado en empaque magnético',
      'Alta fijación con o sin primer'
    ],
    ingredients: 'Talco micronizado, Mica tratada, Estearato de magnesio, Dimeticona, Sílice, Aceite de semilla de uva, Pigmentos perlados.',
    howToUse: 'Aplica el tono neutro como base en el párpado. Usa tonos de transición en la cuenca y deposita los shimmers con la yema del dedo o brocha plana para máximo destello.',
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-01-15T10:00:00.000Z',
  },
  {
    id: 'prod-004',
    name: 'Crema Hidratante Facial "Hydra Glow" con Péptidos',
    slug: 'crema-hidratante-facial-hydra-glow',
    shortDescription: 'Gel sedoso con hidratación profunda por 48 horas.',
    description: 'Enriquecida con complejo de tripéptidos, centella asiática y escualano vegetal. Restaura la barrera cutánea sin tapar los poros, dejando un velo de frescura que prepara la piel perfectamente antes del maquillaje.',
    price: 64000,
    category: 'Skincare y Cuidado',
    stock: 22,
    imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
    isFeatured: true,
    benefits: [
      'Sensación ligera tipo sorbete refrescante',
      'Refuerza la elasticidad y barrera lipídica',
      'Excelente primer natural de maquillaje',
      'Fórmula no comedogénica'
    ],
    ingredients: 'Agua purificada, Escualano de oliva, Péptidos de cobre, Centella Asiática, Ácido Hialurónico multimolecular, Pantenol (Provitamina B5).',
    howToUse: 'Toma la cantidad del tamaño de una moneda y distribuye con palmaditas suaves sobre rostro, cuello y escote.',
    createdAt: '2026-01-18T10:00:00.000Z',
    updatedAt: '2026-01-18T10:00:00.000Z',
  },
  {
    id: 'prod-005',
    name: 'Iluminador Líquido "Luz de Luna" Shimmer Glow',
    slug: 'iluminador-liquido-luz-de-luna-shimmer',
    shortDescription: 'Iluminador fluido con micro-perlas de brillo húmedo.',
    description: 'Un iluminador sedoso de efecto cristalino que se funde con tu piel sin marcar textura. Sus pigmentos perlados ultrafinos capturan la luz en pómulos, arco de cupido y clavículas con un acabado luminoso de larga duración.',
    price: 38000,
    category: 'Rostro',
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80',
    isFeatured: true,
    variantType: 'tono',
    shades: [
      {
        id: 'shade-shimmer-01',
        name: '01 Perla Champagne',
        colorHex: '#F7E3D4',
        finish: 'shimmer',
        hint: 'Dorado perlado',
        stock: 11,
      },
      {
        id: 'shade-shimmer-02',
        name: '02 Rosa Cuarzo',
        colorHex: '#EBB3C0',
        finish: 'shimmer',
        hint: 'Brillo rosado',
        stock: 10,
      },
      {
        id: 'shade-shimmer-03',
        name: '03 Bronce Sol',
        colorHex: '#C98E70',
        finish: 'shimmer',
        hint: 'Bronce cálido',
        stock: 9,
      },
    ],
    benefits: [
      'Micro-destellos multidimensionales sin partículas gruesas',
      'Se difumina fácil con yema de los dedos, esponja o brocha',
      'No levanta la base ni parchea polvos',
      'Enriquecido con aceite de rosa mosqueta y vitamina E'
    ],
    ingredients: 'Isododecano, Mica perlada, Poligliceril-2 Triisostearato, Aceite de Rosa Mosqueta virgen, Sílice, Tocoferol.',
    howToUse: 'Coloca 1 a 2 punticos en la parte alta del pómulo, punta de la nariz y arco de cupido; difumina con toques suaves.',
    createdAt: '2026-01-20T10:00:00.000Z',
    updatedAt: '2026-01-20T10:00:00.000Z',
  },
  {
    id: 'prod-006',
    name: 'Tónico Botánico de Rosas & Hamamelis',
    slug: 'tonico-botanico-rosas-hamamelis',
    shortDescription: 'Bruma de rosas sin alcohol que equilibra y refresca.',
    description: 'Destilado artesanal de pétalos frescos de rosa y agua floral de hamamelis sin alcohol. Ayuda a cerrar visiblemente los poros y prepara la piel para absorber mejor los sueros y tratamientos posteriores.',
    price: 32000,
    originalPrice: 38000,
    category: 'Skincare y Cuidado',
    stock: 19,
    imageUrl: 'https://images.unsplash.com/photo-1608248597359-002d287ee3b6?auto=format&fit=crop&w=800&q=80',
    isFeatured: false,
    benefits: [
      '100% libre de alcohol y fragancias sintéticas',
      'Calma irritaciones después de la limpieza o afeitado',
      'Ideal como bruma hidratante durante el día de trabajo',
      'Aroma natural floral relajante'
    ],
    ingredients: 'Hidrolato puro de Rosa Centifolia, Agua de Hamamelis virginiana, Extracto de Pepino, Glicerina, Ácido Cítrico suave.',
    howToUse: 'Rocía a 20 cm del rostro con los ojos cerrados o aplica con un disco de algodón suave antes del suero.',
    createdAt: '2026-01-22T10:00:00.000Z',
    updatedAt: '2026-01-22T10:00:00.000Z',
  },
  {
    id: 'prod-007',
    name: 'Polvo Compacto Micropulverizado "Velvet Skin" Matte',
    slug: 'polvo-compacto-micropulverizado-velvet-skin',
    shortDescription: 'Sella el maquillaje y matifica por 12h sin resecar.',
    description: 'Fórmula ultra fina resistente a la humedad y al calor tropical. Matifica instantáneamente la zona T sin dejar sensación pesada ni efecto acartonado, adaptándose con suavidad a cada subtono de piel.',
    price: 42000,
    category: 'Rostro',
    stock: 25,
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    isFeatured: true,
    variantType: 'tono',
    shades: [
      {
        id: 'shade-matte-01',
        name: '01 Claro Marfil',
        colorHex: '#F3DFC8',
        finish: 'matte',
        hint: 'Piel clara',
        stock: 7,
      },
      {
        id: 'shade-matte-02',
        name: '02 Beige Natural',
        colorHex: '#E5C29F',
        finish: 'matte',
        hint: 'Clara a media',
        stock: 8,
      },
      {
        id: 'shade-matte-03',
        name: '03 Trigo Medio',
        colorHex: '#C89B73',
        finish: 'matte',
        hint: 'Piel trigueña',
        stock: 6,
      },
      {
        id: 'shade-matte-04',
        name: 'Traslúcido HD',
        colorHex: '#FAF5F0',
        finish: 'matte',
        hint: 'Tono universal',
        stock: 4,
      },
    ],
    benefits: [
      'Efecto filtro suave que disimula poros y líneas finas',
      'Control de brillo inteligente sin resecar las mejillas',
      'Incluye espejo y pomo aterciopelado para retoques'
    ],
    ingredients: 'Talco cosmético purificado, Sílice esférica, Almidón de arroz, Vitamina E, Extracto de Aloe Vera.',
    howToUse: 'Toma producto con brocha o pomo y presiona suavemente sobre frente, nariz, mentón y contorno de ojos.',
    createdAt: '2026-01-25T10:00:00.000Z',
    updatedAt: '2026-01-25T10:00:00.000Z',
  },
  {
    id: 'prod-008',
    name: 'Lip Gloss Love Queen "Berry Glow"',
    slug: 'lip-gloss-love-queen-berry-glow',
    shortDescription: 'Gloss de brillo espejo con aceites, no pegajoso.',
    description: 'Formulado con 5 aceites botánicos preciosos (frambuesa, jojoba, argán, almendras dulces y rosa mosqueta). Aporta volumen visual inmediato, nutrición profunda y tonos jugosos irresistibles.',
    price: 29000,
    category: 'Labios',
    stock: 35,
    imageUrl: 'https://images.unsplash.com/photo-1599305090598-fe179d501227?auto=format&fit=crop&w=800&q=80',
    isFeatured: true,
    variantType: 'tono',
    shades: [
      {
        id: 'shade-gloss-01',
        name: 'Rosa Dulce',
        colorHex: '#E88CA5',
        finish: 'glossy',
        hint: 'Brillo sutil',
        stock: 10,
      },
      {
        id: 'shade-gloss-02',
        name: 'Fresa Mágico',
        colorHex: '#D94E6A',
        finish: 'glossy',
        hint: 'Rosado fresco',
        stock: 9,
      },
      {
        id: 'shade-gloss-03',
        name: 'Cereza Jugosa',
        colorHex: '#A8243B',
        finish: 'glossy',
        hint: 'Rojo jugoso',
        stock: 8,
      },
      {
        id: 'shade-gloss-04',
        name: 'Nude Café',
        colorHex: '#A66B5B',
        finish: 'matte',
        hint: 'Mate natural',
        stock: 8,
      },
    ],
    benefits: [
      'Acabado espejo ultra brillante sin sensación pegajosa',
      'Repara labios resecos desde la primera aplicación',
      'Aplicador jumbo suave tipo felpa de máxima precisión'
    ],
    ingredients: 'Aceite de semilla de frambuesa, Polibuteno, Aceite de Jojoba, Tocoferol, Extracto de fresa silvestre, Sabor natural.',
    howToUse: 'Aplica directamente en cualquier momento del día. Úsalo solo para un look fresco o sobre tu labial favorito.',
    createdAt: '2026-01-28T10:00:00.000Z',
    updatedAt: '2026-01-28T10:00:00.000Z',
  },
  {
    id: 'prod-009',
    name: 'Manteca Corporal Batida Rosa Mosqueta & Vainilla',
    slug: 'manteca-corporal-batida-rosa-mosqueta-vainilla',
    shortDescription: 'Crema corporal batida con rosa mosqueta y vainilla.',
    description: 'Una textura cremosa deliciosa que se derrite al contacto con la piel. Nutre intensamente codos, piernas y escote, mejorando la elasticidad y dejando una fragancia delicada que permanece por horas.',
    price: 49000,
    category: 'Skincare y Cuidado',
    stock: 15,
    imageUrl: 'https://images.unsplash.com/photo-1608248597359-002d287ee3b6?auto=format&fit=crop&w=800&q=80',
    isFeatured: false,
    benefits: [
      'Nutrición profunda para pieles secas o deshidratadas',
      'Rápida absorción sin dejar residuo graso en la ropa',
      'Sin aceites minerales derivados del petróleo'
    ],
    ingredients: 'Manteca de Karité sin refinar, Manteca de Cacao colombiana, Aceite de Rosa Mosqueta orgánico, Extracto natural de Vainilla Bourbon, Vitamina E.',
    howToUse: 'Masajea sobre la piel ligeramente húmeda después de la ducha matutina o nocturna.',
    createdAt: '2026-02-01T10:00:00.000Z',
    updatedAt: '2026-02-01T10:00:00.000Z',
  },
  {
    id: 'prod-010',
    name: 'Set de 8 Brochas Profesionales "Rose Edition" con Estuche',
    slug: 'set-brochas-profesionales-rose-edition',
    shortDescription: '8 brochas suaves de oro rosa con estuche de viaje.',
    description: 'Incluye brochas esenciales para base, polvos, contorno, rubor, difuminado de ojos, cejas y labios. Vienen acompañadas de un neceser rígido acolchado de viaje en tono rosa empolvado.',
    price: 89000,
    originalPrice: 110000,
    category: 'Kits y Accesorios',
    stock: 10,
    imageUrl: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=800&q=80',
    isFeatured: true,
    benefits: [
      'Fibra sintética vegana ultra densa no porosa',
      'No absorbe producto en exceso, ahorra maquillaje',
      'Fáciles de lavar sin desprendimiento de fibras',
      'Incluye estuche protector rígido de viaje'
    ],
    ingredients: 'Fibras de Taklon de grado cosmético, Virola de aluminio anodizado oro rosa, Mango de madera lacada eco-responsable.',
    howToUse: 'Lava semanalmente con jabón neutro y agua tibia. Seca en posición horizontal sobre una toalla limpia.',
    createdAt: '2026-02-05T10:00:00.000Z',
    updatedAt: '2026-02-05T10:00:00.000Z',
  }
];

/**
 * Recursively strips `undefined` properties from objects and arrays before writing to Firestore,
 * preventing FirebaseError: Unsupported field value: undefined.
 */
function sanitizeForFirestore<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        cleaned[k] = sanitizeForFirestore(v);
      }
    }
    return cleaned as T;
  }
  return value;
}

function normalizeProductWithShades(p: Product): Product {
  const hasShades = Array.isArray(p.shades) && p.shades.length > 0;
  return {
    ...p,
    category: normalizeCategory(p.category),
    variantType: p.variantType || 'tono',
    stock: hasShades
      ? computeProductStock(p.shades, p.stock)
      : Math.max(0, Number(p.stock) || 0),
  };
}

class StoreService {
  private cachedProducts: Product[] = [];
  private cachedOrders: Order[] = [];
  private cachedSettings: StoreSettings = { ...DEFAULT_SETTINGS };
  private productListeners: ((products: Product[]) => void)[] = [];
  private orderListeners: ((orders: Order[]) => void)[] = [];
  private settingsListeners: ((settings: StoreSettings) => void)[] = [];
  private isInitialized = false;

  constructor() {
    this.loadFromLocalStorage();
    this.initRealtimeSubscriptions();
  }

  private loadFromLocalStorage() {
    // 1. Settings
    try {
      const storedSettings = localStorage.getItem('dulzara_settings_v1');
      if (storedSettings) {
        this.cachedSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) };
        if (!this.cachedSettings.heroButtonText || this.cachedSettings.heroButtonText.includes('favoritos') || this.cachedSettings.heroButtonText === 'Explorar Catálogo') {
          this.cachedSettings.heroButtonText = 'Explorar Catálogo ✦';
        }
      }
    } catch {
      this.cachedSettings = { ...DEFAULT_SETTINGS };
    }

    // 2. Products
    try {
      const storedProducts = localStorage.getItem('dulzara_products_v1');
      if (storedProducts) {
        const parsed = JSON.parse(storedProducts);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.cachedProducts = parsed.map((p: Product) => normalizeProductWithShades(p));
        } else {
          this.cachedProducts = INITIAL_PRODUCTS.map((p) => normalizeProductWithShades(p));
        }
      } else {
        this.cachedProducts = INITIAL_PRODUCTS.map((p) => normalizeProductWithShades(p));
      }
    } catch {
      this.cachedProducts = INITIAL_PRODUCTS.map((p) => normalizeProductWithShades(p));
    }

    // 3. Orders
    try {
      const storedOrders = localStorage.getItem('dulzara_orders_v1');
      if (storedOrders) {
        const parsed = JSON.parse(storedOrders);
        if (Array.isArray(parsed)) {
          this.cachedOrders = parsed;
        }
      }
    } catch {
      this.cachedOrders = [];
    }
  }

  private saveProductsToLocalStorage() {
    try {
      localStorage.setItem('dulzara_products_v1', JSON.stringify(this.cachedProducts));
    } catch (e) {
      console.warn('Could not save products to localStorage (Firestore remains source of truth):', e);
    }
  }

  private saveOrdersToLocalStorage() {
    try {
      localStorage.setItem('dulzara_orders_v1', JSON.stringify(this.cachedOrders));
    } catch (e) {
      console.warn('Could not save orders to localStorage:', e);
    }
  }

  /**
   * Initializes real-time listener with automatic catalog migration/seeding
   */
  private async initRealtimeSubscriptions() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Subscribe to /products
    try {
      const productsRef = collection(db, 'products');
      onSnapshot(
        productsRef,
        async (snapshot) => {
          if (snapshot.empty) {
            // Seed Firestore with initial products if collection is empty
            await this.seedCatalogToFirestore();
          } else {
            const list: Product[] = [];
            snapshot.forEach((docSnap) => {
              const rawItem = docSnap.data() as Product;
              const normalized = normalizeProductWithShades(rawItem);
              list.push(normalized);
            });
            // Keep consistent ordering by createdAt descending or id
            list.sort((a, b) => {
              const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return tB - tA;
            });
            this.cachedProducts = list;
            this.saveProductsToLocalStorage();
            this.notifyProductListeners();
          }
        },
        (error) => {
          console.warn('Realtime products listener notice (operating in local resilience mode):', error);
        }
      );
    } catch (e) {
      console.warn('Could not establish realtime product listener:', e);
    }

    // Subscribe to /orders
    try {
      const ordersRef = collection(db, 'orders');
      onSnapshot(
        ordersRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Order[] = [];
            snapshot.forEach((docSnap) => {
              list.push(docSnap.data() as Order);
            });
            // Sort by creation date descending
            list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            this.cachedOrders = list;
            this.saveOrdersToLocalStorage();
            this.notifyOrderListeners();
          }
        },
        (error) => {
          console.warn('Orders listener notice:', error);
        }
      );
    } catch (e) {
      console.warn('Orders listener notice:', e);
    }

    // Subscribe to /settings/store
    try {
      const settingsRef = doc(db, 'settings', 'store');
      onSnapshot(
        settingsRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const firestoreSettings = docSnap.data() as StoreSettings;
            this.cachedSettings = { ...DEFAULT_SETTINGS, ...firestoreSettings };
            try {
              localStorage.setItem('dulzara_settings_v1', JSON.stringify(this.cachedSettings));
            } catch {
              // Ignored
            }
            this.notifySettingsListeners();
          }
        },
        (error) => {
          console.warn('Settings listener notice:', error);
        }
      );
    } catch (e) {
      console.warn('Settings listener notice:', e);
    }
  }

  async seedCatalogToFirestore(): Promise<void> {
    try {
      for (const prod of INITIAL_PRODUCTS) {
        await setDoc(doc(db, 'products', prod.id), sanitizeForFirestore(prod));
      }
      this.cachedProducts = INITIAL_PRODUCTS.map((p) => normalizeProductWithShades(p));
      this.saveProductsToLocalStorage();
      this.notifyProductListeners();
    } catch (err) {
      console.warn('Notice seeding initial catalog to Firestore:', err);
    }
  }

  async seedCatalogIfEmpty(): Promise<void> {
    try {
      const snapshot = await getDocs(collection(db, 'products'));
      if (snapshot.empty) {
        await this.seedCatalogToFirestore();
      }
    } catch (e) {
      console.warn('Notice checking catalog seed:', e);
    }
  }

  private notifyProductListeners() {
    for (const listener of this.productListeners) {
      listener(this.cachedProducts);
    }
  }

  private notifyOrderListeners() {
    for (const listener of this.orderListeners) {
      listener(this.cachedOrders);
    }
  }

  private notifySettingsListeners() {
    for (const listener of this.settingsListeners) {
      listener(this.cachedSettings);
    }
  }

  onProductsChange(callback: (products: Product[]) => void): () => void {
    this.productListeners.push(callback);
    callback(this.cachedProducts);
    return () => {
      this.productListeners = this.productListeners.filter((l) => l !== callback);
    };
  }

  onOrdersChange(callback: (orders: Order[]) => void): () => void {
    this.orderListeners.push(callback);
    callback(this.cachedOrders);
    return () => {
      this.orderListeners = this.orderListeners.filter((l) => l !== callback);
    };
  }

  onSettingsChange(callback: (settings: StoreSettings) => void): () => void {
    this.settingsListeners.push(callback);
    callback(this.cachedSettings);
    return () => {
      this.settingsListeners = this.settingsListeners.filter((l) => l !== callback);
    };
  }

  getProducts(): Product[] {
    return this.cachedProducts;
  }

  getProductById(id: string): Product | undefined {
    return this.cachedProducts.find((p) => p.id === id);
  }

  async addProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'slug'>): Promise<Product> {
    const id = `prod-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const slug = productData.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const now = new Date().toISOString();
    const hasShades = Array.isArray(productData.shades) && productData.shades.length > 0;
    const computedStock = computeProductStock(productData.shades, productData.stock);

    const newProduct: Product = sanitizeForFirestore({
      ...productData,
      id,
      slug,
      variantType: productData.variantType || 'tono',
      shades: hasShades ? productData.shades : undefined,
      stock: computedStock,
      createdAt: now,
      updatedAt: now,
    });

    // Immediate optimistic local update with fresh array reference
    this.cachedProducts = [newProduct, ...this.cachedProducts];
    this.saveProductsToLocalStorage();
    this.notifyProductListeners();

    // Persist to Firestore (sanitized so no `undefined` fields cause rejection)
    await setDoc(doc(db, 'products', id), newProduct);

    return newProduct;
  }

  async updateProduct(id: string, updates: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<Product> {
    const current = this.getProductById(id);
    if (!current) {
      throw new Error(`Producto ${id} no encontrado.`);
    }

    const mergedShades = updates.shades !== undefined ? updates.shades : current.shades;
    const hasShades = Array.isArray(mergedShades) && mergedShades.length > 0;
    const rawStock = updates.stock !== undefined ? updates.stock : current.stock;
    const computedStock = hasShades
      ? computeProductStock(mergedShades, rawStock)
      : Math.max(0, Number(rawStock) || 0);

    const updatedRaw: Product = {
      ...current,
      ...updates,
      variantType: updates.variantType || current.variantType || 'tono',
      shades: hasShades ? mergedShades : [],
      stock: computedStock,
      updatedAt: new Date().toISOString(),
    };

    if (updates.originalPrice === undefined || !updates.originalPrice) {
      delete updatedRaw.originalPrice;
    }

    const updated = sanitizeForFirestore(updatedRaw);

    // Immediate optimistic local update with fresh array reference
    this.cachedProducts = this.cachedProducts.map((p) => (p.id === id ? updated : p));
    this.saveProductsToLocalStorage();
    this.notifyProductListeners();

    // Persist full sanitized document to Firestore
    await setDoc(doc(db, 'products', id), updated);

    return updated;
  }

  async deleteProduct(id: string): Promise<boolean> {
    this.cachedProducts = this.cachedProducts.filter((p) => p.id !== id);
    this.saveProductsToLocalStorage();
    this.notifyProductListeners();

    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (error) {
      console.warn('Could not delete product in Firestore immediately (removed locally):', error);
    }
    return true;
  }

  async updateStock(id: string, newStock: number): Promise<Product> {
    const current = this.getProductById(id);
    if (current && current.shades && current.shades.length > 0) {
      // Adjust the first available shade or distribute delta so total stock matches
      const currentTotal = computeProductStock(current.shades, current.stock);
      const delta = Math.max(0, newStock) - currentTotal;
      if (delta !== 0) {
        const updatedShades = current.shades.map((s, idx) =>
          idx === 0 ? { ...s, stock: Math.max(0, s.stock + delta) } : s
        );
        return this.updateProduct(id, { shades: updatedShades });
      }
    }
    return this.updateProduct(id, { stock: Math.max(0, newStock) });
  }

  getOrders(): Order[] {
    return this.cachedOrders;
  }

  /**
   * SECURITY ENFORCEMENT & POLICY:
   * 1. Prices are strictly verified against the authentic database catalog.
   * 2. Inventory is NOT decremented immediately upon opening WhatsApp, preventing stock lockouts from abandoned carts.
   * 3. Order is recorded in Firestore and local state with initial status 'pendiente'.
   */
  async createOrder(
    customer: CustomerInfo,
    rawCartItems: { productId: string; quantity: number; selectedShade?: SelectedShade }[]
  ): Promise<{ order: Order }> {
    if (!rawCartItems || rawCartItems.length === 0) {
      throw new Error('El carrito no puede estar vacío.');
    }

    const currentProducts = this.getProducts();
    const verifiedItems: Order['items'] = [];
    let calculatedSubtotal = 0;

    for (const item of rawCartItems) {
      const canonical = currentProducts.find((p) => p.id === item.productId);
      if (!canonical) {
        throw new Error(`El producto con referencia ${item.productId} ya no está disponible.`);
      }

      let resolvedShade: SelectedShade | undefined = item.selectedShade;
      let shadeImageUrl = canonical.imageUrl;

      if (canonical.shades && canonical.shades.length > 0) {
        const matchingShade = item.selectedShade
          ? canonical.shades.find((s) => s.id === item.selectedShade?.id)
          : canonical.shades.find((s) => s.stock > 0) || canonical.shades[0];

        if (!matchingShade) {
          throw new Error(
            `El tono seleccionado para "${canonical.name}" ya no se encuentra disponible.`
          );
        }
        if (matchingShade.stock < item.quantity) {
          throw new Error(
            `Existencias insuficientes para "${canonical.name} (${matchingShade.name})". Disponibles: ${matchingShade.stock}, solicitadas: ${item.quantity}.`
          );
        }
        resolvedShade = {
          id: matchingShade.id,
          name: matchingShade.name,
          colorHex: matchingShade.colorHex,
          finish: matchingShade.finish,
        };
        if (matchingShade.imageUrl) {
          shadeImageUrl = matchingShade.imageUrl;
        }
      } else if (canonical.stock < item.quantity) {
        throw new Error(
          `Existencias insuficientes para "${canonical.name}". Disponibles: ${canonical.stock}, solicitadas: ${item.quantity}.`
        );
      }

      calculatedSubtotal += canonical.price * item.quantity;
      verifiedItems.push({
        productId: canonical.id,
        name: canonical.name,
        price: canonical.price, // Uses authentic database price
        quantity: item.quantity,
        imageUrl: shadeImageUrl,
        variantType: canonical.variantType || 'tono',
        selectedShade: resolvedShade,
      });
    }

    const settings = this.getSettings();
    const shippingCost =
      calculatedSubtotal >= settings.freeShippingThreshold
        ? 0
        : settings.standardShippingCost;
    const finalTotal = calculatedSubtotal + shippingCost;

    // Generate collision-free readable order reference
    let orderId = '';
    do {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const timeCode = Date.now().toString(36).slice(-2).toUpperCase();
      orderId = `DLZ-2026-${randomNum}${timeCode}`;
    } while (this.cachedOrders.some((o) => o.id === orderId));

    const now = new Date().toISOString();

    const newOrder: Order = sanitizeForFirestore({
      id: orderId,
      customer: { ...customer },
      items: verifiedItems,
      subtotal: calculatedSubtotal,
      shippingCost,
      total: finalTotal,
      status: 'pendiente',
      statusNotes: 'Pedido generado por tienda web Dulzara. Pendiente por confirmación de pago/envío.',
      whatsappSent: false,
      createdAt: now,
      updatedAt: now,
    });

    // Immediate local persistence with fresh array reference
    this.cachedOrders = [newOrder, ...this.cachedOrders];
    this.saveOrdersToLocalStorage();
    this.notifyOrderListeners();

    // Persist to Firestore asynchronously
    try {
      await setDoc(doc(db, 'orders', orderId), newOrder);
    } catch (error) {
      console.warn('Could not sync order to Firestore immediately (saved locally):', error);
    }

    return { order: newOrder };
  }

  /**
   * Status change with Atomic Inventory Deduction:
   * Moving from 'pendiente' to any active status ('confirmado', 'preparando', 'enviado', 'entregado')
   * deducts stock once. Moving back to 'pendiente' restores stock.
   */
  async updateOrderStatus(orderId: string, status: OrderStatus, notes?: string): Promise<Order> {
    const existingOrder = this.cachedOrders.find((o) => o.id === orderId);
    if (!existingOrder) {
      throw new Error(`Pedido ${orderId} no encontrado.`);
    }

    const oldStatus = existingOrder.status;
    const now = new Date().toISOString();

    const wasStockDeducted = oldStatus !== 'pendiente';
    const willStockBeDeducted = status !== 'pendiente';
    const stockDeltaFactor =
      !wasStockDeducted && willStockBeDeducted
        ? -1
        : wasStockDeducted && !willStockBeDeducted
        ? 1
        : 0;

    const updatedProductIds = new Set<string>();

    if (stockDeltaFactor !== 0) {
      this.cachedProducts = this.cachedProducts.map((prod) => {
        const matchingOrderItems = existingOrder.items.filter(
          (it) => it.productId === prod.id
        );
        if (matchingOrderItems.length === 0) return prod;

        updatedProductIds.add(prod.id);
        let nextShades = prod.shades ? prod.shades.map((s) => ({ ...s })) : undefined;
        let nextStock = prod.stock;

        for (const item of matchingOrderItems) {
          const delta = stockDeltaFactor * item.quantity;
          if (nextShades && nextShades.length > 0 && item.selectedShade) {
            nextShades = nextShades.map((s) =>
              s.id === item.selectedShade?.id
                ? { ...s, stock: Math.max(0, s.stock + delta) }
                : s
            );
            nextStock = computeProductStock(nextShades, nextStock);
          } else {
            nextStock = Math.max(0, nextStock + delta);
          }
        }

        return {
          ...prod,
          ...(nextShades ? { shades: nextShades } : {}),
          stock: nextStock,
          updatedAt: now,
        };
      });

      this.saveProductsToLocalStorage();
      this.notifyProductListeners();
    }

    const updatedOrder: Order = {
      ...existingOrder,
      status,
      statusNotes: notes !== undefined ? notes : existingOrder.statusNotes,
      updatedAt: now,
    };

    this.cachedOrders = this.cachedOrders.map((o) =>
      o.id === orderId ? updatedOrder : o
    );
    this.saveOrdersToLocalStorage();
    this.notifyOrderListeners();

    // Persist to Firestore (both stock changes and order changes)
    try {
      for (const prodId of updatedProductIds) {
        const prod = this.cachedProducts.find((p) => p.id === prodId);
        if (prod) {
          await setDoc(
            doc(db, 'products', prodId),
            sanitizeForFirestore({
              stock: prod.stock,
              ...(prod.shades ? { shades: prod.shades } : {}),
              updatedAt: now,
            }),
            { merge: true }
          );
        }
      }

      const orderRef = doc(db, 'orders', orderId);
      await setDoc(
        orderRef,
        sanitizeForFirestore({
          status,
          statusNotes: updatedOrder.statusNotes,
          updatedAt: now,
        }),
        { merge: true }
      );
    } catch (firestoreErr) {
      console.warn('Firestore update warning (applied and persisted in local state):', firestoreErr);
    }

    return updatedOrder;
  }

  async markWhatsappSent(orderId: string): Promise<void> {
    const now = new Date().toISOString();
    this.cachedOrders = this.cachedOrders.map((o) =>
      o.id === orderId ? { ...o, whatsappSent: true, updatedAt: now } : o
    );
    this.saveOrdersToLocalStorage();
    this.notifyOrderListeners();

    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        whatsappSent: true,
        updatedAt: now,
      });
    } catch {
      // Ignored for UI responsiveness
    }
  }

  async deleteOrder(orderId: string): Promise<boolean> {
    this.cachedOrders = this.cachedOrders.filter((o) => o.id !== orderId);
    this.saveOrdersToLocalStorage();
    this.notifyOrderListeners();

    try {
      await deleteDoc(doc(db, 'orders', orderId));
    } catch (error) {
      console.warn('Could not delete order in Firestore immediately (removed locally):', error);
    }
    return true;
  }

  async resetCatalogToDefault(): Promise<void> {
    this.cachedProducts = INITIAL_PRODUCTS.map((p) => normalizeProductWithShades(p));
    this.saveProductsToLocalStorage();
    this.notifyProductListeners();
    await this.seedCatalogToFirestore();
  }

  getSettings(): StoreSettings {
    return this.cachedSettings;
  }

  async saveSettings(newSettings: Partial<StoreSettings>): Promise<StoreSettings> {
    const merged = sanitizeForFirestore({ ...this.cachedSettings, ...newSettings });
    this.cachedSettings = merged;

    try {
      localStorage.setItem('dulzara_settings_v1', JSON.stringify(merged));
    } catch (e) {
      console.warn('Could not save settings to localStorage:', e);
    }

    this.notifySettingsListeners();

    try {
      await setDoc(doc(db, 'settings', 'store'), merged, { merge: true });
    } catch (error) {
      console.warn('Firestore settings sync notice (saved in local store):', error);
    }

    return merged;
  }
}

export const storeService = new StoreService();

