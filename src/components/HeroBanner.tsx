import React from 'react';
import { Heart, MessageCircle } from 'lucide-react';
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
  const rawBadge = settings?.heroBadgeText;
  const isBadgeHidden = rawBadge?.trim() === '.';
  const badgeText = rawBadge !== undefined ? rawBadge.trim() : 'Hecho con amor para ti 💕';
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
        className="select-none absolute top-6 left-[8%] text-[#B9788B]/20 text-2xl sm:text-3xl font-serif pointer-events-none animate-pulse"
      >
        ✦
      </span>
      <span
        aria-hidden="true"
        className="select-none absolute top-16 right-[10%] text-[#B9788B]/25 text-xl sm:text-2xl font-serif pointer-events-none"
      >
        ✦
      </span>
      <span
        aria-hidden="true"
        className="select-none absolute bottom-8 left-[45%] text-[#B9788B]/15 text-lg sm:text-xl font-serif pointer-events-none"
      >
        ✦
      </span>

      {/* Balanced vertical spacing for mobile and all computer viewports */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 md:py-12 lg:py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 md:gap-7 lg:gap-12 items-center">
          
          {/* Left Text Column */}
          <div className="md:col-span-7 space-y-3.5 sm:space-y-4 lg:space-y-5">
            
            {/* Kicker: Delicada píldora con fondo #F7E5E9 */}
            <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-[#F7E5E9] border border-[#E8BFCB]/60 shadow-2xs">
              <span className="text-[10.5px] sm:text-xs font-semibold tracking-[0.08em] uppercase text-[#382A30]">
                {kicker}
              </span>
            </div>

            {/* Main Title (H1) Playfair Display — scales smoothly per computer resolution */}
            <h1 className="text-[28px] min-[390px]:text-[32px] sm:text-4xl md:text-[36px] lg:text-5xl xl:text-[54px] font-serif-brand font-semibold text-[#382A30] leading-[1.13] tracking-[-0.015em] text-balance">
              {renderTitle(rawTitle)}
            </h1>

            {/* Subtitle Plus Jakarta Sans */}
            <p className="text-[13.5px] sm:text-base md:text-[15px] lg:text-lg text-[#382A30]/80 font-sans leading-[1.6] max-w-xl text-pretty">
              {subtitle}
            </p>

            {/* Compact CTAs */}
            <div className="pt-1 sm:pt-2 flex flex-wrap items-center gap-2.5 sm:gap-3.5">
              <button
                type="button"
                onClick={onExploreClick}
                className="px-5 sm:px-6 lg:px-7 py-2.5 sm:py-3 lg:py-3.5 bg-[#B9788B] hover:bg-[#a6687a] text-white font-semibold text-xs sm:text-sm rounded-full transition-all shadow-sm hover:shadow-md active:scale-98 flex items-center gap-1.5 sm:gap-2 cursor-pointer"
              >
                <span>{buttonText}</span>
              </button>

              <button
                type="button"
                onClick={onOpenWhatsAppAdvice}
                className="px-4 sm:px-5 lg:px-6 py-2.5 sm:py-3 lg:py-3.5 bg-white/95 hover:bg-[#F7E5E9]/60 text-[#382A30] border border-[#E8BFCB] font-medium text-xs sm:text-sm rounded-full transition-all flex items-center gap-1.5 sm:gap-2 hover:border-[#B9788B] cursor-pointer shadow-2xs"
              >
                <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#25D366]" />
                <span>Asesoría por WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Right Visual Column — exact original compact size on mobile, side-by-side adaptive on computers (md+) */}
          <div className="md:col-span-5">
            <div className="relative mx-auto max-w-md md:max-w-none">
              
              {/* Main Visual Frame */}
              <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-md sm:shadow-lg border-2 border-white ring-1 ring-[#E8BFCB]/40 bg-white group">
                <BeautyImage
                  src={imageUrl}
                  alt="Dulzara Belleza y Cuidado Personal"
                  priority={true}
                  className="w-full h-48 sm:h-60 md:h-auto md:aspect-[4/3.9] lg:aspect-auto lg:h-[390px] xl:h-[410px] object-cover object-center transition-transform duration-700 ease-out group-hover:scale-102"
                />

                {/* Única etiqueta flotante delicada y limpia en una esquina con icono de corazón */}
                {!isBadgeHidden && (
                  <div
                    className={`absolute bottom-2.5 left-2.5 sm:bottom-4 sm:left-4 bg-white/95 backdrop-blur-md rounded-full ${
                      badgeText ? 'px-3 sm:px-4 py-1.5 sm:py-2 gap-1.5 sm:gap-2' : 'p-2 sm:p-2.5'
                    } border border-[#E8BFCB] shadow-md flex items-center text-[11px] sm:text-xs font-semibold text-[#382A30]`}
                  >
                    <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#B9788B] fill-[#B9788B]" />
                    {badgeText ? <span>{badgeText}</span> : null}
                  </div>
                )}
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
