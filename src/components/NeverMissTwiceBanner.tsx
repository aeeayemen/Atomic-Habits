import React from 'react';
import { ShieldAlert, Check } from 'lucide-react';
import type { Habit, HabitLog } from '../types/habit';
import { calculateStreakStats } from '../lib/streak';
import { soundManager } from '../lib/sound';

interface NeverMissTwiceBannerProps {
  habits: Habit[];
  allLogs: Record<string, HabitLog>;
  onMarkHabitDoneToday: (habitId: string) => void;
}

export const NeverMissTwiceBanner: React.FC<NeverMissTwiceBannerProps> = ({
  habits,
  allLogs,
  onMarkHabitDoneToday,
}) => {
  const atRiskHabits = habits.filter((h) => {
    const stats = calculateStreakStats(h.id, allLogs);
    return stats.isAtRisk;
  });

  if (atRiskHabits.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-xl border border-rose-500/30 dark:border-[#2A5C9E] bg-rose-500/5 dark:bg-[#1C4D8D] p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-rose-500/20 text-rose-500 shrink-0">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-rose-600 dark:text-rose-400 font-['Cairo']">
                قاعدة العادات الذرية: إياك أن تفوّت مرتين متتاليتين!
              </h4>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-300">
                {atRiskHabits.length} معرضة لكسر السلسلة
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-[#94A3B8] mt-1 max-w-2xl leading-relaxed">
              "الخطأ الأول ليس هو ما يدمرك، بل الانزلاق وتكراره. التفويت لمرة واحدة حادث عارض، أما التفويت لمرتين متتاليتين فهو بداية عادة سلبية جديدة! استعد مسارك اليوم فوراً."
            </p>

            {/* بطاقات العادات المعرضة لكسر السلسلة */}
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              {atRiskHabits.map((habit) => (
                <div
                  key={habit.id}
                  className="flex items-center gap-2 px-3 py-1 rounded-md bg-white dark:bg-[#0F2854] border border-rose-200 dark:border-[#2A5C9E] text-xs text-slate-800 dark:text-[#F8FAFC] shadow-2xs"
                >
                  <span className="font-bold">{habit.name}</span>
                  <button
                    onClick={() => {
                      soundManager.playSuccess();
                      onMarkHabitDoneToday(habit.id);
                    }}
                    className="flex items-center gap-1 text-[11px] font-extrabold text-[#00A896] dark:text-[#02C39A] hover:underline cursor-pointer"
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                    إنقاذ العادة الآن
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
