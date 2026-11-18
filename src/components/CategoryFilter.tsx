import React from 'react';
import { Search, Zap, Shield } from 'lucide-react';
import type { HabitCategory, HabitType } from '../types/habit';
import { CATEGORIES_META, cn } from '../lib/utils';

interface CategoryFilterProps {
  selectedCategory: HabitCategory | 'all';
  onSelectCategory: (cat: HabitCategory | 'all') => void;
  selectedType?: HabitType | 'all';
  onSelectType?: (type: HabitType | 'all') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalHabitsCount: number;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  selectedType = 'all',
  onSelectType,
  searchQuery,
  onSearchChange,
  totalHabitsCount,
}) => {
  const categories = Object.values(CATEGORIES_META);

  return (
    <div className="flex flex-col gap-3">
      {/* الصف الأول: شريط البحث وتصفية نوع العادة (بناء / إقلاع) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* حقل البحث */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-[#94A3B8] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ابحث في العادات أو عبارات الهوية..."
            className="w-full pr-9 pl-3 py-2 text-xs rounded-xl bg-white dark:bg-[#1C4D8D] border border-slate-200 dark:border-[#2A5C9E] focus:outline-none focus:ring-2 focus:ring-[#00A896]/30 focus:border-[#00A896] transition-all text-slate-900 dark:text-[#F8FAFC] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8]"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-[#94A3B8] hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              مسح
            </button>
          )}
        </div>

        {/* أزرار تصفية النوع: كل الأهداف / بناء إيجابي ⚡ / إقلاع عن عادة 🛡️ */}
        {onSelectType && (
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#1C4D8D]/60 border border-slate-200/80 dark:border-[#2A5C9E]">
            <button
              onClick={() => onSelectType('all')}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer',
                selectedType === 'all'
                  ? 'bg-white dark:bg-[#0F2854] text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-[#94A3B8] hover:text-slate-800 dark:hover:text-white'
              )}
            >
              جميع العادات
            </button>

            <button
              onClick={() => onSelectType('build')}
              className={cn(
                'flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer',
                selectedType === 'build'
                  ? 'bg-[#00A896] text-white shadow-2xs'
                  : 'text-slate-500 dark:text-[#94A3B8] hover:text-[#00A896]'
              )}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>بناء عادة ⚡</span>
            </button>

            <button
              onClick={() => onSelectType('break')}
              className={cn(
                'flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer',
                selectedType === 'break'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'text-slate-500 dark:text-[#94A3B8] hover:text-amber-500'
              )}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>إقلاع عن عادة 🛡️</span>
            </button>
          </div>
        )}
      </div>

      {/* الصف الثاني: أزرار تصفية التصنيفات */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
        <button
          onClick={() => onSelectCategory('all')}
          className={cn(
            'px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border cursor-pointer',
            selectedCategory === 'all'
              ? 'bg-[#00A896] text-white border-transparent shadow-xs'
              : 'bg-white dark:bg-[#1C4D8D] text-slate-600 dark:text-[#F8FAFC] border-slate-200 dark:border-[#2A5C9E] hover:border-[#00A896] dark:hover:border-[#00A896]'
          )}
        >
          الكل ({totalHabitsCount})
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border cursor-pointer',
              selectedCategory === cat.id
                ? 'bg-[#00A896] text-white border-transparent shadow-xs'
                : 'bg-white dark:bg-[#1C4D8D] text-slate-600 dark:text-[#F8FAFC] border-slate-200 dark:border-[#2A5C9E] hover:border-[#00A896] dark:hover:border-[#00A896]'
            )}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: cat.color }}
            />
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
};
