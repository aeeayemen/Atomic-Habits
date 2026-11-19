export interface TopHabitStreak {
  id: string;
  name: string;
  category: string;
  type: 'build' | 'break';
  streak: number;
}

export interface AccountabilitySummary {
  todayDone: number;
  todayTotal: number;
  todayPercentage: number;
  overallConsistencyRate: number;
  maxActiveStreak: number;
  longestRecordStreak: number;
  totalCompletionsAllTime: number;
  topBuildHabits: TopHabitStreak[];
  topBreakHabits: TopHabitStreak[];
  encouragingQuote: string;
  formattedDate: string;
}

export interface AccountabilityCheckIn {
  id: string;
  userId?: string;
  dateStr: string;
  formattedDate: string;
  activeStreak: number;
  cleanStreak: number;
  todayDone: number;
  todayTotal: number;
  completionRate: number;
  message?: string;
  highlightedHabit?: string;
  createdAt: string;
}
