import React, { useState } from 'react';
import { ShoppingBag, Eye, Check } from 'lucide-react';
import { Product } from '../types/store';
import { formatCOP } from '../utils/formatters';
import { BeautyImage } from './BeautyImage';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onQuickView: (product: Product) => void;
  isItemInCart?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onQuickView,
  isItemInCart = false,
}) => {
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 3;
  const [isJustAdded, setIsJustAdded] = useState(false);

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;

    setIsJustAdded(true);
    onAddToCart(product);

    setTimeout(() => {
      setIsJustAdded(false);
    }, 1200);
  };

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
      className="group flex flex-col bg-white rounded-2xl border border-[#E8BFCB]/40 hover:border-[#B9788B]/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-md overflow-hidden cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-[#B9788B]/40"
    >
      
      {/* Product Image Frame (65-75% visual dominance) */}
      <div className="relative aspect-[4/3] sm:aspect-square w-full overflow-hidden bg-[#F7E5E9]/30">
        <BeautyImage
          src={product.imageUrl}
          alt={product.name}
          category={product.category}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Discount badge */}
        {product.originalPrice && product.originalPrice > product.price && (
          <div className="bg-[#B9788B] text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm absolute top-3 left-3 tracking-wide flex items-center gap-1">
            <span aria-hidden="true">✦</span>
            <span>Descuento</span>
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#382A30] bg-[#FFFDF9] px-3 py-1.5 rounded-full border border-[#E8BFCB]">
              Agotado
            </span>
          </div>
        )}

        {/* Quick View Button overlay on hover */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickView(product);
          }}
          className="absolute bottom-3 right-3 p-2.5 rounded-full bg-white/95 text-[#382A30] shadow-sm hover:text-[#B9788B] hover:bg-white transition-all opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
          aria-label="Ver detalles"
          title="Ver detalles rápidos"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      {/* Card Content & Metadata */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
        <div className="space-y-1.5">
          {/* Category unboxed metadata with dot separator */}
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[#B9788B] font-medium">
            <span>{product.category}</span>
            {isLowStock && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-amber-800 lowercase">¡últimas {product.stock} unidades!</span>
              </>
            )}
          </div>

          {/* Product Title */}
          <h3 className="text-sm sm:text-base font-serif-brand font-medium text-[#382A30] group-hover:text-[#B9788B] transition-colors line-clamp-2 leading-snug">
            {product.name}
          </h3>

          <p className="text-xs text-[#382A30]/70 line-clamp-2 font-sans pt-0.5 leading-relaxed">
            {product.shortDescription}
          </p>
        </div>

        {/* Pricing and Action */}
        <div className="pt-4 mt-2 border-t border-[#F7E5E9] flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm sm:text-base font-semibold text-[#382A30] tabular-nums">
                {formatCOP(product.price)}
              </span>
            </div>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-[#382A30]/40 line-through tabular-nums">
                {formatCOP(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Add to Bag Interactive Button */}
          <div className="relative">
            {/* Bursting magical sparkles when added */}
            {isJustAdded && (
              <>
                <span
                  aria-hidden="true"
                  className="absolute -top-2.5 -right-1 text-xs text-[#B9788B] pointer-events-none select-none animate-bounce font-serif"
                >
                  ✦
                </span>
                <span
                  aria-hidden="true"
                  className="absolute -top-2 -left-1.5 text-[10px] text-[#B9788B]/80 pointer-events-none select-none animate-pulse font-serif"
                >
                  ✦
                </span>
                <span
                  aria-hidden="true"
                  className="absolute -bottom-1 -right-2 text-[9px] text-[#B9788B]/60 pointer-events-none select-none animate-ping font-serif"
                >
                  ✦
                </span>
              </>
            )}

            <button
              onClick={handleAddClick}
              disabled={isOutOfStock}
              className={`relative p-2.5 sm:p-3 rounded-full text-xs font-medium transition-all duration-300 flex items-center justify-center shrink-0 ${
                isOutOfStock
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : isJustAdded
                  ? 'bg-[#B9788B] text-white scale-110 ring-4 ring-[#E8BFCB] shadow-md'
                  : isItemInCart
                  ? 'bg-[#E8BFCB] text-[#382A30] hover:bg-[#B9788B] hover:text-white hover:scale-105 active:scale-90 shadow-xs'
                  : 'bg-[#B9788B] text-white hover:bg-[#a6687a] hover:scale-105 active:scale-90 shadow-xs'
              }`}
              aria-label={`Agregar ${product.name} a la bolsa`}
              title={
                isJustAdded
                  ? '¡Agregado!'
                  : isItemInCart
                  ? 'En tu bolsa (agregar otra unidad)'
                  : 'Agregar a la bolsa'
              }
            >
              {isJustAdded ? (
                <Check className="w-4 h-4 stroke-[2.5] animate-in zoom-in-75 duration-200" />
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
