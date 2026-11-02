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

  return (
    <header className="sticky top-0 z-40 bg-[#FFFDF9]/95 backdrop-blur-md border-b border-[#E8BFCB]/40 transition-colors">
      {/* Slim Top Announcement Bar (<= 40px, dismissible) */}
      {showPromo && (
        <div className="h-8 bg-[#382A30] text-[#FFFDF9] text-xs px-4 flex items-center justify-between font-sans">
          <div className="flex-1 text-center truncate">
            <span>Envíos a toda Colombia</span>
            <span className="mx-2 text-[#E8BFCB]" aria-hidden="true">·</span>
            <span>Gratis desde {formatCOP(settings.freeShippingThreshold)}</span>
            <span className="mx-2 text-[#E8BFCB]" aria-hidden="true">·</span>
            <span className="hidden sm:inline">Pide directo por WhatsApp</span>
          </div>
          <button
            onClick={() => setShowPromo(false)}
            aria-label="Cerrar aviso"
            className="text-[#E8BFCB] hover:text-white p-1 ml-2 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Top Bar Contract: Zone 1, Zone 2, Zone 3 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-8">
        
        {/* Zone 1: Brand Wordmark (Single text element, display face) */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              onNavigateCategory(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-left group cursor-pointer focus-visible:outline-none"
          >
            <span className="text-2xl sm:text-3xl font-serif-brand font-semibold tracking-wider text-[#382A30] group-hover:text-[#B9788B] transition-colors whitespace-nowrap shrink-0">
              DULZARA
            </span>
          </button>
        </div>

        {/* Zone 2: 4-5 Clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#382A30]/80">
          <button
            onClick={() => onNavigateCategory(null)}
            className={`whitespace-nowrap shrink-0 hover:text-[#B9788B] transition-colors ${
              activeCategory === null && !searchQuery ? 'text-[#B9788B] font-semibold' : ''
            }`}
          >
            Inicio & Todo
          </button>
          <button
            onClick={() => onNavigateCategory('skincare')}
            className={`whitespace-nowrap shrink-0 hover:text-[#B9788B] transition-colors ${
              activeCategory === 'skincare' ? 'text-[#B9788B] font-semibold' : ''
            }`}
          >
            Cuidado Facial
          </button>
          <button
            onClick={() => onNavigateCategory('maquillaje')}
            className={`whitespace-nowrap shrink-0 hover:text-[#B9788B] transition-colors ${
              activeCategory === 'maquillaje' ? 'text-[#B9788B] font-semibold' : ''
            }`}
          >
            Maquillaje
          </button>
          <button
            onClick={() => onNavigateCategory('labios')}
            className={`whitespace-nowrap shrink-0 hover:text-[#B9788B] transition-colors ${
              activeCategory === 'labios' ? 'text-[#B9788B] font-semibold' : ''
            }`}
          >
            Labios
          </button>
          <button
            onClick={() => onNavigateCategory('ojos')}
            className={`whitespace-nowrap shrink-0 hover:text-[#B9788B] transition-colors ${
              activeCategory === 'ojos' ? 'text-[#B9788B] font-semibold' : ''
            }`}
          >
            Ojos
          </button>
          <button
            onClick={() => onNavigateCategory('accesorios')}
            className={`whitespace-nowrap shrink-0 hover:text-[#B9788B] transition-colors ${
              activeCategory === 'accesorios' ? 'text-[#B9788B] font-semibold' : ''
            }`}
          >
            Accesorios
          </button>
        </nav>

        {/* Zone 3: Search, Admin Access, Shopping Bag */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Quick Search Toggle / Input */}
          <div className="relative flex items-center">
            {showSearchInput ? (
              <div className="flex items-center bg-[#F7E5E9]/60 border border-[#E8BFCB] rounded-full px-3 py-1.5 w-44 sm:w-60 transition-all">
                <Search className="w-4 h-4 text-[#B9788B] mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  autoFocus
                  className="w-full bg-transparent text-xs text-[#382A30] placeholder-[#382A30]/50 focus:outline-none"
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
                className="p-2 text-[#382A30]/80 hover:text-[#B9788B] rounded-full hover:bg-[#F7E5E9]/60 transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Admin Protected Panel Entry Button */}
          <button
            onClick={onOpenAdmin}
            title={isAdminLoggedIn ? 'Panel de Administración (Conectado)' : 'Acceso Administrador'}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border border-[#E8BFCB] text-[#382A30] hover:bg-[#F7E5E9] hover:border-[#B9788B] transition-colors"
          >
            <ShieldCheck className={`w-4 h-4 ${isAdminLoggedIn ? 'text-emerald-700' : 'text-[#B9788B]'}`} />
            <span className="hidden lg:inline">{isAdminLoggedIn ? 'Panel Admin' : 'Admin'}</span>
          </button>

          {/* Shopping Bag CTA */}
          <button
            onClick={onOpenCart}
            aria-label="Abrir bolsa de compras"
            className="relative flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-[#B9788B] hover:bg-[#a6687a] text-white transition-all shadow-sm active:scale-95"
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

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menú móvil"
            className="md:hidden p-2 text-[#382A30] hover:text-[#B9788B]"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E8BFCB]/50 bg-[#FFFDF9] px-4 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-2 pb-3 border-b border-[#F7E5E9]">
            <button
              onClick={() => {
                onNavigateCategory(null);
                setMobileMenuOpen(false);
              }}
              className="text-left py-2 px-3 text-sm font-medium rounded-lg hover:bg-[#F7E5E9]"
            >
              Todos los productos
            </button>
            <button
              onClick={() => {
                onNavigateCategory('skincare');
                setMobileMenuOpen(false);
              }}
              className="text-left py-2 px-3 text-sm font-medium rounded-lg hover:bg-[#F7E5E9]"
            >
              Cuidado Facial
            </button>
            <button
              onClick={() => {
                onNavigateCategory('maquillaje');
                setMobileMenuOpen(false);
              }}
              className="text-left py-2 px-3 text-sm font-medium rounded-lg hover:bg-[#F7E5E9]"
            >
              Maquillaje
            </button>
            <button
              onClick={() => {
                onNavigateCategory('labios');
                setMobileMenuOpen(false);
              }}
              className="text-left py-2 px-3 text-sm font-medium rounded-lg hover:bg-[#F7E5E9]"
            >
              Labios
            </button>
            <button
              onClick={() => {
                onNavigateCategory('ojos');
                setMobileMenuOpen(false);
              }}
              className="text-left py-2 px-3 text-sm font-medium rounded-lg hover:bg-[#F7E5E9]"
            >
              Ojos
            </button>
            <button
              onClick={() => {
                onNavigateCategory('accesorios');
                setMobileMenuOpen(false);
              }}
              className="text-left py-2 px-3 text-sm font-medium rounded-lg hover:bg-[#F7E5E9]"
            >
              Accesorios
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
