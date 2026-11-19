import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Trophy,
  Save,
  Check,
  Calendar,
  Zap,
  Shield,
  Lightbulb,
} from 'lucide-react';
import type { Habit, HabitLog } from '../types/habit';
import {
  computeWeeklySummary,
  saveWeeklyReflectionNote,
  loadWeeklyReflectionNote,
} from '../lib/weeklyReflection';
import { soundManager } from '../lib/sound';

interface WeeklyReflectionCardProps {
  habits: Habit[];
  allLogs: Record<string, HabitLog>;
  userId?: string;
}

export const WeeklyReflectionCard: React.FC<WeeklyReflectionCardProps> = ({
  habits,
  allLogs,
  userId,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [reflectionText, setReflectionText] = useState('');
  const [savedTime, setSavedTime] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);

  // حساب ملخص الأسبوع الحالي لحظياً
  const summary = useMemo(
    () => computeWeeklySummary(habits, allLogs, new Date()),
    [habits, allLogs]
  );

  // تحميل الملاحظة المخزنة لهذا الأسبوع
  useEffect(() => {
    const data = loadWeeklyReflectionNote(summary.weekKey, userId);
    setReflectionText(data.note || '');
    if (data.updatedAt) {
      setSavedTime(
        new Date(data.updatedAt).toLocaleTimeString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    }
  }, [summary.weekKey, userId]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await saveWeeklyReflectionNote(summary.weekKey, reflectionText, userId);
      soundManager.playSuccess();
      setShowSavedFeedback(true);
      setSavedTime(
        new Date().toLocaleTimeString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
      setTimeout(() => setShowSavedFeedback(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1C4D8D] border border-slate-200/80 dark:border-[#2A5C9E] rounded-2xl shadow-2xs overflow-hidden transition-all duration-300 font-['Cairo',sans-serif]">
      {/* 1. الترويسة القابلة للطي */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full p-4 sm:p-5 flex items-center justify-between text-right cursor-pointer hover:bg-slate-50/60 dark:hover:bg-[#0F2854]/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#00A896]/20 to-[#F39C12]/20 border border-[#00A896]/30 text-[#00A896] dark:text-[#02C39A]">
            <Sparkles className="w-5 h-5 text-[#00A896] dark:text-[#02C39A]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-black text-slate-900 dark:text-[#F8FAFC]">
                التأمل الأسبوعي ومراجعة الزخم 🎯
              </h3>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#00A896]/15 border border-[#00A896]/30 text-[#00A896] dark:text-[#02C39A]">
                <Calendar className="w-3 h-3" />
                {summary.formattedDateRange}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#0F2854] text-slate-700 dark:text-[#F8FAFC] border border-slate-200 dark:border-[#2A5C9E]">
                {summary.overallConsistencyRate}% اتساق هذا الأسبوع
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5">
              مراجعة أسبوعية سريعة لتعزيز استمراريتك: أكثر العادات ثباتاً، نقاط الاحتكاك، وتدوين عهد الأسبوع القادم
            </p>
          </div>
        </div>

        <div className="p-1.5 rounded-lg text-slate-400 dark:text-[#94A3B8] hover:text-slate-700 dark:hover:text-white transition-colors">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {/* 2. المحتوى المفصل عند الفتح */}
      {isExpanded && (
        <div className="p-4 sm:p-5 pt-0 space-y-5 border-t border-slate-100 dark:border-[#2A5C9E]/50">
          {/* البطاقات الإحصائية الثلاث الرائدة */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            {/* أ. العادة الأكثر اتساقاً (Most Consistent) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0F2854]/80 border border-slate-200 dark:border-[#2A5C9E] space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-[#00A896] dark:text-[#02C39A] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#00A896]" />
                  <span>الأكثر اتساقاً هذا الأسبوع 🌟</span>
                </span>
                {summary.mostConsistentHabit && (
                  <span className="px-2 py-0.5 rounded-md bg-[#00A896]/15 text-[#00A896] dark:text-[#02C39A] text-[10px] font-black">
                    {summary.mostConsistentHabit.consistencyRate}%
                  </span>
                )}
              </div>

              {summary.mostConsistentHabit ? (
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                    {summary.mostConsistentHabit.habitName}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-[#94A3B8] mt-1">
                    <span>
                      {summary.mostConsistentHabit.type === 'break'
                        ? `${summary.mostConsistentHabit.completedDays} أيام نقية`
                        : `${summary.mostConsistentHabit.completedDays} من 7 أيام منجزة`}
                    </span>
                    {summary.mostConsistentHabit.currentStreak > 0 && (
                      <span className="text-[#F39C12] font-bold">
                        · سلسلة {summary.mostConsistentHabit.currentStreak} يوماً 🔥
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 dark:text-[#94A3B8] italic">
                  وثّق عاداتك الأولى لتظهر هنا.
                </p>
              )}
            </div>

            {/* ب. العادة التي تحتاج لتركيز إضافي (Needs Most Attention) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0F2854]/80 border border-slate-200 dark:border-[#2A5C9E] space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-[#F39C12] flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-[#F39C12]" />
                  <span>تحتاج تركيزاً إضافياً 🎯</span>
                </span>
                {summary.needsAttentionHabit && (
                  <span className="px-2 py-0.5 rounded-md bg-[#F39C12]/15 text-[#F39C12] text-[10px] font-black">
                    {summary.needsAttentionHabit.consistencyRate}%
                  </span>
                )}
              </div>

              {summary.needsAttentionHabit ? (
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                    {summary.needsAttentionHabit.habitName}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-[#94A3B8] mt-1">
                    <span className="text-rose-500 dark:text-rose-400 font-bold">
                      {summary.needsAttentionHabit.type === 'break'
                        ? `${summary.needsAttentionHabit.missedDays} زلات مسجلة`
                        : `${summary.needsAttentionHabit.missedDays} أيام مفوتة`}
                    </span>
                    <span className="text-slate-400 dark:text-[#94A3B8] truncate">
                      · طبّق قاعدة الدقيقتين لتقليل المقاومة
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-[#00A896] dark:text-[#02C39A] font-bold flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-[#F39C12]" />
                  <span>أداء ممتاز! كافة عاداتك مستقرة بنجاح هذا الأسبوع 🚀</span>
                </div>
              )}
            </div>

            {/* ج. أفضل سلسلة مستمرة (Best Streak) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0F2854]/80 border border-slate-200 dark:border-[#2A5C9E] space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-[#F39C12] flex items-center gap-1.5">
                  <Flame className="w-4 h-4 fill-[#F39C12]" />
                  <span>أقوى سلسلة مستمرة 🔥</span>
                </span>
                {summary.bestStreakHabit && (
                  <span className="px-2 py-0.5 rounded-md bg-[#F39C12]/20 text-[#F39C12] text-[10px] font-black">
                    {summary.bestStreakHabit.currentStreak} يوماً
                  </span>
                )}
              </div>

              {summary.bestStreakHabit ? (
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                    {summary.bestStreakHabit.habitName}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-1 flex items-center gap-1">
                    {summary.bestStreakHabit.type === 'break' ? (
                      <>
                        <Shield className="w-3 h-3 text-amber-500" />
                        <span>صمود متصل نقي بلا انتكاس</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3 text-[#00A896]" />
                        <span>زخم تصاعدي مستمر 1% يومياً</span>
                      </>
                    )}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 dark:text-[#94A3B8] italic">
                  حافظ على إنجاز الغد لتبدأ سلسلتك القياسية.
                </p>
              )}
            </div>
          </div>

          {/* قسم تدوين تأمل الأسبوع القادم */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0F2854]/60 border border-slate-200 dark:border-[#2A5C9E] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-[#F39C12] shrink-0" />
                <h4 className="text-xs font-black text-slate-900 dark:text-white">
                  سؤال التأمل: ما الذي سأحسّنه أو أركز عليه في الأسبوع القادم؟ 💭
                </h4>
              </div>

              <div className="flex items-center gap-2 text-[11px]">
                {savedTime && (
                  <span className="text-slate-400 dark:text-[#94A3B8]">
                    آخر حفظ: {savedTime}
                  </span>
                )}
                {showSavedFeedback && (
                  <span className="flex items-center gap-1 text-[#00A896] dark:text-[#02C39A] font-bold animate-in fade-in">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>تم الحفظ بنجاح!</span>
                  </span>
                )}
              </div>
            </div>

            <textarea
              rows={2}
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              onBlur={() => {
                if (reflectionText.trim()) handleSave();
              }}
              placeholder="مثال: سأجعل جلسة العمل العميق تبدأ بعد قهوة الصباح مباشرة دون تشتت، وأرفع حاجز المقاومة للسهر بوضع الهاتف خارج غرفة النوم..."
              className="w-full p-3 rounded-xl bg-white dark:bg-[#1C4D8D] border border-slate-200 dark:border-[#2A5C9E] text-slate-900 dark:text-white text-xs placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-hidden focus:border-[#00A896] transition-colors resize-none leading-relaxed"
            />

            <div className="flex items-center justify-between gap-3 pt-1">
              <p className="text-[11px] text-slate-400 dark:text-[#94A3B8] italic">
                💡 التدوين الأسبوعي يربط نواياك بنظام يومي واضح ويزيد احتمالية الالتزام بنسبة 200%.
              </p>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#00A896] hover:bg-[#02C39A] text-white text-xs font-bold shadow-xs transition-all hover:scale-102 cursor-pointer shrink-0 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'جاري الحفظ...' : 'حفظ التأمل'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
