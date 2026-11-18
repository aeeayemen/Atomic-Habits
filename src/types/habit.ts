export type HabitStatus = 'done' | 'missed' | 'neutral';

export type HabitCategory = 
  | 'health' 
  | 'code' 
  | 'mind' 
  | 'fitness' 
  | 'deep_work' 
  | 'finance' 
  | 'reading';

export interface HabitLog {
  id: string;
  habitId: string;
  userId?: string;
  date: string; // YYYY-MM-DD
  status: HabitStatus;
  updatedAt: string; // Exact ISO timestamp: 2026-11-18T16:30:00.000Z
  notes?: string;
}

export interface Habit {
  id: string;
  userId?: string;
  name: string;
  category: HabitCategory;
  identity: string; // "Why" statement e.g. "I am a high-leverage software engineer"
  cue: string; // 1st Law (Make it Obvious): Trigger/Cue
  routine: string; // Behavior to perform
  twoMinuteRule: string; // 3rd Law (Make it Easy): 2-minute starter version
  reward: string; // 4th Law (Make it Satisfying): Reward
  color: string; // Accent color hex
  icon: string; // Lucide icon identifier
  frequency: 'daily' | 'weekdays' | 'weekends';
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'anytime';
  targetDaysPerWeek: number;
  createdAt: string;
  archived?: boolean;
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalDone: number;
  totalMissed: number;
  completionRate: number; // 0 to 100%
  last7DaysRate: number;
  last30DaysRate: number;
  isAtRisk: boolean; // Missed yesterday and not logged today - "Never miss twice" alert
  milestoneBadge: 'starter' | 'bronze' | 'silver' | 'gold' | 'diamond' | 'master' | null;
}

export interface DayColumn {
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // "Mon", "Tue", etc.
  dayOfMonth: number; // 18
  isToday: boolean;
  isFuture: boolean;
  isPast: boolean;
  fullDateLabel: string;
}

export interface CategoryMeta {
  id: HabitCategory;
  label: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  accentText: string;
  iconName: string;
}
