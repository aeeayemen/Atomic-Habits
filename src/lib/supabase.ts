import { createClient } from '@supabase/supabase-js';
import type { Habit, HabitLog } from '../types/habit';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * جلب جميع العادات من Supabase
 */
export async function fetchHabitsFromSupabase(): Promise<Habit[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching habits from Supabase:', error);
      return null;
    }

    return (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      identity: row.identity,
      cue: row.cue,
      routine: row.routine,
      twoMinuteRule: row.two_minute_rule,
      reward: row.reward,
      color: row.color,
      icon: row.icon || 'Flame',
      frequency: row.frequency || 'daily',
      timeOfDay: row.time_of_day || 'anytime',
      targetDaysPerWeek: row.target_days_per_week || 7,
      archived: row.archived,
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.error('Supabase fetch exception:', err);
    return null;
  }
}

/**
 * مزامنة وحفظ عادة واحدة إلى Supabase
 */
export async function upsertHabitToSupabase(habit: Habit): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('habits').upsert({
      id: habit.id,
      name: habit.name,
      category: habit.category,
      identity: habit.identity,
      cue: habit.cue,
      routine: habit.routine,
      two_minute_rule: habit.twoMinuteRule,
      reward: habit.reward,
      color: habit.color,
      icon: habit.icon,
      frequency: habit.frequency,
      time_of_day: habit.timeOfDay,
      target_days_per_week: habit.targetDaysPerWeek,
      archived: habit.archived || false,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error upserting habit to Supabase:', error);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * حذف عادة من Supabase
 */
export async function deleteHabitFromSupabase(habitId: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('habits').delete().eq('id', habitId);
    return !error;
  } catch {
    return false;
  }
}

/**
 * جلب جميع السجلات من Supabase
 */
export async function fetchLogsFromSupabase(): Promise<Record<string, HabitLog> | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('habit_logs').select('*');
    if (error) {
      console.error('Error fetching logs from Supabase:', error);
      return null;
    }

    const logsMap: Record<string, HabitLog> = {};
    (data || []).forEach((row) => {
      logsMap[row.id] = {
        id: row.id,
        habitId: row.habit_id,
        date: row.date,
        status: row.status,
        notes: row.notes,
        updatedAt: row.updated_at || row.logged_at,
      };
    });
    return logsMap;
  } catch {
    return null;
  }
}

/**
 * حفظ سجل إنجاز يومي إلى Supabase
 */
export async function upsertLogToSupabase(log: HabitLog): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('habit_logs').upsert({
      id: log.id,
      habit_id: log.habitId,
      date: log.date,
      status: log.status,
      notes: log.notes || null,
      logged_at: log.updatedAt,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error upserting log to Supabase:', error);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
