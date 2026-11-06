import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShoppingBag,
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
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminPanel } from './components/AdminPanel';
import { Footer } from './components/Footer';

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
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');
  const [onlyInStock, setOnlyInStock] = useState(false);

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

  // Real-time synchronization with Firestore
  useEffect(() => {
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
    const matchesStock = !onlyInStock || product.stock > 0;

    return matchesCategory && matchesSearch && matchesStock;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    // Featured first
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return 0;
  });

  // Featured spotlight items
  const featuredProducts = products.filter((p) => p.isFeatured).slice(0, 4);

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
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-[#382A30] font-sans flex flex-col selection:bg-[#E8BFCB] selection:text-[#382A30]">
      
      {/* Toast feedback */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#382A30] text-white px-4 py-2.5 rounded-full text-xs font-medium shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle className="w-4 h-4 text-[#E8BFCB]" />
          <span>{toastMessage}</span>
        </div>
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

        {/* Featured Selection Section */}
        {featuredProducts.length > 0 && !searchQuery && !activeCategory && (
          <section className="py-14 sm:py-20 bg-gradient-to-b from-[#FFFDF9] via-[#F7E5E9]/20 to-[#FFFDF9]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
              
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#B9788B]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Selección Destacada</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-serif-brand font-semibold text-[#382A30] mt-1">
                    Los esenciales más amados de Dulzara
                  </h2>
                </div>
                <button
                  onClick={() => {
                    const el = document.getElementById('catalogo');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="text-xs font-semibold text-[#B9788B] hover:text-[#a6687a] underline underline-offset-4 self-start sm:self-auto"
                >
                  Ver todos los {products.length} productos
                </button>
              </div>

              {/* Grid 4 columns desktop */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                {featuredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={(p) => handleAddToCart(p, 1)}
                    onQuickView={setSelectedProduct}
                    isItemInCart={cartItems.some((ci) => ci.product.id === product.id)}
                  />
                ))}
              </div>

            </div>
          </section>
        )}

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

              {/* Controls: Stock toggle & Sort selector */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none text-[#382A30]/80">
                  <input
                    type="checkbox"
                    checked={onlyInStock}
                    onChange={(e) => setOnlyInStock(e.target.checked)}
                    className="rounded text-[#B9788B] focus:ring-[#B9788B]"
                  />
                  <span>Sólo disponibles</span>
                </label>

                <div className="flex items-center gap-1.5 border border-[#E8BFCB] rounded-xl px-2.5 py-1.5 bg-white">
                  <ArrowUpDown className="w-3.5 h-3.5 text-[#B9788B]" />
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value as 'featured' | 'price-asc' | 'price-desc')
                    }
                    className="bg-transparent focus:outline-none text-[#382A30]"
                  >
                    <option value="featured">Destacados</option>
                    <option value="price-asc">Precio: Menor a Mayor</option>
                    <option value="price-desc">Precio: Mayor a Menor</option>
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
                  setOnlyInStock(false);
                }}
                className="mt-2 px-5 py-2.5 bg-[#B9788B] text-white text-xs font-semibold rounded-full hover:bg-[#a6687a]"
              >
                Ver todo el catálogo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
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

      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={(user) => {
          setAdminUser(user);
          setIsAdminPanelActive(true);
        }}
      />

    </div>
  );
}
