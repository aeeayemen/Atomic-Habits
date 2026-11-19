import React from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Calendar,
  Sparkles,
  PlusCircle,
  Archive,
} from 'lucide-react';
import type { DayColumn, Habit, HabitLog, HabitStatus } from '../types/habit';
import { HabitRow } from './HabitRow';
import { cn } from '../lib/utils';

interface HabitGridProps {
  habits: Habit[];
  days: DayColumn[];
  allLogs: Record<string, HabitLog>;
  onToggleLog: (habitId: string, date: string, status: HabitStatus) => void;
  onOpenDetail: (habit: Habit) => void;
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (habitId: string) => void;
  onAddNewHabit: () => void;
  onOpenReflection?: (habit: Habit, date: string) => void;
  onArchiveHabit?: (habitId: string) => void;
  onRestoreHabit?: (habitId: string) => void;
  isArchivedView?: boolean;
  viewMode: 'week' | 'rolling';
  onChangeViewMode: (mode: 'week' | 'rolling') => void;
  onPrevPeriod: () => void;
  onNextPeriod: () => void;
  onResetToToday: () => void;
  onMarkAllTodayDone: () => void;
}

export const HabitGrid: React.FC<HabitGridProps> = ({
  habits,
  days,
  allLogs,
  onToggleLog,
  onOpenDetail,
  onEditHabit,
  onDeleteHabit,
  onAddNewHabit,
  onOpenReflection,
  onArchiveHabit,
  onRestoreHabit,
  isArchivedView = false,
  viewMode,
  onChangeViewMode,
  onPrevPeriod,
  onNextPeriod,
  onResetToToday,
  onMarkAllTodayDone,
}) => {
  return (
    <div className="space-y-4">
      {/* شريط أدوات التنقل بين الفترات والخيارات */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white dark:bg-[#1C4D8D] rounded-xl border border-slate-200/80 dark:border-[#2A5C9E] shadow-2xs">
        {/* أزرار التنقل الزمني */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onPrevPeriod}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-[#2A5C9E] hover:bg-slate-100 dark:hover:bg-[#2A5C9E]/50 text-slate-600 dark:text-[#F8FAFC] transition-colors cursor-pointer"
            title="الفترة السابقة"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={onResetToToday}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#2A5C9E] hover:bg-slate-100 dark:hover:bg-[#2A5C9E]/50 text-xs font-bold text-slate-700 dark:text-[#F8FAFC] transition-colors cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-[#00A896] dark:text-[#02C39A]" />
            اليوم
          </button>

          <button
            onClick={onNextPeriod}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-[#2A5C9E] hover:bg-slate-100 dark:hover:bg-[#2A5C9E]/50 text-slate-600 dark:text-[#F8FAFC] transition-colors cursor-pointer"
            title="الفترة التالية"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-bold text-slate-600 dark:text-[#94A3B8] mr-2 hidden sm:inline-block">
            {days[0]?.fullDateLabel} — {days[days.length - 1]?.fullDateLabel}
          </span>
        </div>

        {/* خيارات العرض وإجراءات سريعة */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* إتمام جميع مهام اليوم */}
          <button
            onClick={onMarkAllTodayDone}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00A896]/15 hover:bg-[#00A896]/25 text-[#00A896] dark:text-[#02C39A] border border-[#00A896]/30 text-xs font-bold transition-colors cursor-pointer"
            title="تحديد كل عادات اليوم كمنجزة بنجاح"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>إنجاز كل مهام اليوم</span>
          </button>

          {/* تبديل وضع العرض */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-[#0F2854] border border-slate-200 dark:border-[#2A5C9E] text-xs">
            <button
              onClick={() => onChangeViewMode('week')}
              className={cn(
                'px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer',
                viewMode === 'week'
                  ? 'bg-white dark:bg-[#1C4D8D] text-[#00A896] dark:text-[#02C39A] shadow-2xs'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-[#F8FAFC]'
              )}
            >
              عرض 7 أيام
            </button>
            <button
              onClick={() => onChangeViewMode('rolling')}
              className={cn(
                'px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer',
                viewMode === 'rolling'
                  ? 'bg-white dark:bg-[#1C4D8D] text-[#00A896] dark:text-[#02C39A] shadow-2xs'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-[#F8FAFC]'
              )}
            >
              عرض 14 يوماً
            </button>
          </div>
        </div>
      </div>

      {/* ترويسة الجدول لأيام الأسبوع */}
      <div className="hidden md:flex items-center justify-between gap-4 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
        <div className="min-w-[280px] max-w-sm">العادة وبصمة الهوية الذاتية</div>
        <div className="flex items-center gap-2 justify-center flex-1">
          {days.map((day) => (
            <div
              key={day.date}
              className={cn(
                'flex flex-col items-center justify-center transition-colors',
                viewMode === 'rolling' ? 'w-8' : 'w-10',
                day.isToday && 'text-[#00A896] dark:text-[#02C39A] font-black'
              )}
            >
              <span className="text-[11px] font-bold">{day.dayOfWeek}</span>
              <span
                className={cn(
                  'text-xs mt-0.5 font-bold',
                  day.isToday &&
                    'px-1.5 py-0.5 rounded-full bg-[#00A896]/20 text-[#00A896] dark:text-[#02C39A] font-black'
                )}
              >
                {day.dayOfMonth}
              </span>
            </div>
          ))}
        </div>
        <div className="min-w-[200px] text-left">السلاسل والإحصائيات</div>
      </div>

      {/* قائمة العادات */}
      <div className="space-y-3">
        {habits.length > 0 ? (
          habits.map((habit, idx) => (
            <div key={habit.id} data-tour={idx === 0 ? 'tour-first-habit' : undefined}>
              <HabitRow
                habit={habit}
                days={days}
                allLogs={allLogs}
                onToggleLog={onToggleLog}
                onOpenDetail={onOpenDetail}
                onEditHabit={onEditHabit}
                onDeleteHabit={onDeleteHabit}
                onOpenReflection={onOpenReflection}
                onArchiveHabit={onArchiveHabit}
                onRestoreHabit={onRestoreHabit}
                viewMode={viewMode}
              />
            </div>
          ))
        ) : isArchivedView ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-[#2A5C9E] bg-white/50 dark:bg-[#1C4D8D]/40">
            <Archive className="w-12 h-12 text-[#F39C12] mb-3 opacity-80" />
            <h3 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">
              لا توجد عادات مؤرشفة حالياً
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 max-w-sm mt-1">
              جميع عاداتك نشطة وتظهر في لوحة المتابعة اليومية. يمكنك أرشفة أي عادة في أي وقت لتنظيف شاشتك دون فقدان سجلاتها السابقة.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-[#2A5C9E] bg-white/50 dark:bg-[#1C4D8D]/40">
            <Sparkles className="w-10 h-10 text-[#00A896] mb-3 opacity-80" />
            <h3 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">
              لم يتم العثور على عادات مطابقة لهذا الفلتر
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 max-w-sm mt-1 mb-5">
              "أنت لا ترتقي إلى مستوى أهدافك، بل تهبط إلى مستوى أنظمتك."
              — جيمس كلير
            </p>
            <button
              onClick={onAddNewHabit}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00A896] to-[#02C39A] hover:opacity-95 text-white font-bold text-xs shadow-md shadow-[#00A896]/20 transition-all hover:scale-105 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              ابدأ بناء عادتك الأولى الآن
            </button>
          </div>
        )}
      </div>

      {/* دليل الحالات السفلي */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5 text-xs text-slate-700 dark:text-slate-300 border-t border-slate-200/60 dark:border-[#2A5C9E]">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-bold text-slate-800 dark:text-[#F8FAFC]">دليل الحالات:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#00A896]/25 border border-[#00A896] inline-block" />
            <span>منجز بنجاح ✅</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-rose-500/20 border border-rose-500/60 inline-block" />
            <span>مفوّت / لم يُنجز ❌</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-slate-200 dark:bg-[#0F2854] border border-slate-300 dark:border-[#2A5C9E] inline-block" />
            <span>قيد الانتظار / محايد ⏳</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-600 dark:text-slate-400">
          ملاحظة: اضغط على المربع للتبديل السريع بين الحالات، أو اضغط زر الفأرة الأيمن للتفويت المباشر.
        </div>
      </div>
    </div>
  );
};
