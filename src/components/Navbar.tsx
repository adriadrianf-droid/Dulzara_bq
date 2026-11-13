import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ShoppingBag, Search, ShieldCheck, Menu, X, ArrowRight, Sparkles, TrendingUp, CornerDownLeft } from 'lucide-react';
import {
  formatCOP,
  normalizeSearchText,
  matchesSearchQuery,
  getSpanishWordVariants,
} from '../utils/formatters';
import { Product, OFFICIAL_CATEGORIES } from '../types/store';

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
  products?: Product[];
  onSelectProduct?: (product: Product) => void;
  onSearchSubmit?: (query: string) => void;
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
  products = [],
  onSelectProduct,
  onSearchSubmit,
}) => {
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filtered predictive suggestions with diacritics, casing, and plural tolerance
  const normalizedQuery = normalizeSearchText(searchQuery);

  const { suggestions, totalMatches } = useMemo(() => {
    if (!normalizedQuery || products.length === 0) {
      return { suggestions: [], totalMatches: 0 };
    }
    const matches = products.filter((p) => {
      return (
        matchesSearchQuery(p.name, normalizedQuery) ||
        matchesSearchQuery(p.category || '', normalizedQuery) ||
        matchesSearchQuery(p.description || '', normalizedQuery) ||
        matchesSearchQuery(p.shortDescription || '', normalizedQuery)
      );
    });

    // Rank: exact prefix in normalized name first, then contains, then others
    matches.sort((a, b) => {
      const aNorm = normalizeSearchText(a.name);
      const bNorm = normalizeSearchText(b.name);
      const aStarts = aNorm.startsWith(normalizedQuery);
      const bStarts = bNorm.startsWith(normalizedQuery);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return 0;
    });

    return {
      suggestions: matches.slice(0, 5),
      totalMatches: matches.length,
    };
  }, [normalizedQuery, products]);

  // Click outside listener to dismiss search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlight index when query changes
  useEffect(() => {
    setHighlightedIndex(-1);
    if (searchQuery.trim().length > 0) {
      setDropdownOpen(true);
    }
  }, [searchQuery]);

  const handleCategoryClick = (cat: string | null) => {
    onNavigateCategory(cat);
    setMobileMenuOpen(false);
    const catalogEl = document.getElementById('catalogo');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSelectProduct = (product: Product) => {
    setDropdownOpen(false);
    searchInputRef.current?.blur();
    if (onSelectProduct) {
      onSelectProduct(product);
    }
  };

  const handleExecuteSearch = (query: string) => {
    setDropdownOpen(false);
    // Dismiss mobile on-screen keyboard so user clearly sees the filtered catalog
    searchInputRef.current?.blur();
    if (onSearchSubmit) {
      onSearchSubmit(query);
    } else {
      onSearchChange(query);
      const catalogEl = document.getElementById('catalogo') || document.getElementById('grid-productos');
      if (catalogEl) {
        const yOffset = -75;
        const y = catalogEl.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
        setDropdownOpen(true);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setHighlightedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        setDropdownOpen(true);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (dropdownOpen && highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        handleSelectProduct(suggestions[highlightedIndex]);
      } else {
        handleExecuteSearch(searchQuery);
      }
    } else if (e.key === 'Escape') {
      setDropdownOpen(false);
      searchInputRef.current?.blur();
    }
  };

  // Resilient text highlighter that works across accents, casing, and plurals
  const renderHighlightedText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const normText = normalizeSearchText(text);
    const normQuery = normalizeSearchText(query);
    if (!normQuery) return text;

    const queryVariants = getSpanishWordVariants(normQuery);
    let bestIndex = -1;
    let matchLen = 0;

    for (const variant of [normQuery, ...queryVariants]) {
      const idx = normText.indexOf(variant);
      if (idx !== -1) {
        bestIndex = idx;
        matchLen = variant.length;
        break;
      }
    }

    if (bestIndex === -1 || matchLen === 0) {
      return text;
    }

    const before = text.slice(0, bestIndex);
    const match = text.slice(bestIndex, bestIndex + matchLen);
    const after = text.slice(bestIndex + matchLen);

    return (
      <>
        {before}
        <span className="text-[#B9788B] font-bold bg-[#F7E5E9]/90 rounded px-0.5">
          {match}
        </span>
        {after}
      </>
    );
  };

  const popularSearches = ['Labial', 'Bruma', 'Manteca corporal', 'Brochas', 'Skincare'];

  return (
    <header className="sticky top-0 z-40 bg-[#FFFDF9]/95 backdrop-blur-md border-b border-[#E8BFCB]/40 transition-colors w-full">
      {/* Main Top Bar */}
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-1 sm:gap-4 md:gap-8">
        
        {/* Zone 1: Brand Wordmark with Centered Imagotipo */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <button
            onClick={() => {
              onNavigateCategory(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-left group cursor-pointer focus-visible:outline-none flex items-center gap-1.5 sm:gap-2.5"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center overflow-hidden shrink-0 relative">
              <img
                src="/assets/aistudio/dulzara_logo_transparent.png"
                alt="Logo Dulzara"
                className="w-full h-full object-contain pointer-events-none mix-blend-multiply"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="text-base sm:text-2xl font-serif-brand font-semibold tracking-wider text-[#382A30] group-hover:text-[#B9788B] transition-colors whitespace-nowrap shrink-0">
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
            className={`whitespace-nowrap shrink-0 hover:text-[#B9788B] transition-colors cursor-pointer ${
              activeCategory === null && !searchQuery ? 'text-[#B9788B] font-semibold' : ''
            }`}
          >
            Inicio & Todo
          </button>
          {OFFICIAL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`whitespace-nowrap shrink-0 hover:text-[#B9788B] transition-colors cursor-pointer ${
                activeCategory === cat ? 'text-[#B9788B] font-semibold' : ''
              }`}
            >
              {cat}
            </button>
          ))}
        </nav>

        {/* Zone 3: Search, Admin Access, Shopping Bag, and Mobile Menu Pill */}
        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          
          {/* Predictive Search Container with Autocomplete Dropdown */}
          <div className="static sm:relative flex items-center" ref={searchContainerRef}>
            {showSearchInput ? (
              <div className="flex items-center bg-[#F7E5E9]/70 border border-[#E8BFCB] focus-within:border-[#B9788B] rounded-full px-2.5 sm:px-3 py-1 sm:py-1.5 w-36 min-[380px]:w-44 min-[420px]:w-52 sm:w-64 md:w-72 transition-all shadow-xs">
                <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#B9788B] mr-1 sm:mr-1.5 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onFocus={() => setDropdownOpen(true)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  className="w-full bg-transparent text-xs text-[#382A30] placeholder-[#382A30]/50 focus:outline-none min-w-0"
                />
                {searchQuery ? (
                  <button
                    onClick={() => {
                      onSearchChange('');
                      searchInputRef.current?.focus();
                    }}
                    aria-label="Borrar texto"
                    className="text-[#382A30]/50 hover:text-[#382A30] p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowSearchInput(false);
                      setDropdownOpen(false);
                    }}
                    aria-label="Cerrar buscador"
                    className="text-[#382A30]/50 hover:text-[#382A30] p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => {
                  setShowSearchInput(true);
                  setDropdownOpen(true);
                  setTimeout(() => searchInputRef.current?.focus(), 50);
                }}
                aria-label="Abrir buscador"
                className="p-1.5 sm:p-2 text-[#382A30]/80 hover:text-[#B9788B] rounded-full hover:bg-[#F7E5E9]/60 transition-colors cursor-pointer"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}

            {/* Google-Style Predictive Autocomplete Dropdown (Centered & unclipped on mobile, right-aligned on desktop) */}
            {dropdownOpen && showSearchInput && (
              <div className="absolute left-2.5 right-2.5 sm:left-auto sm:right-0 top-full mt-2 sm:w-96 max-w-none sm:max-w-md bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl border border-[#E8BFCB] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                
                {/* Active search with suggestions */}
                {normalizedQuery.length > 0 && suggestions.length > 0 && (
                  <div>
                    <div className="px-3.5 py-2 bg-[#F7E5E9]/50 border-b border-[#E8BFCB]/40 flex items-center justify-between text-[11px] font-medium text-[#382A30]/70">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-[#B9788B]" />
                        Sugerencias ({totalMatches})
                      </span>
                      <span className="text-[10px] text-[#B9788B] hidden sm:inline flex items-center gap-1">
                        Presiona <CornerDownLeft className="w-2.5 h-2.5 inline" /> Enter para filtrar
                      </span>
                    </div>

                    <div className="divide-y divide-[#F7E5E9]/70 max-h-80 overflow-y-auto">
                      {suggestions.map((item, idx) => (
                        <button
                          key={item.id}
                          onClick={() => handleSelectProduct(item)}
                          onMouseEnter={() => setHighlightedIndex(idx)}
                          className={`w-full text-left p-2.5 sm:p-3 flex items-center gap-3 transition-colors cursor-pointer group ${
                            highlightedIndex === idx ? 'bg-[#F7E5E9]/80' : 'hover:bg-[#F7E5E9]/40'
                          }`}
                        >
                          {/* Product Thumbnail with Elegant Fallback */}
                          <div className="w-11 h-11 rounded-xl bg-[#F7E5E9] overflow-hidden shrink-0 border border-[#E8BFCB]/50 flex items-center justify-center relative">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : null}
                            <span className="text-xs text-[#B9788B] font-serif select-none">✦</span>
                          </div>

                          {/* Product Meta & Price */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-semibold uppercase tracking-wider text-[#B9788B]">
                                {item.category}
                              </span>
                              {item.stock <= 3 && item.stock > 0 && (
                                <span className="text-[9px] bg-rose-100 text-rose-700 px-1 rounded-sm font-medium">
                                  ¡Últimas unidades!
                                </span>
                              )}
                            </div>
                            <h5 className="text-xs font-medium text-[#382A30] truncate group-hover:text-[#B9788B] transition-colors">
                              {renderHighlightedText(item.name, searchQuery)}
                            </h5>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-bold text-[#382A30]">
                                {formatCOP(item.price)}
                              </span>
                              {item.originalPrice && item.originalPrice > item.price && (
                                <span className="text-[10px] text-[#382A30]/50 line-through">
                                  {formatCOP(item.originalPrice)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Selection indicator icon */}
                          <div className="shrink-0 p-1 rounded-full text-[#B9788B]/60 group-hover:text-[#B9788B] group-hover:translate-x-0.5 transition-all">
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* View all matching results CTA */}
                    <button
                      onClick={() => handleExecuteSearch(searchQuery)}
                      className="w-full py-2.5 px-4 bg-[#F7E5E9]/60 hover:bg-[#F7E5E9] text-xs font-semibold text-[#B9788B] flex items-center justify-center gap-2 border-t border-[#E8BFCB]/50 transition-colors cursor-pointer"
                    >
                      <span>Ver los {totalMatches} productos para "{searchQuery}"</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Active search with NO matches */}
                {normalizedQuery.length > 0 && suggestions.length === 0 && (
                  <div className="p-5 text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-[#F7E5E9] flex items-center justify-center mx-auto text-[#B9788B]">
                      <Search className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-semibold text-[#382A30]">
                      No encontramos coincidencias para "{searchQuery}"
                    </p>
                    <p className="text-[11px] text-[#382A30]/60 max-w-xs mx-auto">
                      Intenta con palabras clave como labial, bruma, crema, o explora las categorías del menú.
                    </p>
                  </div>
                )}

                {/* Empty query state: Popular suggestions & quick picks */}
                {normalizedQuery.length === 0 && (
                  <div className="p-3.5 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#382A30]">
                      <TrendingUp className="w-3.5 h-3.5 text-[#B9788B]" />
                      <span>Búsquedas frecuentes</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {popularSearches.map((term) => (
                        <button
                          key={term}
                          onClick={() => {
                            onSearchChange(term);
                            searchInputRef.current?.focus();
                          }}
                          className="px-2.5 py-1 rounded-full bg-[#F7E5E9] hover:bg-[#E8BFCB] text-[#382A30] text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Search className="w-2.5 h-2.5 text-[#B9788B]" />
                          <span>{term}</span>
                        </button>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-[#E8BFCB]/30 flex items-center justify-between text-[11px] text-[#382A30]/70">
                      <span>Catálogo completo ({products.length} productos)</span>
                      <button
                        onClick={() => handleExecuteSearch('')}
                        className="text-[#B9788B] font-semibold hover:underline cursor-pointer flex items-center gap-1"
                      >
                        Ver todo <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

              </div>
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
              {cartCount > 0 ? formatCOP(cartSubtotal) : 'Bolsa'}
            </span>
          </button>

          {/* Mobile Menu Ingenious Pill Button (Solo Celular - se oculta mientras se busca para dar espacio cómodo) */}
          {!showSearchInput && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menú móvil"
              className="md:hidden bg-[#F7E5E9] text-[#382A30] border border-[#E8BFCB] rounded-full px-2.5 sm:px-3 py-1.5 flex items-center gap-1 text-xs font-medium hover:bg-[#ebd3d9] transition-colors shrink-0 shadow-xs active:scale-95 animate-in fade-in duration-150"
            >
              {mobileMenuOpen ? (
                <X className="w-3.5 h-3.5 text-[#B9788B]" />
              ) : (
                <Menu className="w-3.5 h-3.5 text-[#B9788B]" />
              )}
              <span>Menú</span>
            </button>
          )}
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
            {OFFICIAL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className="text-left py-2 px-3 text-sm font-medium rounded-lg hover:bg-[#F7E5E9]"
              >
                {cat}
              </button>
            ))}
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
