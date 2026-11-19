import type { HabitCategory, HabitType } from './habit';

export interface WeeklyHabitStat {
  habitId: string;
  habitName: string;
  category: HabitCategory;
  type: HabitType;
  color?: string;
  completedDays: number; // For build: done days; For break: clean days
  missedDays: number; // For build: missed days; For break: slip-up relapses
  totalDays: number;
  consistencyRate: number; // 0 to 100%
  currentStreak: number;
}

export interface WeeklySummary {
  weekKey: string; // e.g. "2026-W47"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  formattedDateRange: string;
  totalActiveHabits: number;
  overallConsistencyRate: number;
  totalCompletionsThisWeek: number;
  mostConsistentHabit: WeeklyHabitStat | null;
  needsAttentionHabit: WeeklyHabitStat | null;
  bestStreakHabit: WeeklyHabitStat | null;
  allHabitStats: WeeklyHabitStat[];
}

export interface WeeklyReflectionRecord {
  id: string;
  weekKey: string;
  userId?: string;
  note: string;
  savedAt: string;
}
