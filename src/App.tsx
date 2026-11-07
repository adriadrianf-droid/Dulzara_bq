import React, { useState, useEffect, lazy, Suspense } from 'react';
import {
  ArrowUpDown,
  Filter,
  CheckCircle,
  MessageCircle,
  Truck,
  ShieldCheck,
  Gift
} from 'lucide-react';

import { Product, CartItem, Order, StoreSettings } from './types/store';
import { storeService } from './services/storeService';
import { authService, AdminUser } from './services/authService';
import { formatCOP, createWhatsAppUrl } from './utils/formatters';

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
    };
  }, []);

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
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Cart operations
  const handleAddToCart = (product: Product, quantity = 1) => {
    if (product.stock <= 0) return;

    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const newQty = Math.min(product.stock, existing.quantity + quantity);
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: newQty } : item
        );
      } else {
        return [...prev, { product, quantity: Math.min(product.stock, quantity) }];
      }
    });

    showToast(`¡Agregaste "${product.name}" a tu bolsa!`);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }

    setCartItems((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          return { ...item, quantity: Math.min(item.product.stock, quantity) };
        }
        return item;
      })
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  // Category counts
  const categoryCounts = products.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Filtered & sorted catalog
  const filteredProducts = products.filter((product) => {
    const matchesCategory = !activeCategory || product.category === activeCategory;
    const cleanSearch = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !cleanSearch ||
      product.name.toLowerCase().includes(cleanSearch) ||
      product.description.toLowerCase().includes(cleanSearch) ||
      product.category.toLowerCase().includes(cleanSearch);
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
      
      {/* Toast feedback */}
      {toastMessage && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 sm:bottom-auto sm:top-20 sm:left-auto sm:right-6 sm:translate-x-0 z-50 bg-[#FFFDF9]/95 backdrop-blur-md text-[#382A30] border border-[#E8BFCB] px-4 py-2.5 rounded-full text-xs font-medium shadow-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 sm:slide-in-from-top-2 duration-300"
        >
          <span className="text-[#B9788B] text-sm animate-pulse font-serif" aria-hidden="true">✦</span>
          <span>{toastMessage}</span>
          <button
            onClick={() => {
              setToastMessage(null);
              setIsCartOpen(true);
            }}
            className="ml-1 text-[11px] font-bold text-[#B9788B] hover:text-[#382A30] underline underline-offset-2 transition-colors cursor-pointer"
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
          setActiveCategory(cat);
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
        settings={settings}
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
        <section className="bg-white border-y border-[#E8BFCB]/30 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F7E5E9] flex items-center justify-center shrink-0 text-[#B9788B]">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#382A30]">Envíos a toda Colombia</h4>
                  <p className="text-[11px] text-[#382A30]/60">Gratis por compras desde {formatCOP(settings.freeShippingThreshold)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F7E5E9] flex items-center justify-center shrink-0 text-[#B9788B]">
                  <MessageCircle className="w-5 h-5 text-[#25D366]" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#382A30]">Pedido por WhatsApp</h4>
                  <p className="text-[11px] text-[#382A30]/60">Atención rápida y personalizada</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F7E5E9] flex items-center justify-center shrink-0 text-[#B9788B]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#382A30]">100% Original</h4>
                  <p className="text-[11px] text-[#382A30]/60">Fórmulas seguras y certificadas</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F7E5E9] flex items-center justify-center shrink-0 text-[#B9788B]">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#382A30]">Empaque de Regalo</h4>
                  <p className="text-[11px] text-[#382A30]/60">Cada pedido viaja perfumado</p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Main Catalog Section with scroll-mt-24 for sticky header clearance */}
        <section id="catalogo" className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 scroll-mt-24">
          
          {/* Section Header */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#B9788B]">
                  Catálogo Oficial
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif-brand font-semibold text-[#382A30]">
                  {activeCategory ? `Colección: ${activeCategory}` : 'Explora Todos los Productos'}
                </h2>
              </div>

              {/* Controls: Featured filter & Sort selector */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none text-[#382A30]/80 hover:text-[#382A30] transition-colors">
                  <input
                    type="checkbox"
                    checked={onlyFeatured}
                    onChange={(e) => setOnlyFeatured(e.target.checked)}
                    className="rounded text-[#B9788B] focus:ring-[#B9788B] border-[#E8BFCB]"
                  />
                  <span className="flex items-center gap-1 font-medium">
                    <span className="text-[#B9788B] text-xs" aria-hidden="true">✦</span>
                    Sólo destacados
                  </span>
                </label>

                <div className="relative inline-flex items-center border border-[#E8BFCB] rounded-xl bg-white hover:border-[#B9788B] transition-colors">
                  <ArrowUpDown className="w-3.5 h-3.5 text-[#B9788B] pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 select-none" />
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value as 'all' | 'price-asc' | 'price-desc')
                    }
                    className="w-full bg-transparent focus:outline-none text-[#382A30] cursor-pointer pl-7 pr-2.5 py-1.5 text-xs rounded-xl"
                  >
                    <option value="all">Todos</option>
                    <option value="price-asc">Menor a mayor</option>
                    <option value="price-desc">Mayor a menor</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Segmented Category Filter Bar */}
            <CategoryFilter
              activeCategory={activeCategory}
              onSelectCategory={setActiveCategory}
              totalProductsCount={products.length}
              categoryCounts={categoryCounts}
            />

            {/* Search query feedback if any */}
            {searchQuery && (
              <div className="flex items-center justify-between p-3 bg-[#F7E5E9]/50 rounded-xl text-xs text-[#382A30]">
                <span>
                  Resultados para la búsqueda: <strong>"{searchQuery}"</strong> ({sortedProducts.length} productos)
                </span>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-[#B9788B] font-semibold hover:underline"
                >
                  Limpiar búsqueda
                </button>
              </div>
            )}
          </div>

          {/* Catalog Grid */}
          {sortedProducts.length === 0 ? (
            <div className="py-20 text-center space-y-3 bg-white rounded-3xl border border-[#E8BFCB]/40 p-8">
              <div className="w-16 h-16 rounded-full bg-[#F7E5E9] flex items-center justify-center mx-auto text-[#B9788B]">
                <Filter className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-serif-brand font-semibold text-[#382A30]">
                No encontramos productos con ese criterio
              </h3>
              <p className="text-xs text-[#382A30]/60 max-w-sm mx-auto">
                Prueba seleccionando otra categoría o limpiando la barra de búsqueda.
              </p>
              <button
                onClick={() => {
                  setActiveCategory(null);
                  setSearchQuery('');
                  setOnlyFeatured(false);
                  setSortBy('all');
                }}
                className="mt-2 px-5 py-2.5 bg-[#B9788B] text-white text-xs font-semibold rounded-full hover:bg-[#a6687a]"
              >
                Ver todo el catálogo
              </button>
            </div>
          ) : (
            <div id="grid-productos" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {sortedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={(p) => handleAddToCart(p, 1)}
                  onQuickView={setSelectedProduct}
                  isItemInCart={cartItems.some((ci) => ci.product.id === product.id)}
                />
              ))}
            </div>
          )}

        </section>

      </main>

      {/* Floating WhatsApp Quick Consultation Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={handleOpenWhatsAppAdvice}
          aria-label="Contactar por WhatsApp"
          className="flex items-center gap-2.5 px-4 py-3 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95 text-xs font-semibold"
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
        onFilterCategory={setActiveCategory}
      />

      {/* Modals & Drawers */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
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
