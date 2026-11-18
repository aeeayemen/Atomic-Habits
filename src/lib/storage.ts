import type { Habit, HabitLog } from '../types/habit';
import { INITIAL_HABITS } from './initialData';

const HABITS_STORAGE_KEY = 'atomic_habits_data_ar_v2';
const LOGS_STORAGE_KEY = 'atomic_habits_logs_ar_v2';
const THEME_STORAGE_KEY = 'atomic_habits_theme_v1';
const SOUND_STORAGE_KEY = 'atomic_habits_sound_v1';

export interface StorageData {
  habits: Habit[];
  logs: Record<string, HabitLog>;
}

function getHabitsKey(userId?: string): string {
  return userId ? `${HABITS_STORAGE_KEY}_${userId}` : HABITS_STORAGE_KEY;
}

function getLogsKey(userId?: string): string {
  return userId ? `${LOGS_STORAGE_KEY}_${userId}` : LOGS_STORAGE_KEY;
}

export function loadStoredHabits(userId?: string): Habit[] {
  if (typeof window === 'undefined') return INITIAL_HABITS;
  try {
    const key = getHabitsKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load habits from storage:', err);
    return [];
  }
}

export function saveHabits(habits: Habit[], userId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getHabitsKey(userId);
    localStorage.setItem(key, JSON.stringify(habits));
  } catch (err) {
    console.error('Failed to save habits to storage:', err);
  }
}

export function loadStoredLogs(userId?: string): Record<string, HabitLog> {
  if (typeof window === 'undefined') return {};
  try {
    const key = getLogsKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (err) {
    console.error('Failed to load logs from storage:', err);
    return {};
  }
}

export function saveLogs(logs: Record<string, HabitLog>, userId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getLogsKey(userId);
    localStorage.setItem(key, JSON.stringify(logs));
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
