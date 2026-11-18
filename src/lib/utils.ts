import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { CategoryMeta, DayColumn, HabitCategory } from '../types/habit';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * تحويل كائن التاريخ إلى YYYY-MM-DD بالتوقيت المحلي
 */
export function formatISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseISODate(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export const CATEGORIES_META: Record<HabitCategory, CategoryMeta> = {
  deep_work: {
    id: 'deep_work',
    label: 'تركيز عميق وعمل',
    color: '#3b82f6', // blue
    badgeBg: 'bg-blue-500/10 dark:bg-blue-500/20',
    badgeBorder: 'border-blue-500/30',
    accentText: 'text-blue-500 dark:text-blue-400',
    iconName: 'Target',
  },
  code: {
    id: 'code',
    label: 'برمجة وبناء تقني',
    color: '#06b6d4', // cyan
    badgeBg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
    badgeBorder: 'border-cyan-500/30',
    accentText: 'text-cyan-500 dark:text-cyan-400',
    iconName: 'Code2',
  },
  health: {
    id: 'health',
    label: 'صحة وحيوية',
    color: '#10b981', // emerald
    badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    badgeBorder: 'border-emerald-500/30',
    accentText: 'text-emerald-500 dark:text-emerald-400',
    iconName: 'HeartPulse',
  },
  fitness: {
    id: 'fitness',
    label: 'لياقة وقوة بدنية',
    color: '#f97316', // orange
    badgeBg: 'bg-orange-500/10 dark:bg-orange-500/20',
    badgeBorder: 'border-orange-500/30',
    accentText: 'text-orange-500 dark:text-orange-400',
    iconName: 'Dumbbell',
  },
  mind: {
    id: 'mind',
    label: 'صفاء ذهني ووعي',
    color: '#8b5cf6', // purple
    badgeBg: 'bg-purple-500/10 dark:bg-purple-500/20',
    badgeBorder: 'border-purple-500/30',
    accentText: 'text-purple-500 dark:text-purple-400',
    iconName: 'Brain',
  },
  reading: {
    id: 'reading',
    label: 'قراءة وتعلّم مستمر',
    color: '#ec4899', // pink
    badgeBg: 'bg-pink-500/10 dark:bg-pink-500/20',
    badgeBorder: 'border-pink-500/30',
    accentText: 'text-pink-500 dark:text-pink-400',
    iconName: 'BookOpen',
  },
  finance: {
    id: 'finance',
    label: 'حرية وإدارة مالية',
    color: '#eab308', // amber
    badgeBg: 'bg-amber-500/10 dark:bg-amber-500/20',
    badgeBorder: 'border-amber-500/30',
    accentText: 'text-amber-500 dark:text-amber-400',
    iconName: 'Coins',
  },
};

const ARABIC_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const ARABIC_DAYS_SHORT = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

/**
 * توليد 7 أيام لأسبوع معين
 */
export function getWeekColumns(anchorDate: Date): DayColumn[] {
  const todayStr = formatISODate(new Date());
  const currentDay = anchorDate.getDay(); // 0 is Sunday
  // سنجعل الأسبوع يبدأ من يوم السبت أو الإثنين (السبت مألوف في العالم العربي):
  // 6 = السبت (مسافة السبت = (currentDay + 1) % 7)
  const distanceToSaturday = (currentDay + 1) % 7;
  
  const saturday = new Date(anchorDate);
  saturday.setDate(anchorDate.getDate() - distanceToSaturday);

  const days: DayColumn[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(saturday);
    d.setDate(saturday.getDate() + i);
    const dateStr = formatISODate(d);
    const dayIndex = d.getDay();
    
    days.push({
      date: dateStr,
      dayOfWeek: ARABIC_DAYS_SHORT[dayIndex],
      dayOfMonth: d.getDate(),
      isToday: dateStr === todayStr,
      isFuture: dateStr > todayStr,
      isPast: dateStr < todayStr,
      fullDateLabel: `${ARABIC_DAYS[dayIndex]} ${d.getDate()} ${ARABIC_MONTHS[d.getMonth()]}`,
    });
  }

  return days;
}

/**
 * توليد 14 يوماً للعرض المتدحرج
 */
export function getRollingDays(numDays: number = 14, endDate: Date = new Date()): DayColumn[] {
  const todayStr = formatISODate(new Date());
  const days: DayColumn[] = [];

  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(endDate.getDate() - i);
    const dateStr = formatISODate(d);
    const dayIndex = d.getDay();

    days.push({
      date: dateStr,
      dayOfWeek: ARABIC_DAYS_SHORT[dayIndex],
      dayOfMonth: d.getDate(),
      isToday: dateStr === todayStr,
      isFuture: dateStr > todayStr,
      isPast: dateStr < todayStr,
      fullDateLabel: `${ARABIC_DAYS[dayIndex]} ${d.getDate()} ${ARABIC_MONTHS[d.getMonth()]}`,
    });
  }

  return days;
}
