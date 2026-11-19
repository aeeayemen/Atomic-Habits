import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFire,
  faAward,
  faTriangleExclamation,
  faChevronLeft,
  faEllipsisVertical,
  faCircleCheck,
  faTrashCan,
  faShieldHalved,
  faShield,
  faBoxArchive,
  faRotateLeft,
} from '../lib/icons';
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
  onArchiveHabit?: (habitId: string) => void;
  onRestoreHabit?: (habitId: string) => void;
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
  onArchiveHabit,
  onRestoreHabit,
  viewMode,
}) => {
  const isBreakHabit = habit.type === 'break';
  const isArchived = Boolean(habit.is_archived ?? habit.archived);
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
      {/* 1. عمود العادة وبيان الهوية */}
      <div className="flex items-center gap-3 min-w-[280px] max-w-sm">
        {/* النقطة اللونية أو درع الحماية */}
        <div
          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs flex items-center justify-center"
          style={{ backgroundColor: isBreakHabit ? '#F59E0B' : (habit.color || categoryMeta.color) }}
          aria-hidden="true"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              onClick={() => onOpenDetail(habit)}
              className="text-sm font-black text-slate-900 dark:text-[#F8FAFC] hover:text-[#0b7a6e] dark:hover:text-[#02C39A] transition-colors cursor-pointer truncate"
              title={habit.name}
            >
              {habit.name}
            </h3>

            {/* شارة التصنيف */}
            <span
              className={cn(
                'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                categoryMeta.badgeBg,
                categoryMeta.badgeBorder,
                categoryMeta.accentText
              )}
            >
              {categoryMeta.label}
            </span>

            {/* شارة إقلاع عن عادة سيئة (Break Habit Shield) */}
            {isBreakHabit && (
              <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-[#9a5b00] dark:text-amber-400">
                <FontAwesomeIcon icon={faShieldHalved} className="w-2.5 h-2.5" aria-hidden="true" />
                <span>إقلاع 🛡️</span>
              </span>
            )}

            {/* شارة عادة مؤرشفة */}
            {isArchived && (
              <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-700/60 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300">
                <FontAwesomeIcon icon={faBoxArchive} className="w-2.5 h-2.5" aria-hidden="true" />
                <span>مؤرشفة</span>
              </span>
            )}
          </div>

          {/* نص الهوية التراكمية */}
          <p
            className="text-xs text-[#475569] dark:text-slate-300 truncate mt-0.5"
            title={habit.identity}
          >
            {isBreakHabit ? (
              <span className="text-[#9a5b00] dark:text-amber-400 font-medium">
                {habit.identity || 'هوية نقية ومتحررة من هذه العادة'}
              </span>
            ) : (
              habit.identity
            )}
          </p>

          {/* تنبيه وشيك لكسر السلسلة (Never Miss Twice Warning) */}
          {stats.isAtRisk && (
            <div className="flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1">
              <FontAwesomeIcon icon={faTriangleExclamation} className="w-3 h-3 text-rose-500" aria-hidden="true" />
              <span>معرضة للكسر! أنجزها اليوم</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. شبكة المربعات اليومية (Day Cells) */}
      <div className="flex items-center gap-2 justify-center flex-1 overflow-x-auto py-1">
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
              <FontAwesomeIcon
                icon={faShield}
                className={cn(
                  'w-4 h-4 text-emerald-500 dark:text-emerald-400'
                )}
                aria-hidden="true"
              />
            ) : (
              <FontAwesomeIcon
                icon={faFire}
                className={cn(
                  'w-4 h-4 text-[#9a5b00] dark:text-[#F39C12]'
                )}
                aria-hidden="true"
              />
            )}
            <div className="text-right">
              <div className="text-xs font-black leading-none text-slate-800 dark:text-[#F8FAFC]">
                {stats.currentStreak}
                <span className="text-[10px] font-normal text-[#475569] dark:text-[#94A3B8] mr-1">
                  {isBreakHabit ? 'أيام صمود' : 'أيام سلسلة'}
                </span>
              </div>
              <div className={cn(
                'text-[9px] leading-none mt-1 font-bold',
                isBreakHabit ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#9a5b00] dark:text-[#F39C12]'
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
            <FontAwesomeIcon icon={faCircleCheck} className="w-3.5 h-3.5 text-[#0b7a6e] dark:text-[#02C39A]" aria-hidden="true" />
            <span className="text-xs font-black text-slate-700 dark:text-[#F8FAFC]">
              {stats.completionRate}%
            </span>
          </div>

          {/* شارة الإنجاز القياسي (#F39C12) */}
          {stats.milestoneBadge && stats.milestoneBadge !== 'starter' && (
            <div
              className="p-1.5 rounded-md bg-[#F39C12]/15 border border-[#F39C12]/30 text-[#9a5b00] dark:text-[#F39C12]"
              title={`إنجاز قياسي مفتوح: ${stats.milestoneBadge}`}
            >
              <FontAwesomeIcon icon={faAward} className="w-3.5 h-3.5" aria-hidden="true" />
            </div>
          )}
        </div>

        {/* أزرار الإجراءات */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onOpenDetail(habit)}
            aria-label={`عرض تفاصيل عادة ${habit.name}`}
            className="p-1.5 text-slate-500 dark:text-slate-300 hover:text-[#00A896] dark:hover:text-[#02C39A] hover:bg-slate-100 dark:hover:bg-[#2A5C9E]/50 rounded-lg transition-colors cursor-pointer"
            title="تفاصيل العادة والقوانين الأربعة"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="w-3.5 h-3.5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => onEditHabit(habit)}
            aria-label={`تعديل عادة ${habit.name}`}
            className="p-1.5 text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#2A5C9E]/50 rounded-lg transition-colors cursor-pointer"
            title="تعديل العادة"
          >
            <FontAwesomeIcon icon={faEllipsisVertical} className="w-3.5 h-3.5" aria-hidden="true" />
          </button>

          {/* زر الأرشفة أو الاستعادة */}
          {isArchived ? (
            onRestoreHabit && (
              <button
                type="button"
                onClick={() => onRestoreHabit(habit.id)}
                aria-label={`استعادة عادة ${habit.name} إلى القائمة النشطة`}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#00A896]/15 hover:bg-[#00A896]/25 text-[#0b7a6e] dark:text-[#02C39A] border border-[#00A896]/30 text-xs font-bold transition-all hover:scale-102 cursor-pointer shadow-2xs"
                title="استعادة العادة إلى القائمة النشطة"
              >
                <FontAwesomeIcon icon={faRotateLeft} className="w-3 h-3" aria-hidden="true" />
                <span>استعادة</span>
              </button>
            )
          ) : (
            onArchiveHabit && (
              <button
                type="button"
                onClick={() => {
                  if (
                    confirm(
                      `هل ترغب في أرشفة عادة "${habit.name}"؟\nسيتم نقلها إلى الأرشيف وإخفاؤها من القائمة اليومية مع الحفاظ الكامل على كافة السجلات والإحصائيات.`
                    )
                  ) {
                    onArchiveHabit(habit.id);
                  }
                }}
                aria-label={`أرشفة عادة ${habit.name}`}
                className="p-1.5 text-slate-500 dark:text-slate-300 hover:text-[#9a5b00] dark:hover:text-[#F39C12] hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors cursor-pointer"
                title="أرشفة العادة وتنظيف القائمة النشطة"
              >
                <FontAwesomeIcon icon={faBoxArchive} className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )
          )}

          <button
            type="button"
            onClick={() => {
              if (confirm(`هل تريد حذف عادة "${habit.name}"؟`)) {
                onDeleteHabit(habit.id);
              }
            }}
            aria-label={`حذف عادة ${habit.name}`}
            className="p-1.5 text-slate-500 dark:text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
            title="حذف العادة"
          >
            <FontAwesomeIcon icon={faTrashCan} className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};
