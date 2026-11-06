import React, { useState } from 'react';
import { ShoppingBag, Search, ShieldCheck, Menu, X, ArrowRight } from 'lucide-react';
import { formatCOP } from '../utils/formatters';
import { StoreSettings } from '../types/store';

interface NavbarProps {
  cartCount: number;
  cartSubtotal: number;
  onOpenCart: () => void;
  onOpenAdmin: () => void;
  isAdminLoggedIn: boolean;
  onNavigateCategory: (category: string | null) => void;
  activeCategory: string | null;
  onSearchChange: (query: string) => void;
  searchQuery: string;
  settings: StoreSettings;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  cartSubtotal,
  onOpenCart,
  onOpenAdmin,
  isAdminLoggedIn,
  onNavigateCategory,
  activeCategory,
  onSearchChange,
  searchQuery,
  settings,
}) => {
  const [showPromo, setShowPromo] = useState(true);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleCategoryClick = (cat: string | null) => {
    onNavigateCategory(cat);
    setMobileMenuOpen(false);
    const catalogEl = document.getElementById('catalogo');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FFFDF9]/95 backdrop-blur-md border-b border-[#E8BFCB]/40 transition-colors w-full max-w-[100vw] overflow-x-hidden">
      {/* Slim Top Announcement Bar (<= 40px, dismissible) */}
      {showPromo && (
        <div className="h-8 bg-[#382A30] text-[#FFFDF9] text-xs px-3 sm:px-4 flex items-center justify-between font-sans">
          <div className="flex-1 text-center truncate text-[11px] sm:text-xs">
            <span>Envíos a toda Colombia</span>
            <span className="mx-1.5 sm:mx-2 text-[#E8BFCB]" aria-hidden="true">·</span>
            <span>Gratis desde {formatCOP(settings.freeShippingThreshold)}</span>
            <span className="mx-1.5 sm:mx-2 text-[#E8BFCB]" aria-hidden="true">·</span>
            <span className="hidden sm:inline">Pide directo por WhatsApp</span>
          </div>
          <button
            onClick={() => setShowPromo(false)}
            aria-label="Cerrar aviso"
            className="text-[#E8BFCB] hover:text-white p-1 ml-1 sm:ml-2 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Top Bar: w-full max-w-[100vw] overflow-x-hidden px-3 */}
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-1.5 sm:gap-4 md:gap-8 overflow-x-hidden">
        
        {/* Zone 1: Brand Wordmark with Centered Imagotipo (bg-white, no transparency, exact centering) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => {
              onNavigateCategory(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-left group cursor-pointer focus-visible:outline-none flex items-center gap-2 sm:gap-2.5"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-[#E8BFCB] flex items-center justify-center overflow-hidden shrink-0 shadow-xs relative">
              <img
                src="/assets/aistudio/dulzara_logo_cropped.png"
                alt="Logo Dulzara"
                className="w-full h-full object-contain scale-110 translate-x-[4%] translate-y-[4%] pointer-events-none"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="text-lg sm:text-2xl font-serif-brand font-semibold tracking-wider text-[#382A30] group-hover:text-[#B9788B] transition-colors whitespace-nowrap shrink-0">
                  DULZARA
                </span>
                <span className="text-[#B9788B] text-xs font-serif leading-none select-none" aria-hidden="true">✦</span>
              </div>
              <span className="text-[9px] uppercase tracking-widest text-[#B9788B] font-sans -mt-0.5 hidden sm:block font-medium">
                Belleza & Cuidado
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: 5 Clean single-line official categories */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#382A30]/80">
          <button
            onClick={() => handleCategoryClick(null)}
            className={`whitespace-nowrap shrink-0 hover:text-[#B9788B] transition-colors ${
              activeCategory === null && !searchQuery ? 'text-[#B9788B] font-semibold' : ''
            }`}
          >
            Inicio & Todo
          </button>
          <button
            onClick={() => handleCategoryClick('Rostro')}
            className={`whitespace-nowrap shrink-0 hover:text-[#B9788B] transition-colors ${
              activeCategory === 'Rostro' ? 'text-[#B9788B] font-semibold' : ''
            }`}
          >
            Rostro
          </button>
          <button
            onClick={() => handleCategoryClick('Ojos y Cejas')}
            className={`whitespace-nowrap shrink-0 hover:text-[#B9788B] transition-colors ${
              activeCategory === 'Ojos y Cejas' ? 'text-[#B9788B] font-semibold' : ''
            }`}
          >
            Ojos y Cejas
          </button>
          <button
            onClick={() => handleCategoryClick('Labios')}
            className={`whitespace-nowrap shrink-0 hover:text-[#B9788B] transition-colors ${
              activeCategory === 'Labios' ? 'text-[#B9788B] font-semibold' : ''
            }`}
          >
            Labios
          </button>
          <button
            onClick={() => handleCategoryClick('Skincare y Cuidado')}
            className={`whitespace-nowrap shrink-0 hover:text-[#B9788B] transition-colors ${
              activeCategory === 'Skincare y Cuidado' ? 'text-[#B9788B] font-semibold' : ''
            }`}
          >
            Skincare y Cuidado
          </button>
          <button
            onClick={() => handleCategoryClick('Kits y Accesorios')}
            className={`whitespace-nowrap shrink-0 hover:text-[#B9788B] transition-colors ${
              activeCategory === 'Kits y Accesorios' ? 'text-[#B9788B] font-semibold' : ''
            }`}
          >
            Kits y Accesorios
          </button>
        </nav>

        {/* Zone 3: Search, Admin Access, Shopping Bag, and Mobile Menu Pill */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Quick Search Toggle / Input */}
          <div className="relative flex items-center">
            {showSearchInput ? (
              <div className="flex items-center bg-[#F7E5E9]/60 border border-[#E8BFCB] rounded-full px-2.5 sm:px-3 py-1 sm:py-1.5 w-36 sm:w-60 transition-all">
                <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#B9788B] mr-1.5 shrink-0" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  autoFocus
                  className="w-full bg-transparent text-xs text-[#382A30] placeholder-[#382A30]/50 focus:outline-none min-w-0"
                />
                <button
                  onClick={() => {
                    setShowSearchInput(false);
                    onSearchChange('');
                  }}
                  className="text-[#382A30]/50 hover:text-[#382A30]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSearchInput(true)}
                aria-label="Abrir buscador"
                className="p-1.5 sm:p-2 text-[#382A30]/80 hover:text-[#B9788B] rounded-full hover:bg-[#F7E5E9]/60 transition-colors"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>

          {/* Admin Protected Panel Entry Button (hidden on tiny mobile, accessible via mobile drawer) */}
          <button
            onClick={onOpenAdmin}
            title={isAdminLoggedIn ? 'Panel de Administración (Conectado)' : 'Acceso Administrador'}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border border-[#E8BFCB] text-[#382A30] hover:bg-[#F7E5E9] hover:border-[#B9788B] transition-colors"
          >
            <ShieldCheck className={`w-4 h-4 ${isAdminLoggedIn ? 'text-emerald-700' : 'text-[#B9788B]'}`} />
            <span className="hidden lg:inline">{isAdminLoggedIn ? 'Panel Admin' : 'Admin'}</span>
          </button>

          {/* Shopping Bag CTA */}
          <button
            onClick={onOpenCart}
            aria-label="Abrir bolsa de compras"
            className="relative flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full bg-[#B9788B] hover:bg-[#a6687a] text-white transition-all shadow-sm active:scale-95 shrink-0"
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#382A30] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center tabular-nums">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-xs font-medium hidden sm:inline whitespace-nowrap">
              {cartCount > 0 ? formatCOP(cartSubtotal, false) : 'Bolsa'}
            </span>
          </button>

          {/* Mobile Menu Ingenious Pill Button (Solo Celular) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menú móvil"
            className="md:hidden bg-[#F7E5E9] text-[#382A30] border border-[#E8BFCB] rounded-full px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium hover:bg-[#ebd3d9] transition-colors shrink-0 shadow-xs active:scale-95"
          >
            {mobileMenuOpen ? (
              <X className="w-3.5 h-3.5 text-[#B9788B]" />
            ) : (
              <Menu className="w-3.5 h-3.5 text-[#B9788B]" />
            )}
            <span>Menú</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E8BFCB]/50 bg-[#FFFDF9] px-4 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-2 pb-3 border-b border-[#F7E5E9]">
            <button
              onClick={() => handleCategoryClick(null)}
              className="text-left py-2 px-3 text-sm font-medium rounded-lg hover:bg-[#F7E5E9]"
            >
              Todos los productos
            </button>
            <button
              onClick={() => handleCategoryClick('Rostro')}
              className="text-left py-2 px-3 text-sm font-medium rounded-lg hover:bg-[#F7E5E9]"
            >
              Rostro
            </button>
            <button
              onClick={() => handleCategoryClick('Ojos y Cejas')}
              className="text-left py-2 px-3 text-sm font-medium rounded-lg hover:bg-[#F7E5E9]"
            >
              Ojos y Cejas
            </button>
            <button
              onClick={() => handleCategoryClick('Labios')}
              className="text-left py-2 px-3 text-sm font-medium rounded-lg hover:bg-[#F7E5E9]"
            >
              Labios
            </button>
            <button
              onClick={() => handleCategoryClick('Skincare y Cuidado')}
              className="text-left py-2 px-3 text-sm font-medium rounded-lg hover:bg-[#F7E5E9]"
            >
              Skincare y Cuidado
            </button>
            <button
              onClick={() => handleCategoryClick('Kits y Accesorios')}
              className="text-left py-2 px-3 text-sm font-medium rounded-lg hover:bg-[#F7E5E9]"
            >
              Kits y Accesorios
            </button>
          </div>

          <div className="pt-1 flex items-center justify-between text-xs text-[#382A30]/70">
            <span>Envíos a toda Colombia</span>
            <button
              onClick={() => {
                onOpenAdmin();
                setMobileMenuOpen(false);
              }}
              className="text-[#B9788B] font-medium flex items-center gap-1"
            >
              Panel Administrador <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
