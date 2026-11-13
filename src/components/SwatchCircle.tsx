import React from 'react';
import { ShadeFinish } from '../types/store';

interface SwatchCircleProps {
  colorHex: string;
  finish?: ShadeFinish | string;
  name?: string;
  stock?: number;
  isSelected?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}

export const SwatchCircle: React.FC<SwatchCircleProps> = ({
  colorHex,
  finish = 'matte',
  name,
  stock = 1,
  isSelected = false,
  size = 'md',
  onClick,
  className = '',
}) => {
  const isOutOfStock = stock <= 0;

  const sizeClasses = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4 sm:w-4.5 sm:h-4.5',
    md: 'w-5.5 h-5.5 sm:w-6 sm:h-6',
    lg: 'w-8 h-8 sm:w-9 sm:h-9',
  }[size];

  const glossyHighlightClasses =
    size === 'xs' || size === 'sm'
      ? "after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-1.5 after:h-[3px] after:bg-white/80 after:rounded-full after:-rotate-45 after:pointer-events-none"
      : "after:content-[''] after:absolute after:top-1 after:left-1 after:w-2 after:h-1 after:bg-white/75 after:rounded-full after:-rotate-45 after:pointer-events-none";

  const finishClasses =
    finish === 'glossy'
      ? `shadow-inner ring-1 ring-inset ring-black/15 ${glossyHighlightClasses}`
      : finish === 'shimmer'
      ? 'shadow-inner ring-1 ring-inset ring-white/50 bg-gradient-to-tr from-black/10 via-white/35 to-white/75'
      : 'shadow-[inset_0_1px_2px_rgba(0,0,0,0.14)] ring-1 ring-inset ring-black/12'; // matte

  const interactiveClasses = onClick
    ? 'cursor-pointer transition-transform duration-150 hover:scale-110 active:scale-95 focus:outline-none'
    : 'pointer-events-none';

  const selectedRingClasses = isSelected
    ? 'ring-2 ring-[#B9788B] ring-offset-1 ring-offset-white scale-110 shadow-2xs'
    : 'hover:ring-1 hover:ring-[#B9788B]/70 hover:ring-offset-1 hover:ring-offset-white';

  const content = (
    <>
      {/* Base solid color layer */}
      <span
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: colorHex || '#E8BFCB' }}
      />

      {/* Finish texture overlay */}
      <span className={`absolute inset-0 rounded-full ${finishClasses}`} />

      {/* Extra central sparkle highlight for shimmer finish */}
      {finish === 'shimmer' && (
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.75)_0%,rgba(255,255,255,0.15)_45%,transparent_70%)] pointer-events-none flex items-center justify-center"
        >
          {size !== 'xs' && size !== 'sm' && (
            <span className="text-[8px] leading-none text-white/90 drop-shadow-2xs select-none">
              ✦
            </span>
          )}
        </span>
      )}

      {/* Out of stock diagonal line */}
      {isOutOfStock && (
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <span className="w-full h-[1.5px] bg-[#382A30]/80 -rotate-45 block shadow-[0_0_1px_#fff]" />
        </span>
      )}
    </>
  );

  const titleText = name
    ? `${name}${isOutOfStock ? ' (Agotado)' : ''}`
    : undefined;

  if (!onClick) {
    return (
      <span
        title={titleText}
        aria-label={titleText}
        className={`relative inline-block rounded-full overflow-hidden shrink-0 ${sizeClasses} ${
          isOutOfStock ? 'opacity-35' : ''
        } ${className}`}
      >
        {content}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title={titleText}
      aria-label={titleText}
      aria-pressed={isSelected}
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 ${sizeClasses} ${interactiveClasses} ${selectedRingClasses} ${
        isOutOfStock ? 'opacity-35' : ''
      } ${className}`}
    >
      {content}
    </button>
  );
};
