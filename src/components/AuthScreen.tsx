import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFire,
  faEnvelope,
  faLock,
  faEye,
  faEyeSlash,
  faRightToBracket,
  faUserPlus,
  faTriangleExclamation,
  faCircleCheck,
  faSpinner,
  faShieldHalved,
  faWandMagicSparkles,
} from '../lib/icons';
import { signInWithEmail, signUpWithEmail } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthScreenProps {
  onAuthSuccess: (user: User, session: Session) => void;
  onContinueAsGuest?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onAuthSuccess,
  onContinueAsGuest,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // التحقق من المدخلات
    if (!email.trim() || !password.trim()) {
      setErrorMessage('يرجى كتابة البريد الإلكتروني وكلمة المرور.');
      return;
    }

    if (mode === 'signup' && password.length < 6) {
      setErrorMessage('يجب أن تتكون كلمة المرور من 6 خانات على الأقل.');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setErrorMessage('كلمتا المرور غير متطابقتين.');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'signin') {
        const { user, session, error } = await signInWithEmail(email.trim(), password);
        if (error) {
          setErrorMessage(error);
        } else if (user && session) {
          setSuccessMessage('تم تسجيل الدخول بنجاح! جاري تحضير عاداتك...');
          setTimeout(() => {
            onAuthSuccess(user, session);
          }, 400);
        }
      } else {
        const { user, session, error } = await signUpWithEmail(email.trim(), password);
        if (error) {
          setErrorMessage(error);
        } else if (user && session) {
          setSuccessMessage('تم إنشاء حسابك وتجهيز عاداتك النموذجية بنجاح!');
          setTimeout(() => {
            onAuthSuccess(user, session);
          }, 600);
        } else if (user && !session) {
          setSuccessMessage('تم إنشاء الحساب! يرجى مراجعة بريدك الإلكتروني لتأكيد التسجيل ثم تسجيل الدخول.');
          setMode('signin');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#0F2854] text-[#F8FAFC] flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-[#00A896] selection:text-white relative overflow-hidden"
    >
      {/* خلفية جمالية بتدرجات خافتة */}
      <div className="absolute top-1/4 -right-32 w-96 h-96 bg-[#00A896]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-[#1C4D8D]/40 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* شارة الهوية والشعار */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3.5 rounded-3xl bg-gradient-to-br from-[#00A896] to-[#02C39A] shadow-xl shadow-[#00A896]/30 mb-4 ring-4 ring-[#00A896]/20">
            <FontAwesomeIcon icon={faFire} className="w-10 h-10 text-[#F39C12] animate-pulse" aria-hidden="true" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
            منظومة العادات الذرية
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] max-w-xs mx-auto leading-relaxed">
            سجّل دخولك لحفظ وتتبع مسار عاداتك وسلاسل إنجازك بمزامنة سحابية آمنة
          </p>
        </div>

        {/* كارت نموذج المصادقة */}
        <div className="bg-[#1C4D8D] border border-[#2A5C9E] rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/40 backdrop-blur-sm">
          {/* أزرار التبديل بين الدخول وإنشاء الحساب */}
          <div className="flex rounded-2xl bg-[#0F2854]/80 p-1 mb-6 border border-[#2A5C9E]/50">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-gradient-to-r from-[#00A896] to-[#02C39A] text-white shadow-md shadow-[#00A896]/25'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <FontAwesomeIcon icon={faRightToBracket} className="w-4 h-4" aria-hidden="true" />
              <span>تسجيل الدخول</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-gradient-to-r from-[#00A896] to-[#02C39A] text-white shadow-md shadow-[#00A896]/25'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <FontAwesomeIcon icon={faUserPlus} className="w-4 h-4" aria-hidden="true" />
              <span>حساب جديد</span>
            </button>
          </div>

          {/* تنبيه الخطأ */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3.5 mb-5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs leading-relaxed animate-in fade-in duration-200">
              <FontAwesomeIcon icon={faTriangleExclamation} className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* تنبيه النجاح */}
          {successMessage && (
            <div className="flex items-start gap-2.5 p-3.5 mb-5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs leading-relaxed animate-in fade-in duration-200">
              <FontAwesomeIcon icon={faCircleCheck} className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" aria-hidden="true" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* نموذج الحقول */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#E2E8F0] mb-1.5">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  dir="ltr"
                  className="w-full px-4 py-2.5 pl-10 bg-[#0F2854] border border-[#2A5C9E] rounded-xl text-white text-sm placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#00A896] focus:border-transparent transition-all"
                />
                <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#E2E8F0] mb-1.5">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  className="w-full px-4 py-2.5 pl-10 pr-10 bg-[#0F2854] border border-[#2A5C9E] rounded-xl text-white text-sm placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#00A896] focus:border-transparent transition-all"
                />
                <FontAwesomeIcon icon={faLock} className="w-4 h-4 text-[#94A3B8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-[#94A3B8] hover:text-white absolute left-2.5 top-1/2 -translate-y-1/2 cursor-pointer transition-colors"
                  title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? (
                    <FontAwesomeIcon icon={faEyeSlash} className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <FontAwesomeIcon icon={faEye} className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-[#E2E8F0] mb-1.5">
                  تأكيد كلمة المرور
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                    className="w-full px-4 py-2.5 pl-10 pr-10 bg-[#0F2854] border border-[#2A5C9E] rounded-xl text-white text-sm placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#00A896] focus:border-transparent transition-all"
                  />
                  <FontAwesomeIcon icon={faShieldHalved} className="w-4 h-4 text-[#94A3B8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#00A896] to-[#02C39A] hover:opacity-95 text-white font-black text-sm shadow-lg shadow-[#00A896]/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01]"
            >
              {isLoading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin className="w-4 h-4" aria-hidden="true" />
                  <span>جاري المعالجة...</span>
                </>
              ) : mode === 'signin' ? (
                <>
                  <FontAwesomeIcon icon={faRightToBracket} className="w-4 h-4" aria-hidden="true" />
                  <span>دخول إلى لوحة المتابعة</span>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faWandMagicSparkles} className="w-4 h-4 text-[#F39C12]" aria-hidden="true" />
                  <span>إنشاء الحساب وبدء الرحلة</span>
                </>
              )}
            </button>
          </form>

          {/* خيار المتابعة كزائر دون اتصال إن وجد */}
          {onContinueAsGuest && (
            <div className="mt-6 pt-5 border-t border-[#2A5C9E]/60 text-center">
              <button
                type="button"
                onClick={onContinueAsGuest}
                className="text-xs font-medium text-[#94A3B8] hover:text-[#02C39A] transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>المتابعة كزائر في الوضع المحلي فقط (دون مزامنة)</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0F2854] border border-[#2A5C9E]">تجربة سريعة</span>
              </button>
            </div>
          )}
        </div>

        {/* مقتبس كتاب العادات الذرية */}
        <div className="mt-6 text-center">
          <p className="text-[11px] text-[#64748B] italic">
            "أنت لا ترتقي لمستوى أهدافك، بل تهبط لمستوى أنظمتك." — جيمس كلير
          </p>
        </div>
      </div>
    </div>
  );
};
