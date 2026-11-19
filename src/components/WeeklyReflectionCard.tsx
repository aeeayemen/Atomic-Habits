import React, { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWandMagicSparkles,
  faChevronDown,
  faChevronUp,
  faCircleCheck,
  faTriangleExclamation,
  faFire,
  faTrophy,
  faFloppyDisk,
  faCheck,
  faCalendarDays,
  faBolt,
  faShieldHalved,
  faLightbulb,
  faSpinner,
} from '../lib/icons';
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
    } catch (err) {
      console.error('Failed to save reflection note:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      data-tour="tour-weekly-reflection"
      className="rounded-2xl border border-slate-200/90 dark:border-[#2A5C9E] bg-white dark:bg-[#1C4D8D] shadow-xs overflow-hidden transition-all duration-200"
    >
      {/* 1. ترويسة البطاقة الرئيسية وقابلية الطي (Heading Order Fix: h2 sequential) */}
      <div
        onClick={() => setIsExpanded((prev) => !prev)}
        className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none hover:bg-slate-50 dark:hover:bg-[#2A5C9E]/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#00A896]/20 to-[#02C39A]/20 border border-[#00A896]/30 text-[#0b7a6e] dark:text-[#02C39A]">
            <FontAwesomeIcon icon={faWandMagicSparkles} className="w-5 h-5 text-[#9a5b00] dark:text-[#F39C12]" aria-hidden="true" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-[#F8FAFC]">
                التأمل الأسبوعي ومراجعة الزخم 🎯
              </h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#00A896]/15 border border-[#00A896]/30 text-[#0b7a6e] dark:text-[#02C39A]">
                <FontAwesomeIcon icon={faCalendarDays} className="w-3 h-3" aria-hidden="true" />
                {summary.formattedDateRange}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#0F2854] text-slate-700 dark:text-[#F8FAFC] border border-slate-200 dark:border-[#2A5C9E]">
                {summary.overallConsistencyRate}% اتساق هذا الأسبوع
              </span>
            </div>
            <p className="text-xs text-[#475569] dark:text-[#94A3B8] mt-0.5">
              مراجعة أسبوعية سريعة لتعزيز استمراريتك: أكثر العادات ثباتاً، نقاط الاحتكاك، وتدوين عهد الأسبوع القادم
            </p>
          </div>
        </div>

        <button
          type="button"
          aria-label={isExpanded ? "طي بطاقة التأمل الأسبوعي" : "توسيع بطاقة التأمل الأسبوعي"}
          aria-expanded={isExpanded}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-colors"
        >
          <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* 2. المحتوى المفصل عند الفتح */}
      {isExpanded && (
        <div className="p-4 sm:p-5 pt-0 space-y-5 border-t border-slate-100 dark:border-[#2A5C9E]/50">
          {/* البطاقات الإحصائية الثلاث الرائدة */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            {/* أ. العادة الأكثر اتساقاً (Accessible Teal #0b7a6e in light mode) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0F2854]/80 border border-slate-200 dark:border-[#2A5C9E] space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-[#0b7a6e] dark:text-[#02C39A] flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faCircleCheck} className="w-4 h-4 text-[#0b7a6e] dark:text-[#02C39A]" aria-hidden="true" />
                  <span>الأكثر اتساقاً هذا الأسبوع 🌟</span>
                </span>
                {summary.mostConsistentHabit && (
                  <span className="px-2 py-0.5 rounded-md bg-[#00A896]/15 text-[#0b7a6e] dark:text-[#02C39A] text-[10px] font-black">
                    {summary.mostConsistentHabit.consistencyRate}%
                  </span>
                )}
              </div>

              {summary.mostConsistentHabit ? (
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white truncate">
                    {summary.mostConsistentHabit.habitName}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-[#475569] dark:text-slate-300 mt-1">
                    <span>
                      {summary.mostConsistentHabit.type === 'break'
                        ? `${summary.mostConsistentHabit.completedDays} أيام نقية`
                        : `${summary.mostConsistentHabit.completedDays} من 7 أيام منجزة`}
                    </span>
                    {summary.mostConsistentHabit.currentStreak > 0 && (
                      <span className="text-[#9a5b00] dark:text-[#F39C12] font-bold">
                        · سلسلة {summary.mostConsistentHabit.currentStreak} يوماً 🔥
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#475569] dark:text-[#94A3B8] italic">
                  وثّق عاداتك الأولى لتظهر هنا.
                </p>
              )}
            </div>

            {/* ب. العادة التي تحتاج لتركيز إضافي (Accessible Amber #9a5b00 in light mode) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0F2854]/80 border border-slate-200 dark:border-[#2A5C9E] space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-[#9a5b00] dark:text-[#F39C12] flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faTriangleExclamation} className="w-4 h-4 text-[#9a5b00] dark:text-[#F39C12]" aria-hidden="true" />
                  <span>تحتاج تركيزاً إضافياً 🎯</span>
                </span>
                {summary.needsAttentionHabit && (
                  <span className="px-2 py-0.5 rounded-md bg-[#F39C12]/15 text-[#9a5b00] dark:text-[#F39C12] text-[10px] font-black">
                    {summary.needsAttentionHabit.consistencyRate}%
                  </span>
                )}
              </div>

              {summary.needsAttentionHabit ? (
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white truncate">
                    {summary.needsAttentionHabit.habitName}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#475569] dark:text-slate-300 mt-1">
                    <span className="text-rose-600 dark:text-rose-400 font-bold">
                      {summary.needsAttentionHabit.type === 'break'
                        ? `${summary.needsAttentionHabit.missedDays} زلات مسجلة`
                        : `${summary.needsAttentionHabit.missedDays} أيام مفوتة`}
                    </span>
                    <span className="text-[#475569] dark:text-[#94A3B8] truncate">
                      · طبّق قاعدة الدقيقتين لتقليل المقاومة
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-[#0b7a6e] dark:text-[#02C39A] font-bold flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faTrophy} className="w-3.5 h-3.5 text-[#9a5b00] dark:text-[#F39C12]" aria-hidden="true" />
                  <span>أداء ممتاز! كافة عاداتك مستقرة بنجاح هذا الأسبوع 🚀</span>
                </div>
              )}
            </div>

            {/* ج. أفضل سلسلة مستمرة (Accessible Amber #9a5b00 in light mode) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0F2854]/80 border border-slate-200 dark:border-[#2A5C9E] space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-[#9a5b00] dark:text-[#F39C12] flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faFire} className="w-4 h-4 text-[#9a5b00] dark:text-[#F39C12]" aria-hidden="true" />
                  <span>أقوى سلسلة مستمرة 🔥</span>
                </span>
                {summary.bestStreakHabit && (
                  <span className="px-2 py-0.5 rounded-md bg-[#F39C12]/20 text-[#9a5b00] dark:text-[#F39C12] text-[10px] font-black">
                    {summary.bestStreakHabit.currentStreak} يوماً
                  </span>
                )}
              </div>

              {summary.bestStreakHabit ? (
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white truncate">
                    {summary.bestStreakHabit.habitName}
                  </h3>
                  <p className="text-[11px] text-[#475569] dark:text-slate-300 mt-1 flex items-center gap-1">
                    {summary.bestStreakHabit.type === 'break' ? (
                      <>
                        <FontAwesomeIcon icon={faShieldHalved} className="w-3 h-3 text-amber-500" aria-hidden="true" />
                        <span>صمود متصل نقي بلا انتكاس</span>
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faBolt} className="w-3 h-3 text-[#0b7a6e] dark:text-[#00A896]" aria-hidden="true" />
                        <span>زخم تصاعدي مستمر 1% يومياً</span>
                      </>
                    )}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-[#475569] dark:text-[#94A3B8] italic">
                  حافظ على إنجاز الغد لتبدأ سلسلتك القياسية.
                </p>
              )}
            </div>
          </div>

          {/* قسم تدوين تأمل الأسبوع القادم */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0F2854]/60 border border-slate-200 dark:border-[#2A5C9E] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faLightbulb} className="w-4 h-4 text-[#9a5b00] dark:text-[#F39C12] shrink-0" aria-hidden="true" />
                <h3 className="text-xs font-black text-slate-900 dark:text-white">
                  سؤال التأمل: ما الذي سأحسّنه أو أركز عليه في الأسبوع القادم؟ 💭
                </h3>
              </div>

              <div className="flex items-center gap-2 text-[11px]">
                {savedTime && (
                  <span className="text-[#475569] dark:text-slate-300">
                    آخر حفظ: {savedTime}
                  </span>
                )}
                {showSavedFeedback && (
                  <span className="flex items-center gap-1 text-[#0b7a6e] dark:text-[#02C39A] font-bold animate-in fade-in">
                    <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5" aria-hidden="true" />
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
              className="w-full p-3 rounded-xl bg-white dark:bg-[#1C4D8D] border border-slate-200 dark:border-[#2A5C9E] text-slate-900 dark:text-white text-xs placeholder:text-slate-500 dark:placeholder:text-[#94A3B8] focus:outline-hidden focus:border-[#00A896] transition-colors resize-none leading-relaxed"
            />

            <div className="flex items-center justify-between gap-3 pt-1">
              {/* Accessible Contrast: #475569 over #f8fafc (contrast > 5.5:1) */}
              <p className="text-[11px] text-[#475569] dark:text-slate-300 italic">
                💡 التدوين الأسبوعي يربط نواياك بنظام يومي واضح ويزيد احتمالية الالتزام بنسبة 200%.
              </p>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                aria-label="حفظ التأمل الأسبوعي"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#00A896] hover:bg-[#02C39A] text-white text-xs font-bold shadow-xs transition-all hover:scale-102 cursor-pointer shrink-0 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>حفظ...</span>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faFloppyDisk} className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>حفظ التأمل</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
