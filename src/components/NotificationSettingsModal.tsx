import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faBellSlash,
  faCircleCheck,
  faTriangleExclamation,
  faXmark,
  faPaperPlane,
  faWandMagicSparkles,
  faClock,
  faLaptop,
} from '../lib/icons';
import {
  isBrowserNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  isLocalNotificationEnabled,
  setLocalNotificationEnabled,
  getNotificationInterval,
  setNotificationInterval,
  sendTestNotificationNow,
} from '../lib/localNotificationService';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (enabled: boolean) => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  onStatusChange,
}) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [intervalMin, setIntervalMin] = useState<number>(60);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const supported = isBrowserNotificationSupported();

  useEffect(() => {
    if (!isOpen) return;

    setPermission(getNotificationPermission());
    setIsEnabled(isLocalNotificationEnabled());
    setIntervalMin(getNotificationInterval());
    setStatusMessage(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggle = async () => {
    setStatusMessage(null);

    if (isEnabled) {
      // إيقاف التنبيهات
      setLocalNotificationEnabled(false);
      setIsEnabled(false);
      onStatusChange?.(false);
      setStatusMessage({
        type: 'success',
        text: 'تم إيقاف التنبيهات المحلية في المتصفح.',
      });
    } else {
      // طلب الإذن والتفعيل
      const granted = await requestNotificationPermission();
      setPermission(getNotificationPermission());

      if (granted) {
        setIsEnabled(true);
        onStatusChange?.(true);
        setStatusMessage({
          type: 'success',
          text: 'تم تفعيل التنبيهات المحلية بنجاح! سيقوم المتصفح بتذكيرك بعاداتك أثناء عملك.',
        });
      } else {
        setIsEnabled(false);
        onStatusChange?.(false);
        setStatusMessage({
          type: 'error',
          text: 'لم يتم منح إذن الإشعارات من المتصفح. يرجى السماح بالإشعارات من شريط العنوان.',
        });
      }
    }
  };

  const handleIntervalChange = (val: number) => {
    setIntervalMin(val);
    setNotificationInterval(val);
  };

  const handleTestNotification = () => {
    const ok = sendTestNotificationNow();
    if (ok) {
      setStatusMessage({
        type: 'success',
        text: 'تم إرسال إشعار تجريبي بنجاح! تفقّد زاوية الشاشة أو مركز الإشعارات.',
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: 'تعذر إرسال الإشعار. تأكد من تفعيل إذن الإشعارات في المتصفح أولاً.',
      });
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
          aria-label="إغلاق"
        >
          <FontAwesomeIcon icon={faXmark} className="w-5 h-5" aria-hidden="true" />
        </button>

        {/* رأس النافذة */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-[#00A896] to-[#02C39A] text-white shadow-lg shadow-[#00A896]/20">
            {isEnabled ? (
              <FontAwesomeIcon icon={faBell} className="w-6 h-6 text-[#F39C12] animate-bounce" aria-hidden="true" />
            ) : (
              <FontAwesomeIcon icon={faBell} className="w-6 h-6" aria-hidden="true" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-black text-white">تنبيهات المتصفح المحلية</h3>
            <p className="text-xs text-[#94A3B8]">
              تذكيرات فورية في المتصفح (Web Notifications API) دون خوادم خارجية
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
              <FontAwesomeIcon icon={faCircleCheck} className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" aria-hidden="true" />
            ) : (
              <FontAwesomeIcon icon={faTriangleExclamation} className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" aria-hidden="true" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* فحص توافق المتصفح */}
        {!supported ? (
          <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs mb-4">
            <p className="font-bold mb-1">المتصفح لا يدعم التنبيهات المباشرة</p>
            <p className="text-[11px] text-amber-300">
              يرجى استخدام متصفح حديث مثل Google Chrome أو Microsoft Edge أو Safari لتفعيل التذكيرات.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* بطاقة التبديل الأساسية */}
            <div className="p-4 rounded-2xl bg-[#0F2854] border border-[#2A5C9E]/70 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-sm font-bold text-white block">
                  تفعيل تذكير العادات في المتصفح
                </span>
                <span className="text-xs text-[#94A3B8] block">
                  {isEnabled
                    ? 'التنبيهات مفعلة وستذكرك بالعادات غير المنجزة'
                    : 'تلقي إشعار نظام دوري لتذكيرك بإنجاز عاداتك'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleToggle}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isEnabled ? 'bg-[#00A896]' : 'bg-[#1C4D8D]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isEnabled ? '-translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* حالة الإذن من المتصفح */}
            {permission === 'denied' && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <FontAwesomeIcon icon={faBellSlash} className="w-4 h-4 text-rose-400" aria-hidden="true" />
                  <span>الإشعارات محظورة في إعدادات المتصفح</span>
                </div>
                <p className="text-[11px] text-rose-300/90 leading-relaxed">
                  تم حظر التنبيهات مسبقاً. لتمكينها، انقر على أيقونة الإعدادات/القفل بجانب شريط العنوان في المتصفح واختر "السماح بالإشعارات".
                </p>
              </div>
            )}

            {/* خيارات تكرار التذكير */}
            {isEnabled && (
              <div className="p-4 rounded-2xl bg-[#0F2854] border border-[#2A5C9E]/70 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <FontAwesomeIcon icon={faClock} className="w-4 h-4 text-[#02C39A]" aria-hidden="true" />
                  <span>تكرار التذكير أثناء فتح المتصفح:</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'كل 30 دقيقة', val: 30 },
                    { label: 'كل ساعة', val: 60 },
                    { label: 'كل ساعتين', val: 120 },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => handleIntervalChange(opt.val)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                        intervalMin === opt.val
                          ? 'bg-[#00A896] border-[#02C39A] text-white shadow-xs'
                          : 'bg-[#1C4D8D] border-[#2A5C9E] text-[#94A3B8] hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* زر إرسال إشعار تجريبي */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleTestNotification}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0F2854] hover:bg-[#0F2854]/80 border border-[#2A5C9E] text-xs font-bold text-[#E2E8F0] hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <FontAwesomeIcon icon={faPaperPlane} className="w-4 h-4 text-[#00A896]" aria-hidden="true" />
                <span>إرسال إشعار تجريبي لمتصفحي الآن</span>
              </button>
            </div>

            {/* ميزة العمل المحلي المباشر */}
            <div className="p-3 rounded-xl bg-[#0F2854]/40 border border-[#2A5C9E]/40 flex items-center gap-2 text-[11px] text-[#94A3B8]">
              <FontAwesomeIcon icon={faLaptop} className="w-4 h-4 text-[#02C39A] shrink-0" aria-hidden="true" />
              <span>
                تنبيهات فورية تعمل مباشرة في متصفحك دون الحاجة لاتصال خوادم أو مهام Cron خارجية.
              </span>
            </div>

            {/* اقتباس تحفيزي */}
            <div className="pt-2 text-center border-t border-[#2A5C9E]/50">
              <p className="text-[11px] text-[#94A3B8] flex items-center justify-center gap-1.5">
                <FontAwesomeIcon icon={faWandMagicSparkles} className="w-3.5 h-3.5 text-[#F39C12]" aria-hidden="true" />
                <span>القانون الأول لتغيير السلوك: اجعل الإشارة واضحة ومباشرة.</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
