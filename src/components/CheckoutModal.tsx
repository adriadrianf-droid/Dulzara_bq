import React, { useState, useRef } from 'react';
import { X, MessageCircle, AlertCircle, ShieldCheck, Loader2 } from 'lucide-react';
import { CartItem, CustomerInfo, Order, StoreSettings } from '../types/store';
import { formatCOP, COLOMBIAN_DEPARTMENTS, buildWhatsAppMessage, createWhatsAppUrl } from '../utils/formatters';
import { storeService } from '../services/storeService';

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

  // Selected department cities
  const currentDeptObj = COLOMBIAN_DEPARTMENTS.find(
    (d) => d.department === formData.department
  ) || COLOMBIAN_DEPARTMENTS[0];

  const handleDepartmentChange = (dept: string) => {
    const found = COLOMBIAN_DEPARTMENTS.find((d) => d.department === dept);
    setFormData((prev) => ({
      ...prev,
      department: dept,
      city: found ? found.cities[0] : '',
    }));
  };

  // Preliminary calculation for display
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const shippingCost =
    subtotal >= settings.freeShippingThreshold ? 0 : settings.standardShippingCost;
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

    if (!formData.city.trim()) {
      errors.city = 'Selecciona o escribe tu ciudad.';
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
      // We pass only { productId, quantity } to storeService.
      // The storeService strictly looks up real database prices and real stock,
      // recalibrates total, and decrements stock safely.
      const rawOrderPayload = items.map((i) => ({
        productId: i.product.id,
        quantity: i.quantity,
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
        <div className="px-6 py-4 border-b border-[#F7E5E9] bg-[#FFFDF9] flex items-center justify-between shrink-0">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-[#B9788B] font-semibold">
              Paso Final · Sin Registro
            </span>
            <h2 className="text-lg font-serif-brand font-semibold text-[#382A30]">
              Datos de Entrega y Envío
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1.5 text-[#382A30]/60 hover:text-[#382A30] rounded-full hover:bg-[#F7E5E9] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Complete Form container covering body & footer */}
        <form onSubmit={handleFinalizeWhatsAppOrder} className="flex-1 flex flex-col overflow-hidden min-h-0">
          
          {/* Scrollable Form Body */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
            
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
                <label className="block text-xs font-semibold text-[#382A30] mb-1">
                  Nombre Completo *
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
                <label className="block text-xs font-semibold text-[#382A30] mb-1">
                  Teléfono WhatsApp (Para coordinar entrega) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs text-[#382A30]/60 font-medium">
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

              {/* Department and City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#382A30] mb-1">
                    Departamento *
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E8BFCB] bg-white focus:border-[#B9788B] focus:outline-none text-[#382A30]"
                  >
                    {COLOMBIAN_DEPARTMENTS.map((dept) => (
                      <option key={dept.department} value={dept.department}>
                        {dept.department}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#382A30] mb-1">
                    Ciudad o Municipio *
                  </label>
                  <input
                    type="text"
                    list="city-suggestions"
                    placeholder="Ej: Barranquilla"
                    value={formData.city}
                    onChange={(e) => {
                      setFormData({ ...formData, city: e.target.value });
                      if (formErrors.city) setFormErrors({ ...formErrors, city: '' });
                    }}
                    className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white focus:outline-none ${
                      formErrors.city
                        ? 'border-red-400 focus:border-red-500 bg-red-50/20'
                        : 'border-[#E8BFCB] focus:border-[#B9788B]'
                    }`}
                  />
                  <datalist id="city-suggestions">
                    {currentDeptObj.cities.map((city) => (
                      <option key={city} value={city} />
                    ))}
                  </datalist>
                  {formErrors.city && (
                    <p className="text-[11px] text-red-600 mt-1 font-medium">{formErrors.city}</p>
                  )}
                </div>
              </div>

              {/* Address and Neighborhood */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#382A30] mb-1">
                    Dirección exacta de entrega *
                  </label>
                  <input
                    type="text"
                    placeholder="Calle, Carrera, N° de casa, Apto o Torre"
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
                  <label className="block text-xs font-semibold text-[#382A30] mb-1">
                    Barrio *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: El Poblado"
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
                  {formErrors.neighborhood && (
                    <p className="text-[11px] text-red-600 mt-1 font-medium">{formErrors.neighborhood}</p>
                  )}
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-xs font-semibold text-[#382A30] mb-1">
                  Observaciones de entrega (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Instrucciones para la transportadora (ej: Portería 24h, timbrar al apto, etc.)"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E8BFCB] bg-white focus:border-[#B9788B] focus:outline-none text-[#382A30] resize-none"
                />
              </div>

            </div>

            {/* Order Summary Inset */}
            <div className="p-4 rounded-2xl bg-[#F7E5E9]/50 border border-[#E8BFCB]/40 space-y-2.5 text-xs">
              <div className="flex justify-between text-[#382A30]/80">
                <span>{items.reduce((s, it) => s + it.quantity, 0)} productos en tu orden</span>
                <span className="font-semibold tabular-nums">{formatCOP(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[#382A30]/80">
                <span>Envío a {formData.department}</span>
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
