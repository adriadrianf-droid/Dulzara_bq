import React from 'react';
import { X, Trash2, ArrowRight, ShoppingBag, Truck } from 'lucide-react';
import { CartItem } from '../types/store';
import { formatCOP, getCartItemKey, getVariantLabel } from '../utils/formatters';
import { BeautyImage } from './BeautyImage';
import { SwatchCircle } from './SwatchCircle';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (cartItemKey: string, quantity: number) => void;
  onRemoveItem: (cartItemKey: string) => void;
  onProceedToCheckout: () => void;
  freeShippingThreshold: number;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  freeShippingThreshold,
}) => {
  if (!isOpen) return null;

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-[#E8BFCB]/50 animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="p-5 border-b border-[#F7E5E9] bg-[#FFFDF9] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#B9788B]" />
              <h2 className="text-base font-serif-brand font-semibold text-[#382A30]">
                Tu Bolsa de Compras
              </h2>
              <span className="text-xs text-[#382A30]/60 tabular-nums">
                ({items.reduce((acc, it) => acc + it.quantity, 0)} {items.length === 1 ? 'artículo' : 'artículos'})
              </span>
            </div>
            <button
              onClick={onClose}
              aria-label="Cerrar bolsa"
              className="p-1.5 text-[#382A30]/60 hover:text-[#382A30] rounded-full hover:bg-[#F7E5E9]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Dynamic Progress */}
          <div className="px-5 py-3 bg-[#F7E5E9]/50 border-b border-[#E8BFCB]/30">
            <div className="flex items-center justify-between text-xs text-[#382A30] mb-1.5 font-medium">
              <span className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-[#B9788B]" />
                {amountNeededForFreeShipping === 0 ? (
                  <span className="text-emerald-800 font-semibold">¡Felicidades! Tienes Envío GRATIS</span>
                ) : (
                  <span>
                    Te faltan <strong className="text-[#B9788B]">{formatCOP(amountNeededForFreeShipping)}</strong> para envío gratis
                  </span>
                )}
              </span>
              <span className="tabular-nums font-semibold text-[#382A30]/70">
                {progressPercent}%
              </span>
            </div>
            <div className="w-full bg-[#E8BFCB]/40 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#B9788B] h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-full bg-[#F7E5E9] flex items-center justify-center text-[#B9788B]">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-base font-serif-brand font-medium text-[#382A30]">
                  Tu bolsa está vacía
                </h3>
                <p className="text-xs text-[#382A30]/70 max-w-xs">
                  Descubre nuestras fórmulas botánicas y productos de maquillaje pensados para ti.
                </p>
                <button
                  onClick={onClose}
                  className="mt-2 px-5 py-2.5 bg-[#B9788B] text-white text-xs font-medium rounded-full hover:bg-[#a6687a] transition-all"
                >
                  Explorar productos
                </button>
              </div>
            ) : (
              items.map((item) => {
                const itemKey = getCartItemKey(item.product.id, item.selectedShade?.id);
                const matchingShade =
                  item.selectedShade && item.product.shades
                    ? item.product.shades.find((s) => s.id === item.selectedShade?.id)
                    : undefined;
                const maxStock = matchingShade
                  ? matchingShade.stock
                  : item.product.stock;
                const itemImageUrl =
                  matchingShade?.imageUrl?.trim()
                    ? matchingShade.imageUrl
                    : item.product.imageUrl;

                return (
                  <div
                    key={itemKey}
                    className="flex gap-4 p-3 rounded-2xl bg-[#FFFDF9] border border-[#F7E5E9] hover:border-[#E8BFCB] transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-[#F7E5E9]/30">
                      <BeautyImage
                        src={itemImageUrl}
                        alt={item.product.name}
                        category={item.product.category}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-semibold text-[#382A30] line-clamp-2">
                            {item.product.name}
                          </h4>
                          <button
                            onClick={() => onRemoveItem(itemKey)}
                            aria-label={`Eliminar ${item.product.name}`}
                            className="text-[#382A30]/40 hover:text-red-700 p-1 transition-colors"
                            title="Eliminar de la bolsa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-[11px] uppercase tracking-wider text-[#B9788B]">
                          {item.product.category}
                        </span>

                        {/* Selected Shade Pill */}
                        {item.selectedShade && (
                          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#382A30]/85 bg-[#F7E5E9]/70 px-2 py-0.5 rounded-full w-fit border border-[#E8BFCB]/50">
                            <SwatchCircle
                              colorHex={item.selectedShade.colorHex}
                              finish={item.selectedShade.finish}
                              name={item.selectedShade.name}
                              size="xs"
                            />
                            <span className="font-medium">
                              {getVariantLabel(item.product.variantType)}: {item.selectedShade.name}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        {/* Quantity Stepper */}
                        <div className="flex items-center border border-[#E8BFCB] rounded-lg bg-white overflow-hidden">
                          <button
                            onClick={() => onUpdateQuantity(itemKey, item.quantity - 1)}
                            className="px-2 py-0.5 text-xs text-[#382A30] hover:bg-[#F7E5E9] transition-colors"
                            aria-label="Disminuir cantidad"
                          >
                            -
                          </button>
                          <span className="px-2.5 py-0.5 text-xs font-semibold tabular-nums min-w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(itemKey, item.quantity + 1)}
                            disabled={item.quantity >= maxStock}
                            className="px-2 py-0.5 text-xs text-[#382A30] hover:bg-[#F7E5E9] disabled:opacity-30 transition-colors"
                            aria-label="Aumentar cantidad"
                          >
                            +
                          </button>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-bold text-[#382A30] tabular-nums">
                            {formatCOP(item.product.price * item.quantity)}
                          </span>
                          {item.quantity > 1 && (
                            <span className="block text-[10px] text-[#382A30]/50 tabular-nums">
                              {formatCOP(item.product.price)} c/u
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Checkout action */}
          {items.length > 0 && (
            <div className="p-5 border-t border-[#F7E5E9] bg-[#FFFDF9] space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-[#382A30]/80">
                  <span>Subtotal estimado</span>
                  <span className="font-semibold tabular-nums">{formatCOP(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#382A30]/80">
                  <span>Envío nacional</span>
                  <span className="tabular-nums">
                    {amountNeededForFreeShipping === 0 ? (
                      <span className="text-emerald-800 font-semibold">¡GRATIS!</span>
                    ) : (
                      'Calculado al checkout'
                    )}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#F7E5E9] flex justify-between text-sm font-bold text-[#382A30]">
                  <span>Total productos</span>
                  <span className="tabular-nums">{formatCOP(subtotal)}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onProceedToCheckout();
                }}
                className="w-full py-3.5 px-4 bg-[#B9788B] hover:bg-[#a6687a] text-white font-medium text-sm rounded-full transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 active:scale-98"
              >
                <span>Proceder a la entrega</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[11px] text-center text-[#382A30]/60">
                Sin necesidad de crear cuenta · Finalización directa por WhatsApp
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
