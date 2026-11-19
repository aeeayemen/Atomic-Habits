import type { Habit, HabitLog } from '../types/habit';
import type { WeeklyHabitStat, WeeklySummary } from '../types/weeklyReflection';
import { calculateStreakStats } from './streak';
import { formatISODate } from './utils';
import { supabase } from './supabase';

/**
 * الحصول على معرف الأسبوع القياسي (ISO Week Key: e.g. 2026-W47)
 */
export function getISOWeekKey(d: Date = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // ضبط اليوم ليكون يوم الخميس في نفس الأسبوع (ISO-8601)
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/**
 * حساب ملخص الـ 7 أيام الأخيرة للعادات النشطة
 */
export function computeWeeklySummary(
  habits: Habit[],
  allLogs: Record<string, HabitLog>,
  referenceDate: Date = new Date()
): WeeklySummary {
  // نطاق الـ 7 أيام (اليوم المرجعي و6 أيام سابقة)
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(referenceDate);
    d.setDate(referenceDate.getDate() - i);
    days.push(formatISODate(d));
  }

  const startDate = days[0];
  const endDate = days[days.length - 1];

  // تنسيق تاريخ باللغة العربية
  const startFormat = new Intl.DateTimeFormat('ar-EG', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(startDate + 'T00:00:00'));
  const endFormat = new Intl.DateTimeFormat('ar-EG', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(endDate + 'T00:00:00'));
  const formattedDateRange = `${startFormat} — ${endFormat}`;

  const activeHabits = habits.filter((h) => !h.archived && !h.is_archived);
  const statsList: WeeklyHabitStat[] = [];

  let totalWeeklyDone = 0;
  let totalOpportunities = activeHabits.length * 7;

  activeHabits.forEach((h) => {
    const isBreak = h.type === 'break';
    let completedCount = 0;
    let missedCount = 0;

    days.forEach((dateStr) => {
      const log = allLogs[`${h.id}_${dateStr}`];
      if (isBreak) {
        if (log?.status === 'missed') {
          missedCount++;
        } else {
          completedCount++; // يوم نقي بلا زلة
        }
      } else {
        if (log?.status === 'done') {
          completedCount++;
        } else if (log?.status === 'missed') {
          missedCount++;
        }
      }
    });

    totalWeeklyDone += completedCount;

    const streakStats = calculateStreakStats(
      h.id,
      allLogs,
      referenceDate,
      h.type || 'build',
      h.createdAt
    );

    const rate = Math.round((completedCount / 7) * 100);

    statsList.push({
      habitId: h.id,
      habitName: h.name,
      category: h.category,
      type: h.type || 'build',
      color: h.color,
      completedDays: completedCount,
      missedDays: missedCount,
      totalDays: 7,
      consistencyRate: rate,
      currentStreak: streakStats.currentStreak,
    });
  });

  const overallConsistencyRate =
    totalOpportunities > 0 ? Math.round((totalWeeklyDone / totalOpportunities) * 100) : 0;

  // 1. العادة الأكثر اتساقاً (أعلى نسبة ثم أطول سلسلة)
  const sortedByConsistency = [...statsList].sort((a, b) => {
    if (b.consistencyRate !== a.consistencyRate) {
      return b.consistencyRate - a.consistencyRate;
    }
    return b.currentStreak - a.currentStreak;
  });
  const mostConsistentHabit = sortedByConsistency[0] || null;

  // 2. العادة التي تحتاج إلى تركيز واهتمام أكبر (أقل نسبة، مع وجود تفويت/زلات)
  const sortedByNeeds = [...statsList].sort((a, b) => {
    if (a.consistencyRate !== b.consistencyRate) {
      return a.consistencyRate - b.consistencyRate;
    }
    return b.missedDays - a.missedDays;
  });

  // نختار العادة كـ "تحتاج اهتمام" إذا كانت نسبتها أقل من 85% أو كان بها تفويت/زلات
  const candidateNeeds = sortedByNeeds[0];
  const needsAttentionHabit =
    candidateNeeds && (candidateNeeds.consistencyRate < 85 || candidateNeeds.missedDays > 0)
      ? candidateNeeds
      : null;

  // 3. صاحب أفضل سلسلة نشطة حالياً
  const sortedByStreak = [...statsList].sort((a, b) => b.currentStreak - a.currentStreak);
  const bestStreakHabit = sortedByStreak[0] && sortedByStreak[0].currentStreak > 0 ? sortedByStreak[0] : null;

  return {
    weekKey: getISOWeekKey(referenceDate),
    startDate,
    endDate,
    formattedDateRange,
    totalActiveHabits: activeHabits.length,
    overallConsistencyRate,
    totalCompletionsThisWeek: totalWeeklyDone,
    mostConsistentHabit,
    needsAttentionHabit,
    bestStreakHabit,
    allHabitStats: statsList,
  };
}

const STORAGE_KEY_PREFIX = 'istomic_weekly_reflection_note_';

/**
 * حفظ تأمل الأسبوع القادم في التخزين المحلي ومحاولة المزامنة السحابية
 */
export async function saveWeeklyReflectionNote(
  weekKey: string,
  noteText: string,
  userId?: string
): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const storageKey = `${STORAGE_KEY_PREFIX}${userId || 'guest'}_${weekKey}`;
  const now = new Date().toISOString();

  try {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        note: noteText.trim(),
        updatedAt: now,
      })
    );
  } catch (err) {
    console.warn('Could not save weekly reflection note to localStorage:', err);
  }

  // محاولة المزامنة مع Supabase إذا كان المستخدم مسجلاً
  if (supabase && userId) {
    try {
      await supabase.from('weekly_reflections').upsert({
        id: `wref_${userId}_${weekKey}`,
        user_id: userId,
        week_key: weekKey,
        note: noteText.trim(),
        updated_at: now,
      });
    } catch {
      // Graceful fallback: table might not exist yet
    }
  }

  return true;
}

/**
 * استرجاع تأمل الأسبوع من التخزين المحلي
 */
export function loadWeeklyReflectionNote(
  weekKey: string,
  userId?: string
): { note: string; updatedAt?: string } {
  if (typeof window === 'undefined') return { note: '' };

  const storageKey = `${STORAGE_KEY_PREFIX}${userId || 'guest'}_${weekKey}`;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return { note: '' };
    const parsed = JSON.parse(raw);
    return {
      note: parsed.note || '',
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return { note: '' };
  }
}
