import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark,
  faCommentMedical,
  faPaperPlane,
  faSpinner,
  faCheck,
  faTriangleExclamation,
  faPalette,
  faCompass,
  faWandMagicSparkles,
  faBookmark,
  faTrashCan,
  faDesktop,
} from '../lib/icons';
import type { FeedbackCategory } from '../types/feedback';
import {
  FEEDBACK_CATEGORIES,
  submitBetaFeedback,
  loadLocalFeedbackHistory,
  deleteLocalFeedback,
  getTechnicalContext,
} from '../lib/feedbackService';
import { soundManager } from '../lib/sound';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  userEmail?: string;
  currentSection?: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  userId,
  userEmail,
  currentSection = 'لوحة العادات الرئيسية',
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');
  const [category, setCategory] = useState<FeedbackCategory>('ui');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [history, setHistory] = useState(loadLocalFeedbackHistory());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const context = getTechnicalContext(currentSection);

  useEffect(() => {
    if (isOpen) {
      setHistory(loadLocalFeedbackHistory());
      setIsSuccess(false);
      setMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || message.trim().length < 5) {
      showToast('يرجى كتابة ملاحظة من 5 أحرف على الأقل.');
      return;
    }

    try {
      setIsSubmitting(true);
      await submitBetaFeedback({
        category,
        message,
        userId,
        userEmail,
        currentSection,
      });

      soundManager.playSuccess();
      setIsSuccess(true);
      setHistory(loadLocalFeedbackHistory());
      setMessage('');
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2200);
    } catch {
      showToast('حدث خطأ أثناء الإرسال، تم حفظ الملاحظة محلياً.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    deleteLocalFeedback(id);
    setHistory((prev) => prev.filter((item) => item.id !== id));
    showToast('تم حذف الملاحظة من سجلك المحلي.');
  };

  const getCategoryIcon = (catId: FeedbackCategory) => {
    switch (catId) {
      case 'ui':
        return <FontAwesomeIcon icon={faPalette} className="w-3.5 h-3.5" aria-hidden="true" />;
      case 'flow':
        return <FontAwesomeIcon icon={faCompass} className="w-3.5 h-3.5" aria-hidden="true" />;
      case 'bug':
        return <FontAwesomeIcon icon={faTriangleExclamation} className="w-3.5 h-3.5" aria-hidden="true" />;
      case 'idea':
        return <FontAwesomeIcon icon={faWandMagicSparkles} className="w-3.5 h-3.5" aria-hidden="true" />;
    }
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
    >
      {/* التنبيه العائم الفوري */}
      {toastMessage && (
        <div className="fixed top-5 z-[60] flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#00A896] to-[#02C39A] text-white font-bold text-xs shadow-xl animate-in slide-in-from-top-4 duration-300">
          <FontAwesomeIcon icon={faWandMagicSparkles} className="w-4 h-4 text-[#F39C12]" aria-hidden="true" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="w-full max-w-lg bg-[#0F2854] border-2 border-[#2A5C9E] rounded-3xl shadow-2xl text-[#F8FAFC] overflow-hidden my-auto max-h-[92vh] flex flex-col font-['Cairo',sans-serif]">
        {/* 1. الترويسة الرئيسية */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#1C4D8D] to-[#0F2854] border-b border-[#2A5C9E] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#00A896]/20 border border-[#00A896]/40 text-[#02C39A]">
              <FontAwesomeIcon icon={faCommentMedical} className="w-6 h-6 text-[#00A896] dark:text-[#02C39A]" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                ملاحظات وتجربة النسخة التجريبية (Beta) 📝
              </h3>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                رأيك يساعدنا على تحسين الواجهة وتسهيل بناء العادات
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#94A3B8] hover:text-white hover:bg-[#0F2854] transition-colors cursor-pointer"
            title="إغلاق النافذة"
            aria-label="إغلاق النافذة"
          >
            <FontAwesomeIcon icon={faXmark} className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* 2. التبويبات */}
        <div className="flex items-center px-6 pt-3 border-b border-[#2A5C9E]/60 bg-[#1C4D8D]/40 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 font-bold text-xs transition-colors cursor-pointer ${
              activeTab === 'form'
                ? 'border-[#00A896] text-[#02C39A]'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            <FontAwesomeIcon icon={faCommentMedical} className="w-3.5 h-3.5" aria-hidden="true" />
            <span>إرسال ملاحظة</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 font-bold text-xs transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'border-[#00A896] text-[#02C39A]'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            <FontAwesomeIcon icon={faBookmark} className="w-3.5 h-3.5" aria-hidden="true" />
            <span>ملاحظاتي السابقة ({history.length})</span>
          </button>
        </div>

        {/* 3. جسم النافذة */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'form' ? (
            isSuccess ? (
              /* حالة نجاح الإرسال */
              <div className="py-10 text-center space-y-3 animate-in zoom-in-95 duration-300">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-[#00A896]/20 border-2 border-[#00A896] flex items-center justify-center text-[#02C39A]">
                  <FontAwesomeIcon icon={faCheck} className="w-7 h-7" aria-hidden="true" />
                </div>
                <h4 className="text-base font-black text-white">
                  شكراً جزيلاً لملاحظتك القيمة! 🎉
                </h4>
                <p className="text-xs text-[#CBD5E1] max-w-sm mx-auto leading-relaxed">
                  تم استلام ملاحظتك بنجاح وتوثيق السياق التقني لتحسين التطبيق في التحديث القادم.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* اختيار التصنيف */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-[#F8FAFC]">
                    نوع الملاحظة أو العائق:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {FEEDBACK_CATEGORIES.map((cat) => {
                      const isSelected = category === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategory(cat.id)}
                          className={`flex items-center gap-2 p-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer text-right ${
                            isSelected
                              ? 'bg-[#00A896]/20 border-[#00A896] text-white shadow-md shadow-[#00A896]/20'
                              : 'bg-[#1C4D8D]/60 border-[#2A5C9E] text-[#94A3B8] hover:bg-[#1C4D8D] hover:text-white'
                          }`}
                        >
                          <span
                            className={`p-1.5 rounded-lg ${
                              cat.id === 'bug'
                                ? 'bg-amber-500/20 text-[#F39C12]'
                                : 'bg-[#00A896]/20 text-[#02C39A]'
                            }`}
                          >
                            {getCategoryIcon(cat.id)}
                          </span>
                          <span className="truncate">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* نص الملاحظة */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-[#F8FAFC]">
                    تفاصيل الملاحظة أو العائق:
                  </label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="ما العائق الذي واجهته؟ أو ما الذي شعرت أنه غير واضح أو يحتاج لتحسين في الواجهة أو الخطوات؟"
                    className="w-full p-3.5 rounded-2xl bg-[#1C4D8D] border border-[#2A5C9E] text-white text-xs placeholder:text-[#94A3B8] focus:outline-hidden focus:border-[#00A896] transition-colors resize-none leading-relaxed"
                  />
                  <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
                    <span>كن صريحاً ودقيقاً، كل ملاحظة تصنع فارقاً كبيراً!</span>
                    <span>{message.length} حرف</span>
                  </div>
                </div>

                {/* شريط السياق التقني المرفق تلقائياً */}
                <div className="p-3 rounded-2xl bg-[#1C4D8D]/40 border border-[#2A5C9E]/60 text-[11px] text-[#94A3B8] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#E2E8F0] flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faDesktop} className="w-3.5 h-3.5 text-[#00A896]" aria-hidden="true" />
                      <span>السياق التقني المرفق تلقائياً:</span>
                    </span>
                    <span className="flex items-center gap-1 text-[10px]">
                      {context.isOnline ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-emerald-400 font-bold">متصل</span>
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                          <span className="text-amber-400 font-bold">غير متصل</span>
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[10px]">
                    <span className="px-2 py-0.5 rounded-md bg-[#0F2854] border border-[#2A5C9E]">
                      {context.deviceInfo}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-[#0F2854] border border-[#2A5C9E]">
                      القسم: {currentSection}
                    </span>
                  </div>
                </div>

                {/* أزرار الإجراء */}
                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl border border-[#2A5C9E] bg-[#0F2854] text-xs font-bold text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
                  >
                    إلغاء
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting || message.trim().length < 5}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00A896] to-[#02C39A] hover:opacity-95 text-white font-black text-xs shadow-md shadow-[#00A896]/20 transition-all hover:scale-102 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isSubmitting ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} spin className="w-4 h-4" aria-hidden="true" />
                        <span>جاري الإرسال...</span>
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faPaperPlane} className="w-4 h-4" aria-hidden="true" />
                        <span>إرسال الملاحظة</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )
          ) : (
            /* تبويب السجل السابق */
            <div className="space-y-3">
              {history.length > 0 ? (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-[#1C4D8D]/60 border border-[#2A5C9E] space-y-2 hover:bg-[#1C4D8D] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="p-1 rounded-md bg-[#0F2854] text-[#00A896]">
                          {getCategoryIcon(item.category)}
                        </span>
                        <span className="text-xs font-black text-white">
                          {FEEDBACK_CATEGORIES.find((c) => c.id === item.category)?.label ||
                            item.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#94A3B8]">
                          {new Date(item.createdAt).toLocaleDateString('ar-EG', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 text-[#94A3B8] hover:text-rose-400 transition-colors cursor-pointer"
                          title="حذف من السجل المحلي"
                          aria-label="حذف من السجل المحلي"
                        >
                          <FontAwesomeIcon icon={faTrashCan} className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-[#E2E8F0] leading-relaxed bg-[#0F2854]/70 p-2.5 rounded-xl border border-[#2A5C9E]/50">
                      {item.message}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-[#2A5C9E] bg-[#1C4D8D]/20">
                  <FontAwesomeIcon icon={faBookmark} className="w-10 h-10 text-[#00A896] mx-auto mb-2 opacity-60" aria-hidden="true" />
                  <h4 className="text-sm font-bold text-white mb-1">
                    لم تقم بإرسال أي ملاحظات بعد
                  </h4>
                  <p className="text-xs text-[#94A3B8]">
                    عند إرسال أي ملاحظة أو عائق، ستظهر هنا في سجلك الشخصي.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
