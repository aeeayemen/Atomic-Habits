import type { Habit, HabitLog } from '../types/habit';
import type {
  AccountabilitySummary,
  AccountabilityCheckIn,
  TopHabitStreak,
} from '../types/accountability';
import { calculateStreakStats } from './streak';
import { formatISODate } from './utils';
import { supabase } from './supabase';

const INSPIRATIONAL_QUOTES = [
  '«أنت لا ترتقي إلى مستوى أهدافك، بل تهبط إلى مستوى أنظمتك.» — جيمس كلير',
  '«كل عمل تقوم به هو صوت تدلي به لصالح الشخص الذي ترغب في أن تصبحه.» — جيمس كلير',
  '«النجاح هو نتاج العادات اليومية، وليس التحولات الكبرى التي تحدث فجأة.» — جيمس كلير',
  '«المكاسب الصغيرة بنسبة 1% يومياً تتراكم لتحدث تحولاً هائلاً على المدى البعيد.» — جيمس كلير',
  '«إياك أن تفوت مرتين؛ التعثر ليوم واحد حادث عابر، أما التعثر ليومين فهو بداية عادة جديدة.» — جيمس كلير',
  '«الانضباط الحقيقي هو أن تختار ما تريده أكثر، على ما تريده الآن.» — جيمس كلير',
];

/**
 * حساب ملخص إنجازات وسلاسل المستخدم بأمان دون كشف الملاحظات الحساسة
 */
export function computeAccountabilitySummary(
  habits: Habit[],
  allLogs: Record<string, HabitLog>,
  referenceDate: Date = new Date()
): AccountabilitySummary {
  const todayStr = formatISODate(referenceDate);

  // 1. نسبة إنجاز اليوم
  const activeHabits = habits.filter((h) => !h.archived);
  let todayDone = 0;
  const todayTotal = activeHabits.length;

  activeHabits.forEach((h) => {
    const log = allLogs[`${h.id}_${todayStr}`];
    if (log?.status === 'done') todayDone++;
  });

  const todayPercentage = todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0;

  // 2. تجميع سلاسل العادات
  let maxActiveStreak = 0;
  let longestRecordStreak = 0;
  let totalCompletionsAllTime = 0;
  let totalMissedAllTime = 0;

  const buildStreaks: TopHabitStreak[] = [];
  const breakStreaks: TopHabitStreak[] = [];

  activeHabits.forEach((h) => {
    const isBreak = h.type === 'break';
    const stats = calculateStreakStats(
      h.id,
      allLogs,
      referenceDate,
      h.type || 'build',
      h.createdAt
    );

    if (stats.currentStreak > maxActiveStreak) maxActiveStreak = stats.currentStreak;
    if (stats.longestStreak > longestRecordStreak) longestRecordStreak = stats.longestStreak;
    totalCompletionsAllTime += stats.totalDone;
    totalMissedAllTime += stats.totalMissed;

    if (isBreak) {
      breakStreaks.push({
        id: h.id,
        name: h.name,
        category: h.category,
        type: 'break',
        streak: stats.currentStreak, // Clean days without relapse
      });
    } else {
      buildStreaks.push({
        id: h.id,
        name: h.name,
        category: h.category,
        type: 'build',
        streak: stats.currentStreak,
      });
    }
  });

  // ترتيب حسب طول السلسلة تنازلياً
  buildStreaks.sort((a, b) => b.streak - a.streak);
  breakStreaks.sort((a, b) => b.streak - a.streak);

  const totalLogsCount = totalCompletionsAllTime + totalMissedAllTime;
  const overallConsistencyRate =
    totalLogsCount > 0 ? Math.round((totalCompletionsAllTime / totalLogsCount) * 100) : todayPercentage;

  // اختيار اقتباس مشجع عشوائي أو مبني على التاريخ
  const dayOfYear = Math.floor(
    (referenceDate.getTime() - new Date(referenceDate.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const quote = INSPIRATIONAL_QUOTES[dayOfYear % INSPIRATIONAL_QUOTES.length];

  // تنسيق تاريخ باللغة العربية
  const formattedDate = new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(referenceDate);

  return {
    todayDone,
    todayTotal,
    todayPercentage,
    overallConsistencyRate,
    maxActiveStreak,
    longestRecordStreak,
    totalCompletionsAllTime,
    topBuildHabits: buildStreaks.slice(0, 3), // أفضل 3 عادات بناء
    topBreakHabits: breakStreaks.slice(0, 2), // أفضل عادتين إقلاع
    encouragingQuote: quote,
    formattedDate,
  };
}

/**
 * توليد نص المشاركة المشجع لشريك المساءلة أو منصات التواصل
 */
export function generateShareableSummaryText(options: {
  summary: AccountabilitySummary;
  customMessage?: string;
  includeBuild?: boolean;
  includeBreak?: boolean;
  includeConsistency?: boolean;
  includeQuote?: boolean;
}): string {
  const {
    summary,
    customMessage,
    includeBuild = true,
    includeBreak = true,
    includeConsistency = true,
    includeQuote = true,
  } = options;

  const lines: string[] = [];

  lines.push('🔥 بطاقة إنجازاتي في العادات الذرية (istomic)');
  lines.push(`📅 ${summary.formattedDate}`);
  lines.push('');

  if (includeConsistency) {
    lines.push(`⚡ نسبة الالتزام الإجمالية: ${summary.overallConsistencyRate}%`);
    lines.push(`🎯 تركيز اليوم: أُنجزت ${summary.todayDone} من أصل ${summary.todayTotal} عادات (${summary.todayPercentage}%)`);
    if (summary.maxActiveStreak > 0) {
      lines.push(`🔥 أطول سلسلة نشطة مستمرة: ${summary.maxActiveStreak} أيام متتالية`);
    }
    lines.push('');
  }

  if (includeBuild && summary.topBuildHabits.length > 0) {
    lines.push('🏆 أبرز سلاسل عادات البناء الإيجابية:');
    summary.topBuildHabits.forEach((h) => {
      const fireBadge = h.streak >= 7 ? '🔥' : '⚡';
      lines.push(`• ${h.name}: سلسلة ${h.streak} أيام ${fireBadge}`);
    });
    lines.push('');
  }

  if (includeBreak && summary.topBreakHabits.length > 0) {
    lines.push('🛡️ عادات الإقلاع والتحصين (أيام نقية بلا زلات):');
    summary.topBreakHabits.forEach((h) => {
      lines.push(`• ${h.name}: ${h.streak} يوماً نقياً ومستمر 🛡️`);
    });
    lines.push('');
  }

  if (customMessage && customMessage.trim()) {
    lines.push(`💬 عهد المساءلة والالتزام: "${customMessage.trim()}"`);
    lines.push('');
  }

  if (includeQuote && summary.encouragingQuote) {
    lines.push(summary.encouragingQuote);
    lines.push('');
  }

  lines.push('#عادات_ذرية #انضباط_يومي #شريك_المساءلة #istomic');

  return lines.join('\n');
}

/**
 * مشاركة الملخص عبر Web Share API أو النسخ إلى الحافظة تلقائياً
 */
export async function shareOrCopySummary(
  title: string,
  text: string
): Promise<'shared' | 'copied' | 'failed'> {
  // محاولة استخدام واجهة المشاركة الأصلية في المتصفح إذا كانت مدعومة
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title,
        text,
      });
      return 'shared';
    } catch (err: any) {
      // إذا قام المستخدم بالإلغاء عمداً نكتفي بالإلغاء
      if (err?.name === 'AbortError') {
        return 'failed';
      }
      // إذا تعثرت المشاركة لأي سبب آخر، ننتقل تلقائياً للنسخ إلى الحافظة
    }
  }

  // النسخ إلى الحافظة كبديل فوري وآمن
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return 'copied';
    } catch {
      // طريقة بديلة في حال قيود أذونات الحافظة
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        return successful ? 'copied' : 'failed';
      } catch {
        document.body.removeChild(textarea);
        return 'failed';
      }
    }
  }

  return 'failed';
}

