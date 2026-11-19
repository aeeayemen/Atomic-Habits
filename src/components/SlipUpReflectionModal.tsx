import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShieldHalved,
  faXmark,
  faWandMagicSparkles,
  faFloppyDisk,
  faTriangleExclamation,
  faClock,
  faMoon,
  faUsers,
  faBolt,
} from '../lib/icons';

interface SlipUpReflectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  habitName: string;
  date: string;
  existingNotes?: string;
  onSave: (notes: string) => void;
  onCancelSlipUp?: () => void;
}

const COMMON_TRIGGERS = [
  { id: 'stress', label: 'توتر وضغط نفسي', icon: faTriangleExclamation, tip: 'اجعلها غير جذابة: تذكر أن الراحة لحظية والندم يدوم' },
  { id: 'boredom', label: 'ملل وفراغ ذهني', icon: faClock, tip: 'اجعلها خفية: استبدل الفراغ بعادة بديلة إيجابية' },
  { id: 'fatigue', label: 'إرهاق وقلة نوم', icon: faMoon, tip: 'اجعلها صعبة: ابتعد عن بيئة الإغراء فور الشعور بالتعب' },
  { id: 'environment', label: 'مؤثر بيئي أو رفقاء', icon: faUsers, tip: 'غيّر البيئة المحيطة لتجعل الإشارة مستحيلة الظهور' },
  { id: 'craving', label: 'إغراء أو رغبة مفاجئة', icon: faBolt, tip: 'طبّق قاعدة الـ 10 دقائق: انتظر 10 دقائق قبل الاستجابة' },
];

export const SlipUpReflectionModal: React.FC<SlipUpReflectionModalProps> = ({
  isOpen,
  onClose,
  habitName,
  date,
  existingNotes = '',
  onSave,
  onCancelSlipUp,
}) => {
  const [selectedTrigger, setSelectedTrigger] = useState<string>('');
  const [reflectionText, setReflectionText] = useState(existingNotes);

  if (!isOpen) return null;

  const handleSave = () => {
    let fullNote = reflectionText.trim();
    if (selectedTrigger) {
      const triggerLabel = COMMON_TRIGGERS.find((t) => t.id === selectedTrigger)?.label;
      fullNote = triggerLabel ? `[محفز: ${triggerLabel}] ${fullNote}` : fullNote;
    }
    onSave(fullNote);
    onClose();
  };

  const activeTrigger = COMMON_TRIGGERS.find((t) => t.id === selectedTrigger);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#1C4D8D] rounded-3xl border border-rose-500/30 dark:border-rose-500/40 shadow-2xl p-6 text-right">
        {/* الترويسة */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#2A5C9E]">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-500 dark:text-amber-400 shrink-0">
              <FontAwesomeIcon icon={faShieldHalved} className="w-5 h-5 shrink-0" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-[#F8FAFC] flex items-center gap-1.5">
                <span>تسجيل زلة / انتكاسة عابرة</span>
                <FontAwesomeIcon icon={faShieldHalved} className="w-3.5 h-3.5 text-amber-500 shrink-0" aria-hidden="true" />
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                {habitName} · {date}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 dark:text-[#94A3B8] hover:text-slate-600 dark:hover:text-[#F8FAFC] rounded-lg hover:bg-slate-100 dark:hover:bg-[#2A5C9E]/50 transition-colors cursor-pointer shrink-0"
            aria-label="إغلاق"
          >
            <FontAwesomeIcon icon={faXmark} className="w-5 h-5 shrink-0" aria-hidden="true" />
          </button>
        </div>

        {/* رسالة الحكمة من جيمس كلير */}
        <div className="mt-4 p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25">
          <p className="text-xs text-amber-700 dark:text-amber-300 font-bold leading-relaxed">
            ⚡ «التعثر ليوم واحد حادث عابر، أما التعثر ليومين فهو بداية عادة جديدة. لا تلم نفسك، بل افهم المحفز وعد إلى مسارك فوراً!»
          </p>
        </div>

        {/* خيارات المحفز الأكثر شيوعاً */}
        <div className="mt-4 space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-[#CBD5E1]">
            ما هو المحفز الأساسي الذي أدى للزلة؟
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {COMMON_TRIGGERS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTrigger(selectedTrigger === t.id ? '' : t.id)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  selectedTrigger === t.id
                    ? 'bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/30'
                    : 'bg-slate-50 dark:bg-[#0F2854]/60 border-slate-200 dark:border-[#2A5C9E] text-slate-600 dark:text-[#94A3B8] hover:border-amber-400'
                }`}
              >
                <span>{t.label}</span>
                <FontAwesomeIcon icon={t.icon} className="w-3.5 h-3.5 shrink-0 opacity-80" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>

        {/* نصيحة القانون المعكوس المستهدفة */}
        {activeTrigger && (
          <div className="mt-3 p-3 rounded-xl bg-[#00A896]/10 border border-[#00A896]/30 text-[#00A896] dark:text-[#02C39A] text-xs flex items-center gap-2">
            <FontAwesomeIcon icon={faWandMagicSparkles} className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>نصيحة القانون المعكوس: {activeTrigger.tip}</span>
          </div>
        )}

        {/* حقل التدوين والتأمل السلوكي */}
        <div className="mt-4 space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-[#CBD5E1]">
            تأمل وتدوين سريع (ما الذي حدث؟ وكيف تجعلها أصعب المرة القادمة؟)
          </label>
          <textarea
            value={reflectionText}
            onChange={(e) => setReflectionText(e.target.value)}
            rows={3}
            placeholder="مثال: تركت الهاتف بجانبي قبل النوم.. في المرة القادمة سأضعه في غرفة أخرى قبل العاشرة مساءً."
            className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-[#0F2854] border border-slate-200 dark:border-[#2A5C9E] text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all placeholder:text-slate-400 dark:placeholder:text-[#94A3B8]"
          />
        </div>

        {/* أزرار الإجراءات */}
        <div className="mt-5 flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-[#2A5C9E]">
          {onCancelSlipUp && (
            <button
              type="button"
              onClick={() => {
                onCancelSlipUp();
                onClose();
              }}
              className="px-3 py-2 text-xs font-bold text-slate-500 dark:text-[#94A3B8] hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
            >
              تراجع (لم أتعثر!)
            </button>
          )}

          <div className="flex items-center gap-2 mr-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-[#2A5C9E] bg-white dark:bg-[#0F2854] text-slate-600 dark:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#1C4D8D] transition-colors cursor-pointer"
            >
              إلغاء
            </button>

            <button
              type="submit"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-95 text-white font-black text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer shrink-0"
            >
              <FontAwesomeIcon icon={faFloppyDisk} className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>حفظ التدوين والزلة</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
