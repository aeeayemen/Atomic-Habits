import type { FeedbackNote, FeedbackCategory, FeedbackCategoryMeta } from '../types/feedback';
import { supabase } from './supabase';

export const FEEDBACK_CATEGORIES: FeedbackCategoryMeta[] = [
  {
    id: 'ui',
    label: 'واجهة وتصميم (UI/UX)',
    iconName: 'Palette',
    badgeBg: 'bg-sky-500/15',
    badgeBorder: 'border-sky-500/40',
    badgeText: 'text-sky-400',
  },
  {
    id: 'flow',
    label: 'تدفق الاستخدام وسهولة الخطوات',
    iconName: 'Compass',
    badgeBg: 'bg-emerald-500/15',
    badgeBorder: 'border-emerald-500/40',
    badgeText: 'text-emerald-400',
  },
  {
    id: 'bug',
    label: 'مشكلة أو عائق تقني (Bug/Friction)',
    iconName: 'AlertTriangle',
    badgeBg: 'bg-amber-500/15',
    badgeBorder: 'border-amber-500/40',
    badgeText: 'text-amber-400',
  },
  {
    id: 'idea',
    label: 'اقتراح أو فكرة تحسين',
    iconName: 'Sparkles',
    badgeBg: 'bg-purple-500/15',
    badgeBorder: 'border-purple-500/40',
    badgeText: 'text-purple-400',
  },
];

const LOCAL_STORAGE_KEY = 'istomic_beta_feedback_history';

/**
 * جمع السياق التقني الآمن (غير الحساس) للمساعدة في فحص المشكلة
 */
export function getTechnicalContext(_currentSection = 'dashboard'): {
  isOnline: boolean;
  screenResolution: string;
  deviceInfo: string;
} {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const screenResolution =
    typeof window !== 'undefined'
      ? `${window.innerWidth}x${window.innerHeight} (نافذة) / ${window.screen.width}x${window.screen.height} (شاشة)`
      : 'unknown';

  let deviceInfo = 'متصفح ويب';
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent;
    const isMobile = /mobile|android|iphone|ipad/i.test(ua);
    const browser = /chrome/i.test(ua)
      ? 'Chrome'
      : /safari/i.test(ua)
      ? 'Safari'
      : /firefox/i.test(ua)
      ? 'Firefox'
      : /edg/i.test(ua)
      ? 'Edge'
      : 'Other';
    deviceInfo = `${isMobile ? 'هاتف/جهاز لوحي' : 'حاسوب مكتب'} (${browser})`;
  }

  return {
    isOnline,
    screenResolution,
    deviceInfo,
  };
}

/**
 * إرسال الملاحظة وحفظها في Supabase والنسخ الاحتياطي المحلي
 */
export async function submitBetaFeedback(params: {
  category: FeedbackCategory;
  message: string;
  userId?: string;
  userEmail?: string;
  currentSection?: string;
}): Promise<{ success: boolean; id: string; savedToCloud: boolean }> {
  const context = getTechnicalContext(params.currentSection);
  const id = `fb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const createdAt = new Date().toISOString();

  const note: FeedbackNote = {
    id,
    userId: params.userId,
    userEmail: params.userEmail,
    category: params.category,
    message: params.message.trim(),
    viewSection: params.currentSection || 'dashboard',
    isOnline: context.isOnline,
    screenResolution: context.screenResolution,
    deviceInfo: context.deviceInfo,
    createdAt,
  };

  // 1. حفظ فوري في التخزين المحلي (Local-First Fallback)
  saveLocalFeedback(note);

  // 2. إرسال إلى جدول feedback_notes في Supabase
  let savedToCloud = false;
  if (supabase) {
    try {
      const { error } = await supabase.from('feedback_notes').insert({
        id: note.id,
        user_id: note.userId || null,
        user_email: note.userEmail || null,
        category: note.category,
        message: note.message,
        view_section: note.viewSection,
        is_online: note.isOnline,
        screen_resolution: note.screenResolution,
        device_info: note.deviceInfo,
        created_at: note.createdAt,
      });

      if (!error) {
        savedToCloud = true;
      } else {
        console.warn('Supabase feedback note table notice:', error.message);
      }
    } catch (err) {
      console.warn('Feedback send to Supabase fallback to local:', err);
    }
  }

  return {
    success: true,
    id,
    savedToCloud,
  };
}

/**
 * حفظ الملاحظة محلياً في المتصفح
 */
function saveLocalFeedback(note: FeedbackNote): void {
  if (typeof window === 'undefined') return;
  try {
    const list = loadLocalFeedbackHistory();
    const updated = [note, ...list.filter((n) => n.id !== note.id)].slice(0, 30);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Could not save feedback to localStorage:', err);
  }
}

/**
 * استرجاع سجل الملاحظات السابقة المرسلة من هذا المتصفح
 */
export function loadLocalFeedbackHistory(): FeedbackNote[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * حذف ملاحظة من السجل المحلي
 */
export function deleteLocalFeedback(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const list = loadLocalFeedbackHistory();
    const updated = list.filter((n) => n.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Could not delete local feedback note:', err);
  }
}
