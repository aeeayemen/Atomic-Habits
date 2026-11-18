import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { MascotCharacter, type MascotMood } from './MascotCharacter';

export interface TourStep {
  target: string; // CSS selector e.g. '[data-tour="tour-brand"]'
  title: string;
  content: string;
  mood: MascotMood;
  position?: 'top' | 'bottom' | 'center';
}

const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="tour-brand"]',
    title: 'أهلاً بك في منظومة العادات الذرية! 🔥',
    content:
      'أنا «شرارة»، رفيقك الذكي! صُممت هذه المنظومة بناءً على قوانين كتاب العادات الذرية لجيمس كلير لمساعدتك على بناء هوية جديدة من خلال مكاسب صغيرة بنسبة 1% يومياً.',
    mood: 'wave',
    position: 'bottom',
  },
  {
    target: '[data-tour="tour-metrics"]',
    title: 'مؤشرات الاتساق والسلاسل اللحظية 📊',
    content:
      'تابع هنا نبض تقدمك اليومي: نسبة الالتزام العامة، أطول سلسلة إنجاز مستمرة، والشارات التحفيزية التي ستفتحها كلما حافظت على سلاسلك دون انقطاع.',
    mood: 'idea',
    position: 'bottom',
  },
  {
    target: '[data-tour="tour-banner"]',
    title: 'القانون الذهبي: إياك أن تفوت مرتين! ⚡',
    content:
      'التعثر ليوم واحد حادث عابر، أما التعثر ليومين متتاليين فهو بداية عادة سلبية جديدة. هذا الشريط الذكي يرصد أي عادة تعثرت فيها بالأمس ليذكرك بإنجازها اليوم فوراً.',
    mood: 'point',
    position: 'bottom',
  },
  {
    target: '[data-tour="tour-grid"]',
    title: 'شبكة الإنجاز اليومي السريعة 📅',
    content:
      'قلب المنظومة النابض! بنقرة واحدة سريعة (استجابة 0 ثانية)، وثّق إنجازك اليومي، راقب تدرج ألوان السلسلة، واحتفل بالمفرقعات عند كسر الأرقام القياسية.',
    mood: 'proud',
    position: 'top',
  },
  {
    target: '[data-tour="tour-new-habit"]',
    title: 'إضافة عادة ذرية جديدة ➕',
    content:
      'انقر هنا لإضافة عادة مصممة بقوانين السلوك: حدد الهوية ("أنا شخص..."), الإشارة، الروتين، وقاعدة الدقيقتين لجعل البداية سهلة للغاية.',
    mood: 'point',
    position: 'bottom',
  },
  {
    target: '[data-tour="tour-notifications"]',
    title: 'التذكيرات الذكية (Web Push) 🔔',
    content:
      'لا تدع النسيان يكسر سلاسلك! فعّل الإشعارات لتصلك تنبيهات العادات المتبقية حتى بعد إغلاق المتصفح أو على شاشة هاتفك المحمول.',
    mood: 'celebrate',
    position: 'bottom',
  },
];

const TOUR_STORAGE_KEY = 'atomic_habits_onboarding_completed_v1';

