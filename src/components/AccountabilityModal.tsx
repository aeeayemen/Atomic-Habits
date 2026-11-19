import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Flame,
  Shield,
  Sparkles,
  Calendar,
  MessageSquare,
  CheckCircle2,
  Bookmark,
  Trash2,
  TrendingUp,
  HeartHandshake,
} from 'lucide-react';
import type { Habit, HabitLog } from '../types/habit';
import type { AccountabilityCheckIn } from '../types/accountability';
import {
  computeAccountabilitySummary,
  generateShareableSummaryText,
  shareOrCopySummary,
  saveLocalAccountabilityCheckIn,
  loadLocalAccountabilityCheckIns,
  deleteLocalAccountabilityCheckIn,
  saveAccountabilityCheckInToSupabase,
} from '../lib/accountability';
import { MascotCharacter } from './MascotCharacter';
import { soundManager } from '../lib/sound';
import { formatISODate } from '../lib/utils';
import confetti from 'canvas-confetti';

interface AccountabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  allLogs: Record<string, HabitLog>;
  currentUserId?: string;
  userName?: string;
}

export const AccountabilityModal: React.FC<AccountabilityModalProps> = ({
  isOpen,
  onClose,
  habits,
  allLogs,
  currentUserId,
  userName,
}) => {
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');
  const [customMessage, setCustomMessage] = useState('');
  const [includeBuild, setIncludeBuild] = useState(true);
  const [includeBreak, setIncludeBreak] = useState(true);
  const [includeConsistency, setIncludeConsistency] = useState(true);
  const [includeQuote, setIncludeQuote] = useState(true);

  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [history, setHistory] = useState<AccountabilityCheckIn[]>([]);

  // احتساب ملخص الإنجاز اللحظي
  const summary = useMemo(
    () => computeAccountabilitySummary(habits, allLogs, new Date()),
    [habits, allLogs]
  );

  // تحميل سجل بطاقات المساءلة السابقة
  useEffect(() => {
    if (isOpen) {
      const localList = loadLocalAccountabilityCheckIns(currentUserId);
      setHistory(localList);
    }
  }, [isOpen, currentUserId]);

  if (!isOpen) return null;

  // توليد النص الجاهز للمشاركة
  const shareText = generateShareableSummaryText({
    summary,
    customMessage,
    includeBuild,
    includeBreak,
    includeConsistency,
    includeQuote,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // نسخ النص إلى الحافظة
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      soundManager.playSuccess();
      showToast('تم نسخ ملخص المساءلة بنجاح! جاهز للصق في واتساب أو أي تطبيق 📋✨');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('تعذر النسخ التلقائي، يمكنك تحديد النص ونسخه يدوياً.');
    }
  };

  // مشاركة أصلية عبر تطبيقات الهاتف أو المتصفح
  const handleShareNative = async () => {
    const res = await shareOrCopySummary(
      'ملخص إنجازاتي في العادات الذرية (istomic)',
      shareText
    );

    if (res === 'shared' || res === 'copied') {
      soundManager.playCelebration();
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {}

      if (res === 'shared') {
        showToast('تم فتح قائمة المشاركة بنجاح! 🚀');
      } else {
        setCopied(true);
        showToast('تم نسخ الملخص بنجاح إلى الحافظة! 📋✨');
        setTimeout(() => setCopied(false), 2500);
      }
    }
  };

  // حفظ اللقطة في سجل إنجازات المساءلة
  const handleSaveCheckIn = async () => {
    try {
      setIsSaving(true);
      const todayStr = formatISODate(new Date());
      const newCheckIn: AccountabilityCheckIn = {
        id: `checkin_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: currentUserId,
        dateStr: todayStr,
        formattedDate: summary.formattedDate,
        activeStreak: summary.maxActiveStreak,
        cleanStreak: summary.topBreakHabits[0]?.streak || 0,
        todayDone: summary.todayDone,
        todayTotal: summary.todayTotal,
        completionRate: summary.overallConsistencyRate,
        message: customMessage.trim() || undefined,
        highlightedHabit: summary.topBuildHabits[0]?.name || undefined,
        createdAt: new Date().toISOString(),
      };

      // 1. حفظ محلي فوري
      saveLocalAccountabilityCheckIn(newCheckIn, currentUserId);
      setHistory(loadLocalAccountabilityCheckIns(currentUserId));

      // 2. مزامنة سحابية هادئة إذا كان المستخدم مسجلاً
      if (currentUserId) {
        saveAccountabilityCheckInToSupabase(newCheckIn, currentUserId).catch(() => {});
      }

      soundManager.playCelebration();
      showToast('تم حفظ بطاقة المساءلة في سجل إنجازاتك بنجاح! 📌');
    } finally {
      setIsSaving(false);
    }
  };

  // حذف لقطة سابقة
  const handleDeleteCheckIn = (id: string) => {
    deleteLocalAccountabilityCheckIn(id, currentUserId);
    setHistory((prev) => prev.filter((item) => item.id !== id));
    showToast('تم حذف بطاقة المساءلة من السجل.');
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
    >
      {/* التنبيه العائم الفوري (Toast) */}
      {toastMessage && (
        <div className="fixed top-5 z-[60] flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#00A896] to-[#02C39A] text-white font-bold text-xs shadow-xl animate-in slide-in-from-top-4 duration-300">
          <Sparkles className="w-4 h-4 text-[#F39C12]" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="w-full max-w-2xl bg-[#0F2854] border-2 border-[#2A5C9E] rounded-3xl shadow-2xl text-[#F8FAFC] overflow-hidden my-auto max-h-[92vh] flex flex-col font-['Cairo',sans-serif]">
        {/* 1. الترويسة الرئيسية */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#1C4D8D] to-[#0F2854] border-b border-[#2A5C9E] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#00A896]/20 border border-[#00A896]/40 text-[#02C39A]">
              <HeartHandshake className="w-6 h-6 text-[#00A896] dark:text-[#02C39A]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">
                  مشاركة الإنجاز ومساءلة الأصدقاء 🤝🔥
                </h3>
              </div>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                شارك تقدمك وسلاسلك بإيجابية مع صديقك أو شريك المساءلة دون أي ضغوط
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#94A3B8] hover:text-white hover:bg-[#0F2854] transition-colors cursor-pointer"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. تبويبات النافذة (توليد الملخص / السجل السابق) */}
        <div className="flex items-center px-6 pt-3 border-b border-[#2A5C9E]/60 bg-[#1C4D8D]/40 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('generate')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-bold text-xs transition-colors cursor-pointer ${
              activeTab === 'generate'
                ? 'border-[#00A896] text-[#02C39A]'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>بطاقة الإنجاز والمشاركة</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-bold text-xs transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'border-[#00A896] text-[#02C39A]'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>سجل بطاقاتي ({history.length})</span>
          </button>
        </div>

        {/* 3. جسم النافذة القابل للتمرير */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'generate' ? (
            <>
              {/* شريط المفهوم الإيجابي الصديق */}
              <div className="p-3.5 rounded-2xl bg-[#00A896]/10 border border-[#00A896]/30 text-xs text-[#E2E8F0] leading-relaxed flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-[#F39C12] shrink-0 mt-0.5" />
                <span>
                  <strong>المساءلة الودية:</strong> شراكة دعم وتشجيع إيجابية بين الأصدقاء لتعزيز الاستمرارية،
                  دون كشف تفاصيل حساسة أو ملاحظات شخصية.
                </span>
              </div>

              {/* بطاقة المعاينة المرئية الحية (Live Visual Card) */}
              <div className="relative rounded-3xl p-5 bg-gradient-to-br from-[#1C4D8D] to-[#0F2854] border-2 border-[#2A5C9E] shadow-xl overflow-hidden">
                {/* زخرفة خلفية */}
                <div className="absolute top-0 right-0 w-36 h-36 bg-[#00A896]/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-36 h-36 bg-[#F39C12]/15 rounded-full blur-3xl pointer-events-none" />

                {/* رأس البطاقة */}
                <div className="flex items-center justify-between gap-3 mb-4 relative z-10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00A896] to-[#02C39A] flex items-center justify-center font-black text-white shadow-md shadow-[#00A896]/30 text-sm">
                      ⚡
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">
                        {userName ? `إنجازات ${userName}` : 'منظومة العادات الذرية'}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#02C39A] font-bold">
                        <Calendar className="w-3 h-3" />
                        <span>{summary.formattedDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* شخصية شرارة الصغيرة */}
                  <div className="shrink-0 scale-90">
                    <MascotCharacter mood="proud" size={54} />
                  </div>
                </div>

                {/* مؤشرات التركيز والسلاسل */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4 relative z-10">
                  {/* نسبة الالتزام */}
                  {includeConsistency && (
                    <div className="p-3 rounded-2xl bg-[#0F2854]/80 border border-[#2A5C9E]/70">
                      <div className="flex items-center justify-between text-[11px] text-[#94A3B8] font-bold mb-1">
                        <span>نسبة الالتزام</span>
                        <TrendingUp className="w-3.5 h-3.5 text-[#00A896]" />
                      </div>
                      <div className="text-xl font-black text-[#02C39A]">
                        {summary.overallConsistencyRate}%
                      </div>
                    </div>
                  )}

                  {/* إنجاز اليوم */}
                  {includeConsistency && (
                    <div className="p-3 rounded-2xl bg-[#0F2854]/80 border border-[#2A5C9E]/70">
                      <div className="flex items-center justify-between text-[11px] text-[#94A3B8] font-bold mb-1">
                        <span>إنجاز اليوم</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#00A896]" />
                      </div>
                      <div className="text-xl font-black text-white">
                        {summary.todayDone}{' '}
                        <span className="text-xs text-[#94A3B8] font-bold">
                          / {summary.todayTotal}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* أطول سلسلة نشطة */}
                  <div className="p-3 rounded-2xl bg-[#0F2854]/80 border border-[#2A5C9E]/70 col-span-2 sm:col-span-1">
                    <div className="flex items-center justify-between text-[11px] text-[#94A3B8] font-bold mb-1">
                      <span>أطول سلسلة</span>
                      <Flame className="w-3.5 h-3.5 text-[#F39C12]" />
                    </div>
                    <div className="text-xl font-black text-[#F39C12] flex items-baseline gap-1">
                      <span>{summary.maxActiveStreak}</span>
                      <span className="text-xs text-[#F39C12]/80 font-bold">أيام 🔥</span>
                    </div>
                  </div>
                </div>

                {/* أبرز العادات المستمرة */}
                <div className="space-y-2 mb-3 relative z-10">
                  {includeBuild && summary.topBuildHabits.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-black text-[#02C39A] flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-[#F39C12]" />
                        <span>أبرز سلاسل عادات البناء الإيجابية:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {summary.topBuildHabits.map((h) => (
                          <div
                            key={h.id}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#0F2854] border border-[#2A5C9E] text-xs font-bold text-[#E2E8F0]"
                          >
                            <span>{h.name}</span>
                            <span className="px-1.5 py-0.2 rounded-md bg-[#F39C12]/20 text-[#F39C12] text-[10px]">
                              {h.streak} يوماً 🔥
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {includeBreak && summary.topBreakHabits.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[11px] font-black text-amber-400 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-amber-400" />
                        <span>عادات الإقلاع (أيام نقية بلا زلات):</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {summary.topBreakHabits.map((h) => (
                          <div
                            key={h.id}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#0F2854] border border-amber-500/30 text-xs font-bold text-amber-200"
                          >
                            <span>{h.name}</span>
                            <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-400 text-[10px]">
                              {h.streak} يوماً نقياً 🛡️
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* رسالة العهد المخصصة إن وجدت */}
                {customMessage.trim() && (
                  <div className="p-3 rounded-xl bg-[#0F2854]/90 border border-[#2A5C9E] text-xs text-[#E2E8F0] italic mb-3 relative z-10 flex items-start gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-[#00A896] shrink-0 mt-0.5" />
                    <span>"{customMessage.trim()}"</span>
                  </div>
                )}

                {/* اقتباس جيمس كلير */}
                {includeQuote && (
                  <div className="text-[11px] text-[#94A3B8] pt-2 border-t border-[#2A5C9E]/50 italic relative z-10">
                    {summary.encouragingQuote}
                  </div>
                )}
              </div>

              {/* 4. خيارات التخصيص */}
              <div className="space-y-3">
                <label className="text-xs font-black text-[#F8FAFC]">
                  تخصيص محتوى بطاقة المساءلة:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#1C4D8D]/60 border border-[#2A5C9E] cursor-pointer hover:bg-[#1C4D8D] transition-colors">
                    <input
                      type="checkbox"
                      checked={includeBuild}
                      onChange={(e) => setIncludeBuild(e.target.checked)}
                      className="w-4 h-4 rounded text-[#00A896] focus:ring-[#00A896] cursor-pointer"
                    />
                    <span>سلاسل عادات البناء الإيجابية 🔥</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#1C4D8D]/60 border border-[#2A5C9E] cursor-pointer hover:bg-[#1C4D8D] transition-colors">
                    <input
                      type="checkbox"
                      checked={includeBreak}
                      onChange={(e) => setIncludeBreak(e.target.checked)}
                      className="w-4 h-4 rounded text-[#00A896] focus:ring-[#00A896] cursor-pointer"
                    />
                    <span>أيام النقاء لعادات الإقلاع 🛡️</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#1C4D8D]/60 border border-[#2A5C9E] cursor-pointer hover:bg-[#1C4D8D] transition-colors">
                    <input
                      type="checkbox"
                      checked={includeConsistency}
                      onChange={(e) => setIncludeConsistency(e.target.checked)}
                      className="w-4 h-4 rounded text-[#00A896] focus:ring-[#00A896] cursor-pointer"
                    />
                    <span>نسبة الالتزام وإنجاز اليوم 📊</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#1C4D8D]/60 border border-[#2A5C9E] cursor-pointer hover:bg-[#1C4D8D] transition-colors">
                    <input
                      type="checkbox"
                      checked={includeQuote}
                      onChange={(e) => setIncludeQuote(e.target.checked)}
                      className="w-4 h-4 rounded text-[#00A896] focus:ring-[#00A896] cursor-pointer"
                    />
                    <span>اقتباس تحفيزي من العادات الذرية 💡</span>
                  </label>
                </div>

                {/* كتابة رسالة تحفيزية شخصية */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-bold text-[#CBD5E1] flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#00A896]" />
                    <span>عهد التزام أو رسالة لشريك المساءلة (اختياري):</span>
                  </label>
                  <input
                    type="text"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="مثال: مستمر في القراءة اليومية وجلسة العمل العميق، موعدنا الأحد القادم!"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#1C4D8D] border border-[#2A5C9E] text-white text-xs placeholder:text-[#94A3B8] focus:outline-hidden focus:border-[#00A896] transition-colors"
                  />
                </div>
              </div>
            </>
          ) : (
            /* تبويب السجل السابق */
            <div className="space-y-3">
              {history.length > 0 ? (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-[#1C4D8D]/60 border border-[#2A5C9E] flex items-center justify-between gap-3 hover:bg-[#1C4D8D] transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white">
                          بطاقة {item.formattedDate || item.dateStr}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-[#00A896]/20 text-[#02C39A] text-[10px] font-bold">
                          {item.completionRate}% التزام
                        </span>
                        {item.activeStreak > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-[#F39C12]/20 text-[#F39C12] text-[10px] font-bold">
                            {item.activeStreak} أيام 🔥
                          </span>
                        )}
                      </div>
                      {item.message && (
                        <p className="text-xs text-[#CBD5E1] italic">"{item.message}"</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={async () => {
                          const text = `🔥 بطاقة مساءلة العادات الذرية\n📅 ${item.formattedDate}\n⚡ نسبة الالتزام: ${item.completionRate}%\n🔥 السلسلة: ${item.activeStreak} أيام\n${item.message ? `💬 "${item.message}"\n` : ''}#istomic #عادات_ذرية`;
                          await navigator.clipboard.writeText(text);
                          soundManager.playSuccess();
                          showToast('تم نسخ البطاقة القديمة بنجاح! 📋');
                        }}
                        className="p-2 rounded-xl text-[#94A3B8] hover:text-[#02C39A] hover:bg-[#0F2854] transition-colors cursor-pointer"
                        title="نسخ نص هذه البطاقة"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteCheckIn(item.id)}
                        className="p-2 rounded-xl text-[#94A3B8] hover:text-rose-400 hover:bg-[#0F2854] transition-colors cursor-pointer"
                        title="حذف البطاقة من السجل"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-[#2A5C9E] bg-[#1C4D8D]/20">
                  <Bookmark className="w-10 h-10 text-[#00A896] mx-auto mb-2 opacity-60" />
                  <h4 className="text-sm font-bold text-white mb-1">
                    لا توجد بطاقات مساءلة محفوظة بعد
                  </h4>
                  <p className="text-xs text-[#94A3B8]">
                    يمكنك توليد بطاقتك الأولى والضغط على "حفظ في السجل" لتوثيق محطات التزامك.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 5. شريط الأزرار والإجراءات السريعة */}
        <div className="p-4 sm:p-5 bg-[#0F2854] border-t border-[#2A5C9E] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {/* زر حفظ اللقطة */}
            {activeTab === 'generate' && (
              <button
                type="button"
                onClick={handleSaveCheckIn}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#2A5C9E] bg-[#1C4D8D] hover:bg-[#2A5C9E] text-[#F8FAFC] text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                title="حفظ بطاقة اليوم في سجلك الشخصي للمساءلة"
              >
                <Bookmark className="w-3.5 h-3.5 text-[#00A896]" />
                <span>حفظ في السجل</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* زر نسخ الملخص للنشر السريع */}
            <button
              type="button"
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#00A896]/50 bg-[#00A896]/15 hover:bg-[#00A896]/25 text-[#02C39A] font-bold text-xs transition-all hover:scale-102 cursor-pointer shadow-md"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-[#02C39A]" />
                  <span>تم النسخ! 📋</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>نسخ الملخص للنشر</span>
                </>
              )}
            </button>

            {/* زر المشاركة المباشرة عبر تطبيقات الهاتف / المتصفح */}
            <button
              type="button"
              onClick={handleShareNative}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00A896] to-[#02C39A] hover:opacity-95 text-white font-black text-xs shadow-lg shadow-[#00A896]/30 transition-all hover:scale-102 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>مشاركة مباشرة 🚀</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
