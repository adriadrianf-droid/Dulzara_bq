import React, { useRef, useState, useLayoutEffect, useEffect, useCallback } from 'react';
import { OFFICIAL_CATEGORIES } from '../types/store';

interface CategoryFilterProps {
  activeCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  totalProductsCount: number;
  categoryCounts: Record<string, number>;
  availableCategories?: string[];
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  activeCategory,
  onSelectCategory,
  totalProductsCount,
  categoryCounts,
  availableCategories,
}) => {
  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const [pillStyle, setPillStyle] = useState<{
    left: number;
    width: number;
    ready: boolean;
  }>({ left: 0, width: 0, ready: false });

  const nonEmptyCategories = (availableCategories || OFFICIAL_CATEGORIES).filter(
    (cat) => (categoryCounts[cat] || 0) > 0 || activeCategory === cat
  );

  const categories = [
    { id: null, label: 'Todo el Catálogo', count: totalProductsCount },
    ...nonEmptyCategories.map((cat) => ({
      id: cat,
      label: cat,
      count: categoryCounts[cat] || 0,
    })),
  ];

  const activeKey = activeCategory || 'all';

  const updatePillGeometry = useCallback(() => {
    const activeBtn = buttonRefs.current[activeKey];
    if (!activeBtn) return;
    setPillStyle({
      left: activeBtn.offsetLeft,
      width: activeBtn.offsetWidth,
      ready: true,
    });
  }, [activeKey]);

  useLayoutEffect(() => {
    updatePillGeometry();
  }, [updatePillGeometry, categories.length, totalProductsCount]);

  useEffect(() => {
    const handleResize = () => updatePillGeometry();
    window.addEventListener('resize', handleResize);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && trackRef.current) {
      observer = new ResizeObserver(() => updatePillGeometry());
      observer.observe(trackRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (observer) observer.disconnect();
    };
  }, [updatePillGeometry]);

  const handleCategorySelect = (categoryId: string | null) => {
    onSelectCategory(categoryId);

    // Smoothly center the selected capsule horizontally inside the filter scroll bar on mobile
    const key = categoryId || 'all';
    const btn = buttonRefs.current[key];
    const wrapper = scrollWrapperRef.current;
    if (btn && wrapper && wrapper.scrollWidth > wrapper.clientWidth) {
      const targetScrollLeft =
        btn.offsetLeft - wrapper.clientWidth / 2 + btn.offsetWidth / 2;
      wrapper.scrollTo({
        left: Math.max(0, targetScrollLeft),
        behavior: 'smooth',
      });
    }

    const gridEl = document.getElementById('grid-productos');
    if (gridEl) {
      const rect = gridEl.getBoundingClientRect();
      // If user has scrolled past the grid, smoothly bring start of grid into view
      if (rect.top < 80) {
        gridEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div ref={scrollWrapperRef} className="w-full overflow-x-auto no-scrollbar pb-1">
      <div
        ref={trackRef}
        className="relative flex items-center gap-1.5 sm:gap-2 p-1.5 bg-[#F7E5E9]/55 rounded-2xl border border-[#E8BFCB]/55 w-max sm:w-auto isolate"
      >
        {/* Smooth gliding active capsule */}
        <span
          aria-hidden="true"
          style={{
            transform: `translate3d(${pillStyle.left}px, 0, 0)`,
            width: `${pillStyle.width}px`,
          }}
          className={`pointer-events-none absolute top-1.5 bottom-1.5 left-0 rounded-xl bg-white border border-[#E8BFCB] shadow-[0_2px_10px_-2px_rgba(185,120,139,0.28)] will-change-[transform,width] ${
            pillStyle.ready
              ? 'transition-[transform,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] opacity-100'
              : 'opacity-0'
          }`}
        />

        {categories.map((cat) => {
          const key = cat.id || 'all';
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={key}
              ref={(el) => {
                buttonRefs.current[key] = el;
              }}
              type="button"
              onClick={() => handleCategorySelect(cat.id)}
              className={`relative z-10 px-3 sm:px-3.5 py-2 text-xs rounded-xl whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer select-none font-semibold transition-colors duration-300 ${
                isActive
                  ? `text-[#382A30] ${!pillStyle.ready ? 'bg-white shadow-xs border border-[#E8BFCB]' : ''}`
                  : 'text-[#382A30]/65 hover:text-[#382A30]'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[10px] tabular-nums transition-colors duration-300 ${
                  isActive ? 'text-[#B9788B] font-bold' : 'text-[#382A30]/45 font-medium'
                }`}
              >
                ({cat.count})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
