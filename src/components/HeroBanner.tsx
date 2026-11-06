import React from 'react';
import { Heart, MessageCircle, Truck, ShieldCheck, Sparkles } from 'lucide-react';
import { BeautyImage } from './BeautyImage';
import { StoreSettings } from '../types/store';

interface HeroBannerProps {
  onExploreClick: () => void;
  onOpenWhatsAppAdvice: () => void;
  settings?: StoreSettings;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onExploreClick,
  onOpenWhatsAppAdvice,
  settings,
}) => {
  const kicker = settings?.heroKicker || '✦ BIENVENIDA A TU LUGAR FELIZ';
  const rawTitle = settings?.heroTitle || 'Brilla a tu manera, nosotros ponemos la magia.';
  const subtitle =
    settings?.heroSubtitle ||
    'Maquillaje y cuidado personal elegido con amor para resaltar lo linda que eres. Arma tu bolsita a tu ritmo y pide fácil por WhatsApp.';
  const badgeText = settings?.heroBadgeText || 'Hecho con amor para ti 💕';
  let buttonText = settings?.heroButtonText || 'Explorar Catálogo ✦';
  if (buttonText.includes('favoritos') || buttonText === 'Explorar Catálogo') {
    buttonText = 'Explorar Catálogo ✦';
  }
  const imageUrl =
    settings?.heroImageUrl ||
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80';

  // Render title with "ponemos la magia" accented in #B9788B and italic if present
  const renderTitle = (title: string) => {
    const magicPhrase = 'ponemos la magia';
    const index = title.toLowerCase().indexOf(magicPhrase);
    if (index !== -1) {
      const before = title.substring(0, index);
      const match = title.substring(index, index + magicPhrase.length);
      const after = title.substring(index + magicPhrase.length);
      return (
        <>
          {before}
          <span className="text-[#B9788B] italic font-serif-brand font-normal">{match}</span>
          {after}
        </>
      );
    }
    return title;
  };

  return (
    <div className="relative bg-gradient-to-b from-[#FFFDF9] via-[#F7E5E9]/35 to-[#FFFDF9] border-b border-[#E8BFCB]/30 overflow-hidden">
      {/* Decorative ambient blush spots */}
      <div
        className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full bg-[#E8BFCB]/25 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-[#F7E5E9]/60 blur-2xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Subtle 4-pointed stars floating in background */}
      <span
        aria-hidden="true"
        className="select-none absolute top-10 left-[8%] text-[#B9788B]/20 text-3xl font-serif pointer-events-none animate-pulse"
      >
        ✦
      </span>
      <span
        aria-hidden="true"
        className="select-none absolute top-28 right-[12%] text-[#B9788B]/25 text-2xl font-serif pointer-events-none"
      >
        ✦
      </span>
      <span
        aria-hidden="true"
        className="select-none absolute bottom-12 left-[48%] text-[#B9788B]/15 text-xl font-serif pointer-events-none"
      >
        ✦
      </span>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Kicker: Delicada píldora con fondo #F7E5E9 */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F7E5E9] border border-[#E8BFCB]/60 shadow-xs">
              <span className="text-xs font-semibold tracking-wider uppercase text-[#382A30]">
                {kicker}
              </span>
            </div>

            {/* Main Title (H1) Playfair Display */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif-brand font-semibold text-[#382A30] leading-[1.15] text-balance">
              {renderTitle(rawTitle)}
            </h1>

            {/* Subtitle Plus Jakarta Sans */}
            <p className="text-base sm:text-lg text-[#382A30]/85 font-sans leading-relaxed max-w-xl text-pretty">
              {subtitle}
            </p>

            {/* CTAs */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onExploreClick}
                className="px-7 py-3.5 bg-[#B9788B] hover:bg-[#a6687a] text-white font-medium text-sm rounded-full transition-all shadow-sm hover:shadow-md active:scale-98 flex items-center gap-2 cursor-pointer"
              >
                <span>{buttonText}</span>
              </button>

              <button
                type="button"
                onClick={onOpenWhatsAppAdvice}
                className="px-6 py-3.5 bg-white hover:bg-[#F7E5E9]/60 text-[#382A30] border border-[#E8BFCB] font-medium text-sm rounded-full transition-all flex items-center gap-2 hover:border-[#B9788B] cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                <span>Asesoría por WhatsApp</span>
              </button>
            </div>

            {/* Micro Trust notes */}
            <div className="pt-4 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-[#382A30]/75">
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
              <div className="relative rounded-3xl overflow-hidden shadow-lg border-2 border-white bg-white group">
                <BeautyImage
                  src={imageUrl}
                  alt="Dulzara Belleza y Cuidado Personal"
                  className="w-full h-80 sm:h-96 md:h-[420px] object-cover transition-transform duration-700 ease-out group-hover:scale-102"
                />

                {/* Única etiqueta flotante delicada y limpia en una esquina con icono de corazón */}
                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md rounded-full px-4 py-2 border border-[#E8BFCB] shadow-md flex items-center gap-2 text-xs font-semibold text-[#382A30]">
                  <Heart className="w-4 h-4 text-[#B9788B] fill-[#B9788B]" />
                  <span>{badgeText}</span>
                </div>
              </div>

              {/* Sutil destello de 4 puntas de marca cerca a la foto */}
              <div
                aria-hidden="true"
                className="hidden sm:flex absolute -top-3 -right-3 w-8 h-8 rounded-full bg-[#F7E5E9] border border-[#E8BFCB] items-center justify-center text-[#B9788B] text-base font-serif shadow-xs"
              >
                ✦
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
