import React, { useRef, useState, useEffect } from 'react';
import {
  Flame,
  Plus,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  FileDown,
  FileUp,
  RefreshCw,
  Loader2,
  LogOut,
  LogIn,
  Bell,
  BellRing,
  Download,
  HelpCircle,
  HardDriveDownload,
  Share2,
  MessageSquarePlus,
  MoreHorizontal,
} from 'lucide-react';
import { soundManager } from '../lib/sound';
import { exportDataAsWordDocx, importDataFromWordDocx } from '../lib/wordService';
import type { User } from '@supabase/supabase-js';
import { SyncStatusBadge } from './SyncStatusBadge';

interface HeaderProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenNewHabitModal: () => void;
  onResetData: () => void;
  onDataImported: () => void;
  currentUser?: User | null;
  onSignOut?: () => void;
  onOpenAuthModal?: () => void;
  onOpenNotifications?: () => void;
  isPushActive?: boolean;
  onRestartTour?: () => void;
  onOpenBackup?: () => void;
  onOpenAccountability?: () => void;
  onOpenFeedback?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  soundEnabled,
  onToggleSound,
  onOpenNewHabitModal,
  onResetData,
  onDataImported,
  currentUser,
  onSignOut,
  onOpenAuthModal,
  onOpenNotifications,
  isPushActive = false,
  onRestartTour,
  onOpenBackup,
  onOpenAccountability,
  onOpenFeedback,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // إغلاق قائمة "المزيد" عند النقر خارجها
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // الاستماع لحدث جاهزية تثبيت التطبيق PWA
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      soundManager.playCelebration();
      setDeferredPrompt(null);
    }
  };

  const handleExportWord = async () => {
    try {
      setIsExporting(true);
      await exportDataAsWordDocx();
      soundManager.playCelebration();
    } catch (err) {
      console.error('Word export error:', err);
      alert('حدث خطأ أثناء تصدير مستند Word');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const res = await importDataFromWordDocx(file);
      if (res.success) {
        soundManager.playCelebration();
        onDataImported();
        alert('تم استيراد العادات وسجلاتها بنجاح من مستند Word!');
      } else {
        alert(`فشل استيراد مستند Word: ${res.error}`);
      }
    } catch (err) {
      console.error('Word import error:', err);
      alert('خطأ أثناء قراءة ملف Word المرفوع');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const userInitial = currentUser?.email
    ? currentUser.email.charAt(0).toUpperCase()
    : 'U';

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-[#2A5C9E]">
      {/* Brand Identity */}
      <div data-tour="tour-brand" className="flex items-center gap-3">
        <div className="relative p-2.5 rounded-2xl bg-gradient-to-br from-[#00A896] to-[#02C39A] text-white shadow-lg shadow-[#00A896]/25 shrink-0">
          <Flame className="w-6 h-6 animate-pulse text-[#F39C12] fill-[#F39C12]" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#02C39A] opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00A896]" />
          </span>
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-[#F8FAFC]">
              العادات الذرية
            </h1>
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#00A896]/15 text-[#00A896] dark:text-[#02C39A] border border-[#00A896]/30">
              نسخة احترافية
            </span>
            <SyncStatusBadge userId={currentUser?.id} />
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            محرك الاتساق اليومي، تتبع السلاسل وبناء الهوية الإيجابية
          </p>
        </div>
      </div>

      {/* Streamlined Modern Navigation Controls */}
      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-start md:justify-end">
        {/* 1. الإجراء الرئيسي الأبرز: زر إضافة عادة جديدة */}
        <button
          data-tour="tour-new-habit"
          onClick={onOpenNewHabitModal}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#00A896] to-[#02C39A] hover:opacity-95 text-white font-bold text-xs shadow-md shadow-[#00A896]/25 transition-all hover:scale-102 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>عادة جديدة</span>
        </button>

        {/* 2. زر مشاركة الإنجاز ومساءلة الأصدقاء */}
        {onOpenAccountability && (
          <button
            onClick={onOpenAccountability}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-500/40 dark:border-amber-500/50 bg-amber-500/10 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 dark:hover:bg-amber-500/25 transition-colors shadow-2xs cursor-pointer text-xs font-bold shrink-0"
            title="مشاركة بطاقة الإنجاز ومساءلة الأصدقاء 🤝🔥"
          >
            <Share2 className="w-3.5 h-3.5 text-[#F39C12]" />
            <span className="hidden sm:inline">مشاركة الإنجاز</span>
          </button>
        )}

        {/* 3. زر النسخ الاحتياطي واستعادة البيانات */}
        {onOpenBackup && (
          <button
            onClick={onOpenBackup}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#00A896]/40 dark:border-[#00A896]/50 bg-[#00A896]/10 dark:bg-[#00A896]/20 text-[#00A896] dark:text-[#02C39A] hover:bg-[#00A896]/20 dark:hover:bg-[#00A896]/30 transition-colors shadow-2xs cursor-pointer text-xs font-bold shrink-0"
            title="النسخ الاحتياطي واستعادة البيانات (JSON, CSV, Word)"
          >
            <HardDriveDownload className="w-3.5 h-3.5" />
            <span className="hidden md:inline">النسخ والبيانات</span>
          </button>
        )}

        {/* فاصل جمالي هادئ */}
        <div className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-[#2A5C9E]/60 mx-0.5 shrink-0" />

        {/* 4. إعدادات التنبيهات Web Push */}
        <button
          data-tour="tour-notifications"
          onClick={onOpenNotifications}
          className="relative p-2 rounded-xl border border-slate-200 dark:border-[#2A5C9E] bg-white dark:bg-[#1C4D8D] text-slate-700 dark:text-[#F8FAFC] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2A5C9E]/60 transition-colors shadow-2xs cursor-pointer shrink-0"
          title="إعدادات إشعارات وتذكيرات العادات اليومية"
        >
          {isPushActive ? (
            <>
              <BellRing className="w-4 h-4 text-[#F39C12]" />
              <span className="absolute top-1 left-1 w-2 h-2 rounded-full bg-[#02C39A] ring-1 ring-white dark:ring-[#0F2854]" />
            </>
          ) : (
            <Bell className="w-4 h-4" />
          )}
        </button>

        {/* 5. زر تبديل المظهر (فاتح / مظلم) */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-xl border border-slate-200 dark:border-[#2A5C9E] bg-white dark:bg-[#1C4D8D] text-slate-700 dark:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#2A5C9E]/60 transition-all shadow-2xs cursor-pointer shrink-0"
          title={theme === 'dark' ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع المظلم'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-[#F39C12]" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>

        {/* 6. قائمة "المزيد من الأدوات" المنسدلة للتخلص من التكدس */}
        <div className="relative shrink-0" ref={moreMenuRef}>
          <button
            onClick={() => setIsMoreOpen((prev) => !prev)}
            className={`flex items-center gap-1 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-[#2A5C9E] bg-white dark:bg-[#1C4D8D] text-slate-700 dark:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#2A5C9E]/60 transition-colors shadow-2xs cursor-pointer text-xs font-bold ${
              isMoreOpen ? 'ring-2 ring-[#00A896]' : ''
            }`}
            title="المزيد من الأدوات والإعدادات"
          >
            <MoreHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">المزيد</span>
          </button>

          {isMoreOpen && (
            <div className="absolute left-0 mt-2 w-64 p-2 rounded-2xl bg-white dark:bg-[#0F2854] border-2 border-slate-200 dark:border-[#2A5C9E] shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-xs text-right">
              <div className="px-3 py-1.5 text-[11px] font-black text-slate-500 dark:text-[#94A3B8] border-b border-slate-100 dark:border-[#2A5C9E]/60 mb-1">
                الأدوات والإعدادات الإضافية
              </div>

              {/* تفعيل / كتم الصوت */}
              <button
                onClick={() => {
                  onToggleSound();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 dark:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#1C4D8D] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-[#00A896] dark:text-[#02C39A]" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-400" />
                  )}
                  <span>المؤثرات الصوتية</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#1C4D8D] text-slate-600 dark:text-slate-300">
                  {soundEnabled ? 'مفعل' : 'مكتوم'}
                </span>
              </button>

              {/* ملاحظات التجربة (Feedback) */}
              {onOpenFeedback && (
                <button
                  onClick={() => {
                    setIsMoreOpen(false);
                    onOpenFeedback();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 dark:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#1C4D8D] transition-colors cursor-pointer"
                >
                  <MessageSquarePlus className="w-4 h-4 text-sky-500" />
                  <span>ملاحظات وعوائق التجربة 📝</span>
                </button>
              )}

              {/* دليل الاستخدام والجولة الإرشادية */}
              {onRestartTour && (
                <button
                  onClick={() => {
                    setIsMoreOpen(false);
                    onRestartTour();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 dark:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#1C4D8D] transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4 text-[#F39C12]" />
                  <span>الجولة الإرشادية (شرارة 🔥)</span>
                </button>
              )}

              {/* تصدير تقرير Word */}
              <button
                onClick={() => {
                  setIsMoreOpen(false);
                  handleExportWord();
                }}
                disabled={isExporting}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 dark:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#1C4D8D] transition-colors cursor-pointer"
              >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin text-[#00A896]" /> : <FileDown className="w-4 h-4 text-[#00A896]" />}
                <span>تصدير تقرير Word (.docx)</span>
              </button>

              {/* استيراد من Word */}
              <button
                onClick={() => {
                  setIsMoreOpen(false);
                  fileInputRef.current?.click();
                }}
                disabled={isImporting}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 dark:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#1C4D8D] transition-colors cursor-pointer"
              >
                {isImporting ? <Loader2 className="w-4 h-4 animate-spin text-[#00A896]" /> : <FileUp className="w-4 h-4 text-indigo-400" />}
                <span>استيراد من Word (.docx)</span>
              </button>

              {/* تثبيت PWA إن وُجد */}
              {deferredPrompt && (
                <button
                  onClick={() => {
                    setIsMoreOpen(false);
                    handleInstallPWA();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer font-bold"
                >
                  <Download className="w-4 h-4 text-amber-500" />
                  <span>تثبيت التطبيق على الجهاز 📲</span>
                </button>
              )}

              <div className="my-1 border-t border-slate-100 dark:border-[#2A5C9E]/60" />

              {/* إعادة تعيين العادات النموذجية */}
              <button
                onClick={() => {
                  setIsMoreOpen(false);
                  onResetData();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>إعادة ضبط العادات النموذجية</span>
              </button>
            </div>
          )}
        </div>

        {/* 7. ملف المستخدم وتسجيل الدخول / الخروج */}
        {currentUser ? (
          <div className="flex items-center gap-1.5 bg-[#0F2854]/90 dark:bg-[#0F2854] border border-[#2A5C9E] rounded-xl px-2.5 py-1.5 shadow-2xs shrink-0">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#00A896] to-[#02C39A] text-white flex items-center justify-center text-xs font-black shadow-xs">
              {userInitial}
            </div>
            <span
              className="text-xs font-bold text-slate-200 max-w-[100px] truncate hidden lg:inline-block"
              title={currentUser.email}
              dir="ltr"
            >
              {currentUser.email}
            </span>
            <button
              onClick={onSignOut}
              className="p-1 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 transition-colors cursor-pointer mr-1"
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#00A896] bg-[#00A896]/10 text-[#00A896] dark:text-[#02C39A] hover:bg-[#00A896]/20 transition-colors text-xs font-bold cursor-pointer shrink-0"
            title="تسجيل الدخول / إنشاء حساب"
          >
            <LogIn className="w-4 h-4" />
            <span>دخول</span>
          </button>
        )}

        {/* حقل ملف Word المخفي للاستيراد */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".docx"
          className="hidden"
        />
      </div>
    </header>
  );
};
