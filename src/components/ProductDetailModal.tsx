import React, { useState, useEffect, useRef } from 'react';
import { X, ShoppingBag, Check, ShieldCheck, Truck, Sparkles, MessageCircle } from 'lucide-react';
import { Product, ProductShade, SelectedShade } from '../types/store';
import { formatCOP, createWhatsAppUrl, getVariantLabel } from '../utils/formatters';
import { BeautyImage } from './BeautyImage';
import { SwatchCircle } from './SwatchCircle';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, selectedShade?: SelectedShade) => void;
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
  const [selectedShade, setSelectedShade] = useState<ProductShade | null>(null);
  const lastProductIdRef = useRef<string | null>(null);
  const addedTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (addedTimerRef.current !== null) {
        window.clearTimeout(addedTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!product) {
      lastProductIdRef.current = null;
      return;
    }

    const isNewProduct = lastProductIdRef.current !== product.id;
    lastProductIdRef.current = product.id;

    if (isNewProduct) {
      setQuantity(1);
      setJustAdded(false);
    }

    if (product.shades && product.shades.length > 0) {
      setSelectedShade((prev) => {
        if (!isNewProduct && prev) {
          const updatedSameShade = product.shades!.find((s) => s.id === prev.id);
          if (updatedSameShade) return updatedSameShade;
        }
        return product.shades!.find((s) => s.stock > 0) || product.shades![0];
      });
    } else {
      setSelectedShade(null);
    }
  }, [product]);

  if (!product) return null;

  const hasShades = Array.isArray(product.shades) && product.shades.length > 0;
  const variantLabel = getVariantLabel(product.variantType);
  const availableStock = hasShades
    ? selectedShade?.stock ?? 0
    : product.stock;
  const isOutOfStock = availableStock <= 0;

  const displayImageUrl =
    selectedShade?.imageUrl?.trim() ? selectedShade.imageUrl : product.imageUrl;

  const handleSelectShade = (shade: ProductShade) => {
    setSelectedShade(shade);
    if (shade.stock > 0 && quantity > shade.stock) {
      setQuantity(shade.stock);
    } else if (shade.stock > 0 && quantity < 1) {
      setQuantity(1);
    }
  };

  const handleAdd = () => {
    if (isOutOfStock) return;
    const shadePayload: SelectedShade | undefined =
      hasShades && selectedShade
        ? {
            id: selectedShade.id,
            name: selectedShade.name,
            colorHex: selectedShade.colorHex,
            finish: selectedShade.finish,
          }
        : undefined;

    onAddToCart(product, quantity, shadePayload);
    if (addedTimerRef.current !== null) {
      window.clearTimeout(addedTimerRef.current);
    }
    setJustAdded(true);
    addedTimerRef.current = window.setTimeout(() => {
      setJustAdded(false);
      addedTimerRef.current = null;
    }, 2000);
  };

  const handleDirectWhatsAppQuestion = () => {
    const shadeText =
      hasShades && selectedShade
        ? ` (${variantLabel}: ${selectedShade.name})`
        : '';
    const msg = `¡Hola Dulzara! Me interesa el producto: *${product.name}*${shadeText} (Ref: ${product.id}) con precio de ${formatCOP(product.price)}. ¿Tienen disponibilidad y me pueden dar más información?`;
    window.open(createWhatsAppUrl(whatsappNumber, msg), '_blank');
  };

  const handleShadeAdvisoryWhatsApp = () => {
    const msg = `¡Hola Dulzara! Quiero comprar el producto *${product.name}* pero tengo dudas sobre cuál tono elegir, ¿me podrían asesorar?`;
    window.open(createWhatsAppUrl(whatsappNumber, msg), '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
        aria-hidden="true" 
      />

      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden border border-[#E8BFCB]/50 z-10 max-h-[92vh] flex flex-col animate-dulzara-pop">
        
        {/* Top close bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#F7E5E9] bg-[#FFFDF9] shrink-0">
          <div className="text-[11px] sm:text-xs uppercase tracking-[0.08em] text-[#B9788B] font-semibold">
            {product.category} · Dulzara Original
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="p-1.5 text-[#382A30]/60 hover:text-[#382A30] rounded-full hover:bg-[#F7E5E9] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="overflow-y-auto p-4 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-8 items-start">
            
            {/* Gallery Left Frame */}
            <div className="md:col-span-6 space-y-3.5 sm:space-y-4">
              <div className="relative aspect-[4/3.6] sm:aspect-square w-full rounded-2xl overflow-hidden border border-[#E8BFCB]/40 bg-[#F7E5E9]/20 shadow-xs">
                <BeautyImage
                  src={displayImageUrl}
                  alt={selectedShade ? `${product.name} - ${selectedShade.name}` : product.name}
                  category={product.category}
                  className="w-full h-full object-cover"
                />
                {product.originalPrice && product.originalPrice > product.price && (
                  <div className="bg-[#B9788B] text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm absolute top-3 left-3 z-10 tracking-wide flex items-center gap-1">
                    <span aria-hidden="true">✦</span>
                    <span>Descuento</span>
                  </div>
                )}
              </div>
            </div>

            {/* Contiguous Purchase Module Right */}
            <div className="md:col-span-6 space-y-4 sm:space-y-5">
              
              <div>
                <h2 className="text-xl sm:text-3xl font-serif-brand font-semibold text-[#382A30] leading-snug">
                  {product.name}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-2.5">
                  <span className="text-xl sm:text-2xl font-bold text-[#382A30] tabular-nums">
                    {formatCOP(product.price)}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-sm text-[#382A30]/40 line-through tabular-nums">
                      {formatCOP(product.originalPrice)}
                    </span>
                  )}

                  {/* Subtle, natural availability indicator for products without shades */}
                  {!hasShades && (
                    <div className="inline-flex items-center gap-2 pl-2 border-l border-[#E8BFCB]/60 text-xs text-[#382A30]/75">
                      <span className="inline-flex items-center gap-1" aria-hidden="true">
                        {[1, 2, 3].map((dot) => {
                          const filledCount = isOutOfStock
                            ? 0
                            : product.stock <= 4
                            ? 1
                            : product.stock <= 8
                            ? 2
                            : 3;
                          return (
                            <span
                              key={dot}
                              className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                                dot <= filledCount
                                  ? 'bg-[#B9788B]'
                                  : 'bg-[#E8BFCB]/45'
                              }`}
                            />
                          );
                        })}
                      </span>
                      <span className="tabular-nums">
                        {isOutOfStock ? (
                          <span className="text-[#B9788B] italic">Agotado por ahora</span>
                        ) : product.stock <= 4 ? (
                          <span>
                            Últimas <strong className="font-semibold text-[#382A30]">{product.stock}</strong> disp.
                          </span>
                        ) : (
                          <span>
                            <strong className="font-semibold text-[#382A30]">{product.stock}</strong> disponibles
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Shade Selector & WhatsApp Lifesaver Button */}
              {hasShades && selectedShade && (
                <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#E8BFCB]/60 space-y-3 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs">
                      <span className="text-[#382A30]/70 font-medium">
                        {variantLabel} seleccionado:{' '}
                      </span>
                      <strong className="text-[#382A30] font-semibold">
                        {selectedShade.name}
                      </strong>
                    </div>

                    {selectedShade.hint && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F7E5E9]/80 text-[#382A30]/90 text-[11px] font-medium">
                        <span className="text-[#B9788B] text-[10px]" aria-hidden="true">✦</span>
                        <span>{selectedShade.hint}</span>
                      </span>
                    )}
                  </div>

                  {/* Large w-9 h-9 Swatch Circles */}
                  <div className="flex items-center flex-wrap gap-3 pt-0.5">
                    {product.shades!.map((shade) => (
                      <SwatchCircle
                        key={shade.id}
                        colorHex={shade.colorHex}
                        finish={shade.finish}
                        name={shade.name}
                        stock={shade.stock}
                        size="lg"
                        isSelected={selectedShade.id === shade.id}
                        onClick={() => handleSelectShade(shade)}
                      />
                    ))}
                  </div>

                  {/* Subtle, editorial finish & availability note */}
                  <div className="pt-2.5 border-t border-[#E8BFCB]/35 flex flex-wrap items-center justify-between gap-y-1.5 gap-x-4 text-xs text-[#382A30]/70">
                    <div className="inline-flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full border border-[#382A30]/15 shrink-0"
                        style={{ backgroundColor: selectedShade.colorHex }}
                      />
                      <span>
                        Acabado{' '}
                        <span className="text-[#382A30] font-medium">
                          {selectedShade.finish === 'glossy'
                            ? 'gloss brillante'
                            : selectedShade.finish === 'shimmer'
                            ? 'iluminador perlado'
                            : 'mate aterciopelado'}
                        </span>
                      </span>
                    </div>

                    {/* Creative 3-pearl blush gauge + quiet tabular count */}
                    <div className="inline-flex items-center gap-2 tabular-nums">
                      <span
                        className="inline-flex items-center gap-1"
                        title="Nivel de disponibilidad"
                        aria-hidden="true"
                      >
                        {[1, 2, 3].map((dot) => {
                          const filledCount =
                            selectedShade.stock <= 0
                              ? 0
                              : selectedShade.stock <= 4
                              ? 1
                              : selectedShade.stock <= 8
                              ? 2
                              : 3;
                          return (
                            <span
                              key={dot}
                              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                                dot <= filledCount
                                  ? 'bg-[#B9788B]'
                                  : 'bg-[#E8BFCB]/45'
                              }`}
                            />
                          );
                        })}
                      </span>

                      {selectedShade.stock > 0 ? (
                        <span className="text-[#382A30]/75">
                          {selectedShade.stock <= 4 ? (
                            <>
                              Últimas{' '}
                              <strong className="font-semibold text-[#B9788B]">
                                {selectedShade.stock}
                              </strong>{' '}
                              {selectedShade.stock === 1 ? 'unidad' : 'unidades'}
                            </>
                          ) : (
                            <>
                              <strong className="font-semibold text-[#382A30]">
                                {selectedShade.stock}
                              </strong>{' '}
                              disponibles
                            </>
                          )}
                        </span>
                      ) : (
                        <span className="text-[#B9788B] italic">
                          Agotado en este tono
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Lifesaver Advisory Link */}
                  <div className="pt-3 border-t border-[#E8BFCB]/35 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={handleShadeAdvisoryWhatsApp}
                      className="text-xs font-medium text-[#B9788B] hover:text-[#382A30] transition-colors inline-flex items-center justify-center gap-1.5 group cursor-pointer text-center leading-snug"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-[#25D366] shrink-0 translate-y-[0.5px] group-hover:scale-110 transition-transform" />
                      <span className="underline decoration-[#E8BFCB] underline-offset-4 group-hover:decoration-[#B9788B]">
                        ¿Dudas con tu tono ideal? Te asesoramos por WhatsApp 💕
                      </span>
                    </button>
                  </div>
                </div>
              )}

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
                      onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                      disabled={quantity >= availableStock || isOutOfStock}
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
                        <span>
                          {hasShades && selectedShade
                            ? `Agregar ${selectedShade.name} ${quantity > 1 ? `(${quantity})` : ''} ✦`
                            : `Agregar ${quantity > 1 ? `(${quantity})` : ''} a la bolsa`}
                        </span>
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

              {/* Trust highlights at the very end */}
              <div className="p-3 sm:p-3.5 bg-[#F7E5E9]/40 rounded-xl border border-[#E8BFCB]/30 space-y-1.5 sm:space-y-2 text-xs text-[#382A30]/80">
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

          </div>
        </div>

      </div>
    </div>
  );
};

