import type { Habit, HabitLog } from '../types/habit';

export interface DayOfWeekStat {
  dayIndex: number; // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  dayName: string; // 'الأحد', 'الإثنين', etc.
  dayShort: string; // 'أحد', 'إثنين', etc.
  totalChecks: number; // Total logged statuses (done + missed)
  missedCount: number; // Missed build habits + break habit slip-ups
  failureRate: number; // Percentage of failure/slip-up (0-100)
  isWeakest: boolean;
}

export interface TimeWindowStat {
  windowId: 'morning' | 'afternoon' | 'evening' | 'late_night';
  label: string; // 'الليل المتأخر (10م - 5ص)'
  shortLabel: string;
  hoursRange: string;
  count: number;
  percentage: number;
}

export interface TriggerStat {
  id: string;
  name: string;
  count: number;
  percentage: number;
  counterStrategy: string; // Inverted law strategy
}

export interface BehavioralAnalyticsResult {
  hasEnoughData: boolean;
  totalLogsAnalyzed: number;
  totalBreakLogs: number;
  totalSlipUps: number;

  // 1. Weakest Days
  daysOfWeek: DayOfWeekStat[];
  weakestDay: DayOfWeekStat | null;
  secondWeakestDay: DayOfWeekStat | null;

  // 2. Peak Slip-up Times
  peakTimeWindow: TimeWindowStat | null;
  timeWindows: TimeWindowStat[];

  // 3. Top Triggers
  topTriggers: TriggerStat[];

  // 4. Overall Health & Streaks
  buildConsistencyRate: number; // 0-100%
  breakCleanRate: number; // 0-100%
  totalCleanDays: number;
  activeCleanStreaksCount: number;
  activeBuildStreaksCount: number;
  strongestHabitName: string | null;
  atRiskHabitsCount: number;
}

const ARABIC_DAYS = [
  { index: 0, name: 'الأحد', short: 'أحد' },
  { index: 1, name: 'الإثنين', short: 'إثنين' },
  { index: 2, name: 'الثلاثاء', short: 'ثلاثاء' },
  { index: 3, name: 'الأربعاء', short: 'أربعاء' },
  { index: 4, name: 'الخميس', short: 'خميس' },
  { index: 5, name: 'الجمعة', short: 'جمعة' },
  { index: 6, name: 'السبت', short: 'سبت' },
];

const TRIGGER_STRATEGIES: Record<string, string> = {
  'توتر': 'اجعلها غير جذابة: التنفس العميق 4-7-8 وتذكر أن راحة الزلة مؤقتة وندمها طويل.',
  'ضغط': 'اجعلها غير جذابة: أخذ استراحة قصيرة مشياً بدلاً من الانتكاس.',
  'ملل': 'اجعلها خفية: استبدل الفراغ الذهني بعادة بديلة سريعة (قراءة صفحة، ماء).',
  'فراغ': 'اجعلها خفية: وضع جدول مسبق للساعات الحرة لمنع المشتتات.',
  'إرهاق': 'اجعلها صعبة: النوم مبكراً وإبعاد الهاتف عن السرير تماماً.',
  'تعب': 'اجعلها صعبة: تقليل الاحتكاك مع المغريات فور الشعور بالإجهاد.',
  'بيئة': 'اجعلها خفية: تغيير مكان الجلوس أو مغادرة التجمع المحفز للعادة.',
  'رفقاء': 'اجعلها غير مُرضية: إخبار الرفاق بقرارك والتمسك بهويتك الجديدة.',
  'إغراء': 'اجعلها صعبة: تطبيق قاعدة الـ 10 دقائق (انتظر 10 دقائق قبل أي استجابة).',
  'سهر': 'اجعلها خفية: إطفاء الشاشات قبل موعد النوم بساعة.',
};

/**
 * Perform client-side behavioral analytics aggregation across habits and logs.
 */
