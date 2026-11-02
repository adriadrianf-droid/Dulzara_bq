import React, { useState } from 'react';
import { X, ShoppingBag, Check, ShieldCheck, Truck, Sparkles, MessageCircle } from 'lucide-react';
import { Product } from '../types/store';
import { formatCOP, createWhatsAppUrl } from '../utils/formatters';
import { BeautyImage } from './BeautyImage';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  whatsappNumber: string;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  whatsappNumber,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  if (!product) return null;

  const isOutOfStock = product.stock <= 0;

  const handleAdd = () => {
    if (isOutOfStock) return;
    onAddToCart(product, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const handleDirectWhatsAppQuestion = () => {
    const msg = `¡Hola Dulzara! Me interesa el producto: *${product.name}* (Ref: ${product.id}) con precio de ${formatCOP(product.price)}. ¿Tienen disponibilidad y me pueden dar más información?`;
    window.open(createWhatsAppUrl(whatsappNumber, msg), '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
        aria-hidden="true" 
      />

      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden border border-[#E8BFCB]/50 z-10 max-h-[90vh] flex flex-col">
        
        {/* Top close bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F7E5E9] bg-[#FFFDF9]">
          <div className="text-xs uppercase tracking-wider text-[#B9788B] font-semibold">
            {product.category} · Dulzara Original
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="p-1.5 text-[#382A30]/60 hover:text-[#382A30] rounded-full hover:bg-[#F7E5E9] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="overflow-y-auto p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            
            {/* Gallery Left Frame */}
            <div className="md:col-span-6 space-y-4">
              <div className="aspect-square w-full rounded-2xl overflow-hidden border border-[#E8BFCB]/40 bg-[#F7E5E9]/20 shadow-xs">
                <BeautyImage
                  src={product.imageUrl}
                  alt={product.name}
                  category={product.category}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Trust highlights */}
              <div className="p-3.5 bg-[#F7E5E9]/40 rounded-xl border border-[#E8BFCB]/30 space-y-2 text-xs text-[#382A30]/80">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#B9788B] shrink-0" />
                  <span>Garantía de originalidad y frescura en cada fórmula</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#B9788B] shrink-0" />
                  <span>Despachos asegurados a cualquier rincón de Colombia</span>
                </div>
              </div>
            </div>

            {/* Contiguous Purchase Module Right */}
            <div className="md:col-span-6 space-y-5">
              
              <div>
                <h2 className="text-2xl sm:text-3xl font-serif-brand font-semibold text-[#382A30] leading-snug">
                  {product.name}
                </h2>
                <div className="mt-2 flex items-baseline gap-3">
                  <span className="text-2xl font-bold text-[#382A30] tabular-nums">
                    {formatCOP(product.price)}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-sm text-[#382A30]/40 line-through tabular-nums">
                      {formatCOP(product.originalPrice)}
                    </span>
                  )}
                </div>

                {/* Availability status */}
                <div className="mt-2 text-xs">
                  {isOutOfStock ? (
                    <span className="text-red-700 font-medium">Temporalmente agotado</span>
                  ) : (
                    <span className="text-emerald-800 font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                      Disponible · {product.stock} unidades en bodega
                    </span>
                  )}
                </div>
              </div>

              {/* Short description */}
              <p className="text-sm text-[#382A30]/80 leading-relaxed font-sans">
                {product.description || product.shortDescription}
              </p>

              {/* Benefits checklist if available */}
              {product.benefits && product.benefits.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#382A30]">
                    Beneficios destacados:
                  </h4>
                  <ul className="space-y-1 text-xs text-[#382A30]/80">
                    {product.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-[#B9788B] shrink-0 mt-0.5" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Quantity Stepper and Actions */}
              <div className="pt-4 border-t border-[#F7E5E9] space-y-3">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-medium text-[#382A30]">Cantidad:</span>
                  <div className="flex items-center border border-[#E8BFCB] rounded-xl overflow-hidden bg-white">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1 || isOutOfStock}
                      className="px-3 py-1.5 text-sm text-[#382A30] hover:bg-[#F7E5E9] disabled:opacity-40 transition-colors"
                    >
                      -
                    </button>
                    <span className="px-3 py-1.5 text-xs font-semibold tabular-nums text-[#382A30] min-w-8 text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      disabled={quantity >= product.stock || isOutOfStock}
                      className="px-3 py-1.5 text-sm text-[#382A30] hover:bg-[#F7E5E9] disabled:opacity-40 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={handleAdd}
                    disabled={isOutOfStock}
                    className={`flex-1 py-3.5 px-6 rounded-full font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                      isOutOfStock
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : justAdded
                        ? 'bg-emerald-700 text-white'
                        : 'bg-[#B9788B] hover:bg-[#a6687a] text-white shadow-sm active:scale-98'
                    }`}
                  >
                    {justAdded ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>¡Agregado a la bolsa!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>Agregar {quantity > 1 ? `(${quantity})` : ''} a la bolsa</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDirectWhatsAppQuestion}
                    className="py-3 px-4 rounded-full border border-[#25D366] text-[#128C7E] hover:bg-[#25D366]/10 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                    title="Consultar disponibilidad por WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4 text-[#25D366]" />
                    <span>Preguntar por WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Mode of Use & Ingredients tabs */}
              {(product.howToUse || product.ingredients) && (
                <div className="pt-4 border-t border-[#F7E5E9] space-y-3">
                  {product.howToUse && (
                    <div className="text-xs text-[#382A30]/80">
                      <span className="font-semibold text-[#382A30] block mb-0.5">Modo de uso:</span>
                      <p>{product.howToUse}</p>
                    </div>
                  )}
                  {product.ingredients && (
                    <div className="text-xs text-[#382A30]/70">
                      <span className="font-semibold text-[#382A30] block mb-0.5">Ingredientes clave:</span>
                      <p className="italic">{product.ingredients}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
