import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck,
  faXmark,
  faShieldHalved,
  faTriangleExclamation,
  faClock,
} from '../lib/icons';
import type { HabitLog, HabitStatus, HabitType } from '../types/habit';
import { cn } from '../lib/utils';
import { soundManager } from '../lib/sound';

interface DayCellProps {
  date: string;
  isToday: boolean;
  isFuture: boolean;
  log?: HabitLog;
  habitName: string;
  habitType?: HabitType;
  onToggle: (date: string, nextStatus: HabitStatus) => void;
  onOpenReflection?: (date: string) => void;
  compact?: boolean;
}

export const DayCell: React.FC<DayCellProps> = ({
  date,
  isToday,
  isFuture,
  log,
  habitName,
  habitType = 'build',
  onToggle,
  onOpenReflection,
  compact = false,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const currentStatus: HabitStatus = log?.status || 'neutral';
  const isBreakHabit = habitType === 'break';

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isFuture) return;

    if (isBreakHabit) {
      let nextStatus: HabitStatus = 'missed';
      if (currentStatus === 'missed') {
        nextStatus = 'neutral';
        soundManager.playSuccess();
      } else {
        nextStatus = 'missed';
        soundManager.playMissed();
        onOpenReflection?.(date);
      }
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
      onToggle(date, nextStatus);
      return;
    }

    let nextStatus: HabitStatus = 'done';
    if (currentStatus === 'neutral') {
      nextStatus = 'done';
      soundManager.playSuccess();
    } else if (currentStatus === 'done') {
      nextStatus = 'missed';
      soundManager.playMissed();
    } else {
      nextStatus = 'neutral';
    }

    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
    onToggle(date, nextStatus);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isFuture) return;

    if (isBreakHabit) {
      if (currentStatus !== 'missed') {
        soundManager.playMissed();
        onOpenReflection?.(date);
        onToggle(date, 'missed');
      }
      return;
    }

    if (currentStatus !== 'missed') {
      soundManager.playMissed();
      onToggle(date, 'missed');
    }
  };

  const getStatusStyles = () => {
    if (isBreakHabit) {
      if (currentStatus === 'missed') {
        return 'bg-amber-500/20 dark:bg-amber-500/25 border-amber-500/80 text-amber-600 dark:text-amber-400 shadow-xs ring-1 ring-amber-500/40';
      }
      if (isFuture) {
        return 'bg-slate-50/50 dark:bg-[#0F2854]/40 border-slate-200/40 dark:border-[#2A5C9E]/30 text-slate-300 dark:text-slate-600 opacity-40 cursor-not-allowed';
      }
      return 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:border-emerald-500/60';
    }

    switch (currentStatus) {
      case 'done':
        return 'bg-[#00A896]/15 dark:bg-[#00A896]/25 border-[#00A896] text-[#0b7a6e] dark:text-[#02C39A] shadow-xs';
      case 'missed':
        return 'bg-rose-500/15 dark:bg-rose-500/20 border-rose-500/60 text-rose-500 dark:text-rose-400 shadow-2xs';
      case 'neutral':
      default:
        if (isFuture) {
          return 'bg-slate-50/50 dark:bg-[#0F2854]/40 border-slate-200/40 dark:border-[#2A5C9E]/30 text-slate-300 dark:text-slate-600 opacity-40 cursor-not-allowed';
        }
        return 'bg-slate-50 dark:bg-[#0F2854] border-slate-200 dark:border-[#2A5C9E] text-slate-400 hover:border-[#00A896]/60 dark:hover:border-[#00A896] hover:bg-slate-100 dark:hover:bg-[#1C4D8D]/60';
    }
  };

  const cellDimensions = compact ? 'w-8 h-8 rounded-lg shrink-0' : 'w-10 h-10 rounded-xl shrink-0';

  const statusLabel = isBreakHabit
    ? currentStatus === 'missed'
      ? 'انتكاسة / زلة مسجلة ⚠️'
      : isFuture
      ? 'يوم قادم'
      : 'يوم نقي بلا زلات '
    : currentStatus === 'done'
    ? 'منجز بنجاح ✅'
    : currentStatus === 'missed'
    ? 'مفوّت ❌'
    : isFuture
    ? 'يوم قادم'
    : 'قيد الانتظار ⏳';

  const tooltipTitle = isBreakHabit
    ? `${date} · ${statusLabel}${log?.notes ? ` (المحفز: ${log.notes})` : ''} - انقر لتسجيل زلة`
    : `${date} · ${statusLabel} (انقر للتغيير، زر أيمن للتفويت)`;

  return (
    <button
      type="button"
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      disabled={isFuture}
      title={tooltipTitle}
      aria-label={`${habitName} بتاريخ ${date}: ${statusLabel}`}
      className={cn(
        'relative group flex items-center justify-center border transition-all duration-150 select-none cursor-pointer shrink-0 overflow-hidden',
        cellDimensions,
        getStatusStyles(),
        isToday && (isBreakHabit ? 'ring-2 ring-emerald-500/50' : 'ring-2 ring-[#00A896]/40 dark:ring-[#00A896]/50'),
        isAnimating && 'animate-success-pop scale-105'
      )}
    >
      {/* أيقونات حالة عادة الإقلاع (Break) */}
      {isBreakHabit ? (
        currentStatus === 'missed' ? (
          <FontAwesomeIcon
            icon={faTriangleExclamation}
            className={cn(
              'text-amber-500 dark:text-amber-400 transition-transform duration-200 shrink-0',
              compact ? 'w-3 h-3 text-[12px]' : 'w-3.5 h-3.5 text-[14px]',
              isAnimating && 'scale-110'
            )}
            aria-hidden="true"
          />
        ) : !isFuture ? (
          <FontAwesomeIcon
            icon={faShieldHalved}
            className={cn(
              'text-emerald-500/50 dark:text-emerald-400/50 group-hover:text-emerald-500 transition-transform duration-200 shrink-0',
              compact ? 'w-2.5 h-2.5 text-[10px]' : 'w-3 h-3 text-[12px]'
            )}
            aria-hidden="true"
          />
        ) : null
      ) : (
        /* أيقونات حالة عادة البناء (Build) */
        <>
          {currentStatus === 'done' && (
            <FontAwesomeIcon
              icon={faCheck}
              className={cn(
                'text-[#0b7a6e] dark:text-[#02C39A] transition-transform duration-200 shrink-0',
                compact ? 'w-3 h-3 text-[12px]' : 'w-3.5 h-3.5 text-[14px]',
                isAnimating && 'scale-110'
              )}
              aria-hidden="true"
            />
          )}

          {currentStatus === 'missed' && (
            <FontAwesomeIcon
              icon={faXmark}
              className={cn(
                'text-rose-500 dark:text-rose-400 transition-transform duration-200 shrink-0',
                compact ? 'w-3 h-3 text-[12px]' : 'w-3.5 h-3.5 text-[14px]'
              )}
              aria-hidden="true"
            />
          )}

          {currentStatus === 'neutral' && !isFuture && (
            <span
              className={cn(
                'rounded-full transition-all duration-150 opacity-40 group-hover:opacity-100 shrink-0',
                compact ? 'w-1.5 h-1.5' : 'w-2 h-2',
                isToday
                  ? 'bg-[#00A896] dark:bg-[#02C39A] animate-pulse'
                  : 'bg-slate-300 dark:bg-[#2A5C9E] group-hover:bg-[#00A896]'
              )}
              aria-hidden="true"
            />
          )}
        </>
      )}

      {isFuture && (
        <FontAwesomeIcon
          icon={faClock}
          className={cn('opacity-25 shrink-0', compact ? 'w-2.5 h-2.5 text-[10px]' : 'w-3 h-3 text-[12px]')}
          aria-hidden="true"
        />
      )}

      {/* نقطة مؤشر اليوم الحالي */}
      {isToday && (
        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#00A896] ring-2 ring-white dark:ring-[#0F2854]" aria-hidden="true" />
      )}
    </button>
  );
};
