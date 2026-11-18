import React, { useState, useEffect } from 'react';
import { X, Sparkles, BookOpen, Target, Zap, Gift, Shield, ShieldAlert, EyeOff, ThumbsDown, Lock, Frown } from 'lucide-react';
import type { Habit, HabitCategory, HabitType } from '../types/habit';
import { CATEGORIES_META } from '../lib/utils';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habitData: Partial<Habit>) => void;
  initialHabit?: Habit | null;
}

export const HabitModal: React.FC<HabitModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialHabit,
}) => {
  const [name, setName] = useState('');
  const [habitType, setHabitType] = useState<HabitType>('build');
  const [category, setCategory] = useState<HabitCategory>('health');
  const [identity, setIdentity] = useState('');
  const [cue, setCue] = useState('');
  const [routine, setRoutine] = useState('');
  const [twoMinuteRule, setTwoMinuteRule] = useState('');
  const [reward, setReward] = useState('');
  const [color, setColor] = useState('#00A896');
  const [frequency, setFrequency] = useState<'daily' | 'weekdays' | 'weekends'>('daily');

  useEffect(() => {
    if (initialHabit) {
      setName(initialHabit.name);
      setHabitType(initialHabit.type || 'build');
      setCategory(initialHabit.category);
      setIdentity(initialHabit.identity);
      setCue(initialHabit.cue);
      setRoutine(initialHabit.routine);
      setTwoMinuteRule(initialHabit.twoMinuteRule);
      setReward(initialHabit.reward);
      setColor(initialHabit.color);
      setFrequency(initialHabit.frequency);
    } else {
      setName('');
      setHabitType('build');
      setCategory('deep_work');
      setIdentity('أنا شخص يقدر الإتقان والتركيز العميق والإنجاز المستمر.');
      setCue('بعد شرب قهوة الصباح...');
      setRoutine('');
      setTwoMinuteRule('فتح بيئة العمل وكتابة أول سطر فقط.');
      setReward('أخذ استراحة منعشة وتسجيل تقدم السلسلة.');
      setColor('#00A896');
      setFrequency('daily');
    }
  }, [initialHabit, isOpen]);

  if (!isOpen) return null;

  const isBreak = habitType === 'break';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      type: habitType,
      category,
      identity: identity.trim() || (isBreak ? 'أنا شخص سيد قراراته ولا تستعبده المشتتات.' : 'أنا شخص ملتزم ومستمر يومياً.'),
      cue: cue.trim() || (isBreak ? 'إبعاد محفزات العادة وإخفاؤها.' : 'يومياً في الموعد المحدد.'),
      routine: routine.trim() || name.trim(),
      twoMinuteRule: twoMinuteRule.trim() || (isBreak ? 'انتظار 10 دقائق أو وضع حاجز صعوبة.' : 'ابدأ بدقيقتين فقط.'),
      reward: reward.trim() || (isBreak ? 'الاحتفال بيوم صمود نقي جديد.' : 'الاحتفال بالتقدم اليومي.'),
      color: isBreak ? '#F59E0B' : color,
      frequency,
      targetDaysPerWeek: frequency === 'weekdays' ? 5 : frequency === 'weekends' ? 2 : 7,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#1C4D8D] rounded-2xl border border-slate-200 dark:border-[#2A5C9E] shadow-2xl p-6 my-8 text-right">
        {/* الترويسة */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#2A5C9E]">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isBreak ? 'bg-amber-500/15 text-amber-500' : 'bg-[#00A896]/15 text-[#00A896] dark:text-[#02C39A]'}`}>
              {isBreak ? <ShieldAlert className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC]">
                {initialHabit
                  ? isBreak ? 'تعديل خطة الإقلاع عن العادة' : 'تعديل العادة والنظام'
                  : isBreak ? 'هندسة خطة الإقلاع عن عادة سيئة 🛡️' : 'هندسة عادة ذرية جديدة ⚡'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                {isBreak
                  ? 'مرتكزة على القوانين المعكوسة لكسر العادات السيئة (كتاب العادات الذرية - جيمس كلير)'
                  : 'مرتكزة على القوانين الأربعة لتغيير السلوك (كتاب العادات الذرية - جيمس كلير)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 dark:text-[#94A3B8] hover:text-slate-600 dark:hover:text-[#F8FAFC] rounded-lg hover:bg-slate-100 dark:hover:bg-[#2A5C9E]/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* نموذج الإدخال */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* اختيار نوع العادة (بناء ⚡ مقابل إقلاع 🛡️) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-[#F8FAFC] mb-1.5">
              نوع الهدف السلوكي *
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-[#0F2854] border border-slate-200 dark:border-[#2A5C9E]">
              <button
                type="button"
                onClick={() => setHabitType('build')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  !isBreak
                    ? 'bg-gradient-to-r from-[#00A896] to-[#02C39A] text-white shadow-xs'
                    : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>بناء عادة إيجابية (Build)</span>
              </button>

              <button
                type="button"
                onClick={() => setHabitType('break')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  isBreak
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>الإقلاع عن عادة سيئة (Break)</span>
              </button>
            </div>
          </div>

          {/* 1. اسم العادة والتصنيف */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-[#F8FAFC] mb-1">
                {isBreak ? 'العادة السلبية المراد الإقلاع عنها *' : 'اسم العادة أو المهمة اليومية *'}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isBreak ? 'مثال: السهر وتصفح الهاتف ليلاً، التدخين، الوجبات السريعة...' : 'مثال: جلسة عمل عميق 90 دقيقة، قراءة، رياضة...'}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-[#0F2854] border border-slate-200 dark:border-[#2A5C9E] focus:outline-none focus:ring-2 focus:ring-[#00A896]/30 focus:border-[#00A896] text-slate-900 dark:text-[#F8FAFC] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-[#F8FAFC] mb-1">
                التصنيف
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as HabitCategory)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-[#0F2854] border border-slate-200 dark:border-[#2A5C9E] focus:outline-none focus:ring-2 focus:ring-[#00A896]/30 focus:border-[#00A896] text-slate-900 dark:text-[#F8FAFC]"
              >
                {Object.values(CATEGORIES_META).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. بيان الهوية (لماذا؟) */}
          <div className={`p-3.5 rounded-xl border ${isBreak ? 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/30' : 'bg-[#00A896]/10 dark:bg-[#00A896]/15 border-[#00A896]/30'}`}>
            <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-1 ${isBreak ? 'text-amber-600 dark:text-amber-400' : 'text-[#00A896] dark:text-[#02C39A]'}`}>
              <Shield className="w-3.5 h-3.5" />
              {isBreak ? 'بيان الهوية الحرة والتحرر السلوكي' : 'بيان الهوية الذاتية (لماذا؟ ومن تريد أن تصبح؟)'}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] mb-1.5">
              {isBreak
                ? 'تخلّص من الهوية القديمة ("أنا مدخن / أنا مسوّف") وتبنّ هوية التحرر ("أنا شخص يقدر صحته ووقته").'
                : 'كل تصرف تتخذه هو صوت تؤيد به نوع الشخص الذي ترغب في أن تصبحه.'}
            </p>
            <input
              type="text"
              value={identity}
              onChange={(e) => setIdentity(e.target.value)}
              placeholder={isBreak ? 'مثال: أنا شخص سيد قراراته يملك صفاءً ذهنياً وصحة عالية.' : 'مثال: أنا مهندس برمجي محترف يبني أنظمة متينة كل يوم.'}
              className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-[#0F2854] border border-slate-200 dark:border-[#2A5C9E] text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:border-[#00A896] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8]"
            />
          </div>

          {/* 3. شبكة القوانين الأربعة (عادية أو معكوسة) */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
              {isBreak ? 'القوانين الأربعة المعكوسة للإقلاع' : 'القوانين الأربعة لتغيير السلوك'}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* القانون 1: الإشارة (واضحة vs خفية) */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0F2854]/80 border border-slate-200 dark:border-[#2A5C9E]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-500 dark:text-blue-400 mb-1">
                  {isBreak ? <EyeOff className="w-3.5 h-3.5 text-amber-500" /> : <Target className="w-3.5 h-3.5" />}
                  {isBreak ? '1. اجعلها خفية (إزالة المحفزات)' : '1. اجعلها واضحة (الإشارة / تكديس العادات)'}
                </div>
                <input
                  type="text"
                  value={cue}
                  onChange={(e) => setCue(e.target.value)}
                  placeholder={isBreak ? 'إبعاد الهاتف خارج الغرفة، إلغاء الاشتراك في...' : 'بعد أن [عادة حالية]، سأقوم بـ...'}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-[#0F2854] border border-slate-200 dark:border-[#2A5C9E] text-slate-900 dark:text-[#F8FAFC] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8]"
                />
              </div>

              {/* القانون 3: السهولة (سهلة vs صعبة) */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0F2854]/80 border border-slate-200 dark:border-[#2A5C9E]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#F39C12] mb-1">
                  {isBreak ? <Lock className="w-3.5 h-3.5 text-rose-500" /> : <Zap className="w-3.5 h-3.5" />}
                  {isBreak ? '3. اجعلها صعبة (زيادة الاحتكاك والحواجز)' : '3. اجعلها سهلة (قاعدة الدقيقتين للبدء)'}
                </div>
                <input
                  type="text"
                  value={twoMinuteRule}
                  onChange={(e) => setTwoMinuteRule(e.target.value)}
                  placeholder={isBreak ? 'وضع كلمة سر معقدة، شحن الجهاز في صالة أخرى...' : 'قلّص العادة: فتح المحرر وكتابة سطر واحد...'}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-[#0F2854] border border-slate-200 dark:border-[#2A5C9E] text-slate-900 dark:text-[#F8FAFC] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8]"
                />
              </div>

              {/* القانون 2: الجاذبية (جذابة vs غير جذابة) */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0F2854]/80 border border-slate-200 dark:border-[#2A5C9E]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-500 dark:text-purple-400 mb-1">
                  {isBreak ? <ThumbsDown className="w-3.5 h-3.5 text-rose-500" /> : <BookOpen className="w-3.5 h-3.5" />}
                  {isBreak ? '2. اجعلها غير جذابة (إدراك الضرر والبديل)' : '2. اجعلها جذابة (الروتين المحدد)'}
                </div>
                <input
                  type="text"
                  value={routine}
                  onChange={(e) => setRoutine(e.target.value)}
                  placeholder={isBreak ? 'التذكير بالشعور بالذنب وضياع ساعات ثمينة...' : 'السلوك الدقيق الذي ستؤديه'}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-[#0F2854] border border-slate-200 dark:border-[#2A5C9E] text-slate-900 dark:text-[#F8FAFC] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8]"
                />
              </div>

              {/* القانون 4: الإشباع (مشبعة vs غير مشبعة) */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0F2854]/80 border border-slate-200 dark:border-[#2A5C9E]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#00A896] dark:text-[#02C39A] mb-1">
                  {isBreak ? <Frown className="w-3.5 h-3.5 text-amber-500" /> : <Gift className="w-3.5 h-3.5" />}
                  {isBreak ? '4. اجعلها غير مُرضية (عقد المساءلة أو التكلفة)' : '4. اجعلها مشبعة (المكافأة الفورية)'}
                </div>
                <input
                  type="text"
                  value={reward}
                  onChange={(e) => setReward(e.target.value)}
                  placeholder={isBreak ? 'شريك مساءلة أو عقوبة رمزية فورية عند الانتكاس...' : 'مكافأة فورية محفزة وتسجيل السلسلة'}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-[#0F2854] border border-slate-200 dark:border-[#2A5C9E] text-slate-900 dark:text-[#F8FAFC] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8]"
                />
              </div>
            </div>
          </div>

          {/* التكرار ولون التمييز */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-[#F8FAFC] mb-1">
                تكرار العادة
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as 'daily' | 'weekdays' | 'weekends')}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0F2854] border border-slate-200 dark:border-[#2A5C9E] text-slate-900 dark:text-[#F8FAFC]"
              >
                <option value="daily">كل يوم بدون استثناء (7 أيام بالأسبوع)</option>
                <option value="weekdays">أيام العمل فقط (من الأحد إلى الخميس)</option>
                <option value="weekends">عطلة نهاية الأسبوع فقط</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-[#F8FAFC] mb-1">
                لون التمييز
              </label>
              <div className="flex items-center gap-2 mt-1">
                {['#00A896', '#02C39A', '#F39C12', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316'].map(
                  (c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                        color === c ? 'scale-125 ring-2 ring-slate-400 dark:ring-white' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  )
                )}
              </div>
            </div>
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#2A5C9E]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#2A5C9E]/50 rounded-xl transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-black text-white bg-gradient-to-r from-[#00A896] to-[#02C39A] hover:opacity-95 rounded-xl shadow-md shadow-[#00A896]/20 transition-all hover:scale-102 cursor-pointer font-['Cairo']"
            >
              {initialHabit ? 'حفظ التعديلات' : 'تثبيت نظام العادة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