export function computeBehavioralAnalytics(
  habits: Habit[],
  allLogs: Record<string, HabitLog>
): BehavioralAnalyticsResult {
  const activeHabits = habits.filter((h) => !h.archived);
  const habitMap = new Map<string, Habit>(activeHabits.map((h) => [h.id, h]));

  const relevantLogs = Object.values(allLogs).filter((log) => habitMap.has(log.habitId));
  const totalLogsAnalyzed = relevantLogs.length;

  // Initialize day stats (Sunday = 0 to Saturday = 6)
  const dayStatsMap = new Map<number, { total: number; missed: number }>();
  for (let i = 0; i < 7; i++) {
    dayStatsMap.set(i, { total: 0, missed: 0 });
  }

  // Time window counters for slip-ups
  const timeCounters = {
    morning: 0,    // 5 AM - 11:59 AM
    afternoon: 0,  // 12 PM - 4:59 PM
    evening: 0,    // 5 PM - 9:59 PM
    late_night: 0, // 10 PM - 4:59 AM
  };

  // Triggers map
  const triggerCounts = new Map<string, number>();
  let totalSlipUps = 0;
  let totalBreakLogs = 0;

  // Build metrics
  let totalBuildDone = 0;
  let totalBuildLogged = 0;
  let totalCleanDays = 0;
  let atRiskHabitsCount = 0;

  // Analyze each log
  for (const log of relevantLogs) {
    const habit = habitMap.get(log.habitId);
    if (!habit) continue;

    const isBreak = habit.type === 'break';
    const logDate = new Date(log.date + 'T00:00:00');
    const dayOfWeek = isNaN(logDate.getTime()) ? 0 : logDate.getDay();

    const dayStat = dayStatsMap.get(dayOfWeek) || { total: 0, missed: 0 };

    if (isBreak) {
      totalBreakLogs++;
      if (log.status === 'missed') {
        // Break habit slip-up!
        totalSlipUps++;
        dayStat.total++;
        dayStat.missed++;

        // 1. Analyze Slip-up Time Window (from log.updatedAt)
        if (log.updatedAt) {
          const updatedDate = new Date(log.updatedAt);
          if (!isNaN(updatedDate.getTime())) {
            const hour = updatedDate.getHours();
            if (hour >= 5 && hour < 12) {
              timeCounters.morning++;
            } else if (hour >= 12 && hour < 17) {
              timeCounters.afternoon++;
            } else if (hour >= 17 && hour < 22) {
              timeCounters.evening++;
            } else {
              timeCounters.late_night++;
            }
          }
        }

        // 2. Analyze Trigger Notes
        if (log.notes && log.notes.trim()) {
          const notes = log.notes.trim();
          // Extract "[محفز: ...]" if present
          const triggerMatch = notes.match(/\[محفز:\s*([^\]]+)\]/i);
          let triggerLabel = '';
          if (triggerMatch && triggerMatch[1]) {
            triggerLabel = triggerMatch[1].trim();
          } else {
            // Check keyword in notes
            const words = ['توتر', 'ملل', 'فراغ', 'إرهاق', 'تعب', 'بيئة', 'رفقاء', 'إغراء', 'سهر'];
            const found = words.find((w) => notes.includes(w));
            triggerLabel = found ? `عامل ${found}` : notes.slice(0, 24);
          }

          if (triggerLabel) {
            triggerCounts.set(triggerLabel, (triggerCounts.get(triggerLabel) || 0) + 1);
          }
        }
      } else {
        // Clean day
        totalCleanDays++;
        dayStat.total++;
      }
    } else {
      // Build habit
      if (log.status === 'done') {
        totalBuildDone++;
        totalBuildLogged++;
        dayStat.total++;
      } else if (log.status === 'missed') {
        totalBuildLogged++;
        dayStat.total++;
        dayStat.missed++;
      }
    }

    dayStatsMap.set(dayOfWeek, dayStat);
  }

  // Process Day of Week Stats
  const daysOfWeek: DayOfWeekStat[] = ARABIC_DAYS.map((d) => {
    const stat = dayStatsMap.get(d.index) || { total: 0, missed: 0 };
    const failureRate = stat.total > 0 ? Math.round((stat.missed / stat.total) * 100) : 0;
    return {
      dayIndex: d.index,
      dayName: d.name,
      dayShort: d.short,
      totalChecks: stat.total,
      missedCount: stat.missed,
      failureRate,
      isWeakest: false,
    };
  });

  // Identify weakest days (with at least 1 check)
  const activeDays = daysOfWeek.filter((d) => d.totalChecks > 0);
  activeDays.sort((a, b) => b.failureRate - a.failureRate || b.missedCount - a.missedCount);

  let weakestDay: DayOfWeekStat | null = null;
  let secondWeakestDay: DayOfWeekStat | null = null;

  if (activeDays.length > 0 && activeDays[0].failureRate > 0) {
    weakestDay = activeDays[0];
    weakestDay.isWeakest = true;
    if (activeDays.length > 1 && activeDays[1].failureRate > 0) {
      secondWeakestDay = activeDays[1];
    }
  }

  // Process Peak Relapse Times
  const timeWindows: TimeWindowStat[] = [
    {
      windowId: 'morning',
      label: 'الصباح المبكر',
      shortLabel: 'صباحاً',
      hoursRange: '5ص - 12ظ',
      count: timeCounters.morning,
      percentage: totalSlipUps > 0 ? Math.round((timeCounters.morning / totalSlipUps) * 100) : 0,
    },
    {
      windowId: 'afternoon',
      label: 'بعد الظهر',
      shortLabel: 'ظهراً',
      hoursRange: '12ظ - 5م',
      count: timeCounters.afternoon,
      percentage: totalSlipUps > 0 ? Math.round((timeCounters.afternoon / totalSlipUps) * 100) : 0,
    },
    {
      windowId: 'evening',
      label: 'المساء',
      shortLabel: 'مساءً',
      hoursRange: '5م - 10م',
      count: timeCounters.evening,
      percentage: totalSlipUps > 0 ? Math.round((timeCounters.evening / totalSlipUps) * 100) : 0,
    },
    {
      windowId: 'late_night',
      label: 'الليل المتأخر',
      shortLabel: 'ليلاً',
      hoursRange: '10م - 5ص',
      count: timeCounters.late_night,
      percentage: totalSlipUps > 0 ? Math.round((timeCounters.late_night / totalSlipUps) * 100) : 0,
    },
  ];

  timeWindows.sort((a, b) => b.count - a.count);
  const peakTimeWindow = timeWindows[0].count > 0 ? timeWindows[0] : null;

  // Process Top Triggers
  const topTriggers: TriggerStat[] = Array.from(triggerCounts.entries())
    .map(([name, count]) => {
      // Find strategy
      let counterStrategy = 'اجعلها صعبة: زيادة الحواجز وتغيير المحيط فوراً.';
      for (const [key, strat] of Object.entries(TRIGGER_STRATEGIES)) {
        if (name.includes(key)) {
          counterStrategy = strat;
          break;
        }
      }

      return {
        id: name,
        name,
        count,
        percentage: totalSlipUps > 0 ? Math.round((count / totalSlipUps) * 100) : 100,
        counterStrategy,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  // Overall rates
  const buildConsistencyRate =
    totalBuildLogged > 0 ? Math.round((totalBuildDone / totalBuildLogged) * 100) : 0;
  const breakCleanRate =
    totalBreakLogs > 0
      ? Math.round(((totalBreakLogs - totalSlipUps) / totalBreakLogs) * 100)
      : totalSlipUps === 0
      ? 100
      : 0;

  // Count active streaks
  let activeCleanStreaksCount = 0;
  let activeBuildStreaksCount = 0;

  for (const h of activeHabits) {
    if (h.type === 'break') {
      activeCleanStreaksCount++;
    } else {
      activeBuildStreaksCount++;
    }
  }

  const hasEnoughData = totalLogsAnalyzed >= 3;

  return {
    hasEnoughData,
    totalLogsAnalyzed,
    totalBreakLogs,
    totalSlipUps,
    daysOfWeek,
    weakestDay,
    secondWeakestDay,
    peakTimeWindow,
    timeWindows,
    topTriggers,
    buildConsistencyRate,
    breakCleanRate,
    totalCleanDays,
    activeCleanStreaksCount,
    activeBuildStreaksCount,
    strongestHabitName: activeHabits[0]?.name || null,
    atRiskHabitsCount,
  };
}
