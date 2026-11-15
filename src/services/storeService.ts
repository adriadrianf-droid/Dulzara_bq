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
import { INITIAL_PRODUCTS } from '../data/catalogSnapshot';

export { INITIAL_PRODUCTS };

const LEGACY_DELETED_IDS = new Set([
  'prod-001',
  'prod-002',
  'prod-003',
  'prod-004',
  'prod-005',
  'prod-006',
  'prod-007',
  'prod-008',
  'prod-009',
  'prod-010',
]);

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
  heroBadgeText: '',
  heroButtonText: 'Explorar Catálogo ✦',
  heroImageUrl: '/assets/aistudio/dulzara_hero_current.jpg',
};

export const DEFAULT_SETTINGS: StoreSettings = {
  brandName: 'DULZARA',
  whatsappNumber: '573122568522',
  freeShippingThreshold: 80000,
  standardShippingCost: 10000,
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
        if (
          !this.cachedSettings.heroButtonText ||
          this.cachedSettings.heroButtonText.includes('favoritos') ||
          this.cachedSettings.heroButtonText === 'Explorar Catálogo'
        ) {
          this.cachedSettings.heroButtonText = 'Explorar Catálogo ✦';
        }
        if (
          this.cachedSettings.heroImageUrl &&
          this.cachedSettings.heroImageUrl.includes('images.unsplash.com/photo-1522337360788')
        ) {
          this.cachedSettings.heroImageUrl = DEFAULT_HERO_SETTINGS.heroImageUrl;
        }
      }
    } catch {
      this.cachedSettings = { ...DEFAULT_SETTINGS };
    }

    // 2. Products (never load legacy deleted demo products prod-001..prod-010)
    try {
      const storedProducts = localStorage.getItem('dulzara_products_v1');
      if (storedProducts) {
        const parsed = JSON.parse(storedProducts);
        if (Array.isArray(parsed)) {
          const validStored = parsed.filter(
            (p: Product) => p && p.id && !LEGACY_DELETED_IDS.has(p.id)
          );
          if (validStored.length > 0) {
            this.cachedProducts = validStored.map((p: Product) => normalizeProductWithShades(p));
          } else {
            this.cachedProducts = INITIAL_PRODUCTS.map((p) => normalizeProductWithShades(p));
          }
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
   * Initializes real-time listener with Firestore as source of truth
   */
  private async initRealtimeSubscriptions() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Subscribe to /products
    try {
      const productsRef = collection(db, 'products');
      onSnapshot(
        productsRef,
        (snapshot) => {
          const list: Product[] = [];
          snapshot.forEach((docSnap) => {
            const rawItem = docSnap.data() as Product;
            if (rawItem && rawItem.id && !LEGACY_DELETED_IDS.has(rawItem.id)) {
              const normalized = normalizeProductWithShades(rawItem);
              list.push(normalized);
            }
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

    const nextName = updates.name ? updates.name.trim() : current.name;
    const fallbackSlug = nextName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const updatedRaw: Product = {
      ...current,
      ...updates,
      slug: current.slug || updates.slug || fallbackSlug,
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

