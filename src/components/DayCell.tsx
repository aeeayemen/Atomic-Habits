import React, { useState } from 'react';
import { Check, X, Clock } from 'lucide-react';
import type { HabitLog, HabitStatus } from '../types/habit';
import { cn } from '../lib/utils';
import { soundManager } from '../lib/sound';

interface DayCellProps {
  date: string;
  isToday: boolean;
  isFuture: boolean;
  log?: HabitLog;
  habitName: string;
  onToggle: (date: string, nextStatus: HabitStatus) => void;
  compact?: boolean;
}

export const DayCell: React.FC<DayCellProps> = ({
  date,
  isToday,
  isFuture,
  log,
  habitName,
  onToggle,
  compact = false,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const currentStatus: HabitStatus = log?.status || 'neutral';

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isFuture) return;

    let nextStatus: HabitStatus = 'done';
    if (currentStatus === 'neutral') {
      nextStatus = 'done';
      soundManager.playSuccess();
    } else if (currentStatus === 'done') {
      nextStatus = 'missed';
      soundManager.playMissed();
    } else {
      nextStatus = 'neutral';
      soundManager.playNeutral();
    }

    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    onToggle(date, nextStatus);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isFuture) return;

    const nextStatus: HabitStatus = currentStatus === 'missed' ? 'neutral' : 'missed';
    if (nextStatus === 'missed') {
      soundManager.playMissed();
    } else {
      soundManager.playNeutral();
    }
    onToggle(date, nextStatus);
  };

  const getStatusStyles = () => {
    if (isFuture) {
      return 'bg-slate-100/50 dark:bg-[#0F2854]/40 text-slate-400 dark:text-[#94A3B8]/40 border-slate-200/50 dark:border-[#2A5C9E]/40 cursor-not-allowed opacity-40';
    }

    switch (currentStatus) {
      case 'done':
        return 'bg-[#00A896]/20 border-[#00A896] text-[#00A896] hover:bg-[#02C39A]/30 dark:bg-[#00A896]/25 dark:border-[#00A896] dark:text-[#02C39A] dark:hover:bg-[#02C39A]/35 shadow-xs shadow-[#00A896]/25';
      case 'missed':
        return 'bg-rose-500/15 border-rose-500/50 text-rose-600 dark:text-rose-400 dark:bg-rose-500/20 hover:bg-rose-500/25 hover:border-rose-500';
      case 'neutral':
      default:
        return isToday
          ? 'bg-slate-100 dark:bg-[#0F2854] border-[#00A896] dark:border-[#00A896] text-slate-400 dark:text-[#94A3B8] hover:border-[#02C39A] hover:bg-slate-200/60 dark:hover:bg-[#1C4D8D]'
          : 'bg-slate-100/60 dark:bg-[#0F2854]/60 border-slate-200 dark:border-[#2A5C9E] text-slate-400 dark:text-[#94A3B8] hover:border-slate-300 dark:hover:border-[#00A896] hover:bg-slate-200/50 dark:hover:bg-[#0F2854]';
    }
  };

  const cellDimensions = compact ? 'w-8 h-8 rounded-md' : 'w-10 h-10 rounded-lg';

  const statusLabel = 
    currentStatus === 'done' ? '✅ تم الإنجاز بنجاح' :
    currentStatus === 'missed' ? '❌ تم التفويت / لم يُنجز' :
    '⏳ قيد الانتظار / لم يُسجل بعد';

  const tooltipTitle = `${habitName} (${date})
الحالة: ${statusLabel}
${log?.updatedAt ? `وقت التسجيل: ${new Date(log.updatedAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}` : 'لم يُسجل بعد'}
اضغط للتبديل: منجز ➔ مفوّت ➔ محايد | زر الفأرة الأيمن: تحديد كمفوّت`;

  return (
    <button
      type="button"
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      disabled={isFuture}
      title={tooltipTitle}
      aria-label={`${habitName} بتاريخ ${date}: ${statusLabel}`}
      className={cn(
        'relative group flex items-center justify-center border transition-all duration-150 select-none cursor-pointer',
        cellDimensions,
        getStatusStyles(),
        isToday && 'ring-2 ring-[#00A896]/40 dark:ring-[#00A896]/50',
        isAnimating && 'animate-success-pop scale-105'
      )}
    >
      {/* أيقونات الحالة */}
      {currentStatus === 'done' && (
        <Check
          className={cn(
            'stroke-[3] text-[#00A896] dark:text-[#02C39A] transition-transform duration-200',
            compact ? 'w-4 h-4' : 'w-5 h-5',
            isAnimating && 'scale-110'
          )}
        />
      )}

      {currentStatus === 'missed' && (
        <X
          className={cn(
            'stroke-[2.5] text-rose-500 dark:text-rose-400 transition-transform duration-200',
            compact ? 'w-3.5 h-3.5' : 'w-4 h-4'
          )}
        />
      )}

      {currentStatus === 'neutral' && !isFuture && (
        <span
          className={cn(
            'rounded-full transition-all duration-150 opacity-40 group-hover:opacity-100',
            compact ? 'w-1.5 h-1.5' : 'w-2 h-2',
            isToday
              ? 'bg-[#00A896] dark:bg-[#02C39A] animate-pulse'
              : 'bg-slate-300 dark:bg-[#2A5C9E] group-hover:bg-[#00A896]'
          )}
        />
      )}

      {isFuture && (
        <Clock className={cn('opacity-25', compact ? 'w-3 h-3' : 'w-3.5 h-3.5')} />
      )}

      {/* نقطة مؤشر اليوم الحالي */}
      {isToday && (
        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#00A896] ring-2 ring-white dark:ring-[#0F2854]" />
      )}
    </button>
  );
};
