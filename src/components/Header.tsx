import React, { useRef, useState } from 'react';
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
} from 'lucide-react';
import { soundManager } from '../lib/sound';
import { exportDataAsWordDocx, importDataFromWordDocx } from '../lib/wordService';
import type { User } from '@supabase/supabase-js';

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
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // الاستماع لحدث جاهزية تثبيت التطبيق PWA (قبل نافذة التثبيت الافتراضية)
  React.useEffect(() => {
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
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-[#2A5C9E]">
      {/* Brand Identity */}
      <div data-tour="tour-brand" className="flex items-center gap-3">
        <div className="relative p-2.5 rounded-2xl bg-gradient-to-br from-[#00A896] to-[#02C39A] text-white shadow-lg shadow-[#00A896]/25">
          <Flame className="w-6 h-6 animate-pulse text-[#F39C12] fill-[#F39C12]" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#02C39A] opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00A896]" />
          </span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-[#F8FAFC]">
              العادات الذرية
            </h1>
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#00A896]/15 text-[#00A896] dark:text-[#02C39A] border border-[#00A896]/30">
              نسخة احترافية
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
            محرك الاتساق اليومي، تتبع السلاسل وبناء الهوية الإيجابية
          </p>
        </div>
      </div>

      {/* Control Actions & User Profile */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* زر كتم / تفعيل الصوت */}
        <button
          onClick={onToggleSound}
          className="p-2 rounded-xl border border-slate-200 dark:border-[#2A5C9E] bg-white dark:bg-[#1C4D8D] text-slate-600 dark:text-[#F8FAFC] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2A5C9E]/60 transition-colors shadow-2xs cursor-pointer"
          title={soundEnabled ? 'كتم المؤثرات الصوتية' : 'تفعيل المؤثرات الصوتية'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-[#00A896] dark:text-[#02C39A]" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* زر تبديل الوضع المظلم / الفاتح */}
        <button
          onClick={onToggleTheme}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A5C9E] bg-white dark:bg-[#1C4D8D] text-slate-700 dark:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#2A5C9E]/60 transition-all shadow-2xs cursor-pointer"
          title={theme === 'dark' ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع المظلم'}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-[#F39C12]" />
              <span className="text-xs font-bold text-[#F39C12]">فاتح</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-slate-700" />
              <span className="text-xs font-bold text-slate-700">مظلم</span>
            </>
          )}
        </button>

        {/* زر إعدادات التنبيهات Web Push */}
        <button
          data-tour="tour-notifications"
          onClick={onOpenNotifications}
          className="relative p-2 rounded-xl border border-slate-200 dark:border-[#2A5C9E] bg-white dark:bg-[#1C4D8D] text-slate-600 dark:text-[#F8FAFC] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2A5C9E]/60 transition-colors shadow-2xs cursor-pointer"
          title="إعدادات إشعارات وتذكيرات العادات اليومية (Web Push)"
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

        {/* زر النسخ الاحتياطي والاستعادة الشامل (JSON, CSV, Word) */}
        {onOpenBackup && (
          <button
            onClick={onOpenBackup}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#00A896]/40 dark:border-[#00A896]/50 bg-[#00A896]/10 dark:bg-[#00A896]/20 text-[#00A896] dark:text-[#02C39A] hover:bg-[#00A896]/20 dark:hover:bg-[#00A896]/30 transition-colors shadow-2xs cursor-pointer text-xs font-bold"
            title="النسخ الاحتياطي واستعادة البيانات (JSON, CSV, Word)"
          >
            <HardDriveDownload className="w-4 h-4" />
            <span>النسخ والبيانات</span>
          </button>
        )}

        {/* تصدير كملف Word (.docx) */}
        <button
          onClick={handleExportWord}
          disabled={isExporting}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A5C9E] bg-white dark:bg-[#1C4D8D] text-slate-700 dark:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#2A5C9E]/60 transition-colors shadow-2xs cursor-pointer text-xs font-bold"
          title="تصدير تقرير وسجلات العادات في مستند Word (.docx)"
        >
          {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
          <span className="hidden sm:inline">تقرير Word</span>
        </button>

        {/* استيراد من ملف Word (.docx) */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".docx"
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
          className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-[#2A5C9E] bg-white dark:bg-[#1C4D8D] text-slate-700 dark:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#2A5C9E]/60 transition-colors shadow-2xs cursor-pointer text-xs font-bold"
          title="استيراد العادات من مستند Word (.docx)"
        >
          {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
          <span className="hidden sm:inline">استيراد Word</span>
        </button>

        {/* إعادة ضبط البيانات النموذجية */}
        <button
          onClick={onResetData}
          className="p-2 rounded-xl border border-slate-200 dark:border-[#2A5C9E] bg-white dark:bg-[#1C4D8D] text-slate-600 dark:text-[#F8FAFC] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2A5C9E]/60 transition-colors shadow-2xs cursor-pointer"
          title="إعادة تعيين العادات الذرية النموذجية"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* زر تثبيت تطبيق الويب PWA عند توفره */}
        {deferredPrompt && (
          <button
            onClick={handleInstallPWA}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-95 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all hover:scale-102 cursor-pointer animate-pulse"
            title="تثبيت منظومة العادات كتطبيق على جهازك (PWA)"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">تثبيت التطبيق</span>
          </button>
        )}

        {/* زر إعادة تشغيل الجولة الإرشادية */}
        {onRestartTour && (
          <button
            onClick={onRestartTour}
            className="p-2 rounded-xl border border-slate-200 dark:border-[#2A5C9E] bg-white dark:bg-[#1C4D8D] text-slate-600 dark:text-[#F8FAFC] hover:text-[#00A896] dark:hover:text-[#02C39A] hover:bg-slate-100 dark:hover:bg-[#2A5C9E]/60 transition-colors shadow-2xs cursor-pointer"
            title="الجولة الإرشادية ودليل الاستخدام السريع (شرارة 🔥)"
          >
            <HelpCircle className="w-4 h-4 text-[#F39C12]" />
          </button>
        )}

        {/* زر إضافة عادة جديدة */}
        <button
          data-tour="tour-new-habit"
          onClick={onOpenNewHabitModal}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#00A896] to-[#02C39A] hover:opacity-95 text-white font-bold text-xs shadow-md shadow-[#00A896]/20 transition-all hover:scale-102 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>عادة جديدة</span>
        </button>

        {/* ملف المستخدم وقائمة تسجيل الخروج */}
        {currentUser ? (
          <div className="flex items-center gap-1.5 bg-[#0F2854]/90 dark:bg-[#0F2854] border border-[#2A5C9E] rounded-xl px-2.5 py-1.5 shadow-2xs">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#00A896] to-[#02C39A] text-white flex items-center justify-center text-xs font-black shadow-xs">
              {userInitial}
            </div>
            <span
              className="text-xs font-bold text-slate-200 max-w-[120px] truncate hidden md:inline-block"
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
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#00A896] bg-[#00A896]/10 text-[#00A896] dark:text-[#02C39A] hover:bg-[#00A896]/20 transition-colors text-xs font-bold cursor-pointer"
            title="تسجيل الدخول / إنشاء حساب"
          >
            <LogIn className="w-4 h-4" />
            <span>تسجيل الدخول</span>
          </button>
        )}
      </div>
    </header>
  );
};
