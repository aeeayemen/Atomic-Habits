import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronRight,
  faChevronLeft,
  faXmark,
  faWandMagicSparkles,
  faCircleCheck,
} from '../lib/icons';
import { MascotCharacter, type MascotMood } from './MascotCharacter';

export interface TourStep {
  target: string; // CSS selector
  title: string;
  content: string;
  mood: MascotMood;
  position?: 'top' | 'bottom';
}

const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="tour-brand"]',
    title: 'أهلاً بك في منظومة العادات الذرية! ',
    content:
      'أنا «شرارة»، رفيقك الذكي! صُممت هذه المنظومة بناءً على قوانين كتاب العادات الذرية لجيمس كلير لمساعدتك على بناء هوية جديدة من خلال مكاسب صغيرة بنسبة 1% يومياً.',
    mood: 'wave',
    position: 'bottom',
  },
  {
    target: '[data-tour="tour-metrics"]',
    title: 'مؤشرات الاتساق والسلاسل اللحظية ',
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
    target: '[data-tour="tour-analytics"]',
    title: 'تحليل الأداء والمحفزات السلوكية 🧠',
    content:
      'اكتشف أضعف أيام التزامك خلال الأسبوع، راقب الفترات الحساسة للزلات، وتعرف على أهم المحفزات التي تؤثر على استمرارك لتضع حواجز استباقية تحميك.',
    mood: 'idea',
    position: 'top',
  },
  {
    target: '[data-tour="tour-first-habit"], [data-tour="tour-grid"]',
    title: 'شبكة الإنجاز اليومي السريعة 📅',
    content:
      'قلب المنظومة النابض! بنقرة واحدة سريعة (استجابة 0 ثانية)، وثّق إنجازك اليومي، راقب تدرج ألوان السلسلة، واحتفل بالمفرقعات عند كسر الأرقام القياسية.',
    mood: 'proud',
    position: 'bottom',
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
    title: 'التذكيرات الذكية في المتصفح 🔔',
    content:
      'لا تدع النسيان يكسر سلاسلك! فعّل الإشعارات المحلية لتصلك تنبيهات العادات المتبقية أثناء استخدامك للمتصفح دون الحاجة لخوادم معقدة.',
    mood: 'celebrate',
    position: 'bottom',
  },
];

const TOUR_STORAGE_KEY = 'atomic_habits_onboarding_completed_v1';

interface OnboardingTourProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

