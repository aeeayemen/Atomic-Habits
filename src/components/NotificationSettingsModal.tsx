import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  BellOff,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Send,
  Sparkles,
  Smartphone,
  Laptop,
} from 'lucide-react';
import {
  isPushNotificationSupported,
  getNotificationPermissionState,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  checkIsUserSubscribed,
  triggerLocalTestNotification,
} from '../lib/pushService';
import type { User } from '@supabase/supabase-js';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User | null;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const supported = isPushNotificationSupported();

  useEffect(() => {
    if (!isOpen) return;

    setPermission(getNotificationPermissionState());
    checkIsUserSubscribed().then((subbed) => {
      setIsSubscribed(subbed);
    });
    setStatusMessage(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleSubscription = async () => {
    if (!currentUser) {
      setStatusMessage({
        type: 'error',
        text: 'يرجى تسجيل الدخول أولاً لتفعيل وتخصيص إشعارات العادات بحسابك.',
      });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    try {
      if (isSubscribed) {
        // إلغاء الاشتراك
        const ok = await unsubscribeFromPushNotifications(currentUser.id);
        if (ok) {
          setIsSubscribed(false);
          setStatusMessage({
            type: 'success',
            text: 'تم إلغاء تفعيل الإشعارات على هذا الجهاز بنجاح.',
          });
        }
      } else {
        // الاشتراك
        const res = await subscribeToPushNotifications(currentUser.id);
        setPermission(getNotificationPermissionState());

        if (res.success) {
          setIsSubscribed(true);
          setStatusMessage({
            type: 'success',
            text: 'تم تفعيل التذكيرات اليومية بنجاح! ستصلك التنبيهات حتى عند إغلاق المتصفح.',
          });
        } else {
          setStatusMessage({
            type: 'error',
            text: res.error || 'تعذر تفعيل التنبيهات. يرجى مراجعة إذن المتصفح.',
          });
        }
      }
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'حدث خطأ أثناء معالجة اشتراك الإشعارات.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    setIsTesting(true);
    try {
      const ok = await triggerLocalTestNotification();
      if (ok) {
        setStatusMessage({
          type: 'success',
          text: 'تم إرسال إشعار تجريبي بنجاح! تفقّد مركز الإشعارات في جهازك.',
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: 'تعذر إرسال الإشعار التجريبي. تأكد من تفعيل إذن الإشعارات.',
        });
      }
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-[#1C4D8D] border border-[#2A5C9E] rounded-3xl w-full max-w-md p-6 shadow-2xl shadow-black/40 text-[#F8FAFC] relative">
        {/* زر الإغلاق */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-1.5 rounded-xl text-[#94A3B8] hover:text-white hover:bg-[#0F2854] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* رأس النافذة */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-[#00A896] to-[#02C39A] text-white shadow-lg shadow-[#00A896]/20">
            {isSubscribed ? (
              <BellRing className="w-6 h-6 text-[#F39C12] animate-bounce" />
            ) : (
              <Bell className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-black text-white">إشعارات وتذكيرات العادات</h3>
            <p className="text-xs text-[#94A3B8]">
              Web Push Notifications تعمل في الخلفية حتى بعد إغلاق المتصفح
            </p>
          </div>
        </div>

        {/* رسائل التنبيه والنجاح */}
        {statusMessage && (
          <div
            className={`flex items-start gap-2.5 p-3.5 mb-5 rounded-2xl text-xs leading-relaxed animate-in fade-in duration-200 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-200'
                : 'bg-rose-500/15 border border-rose-500/30 text-rose-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* فحص توافق المتصفح */}
        {!supported ? (
          <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs mb-4">
            <p className="font-bold mb-1">المتصفح لا يدعم التنبيهات المباشرة</p>
            <p className="text-[11px] text-amber-300">
              يرجى استخدام متصفح حديث مثل Google Chrome أو Microsoft Edge أو Safari للحصول على التذكيرات.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* بطاقة التبديل الأساسية */}
            <div className="p-4 rounded-2xl bg-[#0F2854] border border-[#2A5C9E]/70 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-sm font-bold text-white block">
                  تفعيل التذكير اليومي الذكي
                </span>
                <span className="text-xs text-[#94A3B8] block">
                  {isSubscribed
                    ? 'التنبيهات مفعلة وجاهزة لتذكيرك بعاداتك'
                    : 'تلقي تنبيه قبل انقضاء اليوم لحماية سلاسلك'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleToggleSubscription}
                disabled={isLoading}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                  isSubscribed ? 'bg-[#00A896]' : 'bg-[#1C4D8D]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isSubscribed ? '-translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* حالة الإذن من المتصفح */}
            {permission === 'denied' && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <BellOff className="w-4 h-4 text-rose-400" />
                  <span>الإشعارات محظورة في إعدادات المتصفح</span>
                </div>
                <p className="text-[11px] text-rose-300/90 leading-relaxed">
                  لقد تم حظر الإشعارات مسبقاً. لتمكينها، انقر على أيقونة القفل أو الإعدادات بجانب شريط العنوان في المتصفح، ثم اختر "السماح بالإشعارات".
                </p>
              </div>
            )}

            {/* ميزات التنبيهات المعتمدة */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="p-3 rounded-xl bg-[#0F2854]/60 border border-[#2A5C9E]/40 text-center">
                <Laptop className="w-5 h-5 text-[#02C39A] mx-auto mb-1" />
                <span className="text-xs font-bold text-white block">حاسوب وMac</span>
                <span className="text-[10px] text-[#94A3B8]">تنبيهات النظام الأصلية</span>
              </div>
              <div className="p-3 rounded-xl bg-[#0F2854]/60 border border-[#2A5C9E]/40 text-center">
                <Smartphone className="w-5 h-5 text-[#02C39A] mx-auto mb-1" />
                <span className="text-xs font-bold text-white block">أندرويد وiOS</span>
                <span className="text-[10px] text-[#94A3B8]">إشعارات PWA والشاشة</span>
              </div>
            </div>

            {/* زر إرسال إشعار تجريبي */}
            {isSubscribed && (
              <button
                type="button"
                onClick={handleTestNotification}
                disabled={isTesting}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0F2854] hover:bg-[#0F2854]/80 border border-[#2A5C9E] text-xs font-bold text-[#E2E8F0] hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#02C39A]" />
                    <span>جاري الإرسال...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-[#00A896]" />
                    <span>إرسال إشعار تجريبي لجهازي الآن</span>
                  </>
                )}
              </button>
            )}

            {/* اقتباس تحفيزي */}
            <div className="pt-2 text-center border-t border-[#2A5C9E]/50">
              <p className="text-[11px] text-[#94A3B8] flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#F39C12]" />
                <span>القانون الأول لتغيير السلوك: اجعل الإشارة واضحة ومباشرة.</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
