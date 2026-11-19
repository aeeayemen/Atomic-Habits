import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark,
  faDownload,
  faUpload,
  faFileCode,
  faFileExcel,
  faFileWord,
  faCircleCheck,
  faTriangleExclamation,
  faSpinner,
  faHardDrive,
  faWandMagicSparkles,
  faShieldHalved,
  faFloppyDisk,
} from '../lib/icons';
import type { Habit, HabitLog } from '../types/habit';
import {
  exportBackupAsJSON,
  exportBackupAsCSV,
  parseJSONBackup,
  parseCSVBackup,
  type ParsedImportResult,
} from '../lib/backupService';
import { soundManager } from '../lib/sound';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  allLogs: Record<string, HabitLog>;
  currentUserId?: string;
  onRestoreData: (
    importedHabits: Habit[],
    importedLogs: HabitLog[],
    mode: 'merge' | 'replace'
  ) => Promise<void>;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  habits,
  allLogs,
  currentUserId,
  onRestoreData,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [isExporting, setIsExporting] = useState<string | null>(null);

  // Import states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParsedImportResult | null>(null);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handlers for Exports
  const handleExportJSON = () => {
    try {
      setIsExporting('json');
      exportBackupAsJSON(habits, allLogs, currentUserId);
      soundManager.playCelebration();
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportCSV = () => {
    try {
      setIsExporting('csv');
      exportBackupAsCSV(habits, allLogs);
      soundManager.playCelebration();
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportWord = async () => {
    try {
      setIsExporting('word');
      const { exportDataAsWordDocx } = await import('../lib/wordService');
      await exportDataAsWordDocx();
      soundManager.playCelebration();
    } finally {
      setIsExporting(null);
    }
  };

  // Handler for File Selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setErrorMessage(null);
    setSuccessMessage(null);
    setParseResult(null);

    const fileName = file.name.toLowerCase();
    try {
      if (fileName.endsWith('.json')) {
        const text = await file.text();
        const result = parseJSONBackup(text);
        if (result.success) {
          setParseResult(result);
        } else {
          setErrorMessage(result.error || 'ملف JSON غير صالح.');
        }
      } else if (fileName.endsWith('.csv')) {
        const text = await file.text();
        const result = parseCSVBackup(text);
        if (result.success) {
          setParseResult(result);
        } else {
          setErrorMessage(result.error || 'ملف CSV غير صالح.');
        }
      } else if (fileName.endsWith('.docx')) {
        // Fallback for Word docx import
        const { importDataFromWordDocx } = await import('../lib/wordService');
        const res = await importDataFromWordDocx(file);
        if (res.success && res.habits) {
          setParseResult({
            success: true,
            habits: res.habits,
            habitLogs: Object.values(res.logs || {}),
            metadata: { app: 'word-import', totalHabits: res.habits.length, totalLogs: 0 },
          });
        } else {
          setErrorMessage(res.error || 'فشل استيراد مستند Word.');
        }
      } else {
        setErrorMessage('نوع الملف غير مدعوم. يرجى اختيار ملف بصيغة .json أو .csv أو .docx');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطأ في معالجة الملف';
      setErrorMessage(`حدث خطأ أثناء قراءة الملف: ${msg}`);
    }
  };

  // Handler for Confirm Restore
  const handleConfirmRestore = async () => {
    if (!parseResult || !parseResult.success) return;

    try {
      setIsProcessing(true);
      setErrorMessage(null);

      await onRestoreData(parseResult.habits, parseResult.habitLogs, restoreMode);

      soundManager.playCelebration();
      setSuccessMessage(
        restoreMode === 'replace'
          ? `تم استبدال البيانات بنجاح واستعادة ${parseResult.habits.length} عادة و ${parseResult.habitLogs.length} سجل!`
          : `تم دمج البيانات بنجاح: تم تحديث/إضافة ${parseResult.habits.length} عادة و ${parseResult.habitLogs.length} سجل!`
      );

      // Reset file selection after brief display
      setTimeout(() => {
        setSelectedFile(null);
        setParseResult(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }, 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطأ أثناء الاستعادة';
      setErrorMessage(`فشلت عملية الاستعادة والمزامنة: ${msg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#1C4D8D] rounded-3xl border border-slate-200 dark:border-[#2A5C9E] shadow-2xl p-6 text-right">
        {/* الترويسة */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#2A5C9E]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#00A896]/15 text-[#00A896] dark:text-[#02C39A]">
              <FontAwesomeIcon icon={faHardDrive} className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-[#F8FAFC] flex items-center gap-1.5 flex-wrap">
                <span>النسخ الاحتياطي واستعادة البيانات</span>
                <FontAwesomeIcon icon={faFloppyDisk} className="w-4 h-4 text-[#00A896] dark:text-[#02C39A] shrink-0" aria-hidden="true" />
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                تصدير واستيراد سريع بصيغ JSON و CSV و Word لمزامنة عاداتك بأمان
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 dark:text-[#94A3B8] hover:text-slate-600 dark:hover:text-[#F8FAFC] rounded-lg hover:bg-slate-100 dark:hover:bg-[#2A5C9E]/50 transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <FontAwesomeIcon icon={faXmark} className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* ألسنة التبديل: تصدير مقابل استيراد */}
        <div className="mt-4 flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-[#0F2854] border border-slate-200 dark:border-[#2A5C9E]">
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeTab === 'export'
                ? 'bg-gradient-to-r from-[#00A896] to-[#02C39A] text-white shadow-xs'
                : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FontAwesomeIcon icon={faDownload} className="w-4 h-4" aria-hidden="true" />
            <span>تصدير نسخة احتياطية (Export)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeTab === 'import'
                ? 'bg-gradient-to-r from-[#00A896] to-[#02C39A] text-white shadow-xs'
                : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FontAwesomeIcon icon={faUpload} className="w-4 h-4" aria-hidden="true" />
            <span>استعادة نسخة احتياطية (Import & Restore)</span>
          </button>
        </div>

        {/* محتوى لسان التصدير */}
        {activeTab === 'export' && (
          <div className="mt-5 space-y-3.5">
            <p className="text-xs text-slate-600 dark:text-[#CBD5E1] leading-relaxed">
              اختر الصيغة المناسبة لتصدير وحفظ بياناتك وسجلاتك محلياً على جهازك:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 1. تصدير JSON كامل */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0F2854] border border-slate-200/80 dark:border-[#2A5C9E] flex flex-col justify-between hover:border-[#00A896] transition-all group">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-[#00A896] dark:text-[#02C39A]">
                    <FontAwesomeIcon icon={faFileCode} className="w-5 h-5" aria-hidden="true" />
                    <span className="font-bold text-xs text-slate-900 dark:text-[#F8FAFC]">
                      نسخة احتياطية JSON
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] leading-relaxed mb-3">
                    ملف `.json` متكامل يتضمن كافة تفاصيل العادات، وسجلات الصمود والإنجاز، وملاحظات المحفزات لاستعادتها لاحقاً.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleExportJSON}
                  disabled={isExporting !== null}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#00A896] hover:bg-[#02C39A] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  {isExporting === 'json' ? (
                    <FontAwesomeIcon icon={faSpinner} spin className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <FontAwesomeIcon icon={faDownload} className="w-4 h-4" aria-hidden="true" />
                  )}
                  <span>تنزيل JSON</span>
                </button>
              </div>

              {/* 2. تصدير CSV (إكسل) */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0F2854] border border-slate-200/80 dark:border-[#2A5C9E] flex flex-col justify-between hover:border-emerald-500 transition-all group">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-emerald-500">
                    <FontAwesomeIcon icon={faFileExcel} className="w-5 h-5" aria-hidden="true" />
                    <span className="font-bold text-xs text-slate-900 dark:text-[#F8FAFC]">
                      جدول بيانات CSV
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] leading-relaxed mb-3">
                    ملف `.csv` بتشفير UTF-8 BOM متوافق 100% مع Microsoft Excel و Google Sheets بدون أي مشاكل في الحروف العربية.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  disabled={isExporting !== null}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  {isExporting === 'csv' ? (
                    <FontAwesomeIcon icon={faSpinner} spin className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <FontAwesomeIcon icon={faDownload} className="w-4 h-4" aria-hidden="true" />
                  )}
                  <span>تنزيل CSV (إكسل)</span>
                </button>
              </div>

              {/* 3. تقرير مستند Word (.docx) */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0F2854] border border-slate-200/80 dark:border-[#2A5C9E] flex flex-col justify-between hover:border-blue-500 transition-all group">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-blue-500">
                    <FontAwesomeIcon icon={faFileWord} className="w-5 h-5" aria-hidden="true" />
                    <span className="font-bold text-xs text-slate-900 dark:text-[#F8FAFC]">
                      تقرير مستند Word
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] leading-relaxed mb-3">
                    مستند Word (.docx) مصمم وجاهز للطباعة والمشاركة يحتوي على جداول العادات ونسب الالتزام والقوانين.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleExportWord}
                  disabled={isExporting !== null}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  {isExporting === 'word' ? (
                    <FontAwesomeIcon icon={faSpinner} spin className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <FontAwesomeIcon icon={faDownload} className="w-4 h-4" aria-hidden="true" />
                  )}
                  <span>تصدير Word</span>
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-100/60 dark:bg-[#0F2854]/40 border border-slate-200 dark:border-[#2A5C9E] text-[11px] text-slate-500 dark:text-[#94A3B8] flex items-center gap-2">
              <FontAwesomeIcon icon={faWandMagicSparkles} className="w-4 h-4 text-[#00A896] shrink-0" aria-hidden="true" />
              <span>
                النسخ الاحتياطي يُنصح به أسبوعياً لضمان الاحتفاظ بسجلاتك حتى عند مسح ذاكرة المتصفح.
              </span>
            </div>
          </div>
        )}

        {/* محتوى لسان الاستيراد والاستعادة */}
        {activeTab === 'import' && (
          <div className="mt-5 space-y-4">
            {/* منطقة اختيار وإفلات الملف */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json,.csv,.docx"
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-6 border-2 border-dashed border-slate-300 dark:border-[#2A5C9E] hover:border-[#00A896] dark:hover:border-[#02C39A] rounded-2xl bg-slate-50/60 dark:bg-[#0F2854]/60 text-center cursor-pointer transition-all hover:bg-slate-100/60 dark:hover:bg-[#0F2854]"
            >
              <FontAwesomeIcon icon={faUpload} className="w-8 h-8 text-[#00A896] mx-auto mb-2" aria-hidden="true" />
              <p className="text-xs font-bold text-slate-800 dark:text-[#F8FAFC]">
                {selectedFile ? selectedFile.name : 'انقر لاختيار ملف النسخة الاحتياطية'}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-[#94A3B8] mt-1">
                الصيغ المدعومة: JSON (.json) أو CSV (.csv) أو Word (.docx)
              </p>
            </div>

            {/* رسائل التنبيه والخطأ */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <FontAwesomeIcon icon={faTriangleExclamation} className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                <FontAwesomeIcon icon={faCircleCheck} className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* معاينة بيانات الملف بعد التحقق الناجح */}
            {parseResult && parseResult.success && (
              <div className="p-4 rounded-2xl bg-[#00A896]/10 dark:bg-[#00A896]/15 border border-[#00A896]/30 space-y-3">
                <div className="flex items-center justify-between text-xs font-black text-[#00A896] dark:text-[#02C39A]">
                  <span className="flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faCircleCheck} className="w-4 h-4" aria-hidden="true" />
                    تم التحقق من بنية الملف بنجاح!
                  </span>
                  <span>
                    {parseResult.habits.length} عادات · {parseResult.habitLogs.length} سجلات
                  </span>
                </div>

                {/* اختيار طريقة الاستعادة: دمج مقابل استبدال */}
                <div className="pt-2 border-t border-[#00A896]/20">
                  <label className="block text-xs font-bold text-slate-700 dark:text-[#CBD5E1] mb-2">
                    كيف ترغب في تطبيق النسخة الاحتياطية؟
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRestoreMode('merge')}
                      className={`p-3 rounded-xl text-right border text-xs font-bold transition-all cursor-pointer ${
                        restoreMode === 'merge'
                          ? 'bg-[#00A896]/20 border-[#00A896] text-[#00A896] dark:text-[#02C39A] ring-2 ring-[#00A896]/30'
                          : 'bg-white dark:bg-[#0F2854] border-slate-200 dark:border-[#2A5C9E] text-slate-600 dark:text-[#94A3B8]'
                      }`}
                    >
                      <div className="font-black mb-0.5">دمج ذكي (Merge)</div>
                      <div className="text-[10px] opacity-80">
                        يحتفظ بعاداتك الحالية ويضيف/يحدّث العادات والسجلات المستوردة.
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRestoreMode('replace')}
                      className={`p-3 rounded-xl text-right border text-xs font-bold transition-all cursor-pointer ${
                        restoreMode === 'replace'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-400 ring-2 ring-amber-500/30'
                          : 'bg-white dark:bg-[#0F2854] border-slate-200 dark:border-[#2A5C9E] text-slate-600 dark:text-[#94A3B8]'
                      }`}
                    >
                      <div className="font-black mb-0.5 flex items-center gap-1">
                        <FontAwesomeIcon icon={faShieldHalved} className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                        استبدال كامل (Replace All)
                      </div>
                      <div className="text-[10px] opacity-80">
                        يستبدل كافة عاداتك وسجلاتك الحالية بالبيانات الموجودة في الملف.
                      </div>
                    </button>
                  </div>
                </div>

                {/* زر التأكيد والتنفيذ */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleConfirmRestore}
                    disabled={isProcessing}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00A896] to-[#02C39A] hover:opacity-95 text-white font-black text-xs shadow-md shadow-[#00A896]/30 transition-all cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} spin className="w-4 h-4" aria-hidden="true" />
                        <span>جاري المزامنة والاستعادة...</span>
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faCircleCheck} className="w-4 h-4" aria-hidden="true" />
                        <span>
                          {restoreMode === 'merge'
                            ? `تأكيد دمج ${parseResult.habits.length} عادة`
                            : `تأكيد استبدال البيانات الحالية`}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* تذييل النافذة */}
        <div className="mt-6 pt-3 border-t border-slate-100 dark:border-[#2A5C9E] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-[#2A5C9E] bg-white dark:bg-[#0F2854] text-slate-600 dark:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#1C4D8D] transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
