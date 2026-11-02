import React from 'react';
import { ArrowRight, Sparkles, MessageCircle, ShieldCheck, Truck } from 'lucide-react';
import { BeautyImage } from './BeautyImage';

interface HeroBannerProps {
  onExploreClick: () => void;
  onOpenWhatsAppAdvice: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onExploreClick,
  onOpenWhatsAppAdvice,
}) => {
  return (
    <div className="relative bg-gradient-to-b from-[#FFFDF9] via-[#F7E5E9]/40 to-[#FFFDF9] border-b border-[#E8BFCB]/30 overflow-hidden">
      {/* Decorative subtle background ambient blush */}
      <div 
        className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-[#E8BFCB]/20 blur-3xl pointer-events-none" 
        aria-hidden="true"
      />
      <div 
        className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-[#F7E5E9]/60 blur-2xl pointer-events-none" 
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Clean editorial label - no badge pill */}
            <div className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-[#B9788B]">
              <span>Colección Exclusiva 2026</span>
              <span aria-hidden="true">·</span>
              <span>Belleza Consciente en Colombia</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif-brand font-semibold text-[#382A30] leading-[1.15] text-balance">
              Realza tu belleza natural con la delicadeza de <span className="text-[#B9788B] italic">Dulzara</span>.
            </h1>

            <p className="text-base sm:text-lg text-[#382A30]/80 font-sans leading-relaxed max-w-xl text-pretty">
              Fórmulas botánicas, pigmentos aterciopelados y cuidado de la piel creados para acompañar tu brillo diario. Ordena fácilmente y finaliza tu pedido de forma personalizada por WhatsApp.
            </p>

            {/* CTAs */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={onExploreClick}
                className="px-6 py-3.5 bg-[#B9788B] hover:bg-[#a6687a] text-white font-medium text-sm rounded-full transition-all shadow-sm hover:shadow-md active:scale-98 flex items-center gap-2"
              >
                <span>Explorar Catálogo</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenWhatsAppAdvice}
                className="px-6 py-3.5 bg-white hover:bg-[#F7E5E9]/60 text-[#382A30] border border-[#E8BFCB] font-medium text-sm rounded-full transition-all flex items-center gap-2 hover:border-[#B9788B]"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                <span>Asesoría por WhatsApp</span>
              </button>
            </div>

            {/* Micro Trust notes */}
            <div className="pt-4 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-[#382A30]/70">
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-[#B9788B]" />
                <span>Envíos a nivel nacional</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#B9788B]" />
                <span>Productos 100% Originales</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#B9788B]" />
                <span>Precios claros en Pesos COP</span>
              </div>
            </div>
          </div>

          {/* Right Visual Column */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Main Visual Frame */}
              <div className="relative rounded-3xl overflow-hidden shadow-lg border-2 border-white bg-white">
                <BeautyImage
                  src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80"
                  alt="Colección Dulzara Maquillaje y Cuidado Facial"
                  className="w-full h-80 sm:h-96 object-cover"
                />

                {/* Editorial Floating Inset */}
                <div className="absolute bottom-4 left-4 right-4 bg-[#FFFDF9]/95 backdrop-blur-md rounded-2xl p-4 border border-[#E8BFCB]/50 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-[#B9788B] font-semibold">
                        Favorito Dulzara
                      </p>
                      <p className="text-sm font-serif-brand font-medium text-[#382A30]">
                        Rutina Glow & Velvet
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-[#382A30] tabular-nums">
                      $ 58.000 COP
                    </span>
                  </div>
                </div>
              </div>

              {/* Decorative side accent card */}
              <div className="hidden sm:block absolute -top-4 -right-4 bg-white/90 backdrop-blur-md border border-[#E8BFCB] rounded-2xl px-4 py-2.5 shadow-sm text-xs text-[#382A30]">
                <span className="font-semibold text-[#B9788B]">100% Original</span> · Calidad Premium
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