const STORAGE_PREFIX = 'istomic_accountability_checkins_';

/**
 * حفظ لقطة مساءلة محلية في LocalStorage
 */
export function saveLocalAccountabilityCheckIn(
  checkin: AccountabilityCheckIn,
  userId?: string
): void {
  if (typeof window === 'undefined') return;
  const key = `${STORAGE_PREFIX}${userId || 'guest'}`;
  try {
    const existing = loadLocalAccountabilityCheckIns(userId);
    const updated = [checkin, ...existing.filter((c) => c.id !== checkin.id)].slice(0, 25);
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (err) {
    console.warn('Could not save accountability checkin locally:', err);
  }
}

/**
 * استرجاع سجل لقطات المساءلة السابقة
 */
export function loadLocalAccountabilityCheckIns(userId?: string): AccountabilityCheckIn[] {
  if (typeof window === 'undefined') return [];
  const key = `${STORAGE_PREFIX}${userId || 'guest'}`;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * حذف لقطة مساءلة محددة
 */
export function deleteLocalAccountabilityCheckIn(id: string, userId?: string): void {
  if (typeof window === 'undefined') return;
  const key = `${STORAGE_PREFIX}${userId || 'guest'}`;
  try {
    const existing = loadLocalAccountabilityCheckIns(userId);
    const updated = existing.filter((c) => c.id !== id);
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (err) {
    console.warn('Could not delete accountability checkin:', err);
  }
}

/**
 * حفظ لقطة المساءلة في Supabase بشكل اختياري دون أي جداول متصدرين سلبية
 */
export async function saveAccountabilityCheckInToSupabase(
  checkin: AccountabilityCheckIn,
  userId: string
): Promise<boolean> {
  if (!supabase || !userId) return false;

  try {
    const { error } = await supabase.from('accountability_checkins').upsert({
      id: checkin.id,
      user_id: userId,
      date_str: checkin.dateStr,
      active_streak: checkin.activeStreak,
      clean_streak: checkin.cleanStreak,
      completion_rate: checkin.completionRate,
      message: checkin.message || null,
      highlighted_habit: checkin.highlightedHabit || null,
      created_at: checkin.createdAt,
    });

    if (error) {
      console.warn('Supabase accountability checkin note:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase accountability checkin exception:', err);
    return false;
  }
}

/**
 * جلب سجل لقطات المساءلة الخاصة بالمستخدم من Supabase
 */
export async function fetchAccountabilityCheckInsFromSupabase(
  userId: string
): Promise<AccountabilityCheckIn[] | null> {
  if (!supabase || !userId) return null;

  try {
    const { data, error } = await supabase
      .from('accountability_checkins')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error || !data) {
      return null;
    }

    return data.map((row) => ({
      id: row.id,
      userId: row.user_id,
      dateStr: row.date_str,
      formattedDate: row.date_str,
      activeStreak: row.active_streak || 0,
      cleanStreak: row.clean_streak || 0,
      todayDone: 0,
      todayTotal: 0,
      completionRate: row.completion_rate || 0,
      message: row.message || undefined,
      highlightedHabit: row.highlighted_habit || undefined,
      createdAt: row.created_at,
    }));
  } catch {
    return null;
  }
}
