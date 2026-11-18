import React from 'react';
import { CheckCircle2, Flame, Trophy, Activity } from 'lucide-react';
import type { Habit, HabitLog } from '../types/habit';
import { formatISODate } from '../lib/utils';
import { calculateStreakStats } from '../lib/streak';

interface MetricsSummaryProps {
  habits: Habit[];
  allLogs: Record<string, HabitLog>;
}

export const MetricsSummary: React.FC<MetricsSummaryProps> = ({ habits, allLogs }) => {
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

  const totalLogsCount = totalCompletionsAllTime + totalMissedAllTime;
  const overallRate = totalLogsCount > 0 ? Math.round((totalCompletionsAllTime / totalLogsCount) * 100) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. إنجاز اليوم */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#1C4D8D] border border-slate-200/80 dark:border-[#2A5C9E] shadow-2xs relative overflow-hidden group">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-[#94A3B8]">
            تركيز اليوم
          </span>
          <div className="p-2 rounded-lg bg-[#00A896]/15 text-[#00A896] dark:text-[#02C39A]">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-[#F8FAFC]">
            {todayDone} / {todayTotal}
          </span>
          <span className="text-xs font-bold text-[#00A896] dark:text-[#02C39A]">
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
          <span className="text-xs font-semibold text-slate-500 dark:text-[#94A3B8]">
            أعلى سلسلة مستمرة 🔥
          </span>
          <div className="p-2 rounded-lg bg-[#F39C12]/15 text-[#F39C12]">
            <Flame className="w-4 h-4 fill-[#F39C12]" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-[#F8FAFC]">
            {maxActiveStreak}
          </span>
          <span className="text-xs text-slate-500 dark:text-[#94A3B8]">أيام متتالية</span>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-[#94A3B8] mt-2 truncate">
          {maxActiveStreak > 0 ? 'الزخم يتراكم كل يوم!' : 'ابدأ سلسلتك اليوم!'}
        </p>
      </div>

      {/* 3. الرقم القياسي التاريخي (#F39C12) */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#1C4D8D] border border-slate-200/80 dark:border-[#2A5C9E] shadow-2xs relative overflow-hidden group">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-[#94A3B8]">
            الرقم القياسي التاريخي
          </span>
          <div className="p-2 rounded-lg bg-[#F39C12]/15 text-[#F39C12]">
            <Trophy className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-[#F8FAFC]">
            {allTimeRecord}
          </span>
          <span className="text-xs text-slate-500 dark:text-[#94A3B8]">يوماً أقصى استمرار</span>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-[#94A3B8] mt-2">
          أفضل أداء قياسي مسجل
        </p>
      </div>

      {/* 4. معدل الاتساق والالتزام الكلي */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#1C4D8D] border border-slate-200/80 dark:border-[#2A5C9E] shadow-2xs relative overflow-hidden group">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-[#94A3B8]">
            معدل الالتزام الكلي
          </span>
          <div className="p-2 rounded-lg bg-[#00A896]/15 text-[#00A896] dark:text-[#02C39A]">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-[#F8FAFC]">
            {overallRate}%
          </span>
          <span className="text-xs text-slate-500 dark:text-[#94A3B8]">({totalCompletionsAllTime} تسجيل إنجاز)</span>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-[#94A3B8] mt-2">
          نسبة النجاح التراكمية
        </p>
      </div>
    </div>
  );
};
