import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleCheck,
  faFire,
  faTrophy,
  faChartLine,
  faShareNodes,
} from '../lib/icons';
import type { Habit, HabitLog } from '../types/habit';
import { formatISODate } from '../lib/utils';
import { calculateStreakStats } from '../lib/streak';

interface MetricsSummaryProps {
  habits: Habit[];
  allLogs: Record<string, HabitLog>;
  onOpenAccountability?: () => void;
}

export const MetricsSummary: React.FC<MetricsSummaryProps> = ({
  habits,
  allLogs,
  onOpenAccountability,
}) => {
  const todayStr = formatISODate(new Date());

  // 1. نسبة إنجاز اليوم
  let todayDone = 0;
  const todayTotal = habits.length;

  habits.forEach((h) => {
    const log = allLogs[`${h.id}_${todayStr}`];
    if (log?.status === 'done') todayDone++;
  });

  const todayPercentage = todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0;

  // 2. السلاسل والأرقام القياسية
  let maxActiveStreak = 0;
  let allTimeRecord = 0;
  let totalCompletionsAllTime = 0;
  let totalMissedAllTime = 0;

  habits.forEach((h) => {
    const stats = calculateStreakStats(h.id, allLogs);
    if (stats.currentStreak > maxActiveStreak) maxActiveStreak = stats.currentStreak;
    if (stats.longestStreak > allTimeRecord) allTimeRecord = stats.longestStreak;
    totalCompletionsAllTime += stats.totalDone;
    totalMissedAllTime += stats.totalMissed;
  });

  // 3. معدل الالتزام والاتساق الكلي
  const totalLogsCount = totalCompletionsAllTime + totalMissedAllTime;
  const overallRate =
    totalLogsCount > 0 ? Math.round((totalCompletionsAllTime / totalLogsCount) * 100) : todayPercentage;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. إنجاز اليوم */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#1C4D8D] border border-slate-200/80 dark:border-[#2A5C9E] shadow-2xs relative overflow-hidden group">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            تركيز اليوم
          </span>
          <div className="p-2 rounded-lg bg-[#00A896]/15 text-[#0b7a6e] dark:text-[#02C39A]">
            <FontAwesomeIcon icon={faCircleCheck} className="w-4 h-4" aria-hidden="true" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-[#F8FAFC]">
            {todayDone} / {todayTotal}
          </span>
          <span className="text-xs font-bold text-[#0b7a6e] dark:text-[#02C39A]">
            {todayPercentage}% منجز
          </span>
        </div>
        {/* شريط التقدم */}
        <div className="w-full h-1.5 bg-slate-100 dark:bg-[#0F2854] rounded-full mt-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#00A896] to-[#02C39A] transition-all duration-500"
            style={{ width: `${todayPercentage}%` }}
          />
        </div>
      </div>

      {/* 2. أعلى سلسلة نشطة (Amber/Gold #F39C12) */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#1C4D8D] border border-slate-200/80 dark:border-[#2A5C9E] shadow-2xs relative overflow-hidden group">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            أعلى سلسلة مستمرة 🔥
          </span>
          <div className="p-2 rounded-lg bg-[#F39C12]/15 text-[#9a5b00] dark:text-[#F39C12]">
            <FontAwesomeIcon icon={faFire} className="w-4 h-4" aria-hidden="true" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-[#F8FAFC]">
            {maxActiveStreak}
          </span>
          <span className="text-xs text-slate-700 dark:text-slate-300">أيام متتالية</span>
        </div>
        <p className="text-[11px] text-[#475569] dark:text-slate-400 mt-2 truncate">
          {maxActiveStreak > 0 ? 'الزخم يتراكم كل يوم!' : 'ابدأ سلسلتك اليوم!'}
        </p>
      </div>

      {/* 3. الرقم القياسي التاريخي (#F39C12) */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#1C4D8D] border border-slate-200/80 dark:border-[#2A5C9E] shadow-2xs relative overflow-hidden group">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            الرقم القياسي التاريخي
          </span>
          <div className="p-2 rounded-lg bg-[#F39C12]/15 text-[#9a5b00] dark:text-[#F39C12]">
            <FontAwesomeIcon icon={faTrophy} className="w-4 h-4" aria-hidden="true" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-[#F8FAFC]">
            {allTimeRecord}
          </span>
          <span className="text-xs text-slate-700 dark:text-slate-300">يوماً أقصى استمرار</span>
        </div>
        <p className="text-[11px] text-[#475569] dark:text-slate-400 mt-2">
          أفضل أداء قياسي مسجل
        </p>
      </div>

      {/* 4. معدل الاتساق والالتزام الكلي */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#1C4D8D] border border-slate-200/80 dark:border-[#2A5C9E] shadow-2xs relative overflow-hidden group">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            معدل الالتزام الكلي
          </span>
          <div className="p-2 rounded-lg bg-[#00A896]/15 text-[#0b7a6e] dark:text-[#02C39A]">
            <FontAwesomeIcon icon={faChartLine} className="w-4 h-4" aria-hidden="true" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-[#F8FAFC]">
            {overallRate}%
          </span>
          <span className="text-xs text-slate-700 dark:text-slate-300">({totalCompletionsAllTime} تسجيل إنجاز)</span>
        </div>
        <p className="text-[11px] text-[#475569] dark:text-slate-400 mt-2">
          نسبة النجاح التراكمية
        </p>
      </div>

      {/* 5. شريط مشاركة الإنجاز مع شريك المساءلة (Heading Order Fix: h2 sequential) */}
      {onOpenAccountability && (
        <div className="col-span-2 lg:col-span-4 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[#00A896]/10 to-transparent border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-[#9a5b00] dark:text-[#F39C12] shrink-0">
              <FontAwesomeIcon icon={faFire} className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xs font-black text-slate-900 dark:text-white">
                شريك المساءلة ومشاركة الإنجاز 🤝🔥
              </h2>
              <p className="text-[11px] text-slate-700 dark:text-slate-300">
                شارك بطاقة سلاسلك ونسبة التزامك بإيجابية مع صديقك أو شريك المساءلة دون أي ضغوط.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenAccountability}
            aria-label="مشاركة بطاقة الإنجاز مع شريك المساءلة"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#00A896] to-[#02C39A] hover:opacity-95 text-white font-bold text-xs shadow-md shadow-[#00A896]/20 transition-all hover:scale-102 cursor-pointer"
          >
            <FontAwesomeIcon icon={faShareNodes} className="w-3.5 h-3.5" aria-hidden="true" />
            <span>مشاركة بطاقة الإنجاز</span>
          </button>
        </div>
      )}
    </div>
  );
};
