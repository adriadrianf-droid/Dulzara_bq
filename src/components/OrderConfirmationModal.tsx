import React, { useState } from 'react';
import { CheckCircle2, MessageCircle, Copy, Check, ArrowRight, Package } from 'lucide-react';
import { Order } from '../types/store';
import { formatCOP, buildWhatsAppMessage } from '../utils/formatters';

interface OrderConfirmationModalProps {
  order: Order | null;
  whatsappUrl: string;
  onClose: () => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  order,
  whatsappUrl,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!order) return null;

  const handleCopyMessage = () => {
    const text = buildWhatsAppMessage(
      order.id,
      order.customer,
      order.items,
      order.subtotal,
      order.shippingCost,
      order.total
    );
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#E8BFCB] z-10 max-h-[92vh] flex flex-col">
        
        {/* Momento Mágico de Agradecimiento */}
        <div className="relative p-6 sm:p-7 bg-gradient-to-b from-[#F7E5E9] via-[#F7E5E9]/50 to-[#FFFDF9] text-center border-b border-[#E8BFCB]/50 overflow-hidden">
          {/* Subtle 4-pointed sparkles */}
          <span aria-hidden="true" className="select-none absolute top-3 left-6 text-[#B9788B]/30 text-lg font-serif pointer-events-none">✦</span>
          <span aria-hidden="true" className="select-none absolute top-4 right-8 text-[#B9788B]/30 text-xl font-serif pointer-events-none">✦</span>

          {/* Aesthetic Tender Visual Icon / Brand Star */}
          <div className="relative mx-auto w-18 h-18 rounded-full bg-white border-2 border-[#E8BFCB] shadow-sm flex items-center justify-center overflow-hidden mb-3 p-2">
            <img
              src="/assets/aistudio/dulzara_logo_transparent.png"
              alt="Dulzara Magia"
              className="w-full h-full object-contain pointer-events-none"
            />
          </div>

          <h2 className="text-2xl sm:text-3xl font-serif-brand font-semibold text-[#382A30] leading-snug">
            ¡Gracias por brillar con Dulzara, hermosa! 💖
          </h2>

          <p className="text-sm font-medium text-[#B9788B] mt-1 font-sans">
            Amamos tenerte aquí.
          </p>

          <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 rounded-full bg-white/90 border border-[#E8BFCB] text-xs text-[#382A30]">
            <span className="font-semibold text-[#B9788B]">Pedido #{order.id}</span>
            <span className="text-[#E8BFCB]">·</span>
            <span className="text-[#382A30]/75">Listo para WhatsApp</span>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-5">
          
          {/* Main Action: Open WhatsApp */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-emerald-700" />
                Confirmación por WhatsApp
              </span>
              <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                Paso Requerido
              </span>
            </div>
            <p className="text-xs text-emerald-800">
              Toca el botón verde a continuación para abrir WhatsApp y enviar tu mensaje con el resumen ya redactado:
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1.5">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 px-5 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-sm rounded-full text-center flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all active:scale-98"
              >
                <MessageCircle className="w-5 h-5 fill-white text-[#25D366]" />
                <span>ABRIR CHAT DE WHATSAPP</span>
              </a>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="py-3 px-4 bg-white border border-emerald-300 text-emerald-900 text-xs font-semibold rounded-full hover:bg-emerald-50 transition-colors flex items-center justify-center gap-1.5 shrink-0"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4 text-emerald-700" />}
                <span>{copied ? '¡Copiado!' : 'Copiar Mensaje'}</span>
              </button>
            </div>
          </div>

          {/* Delivery Details */}
          <div className="p-4 rounded-2xl bg-[#F7E5E9]/40 border border-[#E8BFCB]/40 space-y-2 text-xs">
            <h4 className="font-semibold text-[#382A30] text-[11px] uppercase tracking-wider">
              Datos de Envío:
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[#382A30]/80">
              <div>
                <span className="text-[#382A30]/50 block">Destinatario:</span>
                <strong>{order.customer.fullName}</strong>
              </div>
              <div>
                <span className="text-[#382A30]/50 block">Teléfono:</span>
                <strong>{order.customer.phone}</strong>
              </div>
              <div>
                <span className="text-[#382A30]/50 block">Destino:</span>
                <span>{order.customer.city}, {order.customer.department}</span>
              </div>
              <div>
                <span className="text-[#382A30]/50 block">Dirección:</span>
                <span>{order.customer.address} ({order.customer.neighborhood})</span>
              </div>
            </div>
            {order.customer.notes && (
              <div className="pt-1 text-[#382A30]/70 italic border-t border-[#E8BFCB]/30">
                Observaciones: {order.customer.notes}
              </div>
            )}
          </div>

          {/* Items summary */}
          <div className="space-y-2">
            <h4 className="font-semibold text-[#382A30] text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-[#B9788B]" />
              Resumen de compra:
            </h4>
            <div className="divide-y divide-[#F7E5E9] border border-[#F7E5E9] rounded-xl overflow-hidden bg-[#FFFDF9]">
              {order.items.map((it) => (
                <div key={it.productId} className="p-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-medium text-[#382A30]">{it.name}</span>
                    <span className="text-[#382A30]/50 block">
                      Cantidad: {it.quantity} × {formatCOP(it.price)}
                    </span>
                  </div>
                  <span className="font-bold text-[#382A30] tabular-nums">
                    {formatCOP(it.price * it.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="p-3.5 bg-[#FFFDF9] rounded-xl border border-[#E8BFCB]/50 space-y-1.5 text-xs">
            <div className="flex justify-between text-[#382A30]/70">
              <span>Subtotal:</span>
              <span className="tabular-nums">{formatCOP(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-[#382A30]/70">
              <span>Costo de envío:</span>
              <span className="tabular-nums">
                {order.shippingCost === 0 ? 'GRATIS' : formatCOP(order.shippingCost)}
              </span>
            </div>
            <div className="pt-2 border-t border-[#E8BFCB]/40 flex justify-between text-sm font-bold text-[#382A30]">
              <span>Total:</span>
              <span className="text-[#B9788B] tabular-nums">{formatCOP(order.total)}</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#F7E5E9] bg-[#FFFDF9]">
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-[#382A30] hover:bg-[#4a3941] text-white font-medium text-xs rounded-full transition-colors flex items-center justify-center gap-2"
          >
            <span>Volver a la tienda</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
