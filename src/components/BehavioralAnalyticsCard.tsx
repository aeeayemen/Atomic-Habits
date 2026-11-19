import React, { useState } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Shield,
  ShieldAlert,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Brain,
  Calendar,
  Zap,
  CheckCircle2,
  Info,
} from 'lucide-react';
import type { Habit, HabitLog } from '../types/habit';
import { computeBehavioralAnalytics } from '../lib/analytics';

interface BehavioralAnalyticsCardProps {
  habits: Habit[];
  allLogs: Record<string, HabitLog>;
}

export const BehavioralAnalyticsCard: React.FC<BehavioralAnalyticsCardProps> = ({
  habits,
  allLogs,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const analytics = computeBehavioralAnalytics(habits, allLogs);

  const hasBreakHabits = habits.some((h) => h.type === 'break' && !h.archived);

  return (
    <div className="bg-white dark:bg-[#1C4D8D] border border-slate-200/80 dark:border-[#2A5C9E] rounded-2xl shadow-2xs overflow-hidden transition-all duration-300">
      {/* 1. الترويسة القابلة للطي (Collapsible Header) */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full p-4 sm:p-5 flex items-center justify-between text-right cursor-pointer hover:bg-slate-50/60 dark:hover:bg-[#0F2854]/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#00A896]/20 to-[#F39C12]/20 border border-[#00A896]/30 text-[#00A896] dark:text-[#02C39A]">
            <Brain className="w-5 h-5 text-[#00A896] dark:text-[#02C39A]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-black text-slate-900 dark:text-[#F8FAFC]">
                تحليل الأداء والمحفزات السلوكية 📊
              </h3>
              {analytics.weakestDay && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-3 h-3" />
                  أضعف يوم: {analytics.weakestDay.dayName} ({analytics.weakestDay.failureRate}%)
                </span>
              )}
              {analytics.totalSlipUps === 0 && hasBreakHabits && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#00A896]/15 border border-[#00A896]/30 text-[#00A896] dark:text-[#02C39A]">
                  <Shield className="w-3 h-3" />
                  سجل صمود نقي 100%
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5">
              استبصار ذكي لأنماط سلوكك: رصد أضعف أيام الأسبوع، فترات الذروة، وأهم محفزات العادات السلبية
            </p>
          </div>
        </div>

        <div className="p-1.5 rounded-lg text-slate-400 dark:text-[#94A3B8] hover:text-slate-700 dark:hover:text-white transition-colors">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {/* 2. المحتوى المفصل للتحليلات (Grid Cards) */}
      {isExpanded && (
        <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 dark:border-[#2A5C9E]/60 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* بطاقة 1: أضعف أيام الالتزام (Weakest Days of Week) */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0F2854] border border-slate-200/70 dark:border-[#2A5C9E] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-[#CBD5E1]">
                    <Calendar className="w-4 h-4 text-amber-500" />
                    <span>أضعف أيام الالتزام بالأسبوع</span>
                  </div>
                  {analytics.weakestDay && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-500">
                      يوم حرج
                    </span>
                  )}
                </div>

                {/* رسم بياني مصغر لأيام الأسبوع (7 Days Indicator) */}
                <div className="grid grid-cols-7 gap-1 mb-3">
                  {analytics.daysOfWeek.map((day) => {
                    const isMax = day.isWeakest && day.failureRate > 0;
                    return (
                      <div
                        key={day.dayIndex}
                        className={`flex flex-col items-center p-1.5 rounded-lg border text-center transition-all ${
                          isMax
                            ? 'bg-rose-500/20 border-rose-500/60 text-rose-600 dark:text-rose-400 ring-2 ring-rose-500/30'
                            : day.failureRate > 25
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400'
                            : day.totalChecks > 0
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                            : 'bg-slate-100 dark:bg-[#1C4D8D]/40 border-slate-200 dark:border-[#2A5C9E]/40 text-slate-400 dark:text-[#94A3B8]/60'
                        }`}
                        title={`${day.dayName}: نسبة التعثر ${day.failureRate}% (${day.missedCount} من أصل ${day.totalChecks})`}
                      >
                        <span className="text-[10px] font-bold">{day.dayShort}</span>
                        <div className="w-full h-1 bg-slate-200 dark:bg-[#0F2854] rounded-full mt-1.5 overflow-hidden">
                          <div
                            className={`h-full ${isMax ? 'bg-rose-500' : 'bg-amber-500'}`}
                            style={{ width: `${day.failureRate}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-bold mt-1">
                          {day.totalChecks > 0 ? `${day.failureRate}%` : '-'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* استنتاج وتوصية ذكية */}
                {analytics.weakestDay ? (
                  <p className="text-xs text-slate-600 dark:text-[#CBD5E1] leading-relaxed">
                    ⚡ يظهر التحليل أن <span className="font-bold text-amber-600 dark:text-amber-400">يوم {analytics.weakestDay.dayName}</span> هو أكثر يوم يشهد تفويتاً أو زلات بنسبة <span className="font-bold">{analytics.weakestDay.failureRate}%</span>.
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-[#94A3B8] leading-relaxed">
                    ✅ أداؤك متوازن وثابت على مدار الأسبوع بدون أي يوم تعثر بارز!
                  </p>
                )}
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-[#2A5C9E]/60 flex items-center gap-1.5 text-[11px] text-[#00A896] dark:text-[#02C39A]">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">نصيحة: قلّص عادات هذا اليوم عبر قاعدة الدقيقتين.</span>
              </div>
            </div>

            {/* بطاقة 2: ملخص محفزات العادات السيئة (Top Relapse Triggers) */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0F2854] border border-slate-200/70 dark:border-[#2A5C9E] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-[#CBD5E1]">
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                    <span>أبرز محفزات العادات السيئة 🛡️</span>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400">
                    {analytics.totalSlipUps} زلة مسجلة
                  </span>
                </div>

                {/* قائمة المحفزات المكررة */}
                {analytics.topTriggers.length > 0 ? (
                  <div className="space-y-2 mb-2">
                    {analytics.topTriggers.map((trig) => (
                      <div
                        key={trig.id}
                        className="p-2.5 rounded-lg bg-white dark:bg-[#1C4D8D]/60 border border-slate-200 dark:border-[#2A5C9E] text-xs"
                      >
                        <div className="flex items-center justify-between font-bold mb-1">
                          <span className="text-slate-800 dark:text-[#F8FAFC] truncate">
                            {trig.name}
                          </span>
                          <span className="text-amber-600 dark:text-amber-400 font-black text-[11px] mr-2 shrink-0">
                            {trig.count} مرات ({trig.percentage}%)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] leading-tight">
                          {trig.counterStrategy}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 px-3 text-center flex flex-col items-center justify-center">
                    <Shield className="w-8 h-8 text-[#00A896] mb-2 opacity-80" />
                    <p className="text-xs font-bold text-slate-800 dark:text-[#F8FAFC]">
                      لا توجد زلات مسجلة بحمد الله! 🛡️
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-1">
                      عند تسجيل أي زلة عابرة ستظهر لك محفزاتها وقوانين كسرها هنا تلقائياً.
                    </p>
                  </div>
                )}
              </div>

              {analytics.topTriggers.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-[#2A5C9E]/60 text-[11px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 shrink-0" />
                  <span>اجعل العادة غير جذابة وصعبة فور رصد هذا المحفز.</span>
                </div>
              )}
            </div>

            {/* بطاقة 3: معدل الالتزام العام وأوقات الذروة (Overall Consistency & Time Window) */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0F2854] border border-slate-200/70 dark:border-[#2A5C9E] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-[#CBD5E1]">
                    <TrendingUp className="w-4 h-4 text-[#00A896]" />
                    <span>معدل الالتزام وصحة الصمود</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-[#94A3B8]">
                    {analytics.totalLogsAnalyzed} سجل
                  </span>
                </div>

                {/* مؤشرات الاتساق */}
                <div className="space-y-3 mb-3">
                  {/* نسبة عادات البناء */}
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-600 dark:text-[#CBD5E1] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#00A896]" />
                        اتساق عادات البناء الإيجابية:
                      </span>
                      <span className="text-[#00A896] dark:text-[#02C39A]">
                        {analytics.buildConsistencyRate}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-[#1C4D8D] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#00A896] to-[#02C39A]"
                        style={{ width: `${analytics.buildConsistencyRate}%` }}
                      />
                    </div>
                  </div>

                  {/* نسبة نقاء عادات الإقلاع */}
                  {hasBreakHabits && (
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-slate-600 dark:text-[#CBD5E1] flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5 text-emerald-500" />
                          معدل النقاء والصمود (Break):
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {analytics.breakCleanRate}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-[#1C4D8D] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-[#00A896]"
                          style={{ width: `${analytics.breakCleanRate}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* فترة ذروة الانتكاس (Peak Time Window) */}
                <div className="p-2.5 rounded-lg bg-white dark:bg-[#1C4D8D]/60 border border-slate-200 dark:border-[#2A5C9E] text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-[#F8FAFC] mb-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>فترة الذروة الأكثر حساسية:</span>
                  </div>
                  {analytics.peakTimeWindow ? (
                    <p className="text-[11px] text-slate-600 dark:text-[#CBD5E1]">
                      تتركز معظم الزلات خلال فترة <span className="font-bold text-amber-600 dark:text-amber-400">{analytics.peakTimeWindow.label} ({analytics.peakTimeWindow.hoursRange})</span> بنسبة {analytics.peakTimeWindow.percentage}%.
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-500 dark:text-[#94A3B8]">
                      سجلاتك موزعة باعتدال دون تركز حرج في وقت معين.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-[#2A5C9E]/60 text-[11px] text-slate-400 dark:text-[#94A3B8] flex items-center gap-1">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>«أنت لا ترتقي لأهدافك بل تهبط لمستوى أنظمتك»</span>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
