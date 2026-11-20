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

  // Render title with "ponemos la magia" styled naturally, cute & delicate
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
          <span className="relative inline-block text-[#B9788B] italic font-serif-brand font-normal">
            {match}
            {/* Subtle, dainty hand-drawn blush curve */}
            <svg
              aria-hidden="true"
              viewBox="0 0 220 10"
              fill="none"
              preserveAspectRatio="none"
              className="absolute -bottom-0.5 sm:-bottom-1 left-0 w-full h-1.5 sm:h-2 pointer-events-none overflow-visible"
            >
              <path
                d="M4 7.5C65 2.5 155 2.5 216 7"
                stroke="#E8BFCB"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
          </span>
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

      {/* Balanced vertical spacing for mobile, tablet, and all computer viewports */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-9 md:py-11 lg:py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-7 md:gap-7 lg:gap-12 items-center">
          
          {/* Left Text Column */}
          <div className="md:col-span-6 lg:col-span-7 space-y-3.5 sm:space-y-4 lg:space-y-5">
            
            {/* Warm, unique & delicate welcome signature — soft blush aura fade, harmonious typography & twin pastel hearts */}
            <div className="relative inline-flex items-center gap-2 sm:gap-2.5 py-1.5 pl-3 pr-6 -ml-1 rounded-l-full bg-gradient-to-r from-[#F7E5E9]/95 via-[#F7E5E9]/50 to-transparent select-none">
              {/* Dainty left rose sparkle with warm halo dot */}
              <span
                aria-hidden="true"
                className="inline-flex items-center justify-center text-[#B9788B] text-xs sm:text-sm md:text-base font-serif leading-none shrink-0"
              >
                ✦
              </span>

              <span className="inline-flex flex-wrap items-baseline gap-x-1.5 text-[13.5px] sm:text-[15px] md:text-base lg:text-[17.5px] leading-snug">
                {kicker.toLowerCase().includes('lugar feliz') ? (
                  <span className="inline-flex items-baseline gap-1.5">
                    <span className="font-sans font-medium text-[#5A3E47] tracking-[0.01em]">
                      Bienvenida a
                    </span>
                    <span className="relative inline-block font-serif-brand italic font-semibold bg-gradient-to-r from-[#B9788B] via-[#9E566C] to-[#B9788B] bg-clip-text text-transparent text-[15px] sm:text-[17px] md:text-[18.5px] lg:text-[20px]">
                      tu lugar feliz
                      {/* Delicate pearl-tipped rose whisper curve */}
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 130 8"
                        fill="none"
                        preserveAspectRatio="none"
                        className="absolute -bottom-1 left-0 w-full h-1.5 pointer-events-none overflow-visible"
                      >
                        <path
                          d="M3 5.5C38 2 92 2 124 5"
                          stroke="#E8BFCB"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                        <circle cx="127" cy="4.8" r="1.3" fill="#B9788B" opacity="0.65" />
                      </svg>
                    </span>
                  </span>
                ) : (
                  <span className="font-serif-brand italic font-medium text-[#B9788B]">
                    {kicker.replace(/^✦\s*/, '').trim()}
                  </span>
                )}

                {/* Charming twin pastel hearts (main heart + tiny tilted floating companion heart) */}
                <span
                  aria-hidden="true"
                  className="inline-flex items-center self-center ml-0.5 shrink-0"
                >
                  <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-[17px] lg:h-[17px] text-[#B9788B] fill-[#E8BFCB] -rotate-6" />
                  <Heart className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-[#B9788B]/80 fill-[#F7E5E9] -ml-0.5 -translate-y-1.5 rotate-12" />
                </span>
              </span>
            </div>

            {/* Main Title (H1) Playfair Display — scales smoothly across mobile, tablet, and computer */}
            <h1 className="text-[28px] min-[390px]:text-[32px] sm:text-4xl md:text-[32px] lg:text-5xl xl:text-[54px] font-serif-brand font-semibold text-[#382A30] leading-[1.13] tracking-[-0.015em] text-balance">
              {renderTitle(rawTitle)}
            </h1>

            {/* Subtitle Plus Jakarta Sans */}
            <p className="text-[13.5px] sm:text-base md:text-[14.5px] lg:text-lg text-[#382A30]/80 font-sans leading-[1.6] max-w-xl text-pretty">
              {subtitle}
            </p>

            {/* Compact CTAs — single-line aligned on tablets */}
            <div className="pt-1 sm:pt-2 flex flex-wrap sm:flex-nowrap lg:flex-wrap items-center gap-2.5 sm:gap-3 md:gap-2.5 lg:gap-3.5">
              <button
                type="button"
                onClick={onExploreClick}
                className="px-5 sm:px-6 md:px-4.5 lg:px-7 py-2.5 sm:py-3 md:py-2.5 lg:py-3.5 bg-[#B9788B] hover:bg-[#a6687a] text-white font-semibold text-xs sm:text-sm md:text-[13px] lg:text-sm rounded-full transition-all shadow-sm hover:shadow-md active:scale-98 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>{buttonText}</span>
              </button>

              <button
                type="button"
                onClick={onOpenWhatsAppAdvice}
                className="px-4 sm:px-5 md:px-4 lg:px-6 py-2.5 sm:py-3 md:py-2.5 lg:py-3.5 bg-white/95 hover:bg-[#F7E5E9]/60 text-[#382A30] border border-[#E8BFCB] font-medium text-xs sm:text-sm md:text-[13px] lg:text-sm rounded-full transition-all flex items-center gap-1.5 sm:gap-2 hover:border-[#B9788B] whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
              >
                <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#25D366] shrink-0" />
                <span>Asesoría por WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Right Visual Column — exact original compact size on mobile, full aligned width on sm tablet, balanced 50% on md tablet, 5-col on lg+ desktop */}
          <div className="md:col-span-6 lg:col-span-5">
            <div className="relative mx-auto max-w-md sm:max-w-none">
              
              {/* Main Visual Frame */}
              <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-md sm:shadow-lg border-2 border-white ring-1 ring-[#E8BFCB]/40 bg-white group">
                <BeautyImage
                  src={imageUrl}
                  alt="Dulzara Belleza y Cuidado Personal"
                  priority={true}
                  className="w-full h-48 sm:h-72 md:h-[320px] lg:h-[390px] xl:h-[410px] object-cover object-center transition-transform duration-700 ease-out group-hover:scale-102"
                />

                {/* Única etiqueta flotante delicada y limpia en una esquina con icono de corazón */}
                {!isBadgeHidden && (
                  <div
                    className={`absolute bottom-2.5 left-2.5 sm:bottom-3.5 sm:left-3.5 lg:bottom-4 lg:left-4 bg-white/95 backdrop-blur-md rounded-full ${
                      badgeText ? 'px-3 sm:px-3.5 lg:px-4 py-1.5 sm:py-1.5 lg:py-2 gap-1.5 sm:gap-2' : 'p-2 sm:p-2.5'
                    } border border-[#E8BFCB] shadow-md flex items-center text-[11px] sm:text-xs font-semibold text-[#382A30] max-w-[calc(100%-20px)]`}
                  >
                    <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#B9788B] fill-[#B9788B] shrink-0" />
                    {badgeText ? <span className="truncate">{badgeText}</span> : null}
                  </div>
                )}
              </div>

              {/* Sutil destello de 4 puntas de marca cerca a la foto */}
              <div
                aria-hidden="true"
                className="hidden sm:flex absolute -top-2.5 right-2 md:-top-3 md:-right-2.5 lg:-top-3 lg:-right-3 w-8 h-8 rounded-full bg-[#F7E5E9] border border-[#E8BFCB] items-center justify-center text-[#B9788B] text-base font-serif shadow-xs z-10"
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
