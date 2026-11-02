import React from 'react';

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
    { id: 'skincare', label: 'Cuidado Facial', count: categoryCounts['skincare'] || 0 },
    { id: 'maquillaje', label: 'Maquillaje', count: categoryCounts['maquillaje'] || 0 },
    { id: 'labios', label: 'Labios', count: categoryCounts['labios'] || 0 },
    { id: 'ojos', label: 'Ojos', count: categoryCounts['ojos'] || 0 },
    { id: 'cuidado-corporal', label: 'Corporal', count: categoryCounts['cuidado-corporal'] || 0 },
    { id: 'accesorios', label: 'Accesorios', count: categoryCounts['accesorios'] || 0 },
  ];

  return (
    <div className="w-full overflow-x-auto scrollbar-none pb-2">
      <div className="flex items-center gap-2 p-1.5 bg-[#F7E5E9]/50 rounded-2xl border border-[#E8BFCB]/50 w-max sm:w-auto">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id || 'all'}
              onClick={() => onSelectCategory(cat.id)}
              className={`px-3.5 py-2 text-xs font-medium rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                isActive
                  ? 'bg-white text-[#382A30] shadow-sm font-semibold border border-[#E8BFCB]'
                  : 'text-[#382A30]/70 hover:text-[#382A30] hover:bg-white/60'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[10px] tabular-nums ${
                  isActive ? 'text-[#B9788B] font-bold' : 'text-[#382A30]/50'
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
