import React, { useState } from 'react';
import { Sparkles, Heart, Droplets, Eye, Smile, Package } from 'lucide-react';

interface BeautyImageProps {
  src: string;
  alt: string;
  className?: string;
  category?: string;
  aspectRatio?: 'square' | 'wide' | 'portrait';
}

export const BeautyImage: React.FC<BeautyImageProps> = ({
  src,
  alt,
  className = '',
  category,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Pick an icon based on category
  const renderCategoryIcon = () => {
    switch (category) {
      case 'Skincare y Cuidado':
      case 'skincare':
      case 'cuidado-corporal':
        return <Droplets className="w-8 h-8 text-[#B9788B]/70" />;
      case 'Labios':
      case 'labios':
        return <Heart className="w-8 h-8 text-[#B9788B]/70" />;
      case 'Ojos y Cejas':
      case 'ojos':
        return <Eye className="w-8 h-8 text-[#B9788B]/70" />;
      case 'Rostro':
      case 'maquillaje':
        return <Sparkles className="w-8 h-8 text-[#B9788B]/70" />;
      case 'Kits y Accesorios':
      case 'accesorios':
        return <Package className="w-8 h-8 text-[#B9788B]/70" />;
      default:
        return <Package className="w-8 h-8 text-[#B9788B]/70" />;
    }
  };

  return (
    <div className={`relative overflow-hidden bg-[#F7E5E9]/50 flex items-center justify-center ${className}`}>
      {/* Resilient Fallback Container (Zero-Broken-Image compliance) */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center p-4 text-center transition-opacity duration-300 ${
          hasError || !isLoaded ? 'opacity-100 z-0' : 'opacity-0 -z-10'
        }`}
        style={{
          background: 'radial-gradient(circle at 50% 40%, #FFFDF9 0%, #F7E5E9 70%, #E8BFCB 100%)',
        }}
      >
        <div className="w-16 h-16 rounded-full bg-white/80 shadow-sm flex items-center justify-center mb-2 border border-[#E8BFCB]/50">
          {renderCategoryIcon()}
        </div>
        <span className="text-[11px] uppercase tracking-wider text-[#B9788B] font-semibold">
          DULZARA BEAUTY
        </span>
        <span className="text-xs text-[#382A30]/80 font-serif-brand italic line-clamp-1 mt-0.5 max-w-[85%]">
          {alt}
        </span>
      </div>

      {/* Actual Image */}
      {!hasError && (
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
};
