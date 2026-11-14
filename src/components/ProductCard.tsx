import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { ShoppingBag, Eye, Check, X } from 'lucide-react';
import { Product, ProductShade, SelectedShade } from '../types/store';
import { formatCOP, getVariantLabel } from '../utils/formatters';
import { getProductSlug } from '../utils/seo';
import { BeautyImage } from './BeautyImage';
import { SwatchCircle } from './SwatchCircle';

const LINE_CLAMP_CLASSES: Record<number, string> = {
  2: 'line-clamp-2',
  3: 'line-clamp-3',
  4: 'line-clamp-4',
  5: 'line-clamp-5',
  6: 'line-clamp-6',
};

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, selectedShade?: SelectedShade) => void;
  onQuickView: (product: Product) => void;
  isItemInCart?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onQuickView,
  isItemInCart = false,
}) => {
  const hasShades = Array.isArray(product.shades) && product.shades.length > 0;
  const variantLabel = getVariantLabel(product.variantType);

  const [selectedShade, setSelectedShade] = useState<ProductShade | null>(null);
  const [hoveredShade, setHoveredShade] = useState<ProductShade | null>(null);
  const [showQuickSelect, setShowQuickSelect] = useState(false);
  const [isJustAdded, setIsJustAdded] = useState(false);
  const addedTimerRef = useRef<number | null>(null);

  // Keep selectedShade synchronized if product shades are updated in real time
  useEffect(() => {
    setSelectedShade((prev) => {
      if (!prev || !product.shades || product.shades.length === 0) return null;
      return product.shades.find((s) => s.id === prev.id) || null;
    });
  }, [product.shades]);

  useEffect(() => {
    return () => {
      if (addedTimerRef.current !== null) {
        window.clearTimeout(addedTimerRef.current);
      }
    };
  }, []);

  // Refs for adaptive space detection in the card body
  const cardBodyRef = useRef<HTMLDivElement>(null);
  const topStackRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  // Adaptive line budget based on device, presence of shades, title lines, and remaining card whitespace
  const [descLines, setDescLines] = useState<number>(() => (hasShades ? 3 : 4));

  const recalculateDescriptionSpace = useCallback(() => {
    const bodyEl = cardBodyRef.current;
    const topStackEl = topStackRef.current;
    const titleEl = titleRef.current;
    const descEl = descRef.current;
    const footerEl = footerRef.current;

    if (!bodyEl || !topStackEl || !titleEl || !descEl || !footerEl) return;

    const isMobile = window.innerWidth < 640;
    const titleHeight = titleEl.offsetHeight;
    const isSingleLineTitle = titleHeight <= (isMobile ? 23 : 26);

    // 1. Base allocation tailored per device & card components:
    // - Cards without shade selector automatically reclaim those ~28px for 1 extra description line.
    // - Cards with a 1-line title reclaim 1 extra line for the description.
    const baseLines = isMobile
      ? hasShades
        ? isSingleLineTitle
          ? 4
          : 3
        : isSingleLineTitle
        ? 5
        : 4
      : hasShades
      ? isSingleLineTitle
        ? 4
        : 3
      : isSingleLineTitle
      ? 5
      : 4;

    // 2. Blank whitespace reclamation using metrics invariant to descLines:
    // If a sibling card in the grid row stretches this card taller, fill that blank space with description lines.
    const bodyStyle = window.getComputedStyle(bodyEl);
    const padY =
      (parseFloat(bodyStyle.paddingTop) || 0) +
      (parseFloat(bodyStyle.paddingBottom) || 0);
    const availableInnerHeight = bodyEl.clientHeight - padY;

    const nonDescTopHeight = Math.max(0, topStackEl.offsetHeight - descEl.offsetHeight);
    const footerReserveHeight = footerEl.offsetHeight + (isMobile ? 10 : 12);
    const availableForDescPx = availableInnerHeight - nonDescTopHeight - footerReserveHeight;
    const lineHeightPx = isMobile ? 16.5 : 17.5;

    const linesFittingInBlankSpace = Math.floor(availableForDescPx / lineHeightPx);
    const targetLines = Math.min(6, Math.max(baseLines, linesFittingInBlankSpace));

    setDescLines((prev) => (prev !== targetLines ? targetLines : prev));
  }, [hasShades]);

  useLayoutEffect(() => {
    recalculateDescriptionSpace();

    let rafId: number | null = null;
    const handleResize = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        recalculateDescriptionSpace();
      });
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
    };
  }, [recalculateDescriptionSpace, product.id, product.shortDescription, product.name, hasShades]);

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 3;

  // For display in the micro-guide row: show chosen shade, or hovered shade, or first available shade preview
  const displayShade =
    selectedShade ||
    hoveredShade ||
    (hasShades
      ? product.shades!.find((s) => s.stock > 0) || product.shades![0]
      : null);

  // Dynamic card image if chosen shade has its own imageUrl
  const activeImageUrl =
    selectedShade?.imageUrl?.trim() ? selectedShade.imageUrl : product.imageUrl;

  const triggerAddedFeedback = () => {
    if (addedTimerRef.current !== null) {
      window.clearTimeout(addedTimerRef.current);
    }
    setIsJustAdded(true);
    addedTimerRef.current = window.setTimeout(() => {
      setIsJustAdded(false);
      addedTimerRef.current = null;
    }, 1300);
  };

  const handleSelectShadeOnCard = (
    e: React.MouseEvent,
    shade: ProductShade
  ) => {
    e.stopPropagation();
    if (shade.stock <= 0) return;
    setSelectedShade(shade);
    setShowQuickSelect(false);
  };

  const handleQuickSelectPick = (
    e: React.MouseEvent,
    shade: ProductShade
  ) => {
    e.stopPropagation();
    if (shade.stock <= 0) return;
    setSelectedShade(shade);
    setShowQuickSelect(false);
    onAddToCart(product, {
      id: shade.id,
      name: shade.name,
      colorHex: shade.colorHex,
      finish: shade.finish,
    });
    triggerAddedFeedback();
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;

    if (hasShades) {
      if (!selectedShade) {
        // Error prevention: open Quick-Select floating container inside the card
        setShowQuickSelect(true);
        return;
      }
      if (selectedShade.stock <= 0) {
        setShowQuickSelect(true);
        return;
      }
      onAddToCart(product, {
        id: selectedShade.id,
        name: selectedShade.name,
        colorHex: selectedShade.colorHex,
        finish: selectedShade.finish,
      });
      triggerAddedFeedback();
      return;
    }

    onAddToCart(product);
    triggerAddedFeedback();
  };

  const hasDiscount =
    Boolean(product.originalPrice) && product.originalPrice! > product.price;

  const visibleSwatches = hasShades ? product.shades!.slice(0, 4) : [];
  const extraSwatchesCount =
    hasShades && product.shades!.length > 4 ? product.shades!.length - 4 : 0;

  return (
    <div
      onClick={() => onQuickView(product)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onQuickView(product);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Ver descripción y detalles de ${product.name}`}
      className="relative group flex flex-col bg-white rounded-2xl sm:rounded-3xl border border-[#E8BFCB]/45 hover:border-[#B9788B]/65 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_28px_-8px_rgba(56,42,48,0.1)] overflow-hidden cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-[#B9788B]/40"
    >
      {/* Product Image Frame (Balanced vertical proportion on mobile for left vertical swatch capsule + top discount badge) */}
      <div className="relative aspect-[4/4.2] sm:aspect-square w-full overflow-hidden bg-[#F7E5E9]/30">
        <BeautyImage
          src={activeImageUrl}
          alt={selectedShade ? `${product.name} - ${selectedShade.name}` : product.name}
          category={product.category}
          className="w-full h-full object-cover"
        />

        {/* Original Discount badge at top-left */}
        {hasDiscount && (
          <div className="bg-[#B9788B] text-white text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 rounded-full shadow-sm absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-10 tracking-wide flex items-center gap-1">
            <span aria-hidden="true">✦</span>
            <span>Descuento</span>
          </div>
        )}

        {/* Out of stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-10 flex items-center justify-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#382A30] bg-[#FFFDF9] px-3 py-1.5 rounded-full border border-[#E8BFCB]">
              Agotado
            </span>
          </div>
        )}

        {/* Vertical Swatches Palette on the Left Edge of the Image */}
        {hasShades && !isOutOfStock && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-2.5 left-2.5 sm:bottom-3 sm:left-3 z-10 bg-white/92 backdrop-blur-md border border-[#E8BFCB]/85 shadow-sm rounded-full py-1.5 px-1.5 flex flex-col items-center gap-1.5"
          >
            {visibleSwatches.map((shade) => (
              <div
                key={shade.id}
                onMouseEnter={() => setHoveredShade(shade)}
                onMouseLeave={() => setHoveredShade(null)}
                className="flex items-center justify-center"
              >
                <SwatchCircle
                  colorHex={shade.colorHex}
                  finish={shade.finish}
                  name={shade.name}
                  stock={shade.stock}
                  size="sm"
                  isSelected={selectedShade?.id === shade.id}
                  onClick={(e) => handleSelectShadeOnCard(e, shade)}
                />
              </div>
            ))}
            {extraSwatchesCount > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowQuickSelect(true);
                }}
                title={`Ver ${extraSwatchesCount} ${variantLabel.toLowerCase()}s más`}
                className="text-[9px] font-bold text-[#B9788B] hover:text-[#382A30] pt-0.5 leading-none cursor-pointer"
              >
                +{extraSwatchesCount}
              </button>
            )}
          </div>
        )}

        {/* Quick View Button overlay on desktop hover (Bottom-Right) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickView(product);
          }}
          className="hidden sm:flex absolute bottom-3 right-3 z-10 p-2 rounded-full bg-white/95 text-[#382A30] shadow-sm hover:text-[#B9788B] hover:bg-white transition-all opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 items-center justify-center"
          aria-label="Ver detalles"
          title="Ver detalles rápidos"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      {/* Card Content & Metadata */}
      <div
        ref={cardBodyRef}
        className="relative p-3 sm:p-4.5 flex flex-col flex-1 justify-between"
      >
        <div ref={topStackRef} className="space-y-1 sm:space-y-1.5">
          {/* Category unboxed metadata with dot separator */}
          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] uppercase tracking-[0.07em] text-[#B9788B] font-semibold">
            <span className="truncate">{product.category}</span>
            {isLowStock && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-amber-800 lowercase shrink-0 font-medium">
                  ¡últimas {product.stock}!
                </span>
              </>
            )}
          </div>

          {/* Product Title */}
          <h3
            ref={titleRef}
            className="text-[13.5px] sm:text-[15.5px] font-serif-brand font-semibold text-[#382A30] group-hover:text-[#B9788B] transition-colors line-clamp-2 leading-[1.28]"
          >
            <a
              href={`/productos/${getProductSlug(product)}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickView(product);
              }}
              className="focus:outline-none"
            >
              {product.name}
            </a>
          </h3>

          {/* Short Description — Dynamically adapts line budget to available vertical space on mobile & desktop */}
          <p
            ref={descRef}
            className={`text-[11.5px] sm:text-xs text-[#382A30]/72 ${
              LINE_CLAMP_CLASSES[descLines] || 'line-clamp-3'
            } font-sans pt-0.5 leading-[1.45]`}
          >
            {product.shortDescription}
          </p>

          {/* Compact, clean Shade Tag in standard sans font */}
          {hasShades && displayShade && (
            <div className="pt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowQuickSelect((prev) => !prev);
                }}
                className="max-w-full px-2 py-0.5 sm:py-1 rounded-lg bg-[#F7E5E9]/50 hover:bg-[#F7E5E9]/85 border border-[#E8BFCB]/55 text-left transition-colors cursor-pointer inline-flex items-center gap-1.5"
                title="Toca para elegir o cambiar de tono"
              >
                <span
                  className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shrink-0 ring-1 ring-black/10"
                  style={{ backgroundColor: displayShade.colorHex }}
                />
                <span className="font-sans text-[10px] sm:text-[10.5px] leading-tight text-[#382A30] min-w-0">
                  <strong className="font-semibold text-[#382A30]">
                    {displayShade.name.replace(/^0\d\s+/, '')}
                  </strong>
                  {displayShade.hint && (
                    <span className="text-[#382A30]/70 font-normal">
                      {' '}
                      · {displayShade.hint}
                    </span>
                  )}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Floating Quick-Select Box inside the card when customer taps shade tag or bag */}
        {showQuickSelect && hasShades && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-1.5 sm:inset-x-2 bottom-2 z-20 bg-[#FFFDF9]/98 backdrop-blur-md rounded-2xl border border-[#E8BFCB]/85 shadow-[0_10px_28px_-6px_rgba(56,42,48,0.18)] p-2.5 sm:p-3 space-y-2 animate-dulzara-pop"
          >
            <div className="flex items-center justify-between gap-1 border-b border-[#F7E5E9] pb-1.5 px-0.5">
              <span className="font-sans text-[11px] font-semibold text-[#382A30] leading-tight">
                Elige tu {variantLabel.toLowerCase()}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowQuickSelect(false);
                }}
                aria-label="Cerrar selector rápido"
                className="p-1 text-[#382A30]/45 hover:text-[#382A30] rounded-full hover:bg-[#F7E5E9]/70 transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-1 max-h-52 overflow-y-auto pr-0.5">
              {product.shades!.map((shade) => {
                const shadeOut = shade.stock <= 0;
                const isCurrent = selectedShade?.id === shade.id;
                return (
                  <button
                    key={shade.id}
                    type="button"
                    disabled={shadeOut}
                    onClick={(e) => handleQuickSelectPick(e, shade)}
                    className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-xl text-left border transition-all ${
                      shadeOut
                        ? 'bg-slate-50/70 border-transparent opacity-45 cursor-not-allowed'
                        : isCurrent
                        ? 'bg-[#F7E5E9]/65 border-[#B9788B]/50 cursor-pointer'
                        : 'bg-transparent hover:bg-[#F7E5E9]/45 border-transparent hover:border-[#E8BFCB]/60 active:scale-98 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <SwatchCircle
                        colorHex={shade.colorHex}
                        finish={shade.finish}
                        name={shade.name}
                        stock={shade.stock}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1 leading-tight font-sans">
                        <span className="text-[10.5px] sm:text-[11px] font-semibold text-[#382A30] block">
                          {shade.name.replace(/^0\d\s+/, '')}
                        </span>
                        {shade.hint && (
                          <span className="text-[9.5px] sm:text-[10px] text-[#382A30]/70 block mt-0.5">
                            {shade.hint}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-medium text-[#B9788B] shrink-0">
                      {shadeOut ? 'Agotado' : isCurrent ? 'Elegido' : 'Elegir'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Pricing and Action */}
        <div
          ref={footerRef}
          className="pt-2.5 sm:pt-3 mt-2.5 border-t border-[#F7E5E9] flex items-center justify-between gap-1.5 sm:gap-2"
        >
          <div className="flex flex-col min-w-0 shrink-0">
            <span className="text-[13.5px] sm:text-base font-bold text-[#382A30] tabular-nums leading-tight">
              {formatCOP(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-[10.5px] sm:text-xs text-[#382A30]/45 line-through tabular-nums leading-tight">
                {formatCOP(product.originalPrice!)}
              </span>
            )}
          </div>

          {/* Add to Bag Interactive Button */}
          <div className="relative shrink-0">
            {/* Bursting magical sparkles when added */}
            {isJustAdded && (
              <>
                <span
                  aria-hidden="true"
                  className="absolute -top-2.5 -right-1 text-xs text-[#B9788B] pointer-events-none select-none animate-bounce font-serif z-10"
                >
                  ✦
                </span>
                <span
                  aria-hidden="true"
                  className="absolute -top-2 -left-1.5 text-[10px] text-[#B9788B]/80 pointer-events-none select-none animate-pulse font-serif z-10"
                >
                  ✦
                </span>
                <span
                  aria-hidden="true"
                  className="absolute -bottom-1 -right-2 text-[9px] text-[#B9788B]/60 pointer-events-none select-none animate-ping font-serif z-10"
                >
                  ✦
                </span>
              </>
            )}

            <button
              onClick={handleAddClick}
              disabled={isOutOfStock}
              className={`relative rounded-full font-semibold transition-all duration-300 flex items-center justify-center gap-1 cursor-pointer ${
                selectedShade
                  ? 'px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-[11px] leading-tight'
                  : 'p-2.5 sm:p-3 text-xs shrink-0'
              } ${
                isOutOfStock
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : isJustAdded
                  ? 'bg-[#B9788B] text-white scale-105 ring-4 ring-[#E8BFCB] shadow-md'
                  : isItemInCart && !selectedShade
                  ? 'bg-[#E8BFCB] text-[#382A30] hover:bg-[#B9788B] hover:text-white hover:scale-105 active:scale-95 shadow-xs'
                  : 'bg-[#B9788B] text-white hover:bg-[#a6687a] hover:scale-105 active:scale-95 shadow-xs'
              }`}
              aria-label={
                selectedShade
                  ? `Agregar ${product.name} en ${selectedShade.name} a la bolsa`
                  : `Agregar ${product.name} a la bolsa`
              }
              title={
                isJustAdded
                  ? '¡Agregado!'
                  : selectedShade
                  ? `Agregar ${selectedShade.name} ✦`
                  : isItemInCart
                  ? 'En tu bolsa (agregar otra unidad)'
                  : 'Agregar a la bolsa'
              }
            >
              {isJustAdded ? (
                <>
                  <Check className="w-4 h-4 stroke-[2.5] shrink-0" />
                  {selectedShade && <span>¡Listo!</span>}
                </>
              ) : selectedShade ? (
                <span className=" whitespace-nowrap">
                  + {selectedShade.name.replace(/^0\d\s+/, '').split(' ')[0]} ✦
                </span>
              ) : isItemInCart ? (
                <Check className="w-4 h-4" />
              ) : (
                <ShoppingBag className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