interface OnboardingTourProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  forceOpen = false,
  onClose,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // التحقق مما إذا كان المستخدم يزور التطبيق لأول مرة
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (forceOpen) {
      setIsOpen(true);
      setCurrentStepIndex(0);
      return;
    }

    const hasCompleted = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!hasCompleted) {
      // إطلاق الجولة بعد نصف ثانية لمنح الواجهة فرصة للظهور والاستقرار
      const timer = setTimeout(() => {
        setIsOpen(true);
        setCurrentStepIndex(0);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [forceOpen]);

  // تحديث أبعاد وموقع العنصر المستهدف
  const updateTargetRect = useCallback(() => {
    if (!isOpen) return;

    const currentStep = TOUR_STEPS[currentStepIndex];
    if (!currentStep) return;

    const element = document.querySelector(currentStep.target);
    if (element) {
      // تمرير العنصر إلى منتصف الشاشة بسلاسة
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  }, [isOpen, currentStepIndex]);

  useEffect(() => {
    updateTargetRect();
    const handleResize = () => updateTargetRect();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [updateTargetRect]);

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setIsOpen(false);
    onClose?.();
  };

  const handleSkip = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setIsOpen(false);
    onClose?.();
  };

  // دعم التنقل بلوحة المفاتيح
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleSkip();
      if (e.key === 'ArrowLeft') handleNext();
      if (e.key === 'ArrowRight') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex]);

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;

  // احتساب موقع صندوق التلميح (Tooltip) بذكاء لتجنب الخروج عن حدود الشاشة
  const tooltipWidth = Math.min(typeof window !== 'undefined' ? window.innerWidth - 32 : 380, 400);
  const padding = 8;

  let tooltipTop = 0;
  let tooltipLeft = 0;

  if (targetRect) {
    const isTargetInUpperHalf = targetRect.top < (typeof window !== 'undefined' ? window.innerHeight / 2 : 400);

    // إذا كان العنصر في النصف العلوي نضع التلميح أسفله، والعكس صحيح
    if (isTargetInUpperHalf || currentStep.position === 'bottom') {
      tooltipTop = targetRect.bottom + 16;
    } else {
      tooltipTop = Math.max(16, targetRect.top - 240);
    }

    // توسط أفقي مع ضمان عدم الخروج عن حواف الشاشة
    const centerLeft = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
    const maxLeft = (typeof window !== 'undefined' ? window.innerWidth : 800) - tooltipWidth - 16;
    tooltipLeft = Math.max(16, Math.min(centerLeft, maxLeft));
  } else {
    // تمركز تلقائي عند عدم العثور على العنصر
    tooltipTop = (typeof window !== 'undefined' ? window.innerHeight / 2 - 120 : 250);
    tooltipLeft = (typeof window !== 'undefined' ? window.innerWidth / 2 - tooltipWidth / 2 : 50);
  }

  return (
    <div dir="rtl" className="fixed inset-0 z-[9999] overflow-hidden select-none animate-in fade-in duration-200">
      {/* 1. طبقة التعتيم مع فتحة الضوء السحرية (SVG Spotlight Cutout Mask) */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-auto cursor-default"
        style={{ zIndex: 9999 }}
        onClick={handleNext}
      >
        <defs>
          <mask id="tour-spotlight-mask">
            {/* الشاشة بالكامل بيضاء (معتمة) */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* ثقب شفاف مستدير حول العنصر المحدد */}
            {targetRect && (
              <rect
                x={targetRect.left - padding}
                y={targetRect.top - padding}
                width={targetRect.width + padding * 2}
                height={targetRect.height + padding * 2}
                rx="16"
                fill="black"
              />
            )}
          </mask>
        </defs>

        {/* مستطيل الخلفية الداكن بلون التطبيق الكحلي المظلم */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="#0F2854"
          fillOpacity="0.82"
          mask="url(#tour-spotlight-mask)"
        />
      </svg>

      {/* 2. إطار الضوء المتوهج والنابض حول العنصر المحدد */}
      {targetRect && (
        <div
          className="fixed pointer-events-none rounded-2xl border-2 border-[#00A896] ring-4 ring-[#00A896]/30 shadow-[0_0_35px_rgba(0,168,150,0.45)] transition-all duration-300 ease-out z-[10000]"
          style={{
            top: targetRect.top - padding,
            left: targetRect.left - padding,
            width: targetRect.width + padding * 2,
            height: targetRect.height + padding * 2,
          }}
        />
      )}

      {/* 3. صندوق التلميح الأنيق مع شخصية "شرارة" اللطيفة */}
      <div
        className="fixed z-[10001] transition-all duration-300 ease-out"
        style={{
          top: tooltipTop,
          left: tooltipLeft,
          width: tooltipWidth,
        }}
      >
        {/* شخصية "شرارة" تقف بأعلى الصندوق تلوح أو ترشد */}
        <div className="absolute -top-16 -right-3 z-10 animate-bounce duration-1000 pointer-events-none">
          <MascotCharacter mood={currentStep.mood} size={88} />
        </div>

        {/* كارت التلميح المتناسق مع هوية التطبيق */}
        <div className="bg-[#1C4D8D] border-2 border-[#2A5C9E] rounded-3xl p-5 sm:p-6 shadow-2xl shadow-black/60 text-[#F8FAFC] backdrop-blur-md relative overflow-hidden">
          {/* زخرفة خلفية بلون التيل الخافت */}
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-[#00A896]/15 rounded-full blur-2xl pointer-events-none" />

          {/* رأس الكارت: شارة الخطوة وزر الإغلاق */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0F2854] border border-[#2A5C9E] text-[11px] font-black text-[#02C39A]">
              <Sparkles className="w-3.5 h-3.5 text-[#F39C12]" />
              <span>
                خطوة {currentStepIndex + 1} من {TOUR_STEPS.length}
              </span>
            </div>

            <button
              onClick={handleSkip}
              className="p-1 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#0F2854] transition-colors cursor-pointer"
              title="تخطي الجولة"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* العنوان والمحتوى التوجيهي */}
          <h4 className="text-base font-black text-white mb-2 tracking-tight">
            {currentStep.title}
          </h4>
          <p className="text-xs text-[#CBD5E1] leading-relaxed mb-5">
            {currentStep.content}
          </p>

          {/* أزرار التنقل (السابق، التالي / إنهاء، وتخطي) */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#2A5C9E]/60">
            <button
              type="button"
              onClick={handleSkip}
              className="text-xs font-bold text-[#94A3B8] hover:text-[#E2E8F0] transition-colors cursor-pointer"
            >
              تخطي
            </button>

            <div className="flex items-center gap-2">
              {!isFirstStep && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#2A5C9E] bg-[#0F2854] text-xs font-bold text-[#E2E8F0] hover:text-white hover:bg-[#0F2854]/80 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>السابق</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#00A896] to-[#02C39A] hover:opacity-95 text-white font-black text-xs shadow-md shadow-[#00A896]/30 transition-all hover:scale-102 cursor-pointer"
              >
                {isLastStep ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>ابدأ رحلتك! 🚀</span>
                  </>
                ) : (
                  <>
                    <span>التالي</span>
                    <ChevronLeft className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * دالة مساعدة لإعادة تشغيل الجولة يدوياً في أي وقت
 */
export function restartOnboardingTour(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOUR_STORAGE_KEY);
  }
}
