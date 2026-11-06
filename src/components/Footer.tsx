import React from 'react';
import { MessageCircle, Heart, ShieldCheck, Truck, Instagram } from 'lucide-react';
import { StoreSettings } from '../types/store';
import { createWhatsAppUrl, formatCOP } from '../utils/formatters';

interface FooterProps {
  settings: StoreSettings;
  onOpenAdmin: () => void;
  onFilterCategory: (category: string | null) => void;
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  onOpenAdmin,
  onFilterCategory,
}) => {
  const whatsappUrl = createWhatsAppUrl(
    settings.whatsappNumber,
    '¡Hola equipo Dulzara! Tengo una consulta sobre sus productos.'
  );

  const cleanInsta = settings.instagramHandle ? settings.instagramHandle.replace('@', '').trim() : 'dulzara_bq';

  return (
    <footer className="bg-[#382A30] text-[#FFFDF9] border-t border-[#382A30] pt-14 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Brand info */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-white/10 border border-[#E8BFCB]/30 flex items-center justify-center overflow-hidden shrink-0 p-1">
                <img
                  src="/assets/aistudio/dulzara_logo_transparent.png"
                  alt="Dulzara Logo"
                  className="w-full h-full object-contain pointer-events-none"
                />
              </div>
              <span className="text-2xl font-serif-brand font-semibold text-white tracking-wider block">
                DULZARA
              </span>
            </div>
            <p className="text-xs text-[#E8BFCB] leading-relaxed max-w-sm">
              Marca colombiana dedicada a la belleza, maquillaje y cuidado personal. Fórmulas botánicas y pigmentos sofisticados para realzar tu delicadeza con total autenticidad.
            </p>
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#25D366] text-white text-xs font-semibold hover:bg-[#20ba5a] transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Atención por WhatsApp</span>
              </a>
              <a
                href={`https://instagram.com/${cleanInsta}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#E8BFCB]/20 border border-[#E8BFCB]/40 text-[#FFFDF9] hover:bg-[#E8BFCB]/30 text-xs font-medium transition-colors"
              >
                <Instagram className="w-3.5 h-3.5 text-[#E8BFCB]" />
                <span>@{cleanInsta}</span>
              </a>
            </div>
          </div>

          {/* Catalog Categories */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-[#E8BFCB]">
              Colecciones
            </h4>
            <ul className="space-y-2 text-xs text-white/80">
              <li>
                <button
                  onClick={() => {
                    onFilterCategory('Rostro');
                    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="hover:text-white transition-colors"
                >
                  Rostro
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onFilterCategory('Ojos y Cejas');
                    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="hover:text-white transition-colors"
                >
                  Ojos y Cejas
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onFilterCategory('Labios');
                    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="hover:text-white transition-colors"
                >
                  Labios
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onFilterCategory('Skincare y Cuidado');
                    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="hover:text-white transition-colors"
                >
                  Skincare y Cuidado
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onFilterCategory('Kits y Accesorios');
                    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="hover:text-white transition-colors"
                >
                  Kits y Accesorios
                </button>
              </li>
            </ul>
          </div>

          {/* Delivery & Trust */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-[#E8BFCB]">
              Compromiso Dulzara
            </h4>
            <div className="space-y-2.5 text-xs text-white/80">
              <div className="flex items-start gap-2">
                <Truck className="w-4 h-4 text-[#E8BFCB] shrink-0 mt-0.5" />
                <span>Despachos desde {settings.cityOrigin || 'Barranquilla Atlántico, Colombia'}. Cobertura nacional. Envío gratis desde {formatCOP(settings.freeShippingThreshold)}.</span>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#E8BFCB] shrink-0 mt-0.5" />
                <span>Productos 100% originales con empaque protegido de regalo.</span>
              </div>
              <div className="flex items-start gap-2">
                <Heart className="w-4 h-4 text-[#E8BFCB] shrink-0 mt-0.5" />
                <span>Atención directa y cercana para asesorarte con tus tonos ideales.</span>
              </div>
            </div>
          </div>

        </div>

        {/* Quiet Bottom Copyright & Admin link */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#E8BFCB]">
          <p>© 2026 DULZARA. Todos los derechos reservados. Colombia.</p>
          <div className="flex items-center gap-4">
            <span>Precios en Pesos Colombianos (COP)</span>
            <span aria-hidden="true">·</span>
            <button
              onClick={onOpenAdmin}
              className="text-white/60 hover:text-white underline underline-offset-4 transition-colors"
            >
              Acceso Administrativo
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
