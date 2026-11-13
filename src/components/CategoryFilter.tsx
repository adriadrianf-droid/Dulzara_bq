import React from 'react';
import { OFFICIAL_CATEGORIES } from '../types/store';

interface CategoryFilterProps {
  activeCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  totalProductsCount: number;
  categoryCounts: Record<string, number>;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  activeCategory,
  onSelectCategory,
  totalProductsCount,
  categoryCounts,
}) => {
  const categories = [
    { id: null, label: 'Todo el Catálogo', count: totalProductsCount },
    ...OFFICIAL_CATEGORIES.map((cat) => ({
      id: cat,
      label: cat,
      count: categoryCounts[cat] || 0,
    })),
  ];

  const handleCategorySelect = (categoryId: string | null) => {
    onSelectCategory(categoryId);
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
    <div className="w-full overflow-x-auto no-scrollbar pb-1">
      <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 bg-[#F7E5E9]/55 rounded-2xl border border-[#E8BFCB]/55 w-max sm:w-auto">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id || 'all'}
              onClick={() => handleCategorySelect(cat.id)}
              className={`px-3 sm:px-3.5 py-2 text-xs rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-white text-[#382A30] shadow-xs font-semibold border border-[#E8BFCB]'
                  : 'text-[#382A30]/72 font-medium hover:text-[#382A30] hover:bg-white/60'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[10px] tabular-nums ${
                  isActive ? 'text-[#B9788B] font-bold' : 'text-[#382A30]/45'
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
