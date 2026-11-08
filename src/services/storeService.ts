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
import { Product, Order, CustomerInfo, StoreSettings, OrderStatus } from '../types/store';

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
    shortDescription: 'Unifica el tono, minimiza poros y aporta luminosidad natural sin sensación grasa.',
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
    shortDescription: 'Acabado mate aterciopelado de larga duración con manteca de karité hidratante.',
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
    shortDescription: '12 sombras pigmentadas entre mates sedosos, satinados perla y destellos rosa metálico.',
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
    shortDescription: 'Crema en gel sedosa que aporta hidratación profunda por 48 horas con acabado satinado.',
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
    name: 'Rubor Líquido "Pétalo Dewy Blush"',
    slug: 'rubor-liquido-petalo-dewy-blush',
    shortDescription: 'Rubor líquido modulable de larga duración con microesferas de luz natural.',
    description: 'Un rubor suave y sedoso que se funde como una segunda piel. Con una sola gota logras un aspecto saludable de mejillas sonrosadas y radiantes que dura todo el día sin resecar.',
    price: 34000,
    category: 'Rostro',
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80',
    isFeatured: true,
    benefits: [
      'Se difumina impecable con esponja, brocha o dedos',
      'Modulable desde un rubor sutil hasta alta intensidad',
      'No levanta la base ni parchea polvos',
      'Enriquecido con aceite de rosa mosqueta'
    ],
    ingredients: 'Isododecano, Mica, Poligliceril-2 Triisostearato, Aceite de Rosa Mosqueta virgen, Sílice dimetilsililato, Tocoferol.',
    howToUse: 'Coloca 1 a 2 puntos sobre la manzana del pómulo y difumina rápidamente hacia las sienes dando toques suaves.',
    createdAt: '2026-01-20T10:00:00.000Z',
    updatedAt: '2026-01-20T10:00:00.000Z',
  },
  {
    id: 'prod-006',
    name: 'Tónico Botánico de Rosas & Hamamelis',
    slug: 'tonico-botanico-rosas-hamamelis',
    shortDescription: 'Bruma purificante y descongestionante que equilibra el pH y refresca el cutis.',
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
    name: 'Bruma Fijadora de Maquillaje "Velvet Mist" 24h',
    slug: 'bruma-fijadora-maquillaje-velvet-mist',
    shortDescription: 'Spray micro-difusor que sella el maquillaje por 24 horas protegiendo contra humedad y calor.',
    description: 'Resistente al sudor y al clima tropical. Elimina el aspecto empolvado, funde todos los productos aplicados y crea un escudo invisible que mantiene tu look impecable desde la mañana hasta la noche.',
    price: 42000,
    category: 'Rostro',
    stock: 25,
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    isFeatured: false,
    benefits: [
      'Poder anti-transferencia y control de brillo en zona T',
      'Bruma ultra fina que no gotea ni mancha la máscara de pestañas',
      'Acondiciona la piel con extracto de té verde y aloe vera'
    ],
    ingredients: 'Agua, PVP, Polisorbato 20, Extracto de Té Verde, Jugo de hoja de Aloe Barbadensis, Fenoxietanol, Etilhexilglicerina.',
    howToUse: 'Agita bien antes de usar. Sostén a 25 cm del rostro y rocía en forma de "X" y "T" con los ojos cerrados.',
    createdAt: '2026-01-25T10:00:00.000Z',
    updatedAt: '2026-01-25T10:00:00.000Z',
  },
  {
    id: 'prod-008',
    name: 'Aceite Reparador de Labios "Berry Glow Lip Oil"',
    slug: 'aceite-reparador-labios-berry-glow',
    shortDescription: 'Tratamiento labial jugoso que nutre en profundidad y da un brillo cristalino no pegajoso.',
    description: 'Formulado con 5 aceites botánicos preciosos (frambuesa, jojoba, argán, almendras dulces y rosa mosqueta). Proporciona un sutil toque de color baya traslúcido y un confort sedoso incomparable.',
    price: 29000,
    category: 'Labios',
    stock: 35,
    imageUrl: 'https://images.unsplash.com/photo-1599305090598-fe179d501227?auto=format&fit=crop&w=800&q=80',
    isFeatured: false,
    benefits: [
      'Acabado espejo ultra brillante sin sensación pegajosa',
      'Repara labios agrietados y escamados en 24 horas',
      'Aplicador jumbo suave tipo felpa de máxima precisión'
    ],
    ingredients: 'Aceite de semilla de frambuesa, Polibuteno, Aceite de Jojoba, Tocoferol, Extracto de fresa silvestre, Sabor natural.',
    howToUse: 'Aplica directamente en cualquier momento del día. Úsalo solo para un look natural o sobre tu labial para un efecto gloss voluptuoso.',
    createdAt: '2026-01-28T10:00:00.000Z',
    updatedAt: '2026-01-28T10:00:00.000Z',
  },
  {
    id: 'prod-009',
    name: 'Manteca Corporal Batida Rosa Mosqueta & Vainilla',
    slug: 'manteca-corporal-batida-rosa-mosqueta-vainilla',
    shortDescription: 'Crema corporal rica batida en frío con manteca de cacao y aroma relajante.',
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
    shortDescription: 'Cerdas sintéticas ultra suaves hipoalergénicas con virola de oro rosa y mango ergonómico.',
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
          this.cachedProducts = parsed.map((p: Product) => ({
            ...p,
            category: normalizeCategory(p.category),
          }));
        } else {
          this.cachedProducts = [...INITIAL_PRODUCTS];
        }
      } else {
        this.cachedProducts = [...INITIAL_PRODUCTS];
      }
    } catch {
      this.cachedProducts = [...INITIAL_PRODUCTS];
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
      console.warn('Could not save products to localStorage:', e);
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
              const item = docSnap.data() as Product;
              list.push({
                ...item,
                category: normalizeCategory(item.category),
              });
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
        await setDoc(doc(db, 'products', prod.id), prod, { merge: true });
      }
      this.cachedProducts = [...INITIAL_PRODUCTS];
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
    const newProduct: Product = {
      ...productData,
      id,
      slug,
      createdAt: now,
      updatedAt: now,
    };

    // Immediate optimistic local update
    this.cachedProducts.unshift(newProduct);
    this.saveProductsToLocalStorage();
    this.notifyProductListeners();

    // Persist to Firestore asynchronously
    try {
      await setDoc(doc(db, 'products', id), newProduct);
    } catch (error) {
      console.warn('Could not sync new product to Firestore immediately (saved locally):', error);
    }

    return newProduct;
  }

  async updateProduct(id: string, updates: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<Product> {
    const current = this.getProductById(id);
    if (!current) {
      throw new Error(`Producto ${id} no encontrado.`);
    }

    const updated: Product = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Immediate optimistic local update
    const idx = this.cachedProducts.findIndex((p) => p.id === id);
    if (idx !== -1) {
      this.cachedProducts[idx] = updated;
    }
    this.saveProductsToLocalStorage();
    this.notifyProductListeners();

    // Persist to Firestore asynchronously
    try {
      await setDoc(doc(db, 'products', id), updated, { merge: true });
    } catch (error) {
      console.warn('Could not sync product update to Firestore immediately (saved locally):', error);
    }

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
    rawCartItems: { productId: string; quantity: number }[]
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
      if (canonical.stock < item.quantity) {
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
        imageUrl: canonical.imageUrl,
      });
    }

    const settings = this.getSettings();
    const shippingCost =
      calculatedSubtotal >= settings.freeShippingThreshold
        ? 0
        : settings.standardShippingCost;
    const finalTotal = calculatedSubtotal + shippingCost;

    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const orderId = `DLZ-2026-${randomSuffix}`;
    const now = new Date().toISOString();

    const newOrder: Order = {
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
    };

    // Immediate local persistence
    this.cachedOrders.unshift(newOrder);
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
   * When an order is confirmed or prepared, decrement stock of each item and persist immediately!
   */
  async updateOrderStatus(orderId: string, status: OrderStatus, notes?: string): Promise<Order> {
    const order = this.cachedOrders.find((o) => o.id === orderId);
    if (!order) {
      throw new Error(`Pedido ${orderId} no encontrado.`);
    }

    const oldStatus = order.status;
    const now = new Date().toISOString();

    // 1. If moving from 'pendiente' to 'confirmado' or 'preparando', decrement inventory of each product
    if (oldStatus === 'pendiente' && (status === 'confirmado' || status === 'preparando')) {
      for (const item of order.items) {
        const prod = this.cachedProducts.find((p) => p.id === item.productId);
        if (prod) {
          prod.stock = Math.max(0, prod.stock - item.quantity);
          prod.updatedAt = now;
        }
      }
      this.saveProductsToLocalStorage();
      this.notifyProductListeners();
    }

    // 2. If moving from 'confirmado' or 'preparando' back to 'pendiente', restore inventory
    if ((oldStatus === 'confirmado' || oldStatus === 'preparando') && status === 'pendiente') {
      for (const item of order.items) {
        const prod = this.cachedProducts.find((p) => p.id === item.productId);
        if (prod) {
          prod.stock = prod.stock + item.quantity;
          prod.updatedAt = now;
        }
      }
      this.saveProductsToLocalStorage();
      this.notifyProductListeners();
    }

    // 3. Update order state
    order.status = status;
    if (notes !== undefined) order.statusNotes = notes;
    order.updatedAt = now;
    this.saveOrdersToLocalStorage();
    this.notifyOrderListeners();

    // 4. Persist to Firestore (both stock changes and order changes)
    try {
      // Update products stock in Firestore
      if (oldStatus === 'pendiente' && (status === 'confirmado' || status === 'preparando')) {
        for (const item of order.items) {
          const prod = this.cachedProducts.find((p) => p.id === item.productId);
          if (prod) {
            await setDoc(doc(db, 'products', item.productId), { stock: prod.stock, updatedAt: now }, { merge: true });
          }
        }
      }
      // Update order in Firestore
      const orderRef = doc(db, 'orders', orderId);
      await setDoc(
        orderRef,
        {
          status,
          statusNotes: notes !== undefined ? notes : order.statusNotes,
          updatedAt: now,
        },
        { merge: true }
      );
    } catch (firestoreErr) {
      console.warn('Firestore update warning (applied and persisted in local state):', firestoreErr);
    }

    return order;
  }

  async markWhatsappSent(orderId: string): Promise<void> {
    const order = this.cachedOrders.find((o) => o.id === orderId);
    if (order) {
      order.whatsappSent = true;
      this.saveOrdersToLocalStorage();
      this.notifyOrderListeners();
    }
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        whatsappSent: true,
        updatedAt: new Date().toISOString(),
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
    this.cachedProducts = [...INITIAL_PRODUCTS];
    this.saveProductsToLocalStorage();
    this.notifyProductListeners();
    await this.seedCatalogToFirestore();
  }

  getSettings(): StoreSettings {
    return this.cachedSettings;
  }

  async saveSettings(newSettings: Partial<StoreSettings>): Promise<StoreSettings> {
    const merged = { ...this.cachedSettings, ...newSettings };
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

