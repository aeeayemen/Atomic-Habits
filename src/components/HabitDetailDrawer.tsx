import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark,
  faFire,
  faAward,
  faBolt,
  faBullseye,
  faGift,
  faShieldHalved,
  faTrashCan,
  faPenToSquare,
  faCircleCheck,
  faEyeSlash,
  faLock,
  faFaceFrown,
  faBoxArchive,
  faRotateLeft,
  faShareNodes,
  faCheck,
} from '../lib/icons';
import type { Habit, HabitLog } from '../types/habit';
import { calculateStreakStats } from '../lib/streak';
import { CATEGORIES_META, formatISODate } from '../lib/utils';
import { shareToWhatsApp } from '../lib/accountability';

interface HabitDetailDrawerProps {
  habit: Habit | null;
  allLogs: Record<string, HabitLog>;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
  onArchive?: (habitId: string) => void;
  onRestore?: (habitId: string) => void;
}

export const HabitDetailDrawer: React.FC<HabitDetailDrawerProps> = ({
  habit,
  allLogs,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onArchive,
  onRestore,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !habit) return null;

  const isBreak = habit.type === 'break';
  const stats = calculateStreakStats(habit.id, allLogs, new Date(), habit.type || 'build', habit.createdAt);
  const categoryMeta = CATEGORIES_META[habit.category] || CATEGORIES_META.health;

  // خريطة حرارية لآخر 28 يوماً
  const heatmapDays = [];
  const today = new Date();
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = formatISODate(d);
    const log = allLogs[`${habit.id}_${dateStr}`];
    heatmapDays.push({
      dateStr,
      dayNum: d.getDate(),
      status: log?.status || 'neutral',
      notes: log?.notes,
      isToday: i === 0,
    });
  }

  const handleDelete = () => {
    if (confirm(`هل أنت متأكد من رغبتك في حذف عادة "${habit.name}"؟ لا يمكن التراجع عن هذا الإجراء.`)) {
      onDelete(habit.id);
      onClose();
    }
  };

  const handleShareHabit = async () => {
    const streakUnit = isBreak ? 'يوماً نقياً بلا زلات ' : 'أيام متتالية ';
    const text = ` عادتي في منظومة العادات الذرية (istomic):
📌 العادة: ${habit.name}
⚡ السلسلة الحالية: ${stats.currentStreak} ${streakUnit}
🏆 أطول سلسلة مسجلة: ${stats.longestStreak} يوماً
 نسبة الالتزام والاتساق: ${stats.completionRate}%
${habit.identity ? `💪 الهوية الذاتية: "${habit.identity}"\n` : ''}${habit.twoMinuteRule ? `⏱️ قاعدة الدقيقتين: "${habit.twoMinuteRule}"\n` : ''}#عادات_ذرية #انضباط_يومي #istomic`;

    // محاولة المشاركة الفورية عبر واتساب، أو النسخ إلى الحافظة
    const ok = shareToWhatsApp(text);
    if (!ok && typeof navigator !== 'undefined') {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {}
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-start bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg h-full bg-white dark:bg-[#1C4D8D] border-r border-slate-200 dark:border-[#2A5C9E] p-6 overflow-y-auto flex flex-col justify-between shadow-2xl text-right">
        <div>
          {/* الترويسة */}
          <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-[#2A5C9E]">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span
                  className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${categoryMeta.badgeBg} ${categoryMeta.badgeBorder} ${categoryMeta.accentText}`}
                >
                  {categoryMeta.label}
                </span>

                {isBreak && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-600 dark:text-amber-400 shrink-0">
                    <FontAwesomeIcon icon={faShieldHalved} className="w-3 h-3 shrink-0" aria-hidden="true" />
                    خطة إقلاع عن عادة سيئة
                  </span>
                )}
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-[#F8FAFC]">
                {habit.name}
              </h2>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleShareHabit}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold transition-colors cursor-pointer shrink-0"
                title="مشاركة إنجاز وسلسلة هذه العادة عبر واتساب أو الحافظة"
              >
                <span>{copied ? 'تم النسخ!' : 'مشاركة العادة'}</span>
                {copied ? (
                  <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5 text-emerald-500 shrink-0" aria-hidden="true" />
                ) : (
                  <FontAwesomeIcon icon={faShareNodes} className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                )}
              </button>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 dark:text-[#94A3B8] hover:text-slate-600 dark:hover:text-[#F8FAFC] rounded-lg hover:bg-slate-100 dark:hover:bg-[#2A5C9E]/50 cursor-pointer shrink-0"
                title="إغلاق النافذة"
                aria-label="إغلاق النافذة"
              >
                <FontAwesomeIcon icon={faXmark} className="w-5 h-5 shrink-0" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* بيان الهوية */}
          <div className={`my-4 p-3.5 rounded-xl border ${isBreak ? 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/30' : 'bg-[#00A896]/10 dark:bg-[#00A896]/15 border-[#00A896]/30'}`}>
            <div className={`flex items-center gap-1.5 text-xs font-bold mb-1 ${isBreak ? 'text-amber-600 dark:text-amber-400' : 'text-[#00A896] dark:text-[#02C39A]'}`}>
              <FontAwesomeIcon icon={faShieldHalved} className="w-4 h-4 shrink-0" aria-hidden="true" />
              {isBreak ? 'الهوية التحررية المنشودة ("لماذا؟")' : 'الهوية الجوهرية ("لماذا؟")'}
            </div>
            <p className="text-xs text-slate-700 dark:text-[#F8FAFC] italic font-medium leading-relaxed">
              "{habit.identity}"
            </p>
          </div>

          {/* بطاقات الإحصائيات والسلسلة */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0F2854] border border-slate-200/80 dark:border-[#2A5C9E]">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#94A3B8] mb-1">
                {isBreak ? (
                  <FontAwesomeIcon icon={faCircleCheck} className="w-4 h-4 text-emerald-500 shrink-0" aria-hidden="true" />
                ) : (
                  <FontAwesomeIcon icon={faFire} className="w-4 h-4 text-[#F39C12] shrink-0" aria-hidden="true" />
                )}
                {isBreak ? 'سلسلة الصمود النقي' : 'السلسلة الحالية'}
              </div>
              <div className={`text-2xl font-black ${isBreak ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#F39C12]'}`}>
                {stats.currentStreak}{' '}
                <span className="text-xs font-normal text-slate-400 dark:text-[#94A3B8]">
                  {isBreak ? 'أيام صمود' : 'أيام'}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 dark:text-[#94A3B8] mt-0.5 font-bold">
                الرقم القياسي: {stats.longestStreak} يوماً
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0F2854] border border-slate-200/80 dark:border-[#2A5C9E]">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#94A3B8] mb-1">
                <FontAwesomeIcon icon={faAward} className="w-4 h-4 text-[#00A896] dark:text-[#02C39A] shrink-0" aria-hidden="true" />
                {isBreak ? 'معدل الصمود والنقاء' : 'معدل الالتزام'}
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-[#F8FAFC]">
                {stats.completionRate}%
              </div>
              <div className="text-[11px] text-slate-400 dark:text-[#94A3B8] mt-0.5">
                {isBreak ? `${stats.totalMissed} زلة مسجلة` : `${stats.totalDone} منجز · ${stats.totalMissed} مفوّت`}
              </div>
            </div>
          </div>

          {/* الخريطة الحرارية لآخر 4 أسابيع */}
          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8] mb-2">
              {isBreak ? 'سجل الصمود والزلات خلال آخر 4 أسابيع' : 'سجل الالتزام خلال آخر 4 أسابيع'}
            </h4>
            <div className="grid grid-cols-7 gap-1.5 p-3 rounded-xl bg-slate-50 dark:bg-[#0F2854] border border-slate-200 dark:border-[#2A5C9E]">
              {heatmapDays.map((hd) => (
                <div
                  key={hd.dateStr}
                  title={`${hd.dateStr}: ${hd.status}${hd.notes ? ` (${hd.notes})` : ''}`}
                  className={`h-8 rounded-md flex items-center justify-center text-[10px] font-bold border transition-all ${
                    isBreak
                      ? hd.status === 'missed'
                        ? 'bg-amber-500/25 border-amber-500 text-amber-600 dark:text-amber-400 font-black ring-1 ring-amber-500/50'
                        : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                      : hd.status === 'done'
                      ? 'bg-[#00A896]/25 border-[#00A896] text-[#00A896] dark:text-[#02C39A] font-black'
                      : hd.status === 'missed'
                      ? 'bg-rose-500/20 border-rose-500/60 text-rose-500'
                      : 'bg-slate-200/60 dark:bg-[#1C4D8D] border-slate-300 dark:border-[#2A5C9E] text-slate-400 dark:text-[#94A3B8]'
                  } ${hd.isToday ? 'ring-2 ring-[#00A896]' : ''}`}
                >
                  {hd.dayNum}
                </div>
              ))}
            </div>
          </div>

          {/* تفاصيل القوانين الأربعة */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
              {isBreak ? 'مخطط الإقلاع (القوانين المعكوسة)' : 'مخطط هندسة العادة (القوانين الأربعة)'}
            </h4>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0F2854] border border-slate-200 dark:border-[#2A5C9E]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-500 dark:text-blue-400 mb-0.5">
                {isBreak ? (
                  <FontAwesomeIcon icon={faEyeSlash} className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                ) : (
                  <FontAwesomeIcon icon={faBullseye} className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                {isBreak ? 'القانون 1: اجعلها خفية (إزالة المثيرات)' : 'القانون 1: اجعلها واضحة (الإشارة / المثير)'}
              </div>
              <p className="text-xs text-slate-700 dark:text-[#F8FAFC]">{habit.cue || 'غير محدد'}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0F2854] border border-slate-200 dark:border-[#2A5C9E]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#F39C12] mb-0.5">
                {isBreak ? (
                  <FontAwesomeIcon icon={faLock} className="w-3.5 h-3.5 text-rose-500" aria-hidden="true" />
                ) : (
                  <FontAwesomeIcon icon={faBolt} className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                {isBreak ? 'القانون 3: اجعلها صعبة (زيادة الاحتكاك)' : 'القانون 3: اجعلها سهلة (قاعدة الدقيقتين للبدء)'}
              </div>
              <p className="text-xs text-slate-700 dark:text-[#F8FAFC]">
                {habit.twoMinuteRule || (isBreak ? 'ضع حواجز صعوبة' : 'ابدأ بخطوة صغيرة')}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0F2854] border border-slate-200 dark:border-[#2A5C9E]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#00A896] dark:text-[#02C39A] mb-0.5">
                {isBreak ? (
                  <FontAwesomeIcon icon={faFaceFrown} className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                ) : (
                  <FontAwesomeIcon icon={faGift} className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                {isBreak ? 'القانون 4: اجعلها غير مشبعة (المساءلة والتكلفة)' : 'القانون 4: اجعلها مشبعة (المكافأة الفورية)'}
              </div>
              <p className="text-xs text-slate-700 dark:text-[#F8FAFC]">{habit.reward || 'غير محدد'}</p>
            </div>
          </div>
        </div>

        {/* أزرار الإجراءات السفلية */}
        <div className="flex items-center justify-between gap-2 pt-6 border-t border-slate-100 dark:border-[#2A5C9E] mt-6 flex-wrap">
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-colors cursor-pointer shrink-0"
          >
            <FontAwesomeIcon icon={faTrashCan} className="w-4 h-4 shrink-0" aria-hidden="true" />
            حذف العادة
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            {Boolean(habit.is_archived ?? habit.archived) ? (
              onRestore && (
                <button
                  onClick={() => {
                    onRestore(habit.id);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#00A896]/15 hover:bg-[#00A896]/25 text-[#00A896] dark:text-[#02C39A] border border-[#00A896]/30 text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  <FontAwesomeIcon icon={faRotateLeft} className="w-4 h-4 shrink-0" aria-hidden="true" />
                  استعادة للقائمة النشطة
                </button>
              )
            ) : (
              onArchive && (
                <button
                  onClick={() => {
                    if (
                      confirm(
                        `هل ترغب في أرشفة عادة "${habit.name}"؟ سيتم نقلها للأرشيف مع الحفاظ على كافة السجلات والإحصائيات.`
                      )
                    ) {
                      onArchive(habit.id);
                      onClose();
                    }
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  <FontAwesomeIcon icon={faBoxArchive} className="w-4 h-4 shrink-0" aria-hidden="true" />
                  أرشفة العادة
                </button>
              )
            )}

            <button
              onClick={() => {
                onEdit(habit);
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00A896] hover:bg-[#02C39A] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <FontAwesomeIcon icon={faPenToSquare} className="w-4 h-4 shrink-0" aria-hidden="true" />
              تعديل النظام
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
