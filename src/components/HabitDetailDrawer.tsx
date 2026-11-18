import React from 'react';
import {
  X,
  Flame,
  Award,
  Zap,
  Target,
  Gift,
  Shield,
  Trash2,
  Edit3,
} from 'lucide-react';
import type { Habit, HabitLog } from '../types/habit';
import { calculateStreakStats } from '../lib/streak';
import { CATEGORIES_META, formatISODate } from '../lib/utils';

interface HabitDetailDrawerProps {
  habit: Habit | null;
  allLogs: Record<string, HabitLog>;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
}

export const HabitDetailDrawer: React.FC<HabitDetailDrawerProps> = ({
  habit,
  allLogs,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) => {
  if (!isOpen || !habit) return null;

  const stats = calculateStreakStats(habit.id, allLogs);
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
      isToday: i === 0,
    });
  }

  const handleDelete = () => {
    if (confirm(`هل أنت متأكد من رغبتك في حذف عادة "${habit.name}"؟ لا يمكن التراجع عن هذا الإجراء.`)) {
      onDelete(habit.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-start bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg h-full bg-white dark:bg-[#1C4D8D] border-r border-slate-200 dark:border-[#2A5C9E] p-6 overflow-y-auto flex flex-col justify-between shadow-2xl text-right">
        <div>
          {/* الترويسة */}
          <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-[#2A5C9E]">
            <div>
              <span
                className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border mb-1.5 ${categoryMeta.badgeBg} ${categoryMeta.badgeBorder} ${categoryMeta.accentText}`}
              >
                {categoryMeta.label}
              </span>
              <h2 className="text-xl font-black text-slate-900 dark:text-[#F8FAFC]">
                {habit.name}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 dark:text-[#94A3B8] hover:text-slate-600 dark:hover:text-[#F8FAFC] rounded-lg hover:bg-slate-100 dark:hover:bg-[#2A5C9E]/50 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* بيان الهوية */}
          <div className="my-4 p-3.5 rounded-xl bg-[#00A896]/10 dark:bg-[#00A896]/15 border border-[#00A896]/30">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#00A896] dark:text-[#02C39A] mb-1">
              <Shield className="w-4 h-4" />
              الهوية الجوهرية ("لماذا؟")
            </div>
            <p className="text-xs text-slate-700 dark:text-[#F8FAFC] italic font-medium leading-relaxed">
              "{habit.identity}"
            </p>
          </div>

          {/* بطاقات الإحصائيات والسلسلة */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0F2854] border border-slate-200/80 dark:border-[#2A5C9E]">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#94A3B8] mb-1">
                <Flame className="w-4 h-4 text-[#F39C12] fill-[#F39C12]" />
                السلسلة الحالية
              </div>
              <div className="text-2xl font-black text-[#F39C12]">
                {stats.currentStreak}{' '}
                <span className="text-xs font-normal text-slate-400 dark:text-[#94A3B8]">أيام</span>
              </div>
              <div className="text-[11px] text-slate-400 dark:text-[#94A3B8] mt-0.5 font-bold">
                الرقم القياسي: {stats.longestStreak} يوماً
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0F2854] border border-slate-200/80 dark:border-[#2A5C9E]">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#94A3B8] mb-1">
                <Award className="w-4 h-4 text-[#00A896] dark:text-[#02C39A]" />
                معدل الالتزام
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-[#F8FAFC]">
                {stats.completionRate}%
              </div>
              <div className="text-[11px] text-slate-400 dark:text-[#94A3B8] mt-0.5">
                {stats.totalDone} منجز · {stats.totalMissed} مفوّت
              </div>
            </div>
          </div>

          {/* الخريطة الحرارية لآخر 4 أسابيع */}
          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8] mb-2">
              سجل الالتزام خلال آخر 4 أسابيع
            </h4>
            <div className="grid grid-cols-7 gap-1.5 p-3 rounded-xl bg-slate-50 dark:bg-[#0F2854] border border-slate-200 dark:border-[#2A5C9E]">
              {heatmapDays.map((hd) => (
                <div
                  key={hd.dateStr}
                  title={`${hd.dateStr}: ${hd.status}`}
                  className={`h-8 rounded-md flex items-center justify-center text-[10px] font-bold border transition-all ${
                    hd.status === 'done'
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
              مخطط هندسة العادة (القوانين الأربعة)
            </h4>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0F2854] border border-slate-200 dark:border-[#2A5C9E]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-500 dark:text-blue-400 mb-0.5">
                <Target className="w-3.5 h-3.5" />
                القانون 1: اجعلها واضحة (الإشارة / المثير)
              </div>
              <p className="text-xs text-slate-700 dark:text-[#F8FAFC]">{habit.cue || 'غير محدد'}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0F2854] border border-slate-200 dark:border-[#2A5C9E]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#F39C12] mb-0.5">
                <Zap className="w-3.5 h-3.5" />
                القانون 3: اجعلها سهلة (قاعدة الدقيقتين للبدء)
              </div>
              <p className="text-xs text-slate-700 dark:text-[#F8FAFC]">
                {habit.twoMinuteRule || 'ابدأ بخطوة صغيرة'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0F2854] border border-slate-200 dark:border-[#2A5C9E]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#00A896] dark:text-[#02C39A] mb-0.5">
                <Gift className="w-3.5 h-3.5" />
                القانون 4: اجعلها مشبعة (المكافأة الفورية)
              </div>
              <p className="text-xs text-slate-700 dark:text-[#F8FAFC]">{habit.reward || 'غير محدد'}</p>
            </div>
          </div>
        </div>

        {/* أزرار أسفل السحب */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-[#2A5C9E] mt-6">
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            حذف العادة
          </button>

          <button
            onClick={() => {
              onEdit(habit);
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-black text-slate-900 dark:text-[#F8FAFC] bg-slate-100 dark:bg-[#0F2854] hover:bg-slate-200 dark:hover:bg-[#2A5C9E] rounded-xl transition-colors cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            تعديل تفاصيل العادة
          </button>
        </div>
      </div>
    </div>
  );
};
