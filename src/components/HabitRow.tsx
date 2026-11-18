import React from 'react';
import {
  Flame,
  Award,
  AlertTriangle,
  ChevronLeft,
  MoreVertical,
  Zap,
  CheckCircle2,
  Trash2,
  Shield,
  ShieldCheck,
} from 'lucide-react';
import type { DayColumn, Habit, HabitLog, HabitStatus } from '../types/habit';
import { calculateStreakStats } from '../lib/streak';
import { CATEGORIES_META, cn } from '../lib/utils';
import { DayCell } from './DayCell';

interface HabitRowProps {
  habit: Habit;
  days: DayColumn[];
  allLogs: Record<string, HabitLog>;
  onToggleLog: (habitId: string, date: string, status: HabitStatus) => void;
  onOpenDetail: (habit: Habit) => void;
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (habitId: string) => void;
  onOpenReflection?: (habit: Habit, date: string) => void;
  viewMode: 'week' | 'rolling';
}

export const HabitRow: React.FC<HabitRowProps> = ({
  habit,
  days,
  allLogs,
  onToggleLog,
  onOpenDetail,
  onEditHabit,
  onDeleteHabit,
  onOpenReflection,
  viewMode,
}) => {
  const isBreakHabit = habit.type === 'break';
  const stats = calculateStreakStats(habit.id, allLogs, new Date(), habit.type || 'build', habit.createdAt);
  const categoryMeta = CATEGORIES_META[habit.category] || CATEGORIES_META.health;

  return (
    <div
      className={cn(
        'group relative flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-[#1C4D8D] border transition-all duration-200 shadow-2xs hover:shadow-md',
        isBreakHabit
          ? 'border-amber-500/40 dark:border-amber-500/40 hover:border-amber-500/70 bg-gradient-to-r from-amber-500/[0.02] to-transparent'
          : 'border-slate-200/80 dark:border-[#2A5C9E] hover:border-slate-300 dark:hover:border-[#00A896]'
      )}
    >
      
      {/* 1. عمود هوية العادة والتصنيف */}
      <div className="flex items-start gap-3.5 min-w-[280px] max-w-sm">
        {/* خط تمييز لون التصنيف أو شريط التحذير */}
        <div
          className={cn(
            'mt-1 w-1.5 h-12 rounded-full shrink-0',
            isBreakHabit && 'bg-amber-500 shadow-xs shadow-amber-500/50'
          )}
          style={{ backgroundColor: isBreakHabit ? '#F59E0B' : (habit.color || categoryMeta.color) }}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {/* شارة نوع العادة: إقلاع 🛡️ أو بناء ⚡ */}
            {isBreakHabit ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-black tracking-wider px-2.5 py-0.5 rounded-full border bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400">
                <Shield className="w-3 h-3" />
                إقلاع عن عادة سيئة
              </span>
            ) : (
              <span
                className={cn(
                  'inline-flex items-center text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded-full border',
                  categoryMeta.badgeBg,
                  categoryMeta.badgeBorder,
                  categoryMeta.accentText
                )}
              >
                {categoryMeta.label}
              </span>
            )}

            {/* شارة تحذير إياك أن تفوت مرتين */}
            {stats.isAtRisk && (
              <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-500 animate-pulse">
                <AlertTriangle className="w-3 h-3" />
                {isBreakHabit ? 'احذر تكرار الانتكاس اليوم!' : 'إياك أن تفوّت مرتين!'}
              </span>
            )}
          </div>

          {/* اسم العادة */}
          <button
            onClick={() => onOpenDetail(habit)}
            className="text-right font-bold text-slate-900 dark:text-[#F8FAFC] text-sm hover:text-[#00A896] dark:hover:text-[#02C39A] transition-colors truncate block w-full cursor-pointer"
          >
            {habit.name}
          </button>

          {/* بيان الهوية (لماذا؟) */}
          <p className="text-xs text-slate-500 dark:text-[#94A3B8] truncate mt-0.5 italic">
            "{habit.identity}"
          </p>

          {/* قاعدة الدقيقتين أو استراتيجية المقاومة */}
          {habit.twoMinuteRule && (
            <div className={cn(
              'flex items-center gap-1 mt-1 text-[11px] font-medium truncate',
              isBreakHabit ? 'text-amber-600 dark:text-amber-400' : 'text-[#00A896] dark:text-[#02C39A]'
            )}>
              <Zap className="w-3 h-3 shrink-0" />
              <span className="truncate">{isBreakHabit ? `حاجز المقاومة: ${habit.twoMinuteRule}` : `قاعدة الدقيقتين: ${habit.twoMinuteRule}`}</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. شبكة المربعات اليومية التفاعلية */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none justify-start md:justify-center">
        {days.map((day) => {
          const logId = `${habit.id}_${day.date}`;
          const log = allLogs[logId];

          return (
            <div key={day.date} className="flex flex-col items-center">
              <DayCell
                date={day.date}
                isToday={day.isToday}
                isFuture={day.isFuture}
                log={log}
                habitName={habit.name}
                habitType={habit.type || 'build'}
                onToggle={(date, nextStatus) => onToggleLog(habit.id, date, nextStatus)}
                onOpenReflection={(date) => onOpenReflection?.(habit, date)}
                compact={viewMode === 'rolling'}
              />
            </div>
          );
        })}
      </div>

      {/* 3. عمود الإحصائيات والإجراءات */}
      <div className="flex items-center justify-between md:justify-start gap-4 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100 dark:border-[#2A5C9E]">
        {/* عداد السلسلة أو الصمود */}
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border',
              isBreakHabit
                ? 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/30'
                : 'bg-slate-50 dark:bg-[#0F2854] border-slate-200/70 dark:border-[#2A5C9E]'
            )}
            title={
              isBreakHabit
                ? `سلسلة الصمود النقي: ${stats.currentStreak} يوم | القياسي: ${stats.longestStreak} يوم | عدد الزلات: ${stats.totalMissed}`
                : `السلسلة الحالية: ${stats.currentStreak} يوم | القياسي: ${stats.longestStreak} يوم`
            }
          >
            {isBreakHabit ? (
              <ShieldCheck
                className={cn(
                  'w-4 h-4 text-emerald-500 dark:text-emerald-400',
                  stats.currentStreak > 0 && 'fill-emerald-500/20'
                )}
              />
            ) : (
              <Flame
                className={cn(
                  'w-4 h-4 text-[#F39C12]',
                  stats.currentStreak > 0 && 'fill-[#F39C12]'
                )}
              />
            )}
            <div className="text-right">
              <div className="text-xs font-black leading-none text-slate-800 dark:text-[#F8FAFC]">
                {stats.currentStreak}
                <span className="text-[10px] font-normal text-slate-400 dark:text-[#94A3B8] mr-1">
                  {isBreakHabit ? 'أيام صمود' : 'أيام سلسلة'}
                </span>
              </div>
              <div className={cn(
                'text-[9px] leading-none mt-1 font-bold',
                isBreakHabit ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#F39C12]'
              )}>
                {isBreakHabit ? `الزلات: ${stats.totalMissed}` : `القياسي: ${stats.longestStreak} ي`}
              </div>
            </div>
          </div>

          {/* نسبة الاتساق أو الصمود */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#0F2854] border border-slate-200/70 dark:border-[#2A5C9E]"
            title={isBreakHabit ? `نسبة النقاء خلال 30 يوماً: ${stats.completionRate}%` : `نسبة الاتساق خلال 30 يوماً: ${stats.completionRate}%`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00A896] dark:text-[#02C39A]" />
            <span className="text-xs font-black text-slate-700 dark:text-[#F8FAFC]">
              {stats.completionRate}%
            </span>
          </div>

          {/* شارة الإنجاز القياسي (#F39C12) */}
          {stats.milestoneBadge && stats.milestoneBadge !== 'starter' && (
            <div
              className="p-1.5 rounded-md bg-[#F39C12]/15 border border-[#F39C12]/30 text-[#F39C12]"
              title={`إنجاز قياسي مفتوح: ${stats.milestoneBadge}`}
            >
              <Award className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        {/* أزرار الإجراءات */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onOpenDetail(habit)}
            className="p-1.5 text-slate-400 dark:text-[#94A3B8] hover:text-[#00A896] dark:hover:text-[#02C39A] hover:bg-slate-100 dark:hover:bg-[#2A5C9E]/50 rounded-lg transition-colors cursor-pointer"
            title="تفاصيل العادة والقوانين الأربعة"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => onEditHabit(habit)}
            className="p-1.5 text-slate-400 dark:text-[#94A3B8] hover:text-slate-600 dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#2A5C9E]/50 rounded-lg transition-colors cursor-pointer"
            title="تعديل العادة"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              if (confirm(`هل تريد حذف عادة "${habit.name}"؟`)) {
                onDeleteHabit(habit.id);
              }
            }}
            className="p-1.5 text-slate-400 dark:text-[#94A3B8] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
            title="حذف العادة"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
