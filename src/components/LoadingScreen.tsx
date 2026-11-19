import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFire } from '../lib/icons';

interface LoadingScreenProps {
  onLoaded?: () => void;
  minDuration?: number;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  onLoaded,
  minDuration = 0,
}) => {
  const [progress, setProgress] = useState(minDuration > 0 ? 15 : 100);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isGone, setIsGone] = useState(false);

  useEffect(() => {
    // إذا كانت المدة 0 أو سلبية، تفريغ الشاشة فوراً دون تعطيل
    if (minDuration <= 0) {
      const immediateTimer = setTimeout(() => {
        setIsFadingOut(true);
        setTimeout(() => {
          setIsGone(true);
          onLoaded?.();
        }, 120);
      }, 50);
      return () => clearTimeout(immediateTimer);
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 100;
        }
        const increment = Math.floor(Math.random() * 25) + 15;
        return Math.min(prev + increment, 100);
      });
    }, 100);

    const timer = setTimeout(() => {
      setProgress(100);
      setIsFadingOut(true);
      setTimeout(() => {
        setIsGone(true);
        onLoaded?.();
      }, 200);
    }, minDuration);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [minDuration, onLoaded]);

  if (isGone) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0F2854] text-[#F8FAFC] transition-opacity duration-300 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* خلفية جمالية بتوهج خافت */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#00A896]/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-[#F39C12]/5 blur-2xl" />
      </div>

      {/* الشعار التفاعلي مع الحلقات المضيئة */}
      <div className="relative mb-6">
        <div className="absolute -inset-4 rounded-3xl border border-[#00A896]/30 animate-spin [animation-duration:8s]" />
        <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-[#00A896] to-[#02C39A] opacity-25 blur-md" />

        <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00A896] to-[#02C39A] shadow-xl shadow-[#00A896]/30">
          <FontAwesomeIcon icon={faFire} className="w-10 h-10 text-[#F39C12]" aria-hidden="true" />
          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#02C39A] opacity-80" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-[#00A896] ring-2 ring-[#0F2854]" />
          </span>
        </div>
      </div>

      {/* اسم التطبيق والترويسة */}
      <div className="text-center space-y-1.5 relative z-10 px-4">
        <h1 className="text-2xl font-black tracking-tight text-[#F8FAFC] font-['Cairo']">
          العادات الذرية
        </h1>
        <p className="text-xs text-[#02C39A] font-bold tracking-wide">
          ATOMIC HABITS · محرك الاتساق التراكمي
        </p>
      </div>

      {/* شريط التقدم العصري مع GPU composited transform */}
      <div className="w-64 max-w-xs mt-8 space-y-2 relative z-10">
        <div className="w-full h-1.5 bg-[#1C4D8D] rounded-full overflow-hidden border border-[#2A5C9E]/60 p-0.5">
          <div
            className="h-full bg-gradient-to-r from-[#00A896] via-[#02C39A] to-[#F39C12] rounded-full origin-right transition-transform duration-200"
            style={{ transform: `scaleX(${progress / 100})` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-[#94A3B8] font-bold">
          <span>تهيئة الأنظمة والسلاسل...</span>
          <span className="text-[#02C39A] font-mono">{progress}%</span>
        </div>
      </div>

      {/* مقولة كتاب العادات الذرية */}
      <div className="absolute bottom-8 text-center px-4 max-w-md">
        <p className="text-xs text-[#94A3B8] italic font-medium">
          «التحسن بنسبة 1% يومياً يجعلك أفضل بـ 37 ضعفاً بنهاية العام.»
        </p>
        <span className="text-[10px] text-[#00A896] font-bold mt-1 inline-block">
          — جيمس كلير
        </span>
      </div>
    </div>
  );
};
