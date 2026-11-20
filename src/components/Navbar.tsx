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

  const visibleCategories = useMemo(
    () =>
      OFFICIAL_CATEGORIES.filter((cat) =>
        products.some((p) => p.category === cat && p.stock > 0)
      ),
    [products]
  );

  const popularSearches = useMemo(() => {
    const candidates = ['Base', 'Corrector', 'Pestañina', 'Rubor', 'Polvo', 'Labial', 'Delineador', 'Gloss'];
    const matching = candidates.filter((term) =>
      products.some(
        (p) =>
          p.stock > 0 &&
          (matchesSearchQuery(p.name, term) ||
            matchesSearchQuery(p.category || '', term) ||
            matchesSearchQuery(p.shortDescription || '', term) ||
            matchesSearchQuery(p.description || '', term))
      )
    );
    return matching.length > 0 ? matching.slice(0, 6) : ['Base', 'Corrector', 'Pestañina', 'Labial'];
  }, [products]);

  return (
    <header className="sticky top-0 z-40 bg-[#FFFDF9]/95 backdrop-blur-md border-b border-[#E8BFCB]/40 transition-colors w-full">
      {/* Main Top Bar */}
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-6 md:px-5 lg:px-8 h-16 sm:h-18 md:h-20 flex items-center justify-between gap-1 sm:gap-4 md:gap-4 lg:gap-6 xl:gap-8">
        
        {/* Zone 1: Brand Wordmark with Centered Imagotipo */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <button
            onClick={() => {
              onNavigateCategory(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-left group cursor-pointer focus-visible:outline-none flex items-center gap-1.5 sm:gap-2.5 md:gap-3"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center overflow-hidden shrink-0 relative">
              <img
                src="/assets/aistudio/dulzara_logo_transparent.png"
                alt="Logo Dulzara"
                className="w-full h-full object-contain pointer-events-none mix-blend-multiply"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="text-base sm:text-2xl md:text-xl lg:text-2xl font-serif-brand font-semibold tracking-wider text-[#382A30] group-hover:text-[#B9788B] transition-colors whitespace-nowrap shrink-0">
                  DULZARA
                </span>
                <span className="text-[#B9788B] text-xs font-serif leading-none select-none" aria-hidden="true">✦</span>
              </div>
              <span className="text-[9px] lg:text-[10px] uppercase tracking-widest text-[#B9788B] font-sans -mt-0.5 hidden sm:block font-medium">
                Belleza & Cuidado
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Desktop Airy Editorial Category Navigation — only categories with available products */}
        <nav
          className="hidden md:flex md:flex-1 items-center justify-center md:gap-6 lg:gap-9 xl:gap-11 md:text-[14px] lg:text-[15px] tracking-[0.01em] min-w-0 md:px-2 lg:px-4 transition-all duration-200"
        >
          <button
            onClick={() => handleCategoryClick(null)}
            className={`relative whitespace-nowrap shrink-0 py-1.5 transition-colors duration-200 cursor-pointer after:content-[''] after:absolute after:left-1/2 after:-translate-x-1/2 after:bottom-0 after:h-[2px] after:rounded-full after:bg-[#B9788B] after:transition-all after:duration-300 ${
              activeCategory === null && !searchQuery
                ? 'text-[#382A30] font-semibold after:w-5 after:opacity-100'
                : 'text-[#382A30]/75 font-medium hover:text-[#B9788B] after:w-0 after:opacity-0 hover:after:w-3.5 hover:after:opacity-60'
            }`}
          >
            Inicio & Todo
          </button>
          {visibleCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`relative whitespace-nowrap shrink-0 py-1.5 transition-colors duration-200 cursor-pointer after:content-[''] after:absolute after:left-1/2 after:-translate-x-1/2 after:bottom-0 after:h-[2px] after:rounded-full after:bg-[#B9788B] after:transition-all after:duration-300 ${
                activeCategory === cat
                  ? 'text-[#382A30] font-semibold after:w-5 after:opacity-100'
                  : 'text-[#382A30]/75 font-medium hover:text-[#B9788B] after:w-0 after:opacity-0 hover:after:w-3.5 hover:after:opacity-60'
              }`}
            >
              {cat}
            </button>
          ))}
        </nav>

        {/* Zone 3: Search, Admin Access, Shopping Bag, and Mobile Menu Pill */}
        <div className="flex items-center justify-end gap-1 sm:gap-3 md:gap-2.5 lg:gap-3 shrink-0">
          
          {/* Predictive Search Container with Autocomplete Dropdown */}
          <div className="static sm:relative flex items-center" ref={searchContainerRef}>
            {showSearchInput ? (
              <div className="flex items-center h-9 sm:h-9.5 md:h-10 bg-[#FDF6F8] focus-within:bg-white border border-[#E8BFCB] focus-within:border-[#B9788B] focus-within:ring-2 focus-within:ring-[#F7E5E9] rounded-full pl-3 pr-1.5 sm:pl-3.5 sm:pr-2 md:pl-4 md:pr-2 w-38 min-[380px]:w-44 min-[420px]:w-52 sm:w-64 md:w-56 lg:w-64 xl:w-72 transition-all duration-200 shadow-[0_2px_10px_-2px_rgba(185,120,139,0.2)] animate-in fade-in zoom-in-95">
                <Search className="w-4 h-4 md:w-[17px] md:h-[17px] text-[#B9788B] mr-1.5 sm:mr-2 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onFocus={() => setDropdownOpen(true)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  className="w-full h-full bg-transparent text-xs sm:text-[13px] md:text-[14px] font-medium leading-none text-[#382A30] placeholder-[#382A30]/45 focus:outline-none min-w-0"
                />
                {searchQuery ? (
                  <button
                    onClick={() => {
                      onSearchChange('');
                      searchInputRef.current?.focus();
                    }}
                    aria-label="Borrar texto"
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[#B9788B]/80 hover:text-[#382A30] hover:bg-[#F7E5E9] transition-colors shrink-0 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowSearchInput(false);
                      setDropdownOpen(false);
                    }}
                    aria-label="Cerrar buscador"
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[#B9788B]/80 hover:text-[#382A30] hover:bg-[#F7E5E9] transition-colors shrink-0 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
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
                className="group inline-flex items-center justify-center w-9 h-9 sm:w-9.5 sm:h-9.5 md:w-auto md:h-10 md:pl-1.5 md:pr-4 rounded-full text-[#382A30]/85 hover:text-[#B9788B] hover:bg-[#F7E5E9]/65 transition-all duration-200 cursor-pointer md:gap-2.5 md:bg-[#FDF6F8] md:hover:bg-[#F7E5E9]/90 md:border md:border-[#E8BFCB] md:hover:border-[#B9788B]/80 md:text-[#382A30] md:shadow-2xs active:scale-95"
              >
                <Search
                  strokeWidth={2.25}
                  className="w-5 h-5 text-[#B9788B] md:w-7 md:h-7 md:p-1.5 md:rounded-full md:bg-[#B9788B] md:text-white md:shadow-2xs shrink-0 transition-transform duration-200 group-hover:scale-105"
                />
                <span className="hidden md:inline-flex items-center justify-center flex-1 text-center text-[13.5px] font-semibold leading-none tracking-[0.01em] text-[#382A30]/85 group-hover:text-[#382A30] -translate-y-[0.5px]">
                  Buscar
                </span>
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

          {/* Discreet Admin Entry Icon Button (for store owners, subtle so it doesn't distract customers) */}
          <button
            onClick={onOpenAdmin}
            aria-label={isAdminLoggedIn ? 'Panel de Administración (Conectado)' : 'Acceso interno'}
            title={isAdminLoggedIn ? 'Panel de Administración (Conectado)' : 'Acceso interno'}
            className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full text-[#382A30]/30 hover:text-[#B9788B] hover:bg-[#F7E5E9]/60 transition-colors cursor-pointer"
          >
            <ShieldCheck className={`w-4 h-4 ${isAdminLoggedIn ? 'text-emerald-600/80' : ''}`} />
          </button>

          {/* Shopping Bag CTA */}
          <button
            onClick={onOpenCart}
            aria-label="Abrir bolsa de compras"
            className="relative inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 md:px-5 py-1.5 sm:py-2 md:py-0 md:h-10 rounded-full bg-[#B9788B] hover:bg-[#a6687a] text-white transition-all shadow-sm active:scale-95 shrink-0 cursor-pointer"
          >
            <div className="relative flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 md:w-[17px] md:h-[17px]" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#382A30] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center tabular-nums">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-xs md:text-[14px] font-medium leading-none hidden sm:inline-flex items-center whitespace-nowrap">
              {cartCount > 0 ? formatCOP(cartSubtotal) : 'Bolsa'}
            </span>
          </button>

          {/* Mobile Menu Pill Button (mantiene siempre su tono rosa suave original) */}
          {!showSearchInput && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menú móvil"
              aria-expanded={mobileMenuOpen}
              className="md:hidden bg-[#F7E5E9] text-[#382A30] border border-[#E8BFCB] rounded-full px-2.5 sm:px-3 py-1.5 flex items-center gap-1 text-xs font-medium hover:bg-[#ebd3d9] transition-colors shrink-0 shadow-xs active:scale-95 cursor-pointer"
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

      {/* Mobile Navigation Drawer — Boutique Tactile Category Experience */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E8BFCB]/60 bg-gradient-to-b from-[#FFFDF9] via-[#FFF9FA] to-[#FDF3F6] px-3 pt-3 pb-2.5 shadow-[0_14px_30px_-10px_rgba(56,42,48,0.12)] animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Div 1: Tactile Boutique Category Grid (zero truncated text, hand-crafted multi-tone cosmetic illustrations) */}
          <div className="grid grid-cols-2 gap-2 pb-2.5 border-b border-[#E8BFCB]/45">
            {(() => {
              const isAllSelected = activeCategory === null && !searchQuery;
              const totalCards = 1 + visibleCategories.length;
              const spanFullFirstCard = totalCards % 2 !== 0;

              const getCategoryMeta = (cat: string) => {
                switch (cat) {
                  case 'Rostro':
                    return {
                      subtitle: 'Bases, rubor y piel',
                      // Hand-crafted blush compact mirror with rosy powder pan & mirror sheen
                      icon: (
                        <svg viewBox="0 0 28 28" fill="none" className="w-6 h-6">
                          {/* Upper mirror lid */}
                          <ellipse cx="14" cy="8.5" rx="7.5" ry="4.8" fill="#F5DCE3" stroke="#9E586D" strokeWidth="1.35" />
                          <ellipse cx="14" cy="8.5" rx="5.6" ry="3.2" fill="#FFFDF9" />
                          <path d="M11 7.2 13.5 9.8M14.5 6.8l1.6 1.7" stroke="#E5B2C2" strokeWidth="1.2" strokeLinecap="round" />
                          {/* Hinge */}
                          <rect x="10.5" y="12.5" width="7" height="1.8" rx="0.9" fill="#B9788B" />
                          {/* Lower blush pan */}
                          <ellipse cx="14" cy="18.5" rx="8.2" ry="5.2" fill="#F2C6D4" stroke="#9E586D" strokeWidth="1.35" />
                          <ellipse cx="14" cy="18.5" rx="5.8" ry="3.4" fill="#DF88A1" />
                          {/* Cute puff overlapping corner */}
                          <circle cx="19.2" cy="19.5" r="3" fill="#FFFDF9" stroke="#B9788B" strokeWidth="1.2" />
                          <path d="M17.8 19.3h2.8" stroke="#E5B2C2" strokeWidth="1.1" strokeLinecap="round" />
                        </svg>
                      ),
                    };
                  case 'Ojos y Cejas':
                    return {
                      subtitle: 'Pestañinas y mirada',
                      // Expressive lashed eye with soft rose eyeshadow wash & cute heart glint
                      icon: (
                        <svg viewBox="0 0 28 28" fill="none" className="w-6 h-6">
                          {/* Soft blush eyeshadow wash */}
                          <path d="M4.5 14.5c2.4-4.8 6-7.2 9.5-7.2s7.1 2.4 9.5 7.2c-2.6-2.2-5.8-3.3-9.5-3.3s-6.9 1.1-9.5 3.3Z" fill="#F4C2D1" />
                          {/* Upper brow arch */}
                          <path d="M6.5 8.2c2.2-1.8 5-2.5 8-2.2 2.4.2 4.6 1 6.8 2.4" stroke="#7A4455" strokeWidth="1.4" strokeLinecap="round" />
                          {/* Lash line & curved lashes */}
                          <path d="M4.8 15c2.6 3.6 5.8 5.2 9.2 5.2s6.6-1.6 9.2-5.2" stroke="#7A4455" strokeWidth="1.55" strokeLinecap="round" />
                          <path d="M7.2 17.5 5.4 20.2M10.5 19.3l-1 3.1M14 20.2v3.3M17.5 19.3l1 3.1M20.8 17.5l1.8 2.7" stroke="#7A4455" strokeWidth="1.35" strokeLinecap="round" />
                          {/* Cute rose heart accent */}
                          <path d="M14 11.8c-.7-.9-2.1-.8-2.5.2-.4.9.3 1.9 2.5 3.2 2.2-1.3 2.9-2.3 2.5-3.2-.4-1-1.8-1.1-2.5-.2Z" fill="#D46A89" />
                        </svg>
                      ),
                    };
                  case 'Labios':
                    return {
                      subtitle: 'Tintas, gloss y color',
                      // Hand-crafted tilted glossy lipstick with berry bullet, rose casing & shine highlight
                      icon: (
                        <svg viewBox="0 0 28 28" fill="none" className="w-6 h-6">
                          <g transform="rotate(-16 14 14)">
                            {/* Lipstick glossy bullet */}
                            <path d="M10.5 6.8c0-2.1 2.5-3.8 3.5-3.8 1 0 3.5 .8 3.5 3.8v5.5h-7V6.8Z" fill="#D95B7B" stroke="#8F3D54" strokeWidth="1.3" />
                            {/* Glossy bevel & white shine */}
                            <ellipse cx="14" cy="6.6" rx="2.3" ry="1.3" fill="#F08CA5" />
                            <path d="M12 8.5v2.2" stroke="#FFFDF9" strokeWidth="1.2" strokeLinecap="round" />
                            {/* Rose-gold collar */}
                            <rect x="9.6" y="12" width="8.8" height="3.2" rx="1" fill="#F7E5E9" stroke="#9E586D" strokeWidth="1.3" />
                            {/* Lower berry case */}
                            <rect x="9" y="15.2" width="10" height="8.5" rx="2.2" fill="#B9788B" stroke="#7A4455" strokeWidth="1.3" />
                            <path d="M11.3 17.5v4" stroke="#F7E5E9" strokeWidth="1.2" strokeLinecap="round" />
                          </g>
                        </svg>
                      ),
                    };
                  case 'Skincare y Cuidado':
                    return {
                      subtitle: 'Cuidado e hidratación',
                      // Cute botanical serum bottle with rose droplet & leaf
                      icon: (
                        <svg viewBox="0 0 28 28" fill="none" className="w-6 h-6">
                          {/* Dropper bulb & cap */}
                          <path d="M11.5 5.5a2.5 2.5 0 0 1 5 0v2h-5v-2Z" fill="#DF88A1" stroke="#8F465C" strokeWidth="1.3" />
                          <rect x="10.2" y="7.5" width="7.6" height="2.4" rx="1" fill="#FFFDF9" stroke="#8F465C" strokeWidth="1.3" />
                          {/* Bottle body */}
                          <rect x="8" y="10" width="12" height="13.5" rx="4" fill="#F7DCE4" stroke="#8F465C" strokeWidth="1.35" />
                          {/* Label with heart drop */}
                          <rect x="9.8" y="13" width="8.4" height="7.5" rx="2" fill="#FFFDF9" />
                          <path d="M14 14.5c-1.3 1.6-2.2 2.7-2.2 3.8a2.2 2.2 0 0 0 4.4 0c0-1.1-.9-2.2-2.2-3.8Z" fill="#D95B7B" />
                        </svg>
                      ),
                    };
                  default:
                    return {
                      subtitle: 'Brochas y sets',
                      // Plush two-tone makeup brush with blush bristles
                      icon: (
                        <svg viewBox="0 0 28 28" fill="none" className="w-6 h-6">
                          <g transform="rotate(20 14 14)">
                            {/* Fluffy brush head */}
                            <path d="M9 9.5C9 5.5 11.2 3.5 14 3.5s5 2 5 6c0 2-1.2 3.2-5 3.2S9 11.5 9 9.5Z" fill="#F2BACB" stroke="#8F465C" strokeWidth="1.3" />
                            <path d="M9.6 7.5c1.4.8 3 .9 4.4.9s3-.1 4.4-.9" stroke="#D97392" strokeWidth="1.3" strokeLinecap="round" />
                            {/* Ferrule */}
                            <rect x="11.5" y="12.5" width="5" height="3.5" rx="0.8" fill="#FFFDF9" stroke="#8F465C" strokeWidth="1.3" />
                            {/* Handle */}
                            <path d="M12 16h4l-.6 7.2a1.4 1.4 0 0 1-2.8 0L12 16Z" fill="#B9788B" stroke="#8F465C" strokeWidth="1.3" />
                          </g>
                        </svg>
                      ),
                    };
                }
              };

              return (
                <>
                  <button
                    onClick={() => handleCategoryClick(null)}
                    className={`group relative text-left px-2.5 py-2.5 rounded-2xl border transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-center gap-2.5 ${
                      spanFullFirstCard ? 'col-span-2' : ''
                    } ${
                      isAllSelected
                        ? 'bg-[#F7E5E9] border-[#B9788B] shadow-[0_3px_12px_-4px_rgba(185,120,139,0.28)]'
                        : 'bg-white/95 hover:bg-white border-[#E8BFCB]/75 shadow-[0_2px_8px_-3px_rgba(56,42,48,0.06)] hover:border-[#B9788B]/60'
                    }`}
                  >
                    <span
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                        isAllSelected
                          ? 'bg-white shadow-2xs ring-1 ring-[#E8BFCB]'
                          : 'bg-[#FDF4F6] ring-1 ring-[#E8BFCB]/60'
                      }`}
                    >
                      {/* Boutique shopping bag with satin bow & rose heart */}
                      <svg viewBox="0 0 28 28" fill="none" className="w-6 h-6">
                        <path d="M10.5 9.5V8a3.5 3.5 0 0 1 7 0v1.5" stroke="#8F465C" strokeWidth="1.4" strokeLinecap="round" />
                        <path d="M6.8 9.5h14.4l1.2 12.2a2.4 2.4 0 0 1-2.4 2.6H8a2.4 2.4 0 0 1-2.4-2.6L6.8 9.5Z" fill="#F4C6D4" stroke="#8F465C" strokeWidth="1.35" strokeLinejoin="round" />
                        <path d="M7.3 12.2h13.4" stroke="#FFFDF9" strokeWidth="1.2" strokeLinecap="round" />
                        <path d="M14 15.6c-.8-1-2.3-.9-2.8.2-.4 1 .4 2.1 2.8 3.5 2.4-1.4 3.2-2.5 2.8-3.5-.5-1.1-2-1.2-2.8-.2Z" fill="#D45B7A" />
                      </svg>
                    </span>
                    <span className="flex-1 min-w-0 leading-tight">
                      <span className="block text-[13px] font-semibold text-[#382A30]">
                        Ver Todo
                      </span>
                      <span className="block text-[11px] text-[#382A30]/65 mt-0.5">
                        Catálogo completo
                      </span>
                    </span>
                  </button>

                  {visibleCategories.map((cat) => {
                    const isSelected = activeCategory === cat;
                    const meta = getCategoryMeta(cat);
                    return (
                      <button
                        key={cat}
                        onClick={() => handleCategoryClick(cat)}
                        className={`group relative text-left px-2.5 py-2.5 rounded-2xl border transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-center gap-2.5 ${
                          isSelected
                            ? 'bg-[#F7E5E9] border-[#B9788B] shadow-[0_3px_12px_-4px_rgba(185,120,139,0.28)]'
                            : 'bg-white/95 hover:bg-white border-[#E8BFCB]/75 shadow-[0_2px_8px_-3px_rgba(56,42,48,0.06)] hover:border-[#B9788B]/60'
                        }`}
                      >
                        <span
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                            isSelected
                              ? 'bg-white shadow-2xs ring-1 ring-[#E8BFCB]'
                              : 'bg-[#FDF4F6] ring-1 ring-[#E8BFCB]/60'
                          }`}
                        >
                          {meta.icon}
                        </span>
                        <span className="flex-1 min-w-0 leading-tight">
                          <span className="block text-[13px] font-semibold text-[#382A30]">
                            {cat}
                          </span>
                          <span className="block text-[11px] text-[#382A30]/65 mt-0.5">
                            {meta.subtitle}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </>
              );
            })()}
          </div>

          {/* Div 2: Perfectly Centered Boutique Delivery Signature + Whisper-Quiet Admin Icon */}
          <div className="relative pt-2.5 flex items-center justify-center">
            <span className="inline-flex items-center justify-center gap-2 px-3.5 py-1 rounded-full bg-white/85 border border-[#E8BFCB]/60 shadow-2xs text-[11px] text-[#382A30]/80 text-center">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B9788B] shrink-0" aria-hidden="true" />
              <span>
                Entregas en puerta en{' '}
                <strong className="font-serif-brand italic font-semibold text-[#B9788B] text-[12px] tracking-wide">
                  Barranquilla y Soledad
                </strong>
              </span>
            </span>

            <button
              onClick={() => {
                onOpenAdmin();
                setMobileMenuOpen(false);
              }}
              aria-label="Acceso interno"
              title="Acceso interno"
              className="absolute right-0.5 top-1/2 -translate-y-1/2 mt-1 w-7 h-7 rounded-full flex items-center justify-center text-[#382A30]/25 hover:text-[#B9788B] hover:bg-[#F7E5E9]/60 transition-colors cursor-pointer"
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${isAdminLoggedIn ? 'text-emerald-600/75' : ''}`} />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
