import React, { useState, useRef } from 'react';
import { X, MessageCircle, AlertCircle, ShieldCheck, Loader2, MapPin } from 'lucide-react';
import { CartItem, CustomerInfo, Order, StoreSettings } from '../types/store';
import {
  formatCOP,
  buildWhatsAppMessage,
  createWhatsAppUrl,
  getVariantLabel,
  getCartItemKey,
} from '../utils/formatters';
import { storeService, getCityShippingCost } from '../services/storeService';
import { SwatchCircle } from './SwatchCircle';

const COVERAGE_CITIES: {
  city: 'Barranquilla' | 'Soledad';
  placeholderNeighborhood: string;
  neighborhoods: string[];
}[] = [
  {
    city: 'Barranquilla',
    placeholderNeighborhood: 'Ej: Villa Carolina',
    neighborhoods: [
      'Villa Carolina',
      'Alto Prado',
      'El Prado',
      'Riomar',
      'Miramar',
      'Villa Santos',
      'Ciudad Jardín',
      'El Recreo',
      'Boston',
      'Los Andes',
      'Paraíso',
      'Las Delicias',
      'Las Mercedes',
      'San Felipe',
      'Olaya',
      'Nuevo Horizonte',
      'La Concepción',
      'San José',
      'Cevillar',
      'Simón Bolívar',
      'Centro',
      'Alameda del Río',
      'Villa Campestre',
    ],
  },
  {
    city: 'Soledad',
    placeholderNeighborhood: 'Ej: Los Robles',
    neighborhoods: [
      'Los Robles',
      'Villa Estadio',
      'Las Moras',
      'Portal de Las Moras',
      'Ciudadela Metropolitana',
      'Hipódromo',
      'El Parque',
      'Los Almendros',
      'Manuela Beltrán',
      'Soledad 2000',
      'Villa Katanga',
      'Tajamar',
      'Terranova',
      'Los Loteros',
      'Villa Muvdi',
      'Centro de Soledad',
    ],
  },
];

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  settings: StoreSettings;
  onOrderSuccess: (order: Order, whatsappUrl: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  settings,
  onOrderSuccess,
}) => {
  const [formData, setFormData] = useState<CustomerInfo>({
    fullName: '',
    phone: '',
    department: 'Atlántico',
    city: 'Barranquilla',
    address: '',
    neighborhood: '',
    notes: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [validationAlert, setValidationAlert] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const activeCityConfig =
    COVERAGE_CITIES.find((c) => c.city === formData.city) || COVERAGE_CITIES[0];

  const handleCitySelect = (city: 'Barranquilla' | 'Soledad') => {
    setFormData((prev) => ({
      ...prev,
      department: 'Atlántico',
      city,
    }));
    if (formErrors.city) {
      setFormErrors((prev) => ({ ...prev, city: '' }));
    }
  };

  // Preliminary calculation for display
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const cityShippingRate = getCityShippingCost(settings, formData.city);
  const shippingCost =
    subtotal >= settings.freeShippingThreshold ? 0 : cityShippingRate;
  const estimatedTotal = subtotal + shippingCost;

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.fullName.trim() || formData.fullName.trim().length < 3) {
      errors.fullName = 'Por favor ingresa tu nombre y apellido.';
    }

    const cleanPhone = formData.phone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      errors.phone = 'Ingresa un número de celular o WhatsApp de al menos 10 dígitos (ej: 3101234567).';
    }

    if (!formData.address.trim()) {
      errors.address = 'La dirección de entrega es obligatoria.';
    }

    if (!formData.neighborhood.trim()) {
      errors.neighborhood = 'Ingresa el barrio para ubicar tu entrega.';
    }

    if (formData.city !== 'Barranquilla' && formData.city !== 'Soledad') {
      errors.city = 'Selecciona Barranquilla o Soledad para tu domicilio.';
    }

    setFormErrors(errors);

    const hasErrors = Object.keys(errors).length > 0;
    if (hasErrors) {
      setValidationAlert('Por favor completa todos los campos requeridos marcados en rojo.');
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return false;
    }

    setValidationAlert(null);
    return true;
  };

  const handleFinalizeWhatsAppOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // SECURITY ENFORCEMENT:
      // We pass { productId, quantity, selectedShade } to storeService.
      // The storeService strictly looks up real database prices and real stock,
      // recalibrates total, and validates shade availability safely.
      const rawOrderPayload = items.map((i) => ({
        productId: i.product.id,
        quantity: i.quantity,
        selectedShade: i.selectedShade,
      }));

      const result = await storeService.createOrder(formData, rawOrderPayload);
      const order = result.order;

      // Construct formatted WhatsApp text
      const message = buildWhatsAppMessage(
        order.id,
        order.customer,
        order.items,
        order.subtotal,
        order.shippingCost,
        order.total
      );

      // Construct WhatsApp URL with normalized international phone
      const whatsappUrl = createWhatsAppUrl(settings.whatsappNumber, message);

      // Mark that it is proceeding to WhatsApp
      await storeService.markWhatsappSent(order.id);

      // Try opening WhatsApp in a new tab/app immediately
      try {
        window.open(whatsappUrl, '_blank');
      } catch (e) {
        console.warn('Popup notice (will be accessible via confirmation modal):', e);
      }

      // Callback to show order confirmation with direct guaranteed WhatsApp button
      onOrderSuccess(order, whatsappUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al procesar el pedido.';
      setServerError(msg);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
        aria-hidden="true" 
      />

      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#E8BFCB]/50 z-10 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-[#F7E5E9] bg-[#FFFDF9] flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <span className="text-[10.5px] sm:text-[11px] uppercase tracking-wider text-[#B9788B] font-semibold block">
              Paso Final · Domicilio Directo
            </span>
            <h2 className="text-base sm:text-lg font-serif-brand font-semibold text-[#382A30] leading-snug">
              Datos de Entrega
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1.5 text-[#382A30]/60 hover:text-[#382A30] rounded-full hover:bg-[#F7E5E9] transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Complete Form container covering body & footer */}
        <form onSubmit={handleFinalizeWhatsAppOrder} className="flex-1 flex flex-col overflow-hidden min-h-0">
          
          {/* Scrollable Form Body */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5">
            
            {serverError && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <strong>No fue posible completar el pedido:</strong>
                  <p className="mt-0.5">{serverError}</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              
              {/* Customer Name */}
              <div>
                <label className="block text-xs font-semibold text-[#382A30] mb-1.5">
                  Nombre y apellido <span className="text-[#B9788B]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: Sofia Restrepo"
                  value={formData.fullName}
                  onChange={(e) => {
                    setFormData({ ...formData, fullName: e.target.value });
                    if (formErrors.fullName) setFormErrors({ ...formErrors, fullName: '' });
                  }}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white focus:outline-none transition-colors ${
                    formErrors.fullName
                      ? 'border-red-400 focus:border-red-500 bg-red-50/20'
                      : 'border-[#E8BFCB] focus:border-[#B9788B]'
                  }`}
                />
                {formErrors.fullName && (
                  <p className="text-[11px] text-red-600 mt-1 font-medium">{formErrors.fullName}</p>
                )}
              </div>

              {/* Phone (WhatsApp) */}
              <div>
                <label className="block text-xs font-semibold text-[#382A30] mb-1.5">
                  Número de WhatsApp <span className="text-[#B9788B]">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sm text-[#382A30]/55 font-medium select-none">
                    +57
                  </span>
                  <input
                    type="tel"
                    placeholder="310 123 4567"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value });
                      if (formErrors.phone) setFormErrors({ ...formErrors, phone: '' });
                    }}
                    className={`w-full pl-12 pr-3.5 py-2.5 text-sm rounded-xl border bg-white focus:outline-none transition-colors ${
                      formErrors.phone
                        ? 'border-red-400 focus:border-red-500 bg-red-50/20'
                        : 'border-[#E8BFCB] focus:border-[#B9788B]'
                    }`}
                  />
                </div>
                {formErrors.phone && (
                  <p className="text-[11px] text-red-600 mt-1 font-medium">{formErrors.phone}</p>
                )}
              </div>

              {/* Direct City Selection: Barranquilla or Soledad */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label className="block text-xs font-semibold text-[#382A30]">
                    Elige tu ciudad <span className="text-[#B9788B]">*</span>
                  </label>
                  <span className="text-[10.5px] text-[#B9788B] font-medium bg-[#F7E5E9]/70 px-2 py-0.5 rounded-full">
                    Toca una opción
                  </span>
                </div>
                <div
                  role="radiogroup"
                  aria-label="Ciudad de entrega"
                  className="p-1.5 rounded-2xl bg-[#F7E5E9]/65 border border-[#E8BFCB]/80 grid grid-cols-2 gap-1.5"
                >
                  {COVERAGE_CITIES.map((item) => {
                    const isSelected = formData.city === item.city;
                    return (
                      <button
                        key={item.city}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => handleCitySelect(item.city)}
                        className={`relative py-2.5 px-2.5 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center text-center select-none ${
                          isSelected
                            ? 'bg-[#B9788B] text-white shadow-sm shadow-[#382A30]/15 font-semibold'
                            : 'bg-white/75 text-[#382A30]/70 hover:bg-white hover:text-[#382A30] font-medium border border-transparent hover:border-[#E8BFCB]'
                        }`}
                      >
                        <span className="inline-flex items-center justify-center gap-1.5">
                          <MapPin
                            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-transform duration-200 ${
                              isSelected ? 'text-white scale-105' : 'text-[#B9788B]/75'
                            }`}
                          />
                          <span className="text-[13px] sm:text-sm whitespace-nowrap tracking-wide">
                            {item.city}
                          </span>
                          {isSelected && (
                            <span
                              aria-hidden="true"
                              className="text-[10px] text-[#F7E5E9] font-serif leading-none ml-0.5"
                            >
                              ✦
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {formErrors.city && (
                  <p className="text-[11px] text-red-600 mt-1 font-medium">{formErrors.city}</p>
                )}
              </div>

              {/* Address and Neighborhood */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#382A30] mb-1.5">
                    Dirección de entrega <span className="text-[#B9788B]">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Calle, Carrera, N° de casa o Apto"
                    value={formData.address}
                    onChange={(e) => {
                      setFormData({ ...formData, address: e.target.value });
                      if (formErrors.address) setFormErrors({ ...formErrors, address: '' });
                    }}
                    className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white focus:outline-none ${
                      formErrors.address
                        ? 'border-red-400 focus:border-red-500 bg-red-50/20'
                        : 'border-[#E8BFCB] focus:border-[#B9788B]'
                    }`}
                  />
                  {formErrors.address && (
                    <p className="text-[11px] text-red-600 mt-1 font-medium">{formErrors.address}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#382A30] mb-1.5">
                    Barrio <span className="text-[#B9788B]">*</span>
                  </label>
                  <input
                    type="text"
                    list="barrio-suggestions"
                    placeholder={activeCityConfig.placeholderNeighborhood}
                    value={formData.neighborhood}
                    onChange={(e) => {
                      setFormData({ ...formData, neighborhood: e.target.value });
                      if (formErrors.neighborhood) setFormErrors({ ...formErrors, neighborhood: '' });
                    }}
                    className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white focus:outline-none ${
                      formErrors.neighborhood
                        ? 'border-red-400 focus:border-red-500 bg-red-50/20'
                        : 'border-[#E8BFCB] focus:border-[#B9788B]'
                    }`}
                  />
                  <datalist id="barrio-suggestions">
                    {activeCityConfig.neighborhoods.map((neighborhood) => (
                      <option key={neighborhood} value={neighborhood} />
                    ))}
                  </datalist>
                  {formErrors.neighborhood && (
                    <p className="text-[11px] text-red-600 mt-1 font-medium">{formErrors.neighborhood}</p>
                  )}
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-xs font-semibold text-[#382A30] mb-1.5">
                  Punto de referencia <span className="text-[#382A30]/50 font-normal">(Opcional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Portería 24h, casa rejas blancas, diagonal al parque..."
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E8BFCB] bg-white focus:border-[#B9788B] focus:outline-none text-[#382A30] resize-none"
                />
              </div>

            </div>

            {/* Order Summary Inset */}
            <div className="p-4 rounded-2xl bg-[#F7E5E9]/50 border border-[#E8BFCB]/40 space-y-2.5 text-xs">
              <div className="space-y-1.5 pb-2 border-b border-[#E8BFCB]/40 max-h-36 overflow-y-auto pr-1">
                {items.map((item) => {
                  const key = getCartItemKey(item.product.id, item.selectedShade?.id);
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between gap-2 text-[#382A30]/90"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-semibold shrink-0">{item.quantity}x</span>
                        <span className="truncate">{item.product.name}</span>
                        {item.selectedShade && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/90 border border-[#E8BFCB]/60 text-[10px] font-medium shrink-0">
                            <SwatchCircle
                              colorHex={item.selectedShade.colorHex}
                              finish={item.selectedShade.finish}
                              name={item.selectedShade.name}
                              size="xs"
                            />
                            <span>
                              {getVariantLabel(item.product.variantType)}: {item.selectedShade.name}
                            </span>
                          </span>
                        )}
                      </div>
                      <span className="font-semibold tabular-nums shrink-0">
                        {formatCOP(item.product.price * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between text-[#382A30]/80">
                <span>{items.reduce((s, it) => s + it.quantity, 0)} productos en tu orden</span>
                <span className="font-semibold tabular-nums">{formatCOP(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[#382A30]/80">
                <span>Domicilio en {formData.city}, Atlántico</span>
                <span className="tabular-nums">
                  {shippingCost === 0 ? (
                    <strong className="text-emerald-800">¡GRATIS!</strong>
                  ) : (
                    formatCOP(shippingCost)
                  )}
                </span>
              </div>
              <div className="pt-2 border-t border-[#E8BFCB]/50 flex justify-between text-base font-bold text-[#382A30]">
                <span>Total a Pagar</span>
                <span className="text-[#382A30] tabular-nums">{formatCOP(estimatedTotal)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#382A30]/70">
              <ShieldCheck className="w-4 h-4 text-[#B9788B] shrink-0" />
              <span>Los precios son validados directamente con la base de datos oficial de Dulzara.</span>
            </div>

          </div>

          {/* Footer with Whatsapp Button inside form */}
          <div className="p-5 border-t border-[#F7E5E9] bg-[#FFFDF9] space-y-2 shrink-0">
            {validationAlert && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-medium">{validationAlert}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 bg-[#25D366] hover:bg-[#20ba5a] text-white font-semibold text-sm sm:text-base rounded-full transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 active:scale-98 disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>PROCESANDO TU PEDIDO...</span>
                </>
              ) : (
                <>
                  <MessageCircle className="w-5 h-5 fill-white text-[#25D366]" />
                  <span>FINALIZAR PEDIDO POR WHATSAPP</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-center text-[#382A30]/60">
              Al presionar este botón se guardará tu pedido y se abrirá WhatsApp con el resumen listo para enviar (+{settings.whatsappNumber}).
            </p>
          </div>

        </form>

      </div>
    </div>
  );
};