// دالة مساعدة للبحث عن أول عنصر يطابق المحددات حسب الأولوية
const findTargetElement = (selector: string): HTMLElement | null => {
  const parts = selector.split(',').map((s) => s.trim());
  for (const part of parts) {
    const el = document.querySelector<HTMLElement>(part);
    if (el) return el;
  }
  return null;
};

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  forceOpen = false,
  onClose,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [measuredTooltipHeight, setMeasuredTooltipHeight] = useState(260);

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
      const timer = setTimeout(() => {
        setIsOpen(true);
        setCurrentStepIndex(0);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [forceOpen]);

  // تمرير العنصر بسلاسة إلى مركز الشاشة عند تغيير الخطوة فقط (دون تكرار أثناء التمرير)
  useEffect(() => {
    if (!isOpen) return;

    const currentStep = TOUR_STEPS[currentStepIndex];
    if (!currentStep) return;

    const element = findTargetElement(currentStep.target);
    if (element) {
      // تمرير العنصر إلى المنتصف العمودي لضمان إبرازه ورؤيته براحة
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // تحديث أولي للموقع
      setTargetRect(element.getBoundingClientRect());

      // مزامنة الإحداثيات بعد استقرار أنيميشن التمرير السلس
      const t1 = setTimeout(() => {
        if (element) setTargetRect(element.getBoundingClientRect());
      }, 100);
      const t2 = setTimeout(() => {
        if (element) setTargetRect(element.getBoundingClientRect());
      }, 300);
      const t3 = setTimeout(() => {
        if (element) setTargetRect(element.getBoundingClientRect());
      }, 500);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    } else {
      setTargetRect(null);
    }
  }, [isOpen, currentStepIndex]);

  // تحديث إحداثيات العنصر فقط عند إعادة التحجيم أو التمرير (دون إعادة استدعاء scrollIntoView)
  const syncTargetRect = useCallback(() => {
    if (!isOpen) return;
    const currentStep = TOUR_STEPS[currentStepIndex];
    if (!currentStep) return;

    const element = findTargetElement(currentStep.target);
    if (element) {
      setTargetRect(element.getBoundingClientRect());
    } else {
      setTargetRect(null);
    }
  }, [isOpen, currentStepIndex]);

  useEffect(() => {
    if (!isOpen) return;

    window.addEventListener('resize', syncTargetRect);
    window.addEventListener('scroll', syncTargetRect, true);

    return () => {
      window.removeEventListener('resize', syncTargetRect);
      window.removeEventListener('scroll', syncTargetRect, true);
    };
  }, [isOpen, syncTargetRect]);

  // قياس الارتفاع الفعلي لصندوق التلميح فور تغييره
  useEffect(() => {
    if (tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect();
      if (rect.height > 0) {
        setMeasuredTooltipHeight(rect.height);
      }
    }
  }, [currentStepIndex, isOpen]);

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

  // أبعاد الشاشة الحقيقية
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  const tooltipWidth = Math.min(viewportWidth - 32, 420);
  const actualTooltipHeight = Math.max(measuredTooltipHeight, 260);
  const padding = 8;

  // مساحة الأمان العلوية لشخصية شرارة (Mascot headroom)
  const mascotHeadroom = 70;
  const minTop = mascotHeadroom;
  const maxTop = Math.max(minTop, viewportHeight - actualTooltipHeight - 20);

  let tooltipTop = minTop;
  let tooltipLeft = Math.max(16, (viewportWidth - tooltipWidth) / 2);

  if (targetRect) {
    const spaceAbove = targetRect.top;
    const spaceBelow = viewportHeight - targetRect.bottom;
    const preferTop = currentStep.position === 'top';

    if (preferTop) {
      if (spaceAbove >= actualTooltipHeight + mascotHeadroom + 16) {
        // مساحة كافية بالأعلى
        tooltipTop = targetRect.top - actualTooltipHeight - 16;
      } else if (spaceBelow >= actualTooltipHeight + 24) {
        // مساحة كافية بالأسفل
        tooltipTop = targetRect.bottom + 16;
      } else {
        // العنصر ضخم أو يشغل منتصف الشاشة: نثبت الصندوق بالأعلى أو الأسفل حسب موقع العنصر
        const elementCenter = (targetRect.top + targetRect.bottom) / 2;
        tooltipTop = elementCenter > viewportHeight / 2 ? minTop : maxTop;
      }
    } else {
      // تفضيل الوضع السفلي الافتراضي
      if (spaceBelow >= actualTooltipHeight + 24) {
        // مساحة كافية بالأسفل
        tooltipTop = targetRect.bottom + 16;
      } else if (spaceAbove >= actualTooltipHeight + mascotHeadroom + 16) {
        // مساحة كافية بالأعلى
        tooltipTop = targetRect.top - actualTooltipHeight - 16;
      } else {
        // العنصر ضخم أو يشغل معظم الشاشة: نثبت بالأعلى أو الأسفل حسب موقع العنصر
        const elementCenter = (targetRect.top + targetRect.bottom) / 2;
        tooltipTop = elementCenter > viewportHeight / 2 ? minTop : maxTop;
      }
    }

    // توسط أفقي مع مراعاة حواف الشاشة
    const centerLeft = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
    tooltipLeft = Math.max(16, Math.min(centerLeft, viewportWidth - tooltipWidth - 16));
  }

  // صمام أمان رياضي صارم: يضمن بقاء صندوق التلميح 100% داخل حدود الشاشة المرئية دائماً
  tooltipTop = Math.max(minTop, Math.min(tooltipTop, maxTop));

  return (
    <div dir="rtl" className="fixed inset-0 z-[9999] pointer-events-none select-none animate-in fade-in duration-200">
      {/* زر إغلاق عائم مضمون الوصول في أي وقت (Esc) في أعلى يسار الشاشة */}
      <button
        type="button"
        onClick={handleSkip}
        className="fixed top-4 left-4 z-[10002] pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0F2854]/95 hover:bg-[#1C4D8D] border border-[#2A5C9E] text-white/90 hover:text-white text-xs font-bold shadow-xl transition-all cursor-pointer backdrop-blur-md hover:scale-105"
        title="إغلاق الجولة الإرشادية"
        aria-label="إغلاق الجولة الإرشادية"
      >
        <FontAwesomeIcon icon={faXmark} className="w-3.5 h-3.5 text-rose-400" aria-hidden="true" />
        <span>إغلاق الجولة (Esc)</span>
      </button>

      {/* 1. طبقة التعتيم مع فتحة الضوء السحرية (SVG Spotlight Cutout Mask) */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-auto cursor-default"
        style={{ zIndex: 9999 }}
        onClick={handleNext}
      >
        <defs>
          <mask id="tour-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
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

      {/* 3. صندوق التلميح الأنيق المضمون الظهور 100% داخل حدود الشاشة */}
      <div
        ref={tooltipRef}
        className="fixed z-[10001] pointer-events-auto transition-all duration-300 ease-out"
        style={{
          top: tooltipTop,
          left: tooltipLeft,
          width: tooltipWidth,
          maxHeight: 'calc(100vh - 32px)',
        }}
      >
        {/* شخصية "شرارة" تقف بأعلى الصندوق وتتكيف مع حافة الشاشة */}
        <div
          className={`absolute z-10 animate-bounce duration-1000 pointer-events-none transition-all ${
            tooltipTop < 80 ? '-top-8 -right-1 scale-80 origin-bottom' : '-top-14 -right-2'
          }`}
        >
          <MascotCharacter mood={currentStep.mood} size={78} />
        </div>

        {/* كارت التلميح المتناسق مع هوية التطبيق */}
        <div className="bg-[#1C4D8D] border-2 border-[#2A5C9E] rounded-3xl p-5 sm:p-6 shadow-2xl shadow-black/70 text-[#F8FAFC] backdrop-blur-md relative overflow-hidden max-h-[calc(100vh-100px)] overflow-y-auto">
          {/* زخرفة خلفية بلون التيل الخافت */}
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-[#00A896]/15 rounded-full blur-2xl pointer-events-none" />

          {/* رأس الكارت: شارة الخطوة وزر الإغلاق */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0F2854] border border-[#2A5C9E] text-[11px] font-black text-[#02C39A]">
              <FontAwesomeIcon icon={faWandMagicSparkles} className="w-3.5 h-3.5 text-[#F39C12]" aria-hidden="true" />
              <span>
                خطوة {currentStepIndex + 1} من {TOUR_STEPS.length}
              </span>
            </div>

            <button
              onClick={handleSkip}
              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#0F2854] transition-colors cursor-pointer"
              title="تخطي الجولة"
              aria-label="تخطي الجولة"
            >
              <FontAwesomeIcon icon={faXmark} className="w-4 h-4" aria-hidden="true" />
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
                  <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4" aria-hidden="true" />
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
                    <FontAwesomeIcon icon={faCircleCheck} className="w-4 h-4 text-white" aria-hidden="true" />
                    <span>ابدأ رحلتك! 🚀</span>
                  </>
                ) : (
                  <>
                    <span>التالي</span>
                    <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" aria-hidden="true" />
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

export function restartOnboardingTour(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOUR_STORAGE_KEY);
  }
}
