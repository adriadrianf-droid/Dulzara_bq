import { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react';
import {
  ArrowUpDown,
  MessageCircle,
  Truck,
  ShieldCheck,
  Gift,
  Sparkles,
  ShoppingBag
} from 'lucide-react';

import { Product, CartItem, Order, StoreSettings, SelectedShade } from './types/store';
import { storeService } from './services/storeService';
import { authService, AdminUser } from './services/authService';
import {
  formatCOP,
  createWhatsAppUrl,
  matchesSearchQuery,
  getCartItemKey,
  getVariantLabel,
} from './utils/formatters';
import {
  getProductSlug,
  getCategorySlug,
  parseStorePath,
  updatePageSEO,
  CATEGORY_SEO_MAP,
} from './utils/seo';

import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { CategoryFilter } from './components/CategoryFilter';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { Footer } from './components/Footer';

// Lazy load heavy admin-only modules to optimize mobile shopping performance
const AdminLoginModal = lazy(() =>
  import('./components/AdminLoginModal').then((m) => ({ default: m.AdminLoginModal }))
);
const AdminPanel = lazy(() =>
  import('./components/AdminPanel').then((m) => ({ default: m.AdminPanel }))
);

export default function App() {
  // Store Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(storeService.getSettings());

  // User Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('dulzara_cart_items_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Navigation & Filtering
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'all' | 'price-asc' | 'price-desc'>('all');
  const [onlyFeatured, setOnlyFeatured] = useState(false);

  // Modals & Panels state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<{ order: Order; whatsappUrl: string } | null>(null);

  // Admin View State
  const [adminUser, setAdminUser] = useState<AdminUser | null>(authService.getCurrentUser());
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdminPanelActive, setIsAdminPanelActive] = useState(false);

  // Toast / notification feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const hasResolvedInitialRouteRef = useRef<boolean>(false);

  const handleSelectCategory = (category: string | null) => {
    setActiveCategory(category);
    setSelectedProduct(null);
    const nextPath = category ? `/categoria/${getCategorySlug(category)}` : '/';
    if (window.location.pathname !== nextPath) {
      window.history.pushState({ category }, '', nextPath);
    }
  };

  const handleSelectProduct = (product: Product | null) => {
    setSelectedProduct(product);
    if (product) {
      const nextPath = `/productos/${getProductSlug(product)}`;
      if (window.location.pathname !== nextPath) {
        window.history.pushState({ productSlug: getProductSlug(product) }, '', nextPath);
      }
    } else {
      const fallbackPath = activeCategory
        ? `/categoria/${getCategorySlug(activeCategory)}`
        : '/';
      if (window.location.pathname !== fallbackPath) {
        window.history.pushState({ category: activeCategory }, '', fallbackPath);
      }
    }
  };

  // Real-time synchronization with Firestore & Favicon enforcement
  useEffect(() => {
    const faviconUri = 'data:image/png;base64,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';
    let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.type = 'image/png';
    link.href = faviconUri;

    const unsubscribeProducts = storeService.onProductsChange((updated) => {
      setProducts(updated);
    });

    const unsubscribeOrders = storeService.onOrdersChange((updated) => {
      setOrders(updated);
    });

    const unsubscribeSettings = storeService.onSettingsChange((updatedSettings) => {
      setSettings(updatedSettings);
    });

    const unsubscribeAuth = authService.onAuthChanged(async (user) => {
      setAdminUser(user);
      if (user) {
        await storeService.seedCatalogIfEmpty();
      }
    });

    setSettings(storeService.getSettings());

    return () => {
      unsubscribeProducts();
      unsubscribeOrders();
      unsubscribeSettings();
      unsubscribeAuth();
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // Synchronize open ProductDetailModal, initial URL route (/productos/:slug or /categoria/:slug), & Cart items with live product updates
  useEffect(() => {
    if (products.length === 0) return;

    if (!hasResolvedInitialRouteRef.current) {
      hasResolvedInitialRouteRef.current = true;
      const initialRoute = parseStorePath(window.location.pathname, products);
      if (initialRoute.product) {
        setSelectedProduct(initialRoute.product);
      } else if (initialRoute.category) {
        setActiveCategory(initialRoute.category);
      }
    }

    setSelectedProduct((prev) => {
      if (!prev) return null;
      return products.find((p) => p.id === prev.id) || null;
    });

    setCartItems((prev) => {
      if (prev.length === 0) return prev;
      let changed = false;
      const synced: CartItem[] = [];

      for (const item of prev) {
        const liveProduct = products.find((p) => p.id === item.product.id);
        if (!liveProduct) {
          changed = true;
          continue;
        }

        const hasLiveShades = Array.isArray(liveProduct.shades) && liveProduct.shades.length > 0;
        const liveShade =
          hasLiveShades && item.selectedShade
            ? liveProduct.shades!.find((s) => s.id === item.selectedShade?.id)
            : undefined;

        const maxStock = hasLiveShades
          ? liveShade
            ? liveShade.stock
            : 0
          : liveProduct.stock;

        if (maxStock <= 0) {
          changed = true;
          continue;
        }

        const clampedQty = Math.min(maxStock, item.quantity);
        const nextSelectedShade: SelectedShade | undefined = liveShade
          ? {
              id: liveShade.id,
              name: liveShade.name,
              colorHex: liveShade.colorHex,
              finish: liveShade.finish,
            }
          : undefined;

        if (
          item.product !== liveProduct ||
          clampedQty !== item.quantity ||
          nextSelectedShade?.name !== item.selectedShade?.name ||
          nextSelectedShade?.colorHex !== item.selectedShade?.colorHex ||
          nextSelectedShade?.finish !== item.selectedShade?.finish
        ) {
          changed = true;
          synced.push({
            product: liveProduct,
            selectedShade: nextSelectedShade,
            quantity: clampedQty,
          });
        } else {
          synced.push(item);
        }
      }

      return changed ? synced : prev;
    });
  }, [products]);

  // Handle browser Back/Forward navigation for /productos/:slug and /categoria/:slug
  useEffect(() => {
    const handlePopState = () => {
      const route = parseStorePath(window.location.pathname, products);
      setSelectedProduct(route.product);
      setActiveCategory(route.product ? activeCategory : route.category);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [products, activeCategory]);

  // Keep page <title>, <meta name="description">, canonical URL, and Schema.org Product/Offer JSON-LD updated
  useEffect(() => {
    updatePageSEO({
      selectedProduct,
      activeCategory,
      products,
      settings,
    });
  }, [selectedProduct, activeCategory, products, settings]);

  const loadData = () => {
    setProducts(storeService.getProducts());
    setOrders(storeService.getOrders());
    setSettings(storeService.getSettings());
  };

  // Sync cart to storage
  useEffect(() => {
    try {
      localStorage.setItem('dulzara_cart_items_v1', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Error saving cart items', e);
    }
  }, [cartItems]);

  const showToast = (msg: string) => {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    setToastMessage(msg);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 2500);
  };

  // Cart operations using unique key ${product.id}_${selectedShade?.id || 'default'}
  const handleAddToCart = (
    product: Product,
    quantity = 1,
    selectedShade?: SelectedShade
  ) => {
    if (product.stock <= 0) return;

    const targetShadeObj =
      selectedShade && product.shades
        ? product.shades.find((s) => s.id === selectedShade.id)
        : undefined;
    const maxStock = targetShadeObj ? targetShadeObj.stock : product.stock;
    if (maxStock <= 0) return;

    const targetKey = getCartItemKey(product.id, selectedShade?.id);

    setCartItems((prev) => {
      const existing = prev.find(
        (item) =>
          getCartItemKey(item.product.id, item.selectedShade?.id) === targetKey
      );
      if (existing) {
        const newQty = Math.min(maxStock, existing.quantity + quantity);
        return prev.map((item) =>
          getCartItemKey(item.product.id, item.selectedShade?.id) === targetKey
            ? { ...item, product, selectedShade, quantity: newQty }
            : item
        );
      } else {
        return [
          ...prev,
          {
            product,
            selectedShade,
            quantity: Math.min(maxStock, quantity),
          },
        ];
      }
    });

    const shadeLabel = selectedShade
      ? ` (${getVariantLabel(product.variantType)}: ${selectedShade.name})`
      : '';
    showToast(`¡Agregaste "${product.name}"${shadeLabel} a tu bolsa!`);
  };

  const handleUpdateQuantity = (cartItemKey: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(cartItemKey);
      return;
    }

    setCartItems((prev) =>
      prev.map((item) => {
        const itemKey = getCartItemKey(item.product.id, item.selectedShade?.id);
        if (itemKey === cartItemKey || item.product.id === cartItemKey) {
          const matchingShade =
            item.selectedShade && item.product.shades
              ? item.product.shades.find((s) => s.id === item.selectedShade?.id)
              : undefined;
          const maxStock = matchingShade
            ? matchingShade.stock
            : item.product.stock;
          return { ...item, quantity: Math.min(maxStock, quantity) };
        }
        return item;
      })
    );
  };

  const handleRemoveFromCart = (cartItemKey: string) => {
    setCartItems((prev) =>
      prev.filter(
        (item) =>
          getCartItemKey(item.product.id, item.selectedShade?.id) !==
            cartItemKey && item.product.id !== cartItemKey
      )
    );
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  // Global search matches across all categories
  const allSearchMatches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return products.filter((p) =>
      matchesSearchQuery(p.name, searchQuery) ||
      matchesSearchQuery(p.description || '', searchQuery) ||
      matchesSearchQuery(p.shortDescription || '', searchQuery) ||
      matchesSearchQuery(p.category || '', searchQuery)
    );
  }, [products, searchQuery]);

  // Breakdown of matching products by category
  const matchesByCategory = useMemo(() => {
    return allSearchMatches.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [allSearchMatches]);

  // Category counts: show search result count per category when searching
  const categoryCounts = useMemo(() => {
    const list = searchQuery.trim() ? allSearchMatches : products;
    return list.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [products, searchQuery, allSearchMatches]);

  // Filtered & sorted catalog with accent, case, and plural tolerance
  const filteredProducts = products.filter((product) => {
    const matchesCategory = !activeCategory || product.category === activeCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      matchesSearchQuery(product.name, searchQuery) ||
      matchesSearchQuery(product.description || '', searchQuery) ||
      matchesSearchQuery(product.shortDescription || '', searchQuery) ||
      matchesSearchQuery(product.category || '', searchQuery);
    const matchesFeatured = !onlyFeatured || Boolean(product.isFeatured);

    return matchesCategory && matchesSearch && matchesFeatured;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    return 0;
  });

  // Order success handler
  const handleOrderSuccess = (order: Order, whatsappUrl: string) => {
    handleClearCart();
    setIsCheckoutOpen(false);
    setCompletedOrder({ order, whatsappUrl });
    loadData(); // updates local stock in state
  };

  // Search submission: searches globally across the whole store by resetting activeCategory to null
  const handleSearchSubmit = (query: string) => {
    // Automatically search entire catalog so products in any category are shown immediately
    handleSelectCategory(null);
    setSearchQuery(query);
    setTimeout(() => {
      const el = document.getElementById('catalogo') || document.getElementById('grid-productos');
      if (el) {
        const yOffset = -75; // subtle offset so header doesn't cover "Resultados para la búsqueda..."
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }
    }, 40);
  };

  // WhatsApp general consultation
  const handleOpenWhatsAppAdvice = () => {
    const msg = '¡Hola equipo Dulzara! Me gustaría recibir asesoría personalizada sobre sus productos y tonos.';
    window.open(createWhatsAppUrl(settings.whatsappNumber, msg), '_blank');
  };

  // If Admin Panel is opened and user is authenticated
  if (isAdminPanelActive && adminUser) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#FFFDF9] flex flex-col items-center justify-center text-xs text-[#382A30]/70 gap-2">
            <span className="w-6 h-6 border-2 border-[#B9788B] border-t-transparent rounded-full animate-spin" />
            <span>Cargando panel administrativo...</span>
          </div>
        }
      >
        <AdminPanel
          user={adminUser}
          onLogout={async () => {
            await authService.logout();
            setAdminUser(null);
            setIsAdminPanelActive(false);
          }}
          onBackToStore={() => setIsAdminPanelActive(false)}
          products={products}
          orders={orders}
          settings={settings}
          onRefreshData={loadData}
        />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-[#382A30] font-sans flex flex-col selection:bg-[#E8BFCB] selection:text-[#382A30]">
      
      {/* Toast feedback (Top-aligned below single-row header, fully horizontal & non-obstructive) */}
      {toastMessage && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed top-20 sm:top-22 left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0 z-50 w-[92vw] max-w-md sm:w-auto sm:max-w-lg bg-[#FFFDF9]/98 backdrop-blur-md text-[#382A30] border border-[#E8BFCB] px-3.5 sm:px-4 py-2.5 rounded-full shadow-lg shadow-[#382A30]/8 flex items-center justify-between gap-3 animate-dulzara-toast"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-5 h-5 rounded-full bg-[#F7E5E9] text-[#B9788B] flex items-center justify-center shrink-0">
              <span className="text-xs font-serif leading-none" aria-hidden="true">✦</span>
            </div>
            <p className="text-xs font-medium text-[#382A30] truncate">
              {toastMessage}
            </p>
          </div>
          <button
            onClick={() => {
              setToastMessage(null);
              setIsCartOpen(true);
            }}
            className="shrink-0 px-3 py-1 rounded-full bg-[#B9788B] hover:bg-[#a6687a] text-white text-[11px] font-semibold transition-all active:scale-95 shadow-xs whitespace-nowrap cursor-pointer"
          >
            Ver bolsa
          </button>
        </aside>
      )}

      {/* Top Navbar */}
      <Navbar
        cartCount={cartCount}
        cartSubtotal={cartSubtotal}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAdmin={() => {
          if (adminUser) {
            setIsAdminPanelActive(true);
          } else {
            setIsAdminLoginOpen(true);
          }
        }}
        isAdminLoggedIn={!!adminUser}
        onNavigateCategory={(cat) => {
          handleSelectCategory(cat);
          setSearchQuery('');
          setTimeout(() => {
            const catalogEl = document.getElementById('catalogo');
            if (catalogEl) {
              catalogEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 30);
        }}
        activeCategory={activeCategory}
        onSearchChange={setSearchQuery}
        searchQuery={searchQuery}
        products={products}
        onSelectProduct={handleSelectProduct}
        onSearchSubmit={handleSearchSubmit}
      />

      {/* Main Storefront Area */}
      <main className="flex-1">
        
        {/* Editorial Hero Banner */}
        <HeroBanner
          settings={settings}
          onExploreClick={() => {
            const el = document.getElementById('catalogo');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          onOpenWhatsAppAdvice={handleOpenWhatsAppAdvice}
        />

        {/* Store Trust & Perks Strip */}
        <section className="bg-white border-y border-[#E8BFCB]/30 py-4 sm:py-6">
          <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-5">
              
              <div className="flex items-center gap-2.5 sm:gap-3.5 p-2.5 sm:p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#F7E5E9]">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#F7E5E9] flex items-center justify-center shrink-0 text-[#B9788B]">
                  <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[11.5px] sm:text-xs font-semibold text-[#382A30] leading-tight">Envíos a toda Colombia</h4>
                  <p className="text-[10.5px] sm:text-[11px] text-[#382A30]/65 leading-snug mt-0.5">
                    Gratis desde{' '}
                    <span className="whitespace-nowrap">
                      {formatCOP(settings.freeShippingThreshold).replace('$ ', '$')}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 sm:gap-3.5 p-2.5 sm:p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#F7E5E9]">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#F7E5E9] flex items-center justify-center shrink-0 text-[#B9788B]">
                  <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#25D366]" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[11.5px] sm:text-xs font-semibold text-[#382A30] leading-tight">Pedido por WhatsApp</h4>
                  <p className="text-[10.5px] sm:text-[11px] text-[#382A30]/65 leading-snug mt-0.5">Atención rápida y cercana</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 sm:gap-3.5 p-2.5 sm:p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#F7E5E9]">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#F7E5E9] flex items-center justify-center shrink-0 text-[#B9788B]">
                  <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[11.5px] sm:text-xs font-semibold text-[#382A30] leading-tight">100% Original</h4>
                  <p className="text-[10.5px] sm:text-[11px] text-[#382A30]/65 leading-snug mt-0.5">Fórmulas seguras y certificadas</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 sm:gap-3.5 p-2.5 sm:p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#F7E5E9]">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#F7E5E9] flex items-center justify-center shrink-0 text-[#B9788B]">
                  <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[11.5px] sm:text-xs font-semibold text-[#382A30] leading-tight">Empaque de Regalo</h4>
                  <p className="text-[10.5px] sm:text-[11px] text-[#382A30]/65 leading-snug mt-0.5">Cada pedido viaja perfumado</p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Main Catalog Section with scroll-mt-20 for sticky header clearance */}
        <section id="catalogo" className="py-8 sm:py-14 max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 scroll-mt-20">
          
          {/* Section Header */}
          <div className="space-y-3.5 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
              <div>
                <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.08em] text-[#B9788B]">
                  Catálogo Oficial · Barranquilla y toda Colombia
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif-brand font-semibold text-[#382A30] leading-tight mt-0.5">
                  {activeCategory ? `Colección: ${activeCategory}` : 'Explora Todos los Productos'}
                </h2>
                {activeCategory && CATEGORY_SEO_MAP[activeCategory] && (
                  <p className="text-xs text-[#382A30]/70 mt-1 max-w-2xl">
                    {CATEGORY_SEO_MAP[activeCategory].subtitle}
                  </p>
                )}
              </div>

              {/* Controls: Cohesive Featured pill button & Sort selector */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-xs">
                <button
                  type="button"
                  onClick={() => setOnlyFeatured((prev) => !prev)}
                  aria-pressed={onlyFeatured}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                    onlyFeatured
                      ? 'bg-[#B9788B] text-white border-[#B9788B] shadow-2xs'
                      : 'bg-white text-[#382A30]/80 border-[#E8BFCB] hover:border-[#B9788B] hover:text-[#382A30]'
                  }`}
                >
                  <span className={onlyFeatured ? 'text-white' : 'text-[#B9788B]'} aria-hidden="true">
                    ✦
                  </span>
                  <span>Sólo destacados</span>
                </button>

                <div className="relative inline-flex items-center border border-[#E8BFCB] rounded-xl bg-white hover:border-[#B9788B] transition-colors">
                  <ArrowUpDown className="w-3.5 h-3.5 text-[#B9788B] pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 select-none" />
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value as 'all' | 'price-asc' | 'price-desc')
                    }
                    className="w-full bg-transparent focus:outline-none text-[#382A30] font-medium cursor-pointer pl-7 pr-3 py-1.5 text-xs rounded-xl"
                  >
                    <option value="all">Ordenar: Todos</option>
                    <option value="price-asc">Precio: Menor a mayor</option>
                    <option value="price-desc">Precio: Mayor a menor</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Segmented Category Filter Bar */}
            <CategoryFilter
              activeCategory={activeCategory}
              onSelectCategory={handleSelectCategory}
              totalProductsCount={searchQuery.trim() ? allSearchMatches.length : products.length}
              categoryCounts={categoryCounts}
            />

            {/* Search query feedback with cross-category awareness */}
            {searchQuery && (
              <div className="p-3.5 bg-[#F7E5E9]/60 border border-[#E8BFCB] rounded-2xl text-xs text-[#382A30] space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#B9788B] shrink-0" />
                    <span>
                      Resultados para <strong>"{searchQuery}"</strong>:{' '}
                      {activeCategory ? (
                        <>
                          <strong>{sortedProducts.length}</strong> en <em>{activeCategory}</em>{' '}
                          {allSearchMatches.length !== sortedProducts.length && (
                            <span className="text-[#382A30]/70">
                              (de <strong>{allSearchMatches.length}</strong> en toda la tienda)
                            </span>
                          )}
                        </>
                      ) : (
                        <strong>{sortedProducts.length} productos en toda la tienda</strong>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeCategory && allSearchMatches.length > sortedProducts.length && (
                      <button
                        onClick={() => handleSelectCategory(null)}
                        className="px-2.5 py-1 bg-white hover:bg-[#F7E5E9] text-[#B9788B] font-semibold rounded-lg border border-[#E8BFCB] transition-colors cursor-pointer text-[11px]"
                      >
                        Ver todos ({allSearchMatches.length})
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        handleSelectCategory(null);
                      }}
                      className="text-[#B9788B] font-semibold hover:underline cursor-pointer text-[11px]"
                    >
                      Limpiar búsqueda
                    </button>
                  </div>
                </div>

                {/* Proactive alert: if current category has 0 matches but other categories do */}
                {activeCategory && sortedProducts.length === 0 && allSearchMatches.length > 0 && (
                  <div className="pt-2 border-t border-[#E8BFCB]/50 flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="text-[#382A30]/80">
                      💡 No hay coincidencias en <strong>{activeCategory}</strong>, pero sí encontramos en:
                    </span>
                    {Object.entries(matchesByCategory).map(([cat, count]) => (
                      <button
                        key={cat}
                        onClick={() => handleSelectCategory(cat)}
                        className="px-2.5 py-0.5 bg-[#B9788B] text-white rounded-full font-medium hover:bg-[#a6687a] transition-all cursor-pointer shadow-2xs"
                      >
                        {cat} ({count})
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Catalog Grid */}
          {sortedProducts.length === 0 ? (
            <div className="py-14 text-center space-y-4 bg-white rounded-3xl border border-[#E8BFCB]/60 p-8 shadow-xs">
              <div className="w-16 h-16 rounded-full bg-[#F7E5E9] flex items-center justify-center mx-auto text-[#B9788B]">
                <Sparkles className="w-8 h-8" />
              </div>

              {activeCategory && allSearchMatches.length > 0 ? (
                <div className="space-y-3 max-w-md mx-auto">
                  <h3 className="text-lg font-serif-brand font-semibold text-[#382A30]">
                    ¿Buscabas "{searchQuery}" en otra sección?
                  </h3>
                  <p className="text-xs text-[#382A30]/70">
                    No encontramos "{searchQuery}" dentro de <strong>{activeCategory}</strong>, pero sí tenemos <strong>{allSearchMatches.length} {allSearchMatches.length === 1 ? 'producto' : 'productos'}</strong> disponibles en otras secciones:
                  </p>
                  
                  {/* Category jump buttons */}
                  <div className="flex flex-wrap justify-center gap-2 pt-1">
                    {Object.entries(matchesByCategory).map(([cat, count]) => (
                      <button
                        key={cat}
                        onClick={() => handleSelectCategory(cat)}
                        className="px-3.5 py-1.5 bg-[#F7E5E9] hover:bg-[#E8BFCB] text-[#382A30] text-xs font-semibold rounded-xl border border-[#E8BFCB] transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <span>{cat}</span>
                        <span className="bg-[#B9788B] text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                          {count}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="pt-3">
                    <button
                      onClick={() => handleSelectCategory(null)}
                      className="px-5 py-2.5 bg-[#B9788B] text-white text-xs font-semibold rounded-full hover:bg-[#a6687a] transition-all shadow-xs cursor-pointer"
                    >
                      Ver todos los {allSearchMatches.length} productos
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 max-w-sm mx-auto">
                  <h3 className="text-lg font-serif-brand font-semibold text-[#382A30]">
                    No encontramos productos con ese criterio
                  </h3>
                  <p className="text-xs text-[#382A30]/60">
                    Prueba seleccionando otra categoría o limpiando la barra de búsqueda.
                  </p>
                  <button
                    onClick={() => {
                      handleSelectCategory(null);
                      setSearchQuery('');
                      setOnlyFeatured(false);
                      setSortBy('all');
                    }}
                    className="mt-2 px-5 py-2.5 bg-[#B9788B] text-white text-xs font-semibold rounded-full hover:bg-[#a6687a] cursor-pointer"
                  >
                    Ver todo el catálogo
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div id="grid-productos" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {sortedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={(p, shade) => handleAddToCart(p, 1, shade)}
                  onQuickView={handleSelectProduct}
                  isItemInCart={cartItems.some((ci) => ci.product.id === product.id)}
                />
              ))}
            </div>
          )}

        </section>

      </main>

      {/* Mobile Floating Quick-Bag Bar (Only on phones when bag has items and no modal is open) */}
      {cartCount > 0 && !isCartOpen && !isCheckoutOpen && !selectedProduct && !completedOrder && (
        <div className="fixed bottom-5 left-3.5 right-18 z-40 sm:hidden animate-dulzara-pop">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-[#382A30]/95 backdrop-blur-md text-[#FFFDF9] border border-[#E8BFCB]/30 rounded-full px-3.5 py-2.5 shadow-lg flex items-center justify-between gap-2 active:scale-98 transition-transform cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative w-7 h-7 rounded-full bg-[#B9788B] flex items-center justify-center shrink-0">
                <ShoppingBag className="w-3.5 h-3.5 text-white" />
                <span className="absolute -top-1 -right-1 bg-white text-[#382A30] text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center tabular-nums">
                  {cartCount}
                </span>
              </div>
              <div className="text-left min-w-0">
                <span className="text-xs font-bold block leading-tight tabular-nums truncate">
                  {formatCOP(cartSubtotal)}
                </span>
                <span className="text-[10px] text-[#E8BFCB] block leading-tight truncate">
                  {cartSubtotal >= settings.freeShippingThreshold
                    ? '¡Envío gratis desbloqueado! ✦'
                    : `Faltan ${formatCOP(settings.freeShippingThreshold - cartSubtotal)} para envío gratis`}
                </span>
              </div>
            </div>
            <span className="shrink-0 bg-[#B9788B] text-white text-[11px] font-semibold px-3 py-1 rounded-full">
              Ver bolsa
            </span>
          </button>
        </div>
      )}

      {/* Floating WhatsApp Quick Consultation Button */}
      <div className="fixed bottom-5 right-3.5 sm:bottom-6 sm:right-6 z-40">
        <button
          onClick={handleOpenWhatsAppAdvice}
          aria-label="Contactar por WhatsApp"
          className="flex items-center gap-2.5 px-3.5 py-3 sm:px-4 sm:py-3 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95 text-xs font-semibold cursor-pointer"
        >
          <MessageCircle className="w-5 h-5 fill-white text-[#25D366]" />
          <span className="hidden sm:inline">¿Dudas? Escríbenos</span>
        </button>
      </div>

      {/* Footer */}
      <Footer
        settings={settings}
        onOpenAdmin={() => {
          if (adminUser) {
            setIsAdminPanelActive(true);
          } else {
            setIsAdminLoginOpen(true);
          }
        }}
        onFilterCategory={handleSelectCategory}
      />

      {/* Modals & Drawers */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => handleSelectProduct(null)}
        onAddToCart={handleAddToCart}
        whatsappNumber={settings.whatsappNumber}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
        freeShippingThreshold={settings.freeShippingThreshold}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cartItems}
        settings={settings}
        onOrderSuccess={handleOrderSuccess}
      />

      <OrderConfirmationModal
        order={completedOrder ? completedOrder.order : null}
        whatsappUrl={completedOrder ? completedOrder.whatsappUrl : ''}
        onClose={() => setCompletedOrder(null)}
      />

      {isAdminLoginOpen && (
        <Suspense fallback={null}>
          <AdminLoginModal
            isOpen={isAdminLoginOpen}
            onClose={() => setIsAdminLoginOpen(false)}
            onLoginSuccess={(user) => {
              setAdminUser(user);
              setIsAdminPanelActive(true);
            }}
          />
        </Suspense>
      )}

    </div>
  );
}
