import type { Habit, HabitLog } from '../types/habit';
import { generateInitialLogs, INITIAL_HABITS } from './initialData';

const HABITS_STORAGE_KEY = 'atomic_habits_data_ar_v2';
const LOGS_STORAGE_KEY = 'atomic_habits_logs_ar_v2';
const THEME_STORAGE_KEY = 'atomic_habits_theme_v1';
const SOUND_STORAGE_KEY = 'atomic_habits_sound_v1';

export interface StorageData {
  habits: Habit[];
  logs: Record<string, HabitLog>;
}

export function loadStoredHabits(): Habit[] {
  if (typeof window === 'undefined') return INITIAL_HABITS;
  try {
    const raw = localStorage.getItem(HABITS_STORAGE_KEY);
    if (!raw) {
      saveHabits(INITIAL_HABITS);
      return INITIAL_HABITS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_HABITS;
  } catch (err) {
    console.error('Failed to load habits from storage:', err);
    return INITIAL_HABITS;
  }
}

export function saveHabits(habits: Habit[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(habits));
  } catch (err) {
    console.error('Failed to save habits to storage:', err);
  }
}

export function loadStoredLogs(): Record<string, HabitLog> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOGS_STORAGE_KEY);
    if (!raw) {
      const initialLogs = generateInitialLogs(INITIAL_HABITS);
      saveLogs(initialLogs);
      return initialLogs;
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (err) {
    console.error('Failed to load logs from storage:', err);
    return {};
  }
}

export function saveLogs(logs: Record<string, HabitLog>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs));
  } catch (err) {
    console.error('Failed to save logs to storage:', err);
  }
}

export function loadTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function saveTheme(theme: 'dark' | 'light'): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function loadSoundSetting(): boolean {
  if (typeof window === 'undefined') return true;
  const val = localStorage.getItem(SOUND_STORAGE_KEY);
  return val === null ? true : val === 'true';
}

export function saveSoundSetting(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SOUND_STORAGE_KEY, enabled ? 'true' : 'false');
}

/**
 * تصدير البيانات كملف JSON احتياطي
 */
export function exportDataAsJSON(): void {
  const habits = loadStoredHabits();
  const logs = loadStoredLogs();
  const backup = {
    version: '2.0-ar',
    exportDate: new Date().toISOString(),
    habits,
    logs,
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `atomic-habits-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * استيراد نسخة احتياطية من ملف JSON
 */
export function importDataFromJSON(
  jsonString: string
): { success: boolean; habits?: Habit[]; logs?: Record<string, HabitLog>; error?: string } {
  try {
    const data = JSON.parse(jsonString);
    if (!data || !Array.isArray(data.habits)) {
      return { success: false, error: 'صيغة الملف غير صحيحة: مصفوفة العادات مفقودة' };
    }
    const habits: Habit[] = data.habits;
    const logs: Record<string, HabitLog> = data.logs || {};

    saveHabits(habits);
    saveLogs(logs);

    return { success: true, habits, logs };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'خطأ غير متوقع أثناء القراءة';
    return { success: false, error: message };
  }
}
