import type { HabitLog, StreakStats } from '../types/habit';
import { formatISODate } from './utils';

/**
 * Real-time calculation of streaks and consistency statistics
 * Implements James Clear's "Never Miss Twice" rule logic.
 */
export function calculateStreakStats(
  habitId: string,
  allLogs: Record<string, HabitLog>,
  referenceDate: Date = new Date()
): StreakStats {
  const habitLogs = Object.values(allLogs).filter((log) => log.habitId === habitId);

  // Map by YYYY-MM-DD
  const logByDate = new Map<string, HabitLog>();
  for (const log of habitLogs) {
    logByDate.set(log.date, log);
  }

  const todayStr = formatISODate(referenceDate);

  // 1. Current streak computation:
  let currentStreak = 0;
  const cursor = new Date(referenceDate);

  const todayLog = logByDate.get(todayStr);
  const todayStatus = todayLog?.status;

  if (todayStatus === 'done') {
    currentStreak++;
    cursor.setDate(cursor.getDate() - 1);
  } else if (todayStatus === 'missed') {
    currentStreak = 0;
  } else {
    // Today is neutral/pending: look from yesterday
    cursor.setDate(cursor.getDate() - 1);
  }

  // Continue backward as long as status is 'done'
  if (todayStatus !== 'missed') {
    while (true) {
      const dateStr = formatISODate(cursor);
      const log = logByDate.get(dateStr);
      if (log?.status === 'done') {
        currentStreak++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // 2. Longest streak computation across entire logged history:
  const sortedDates = Array.from(logByDate.keys()).sort();
  let longestStreak = 0;
  let runningStreak = 0;
  let prevDate: Date | null = null;

  for (const dateStr of sortedDates) {
    const log = logByDate.get(dateStr);
    const currDate = new Date(dateStr + 'T00:00:00');

    if (log?.status === 'done') {
      if (prevDate) {
        const diffMs = currDate.getTime() - prevDate.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          runningStreak++;
        } else {
          runningStreak = 1;
        }
      } else {
        runningStreak = 1;
      }
      prevDate = currDate;
      if (runningStreak > longestStreak) {
        longestStreak = runningStreak;
      }
    } else {
      runningStreak = 0;
      prevDate = null;
    }
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  // 3. Totals and completion rate
  let totalDone = 0;
  let totalMissed = 0;

  for (const log of habitLogs) {
    if (log.status === 'done') totalDone++;
    if (log.status === 'missed') totalMissed++;
  }

  const totalLogged = totalDone + totalMissed;
  const completionRate = totalLogged > 0 ? Math.round((totalDone / totalLogged) * 100) : 0;

  // 4. Last 7 days and 30 days consistency rates
  let last7Done = 0;
  let last7Count = 0;
  let last30Done = 0;
  let last30Count = 0;

  for (let i = 0; i < 30; i++) {
    const d = new Date(referenceDate);
    d.setDate(referenceDate.getDate() - i);
    const dStr = formatISODate(d);
    const log = logByDate.get(dStr);

    if (i < 7) {
      if (log && log.status !== 'neutral') {
        last7Count++;
        if (log.status === 'done') last7Done++;
      }
    }

    if (log && log.status !== 'neutral') {
      last30Count++;
      if (log.status === 'done') last30Done++;
    }
  }

  const last7DaysRate = last7Count > 0 ? Math.round((last7Done / last7Count) * 100) : 0;
  const last30DaysRate = last30Count > 0 ? Math.round((last30Done / last30Count) * 100) : 0;

  // 5. "Never Miss Twice" check
  const yesterday = new Date(referenceDate);
  yesterday.setDate(referenceDate.getDate() - 1);
  const yesterdayLog = logByDate.get(formatISODate(yesterday));
  const isAtRisk = yesterdayLog?.status === 'missed' && todayStatus !== 'done';

  // 6. Milestone badges
  let milestoneBadge: StreakStats['milestoneBadge'] = null;
  if (currentStreak >= 100) milestoneBadge = 'master';
  else if (currentStreak >= 30) milestoneBadge = 'diamond';
  else if (currentStreak >= 14) milestoneBadge = 'gold';
  else if (currentStreak >= 7) milestoneBadge = 'silver';
  else if (currentStreak >= 3) milestoneBadge = 'bronze';
  else if (currentStreak >= 1) milestoneBadge = 'starter';

  return {
    currentStreak,
    longestStreak,
    totalDone,
    totalMissed,
    completionRate,
    last7DaysRate,
    last30DaysRate,
    isAtRisk,
    milestoneBadge,
  };
}
