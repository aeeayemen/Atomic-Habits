import { createClient, type User, type Session } from '@supabase/supabase-js';
import type { Habit, HabitLog } from '../types/habit';
import { INITIAL_HABITS } from './initialData';
import { loadStoredHabits } from './storage';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

// ============================================================================
// 1. إدارة المصادقة والمستخدمين (Authentication)
// ============================================================================

/**
 * تسجيل حساب جديد بالبريد الإلكتروني وكلمة المرور
 */
export async function signUpWithEmail(email: string, password: string): Promise<{
  user: User | null;
  session: Session | null;
  error: string | null;
}> {
  if (!supabase) {
    return { user: null, session: null, error: 'خدمة Supabase غير مهيأة بعد.' };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { user: null, session: null, error: translateAuthError(error.message) };
    }

    // إذا تم تسجيل المستخدم بنجاح ومعه جلسة نشطة، نقوم بزرع العادات النموذجية
    if (data.user) {
      await seedInitialHabitsForUser(data.user.id);
    }

    return { user: data.user, session: data.session, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'حدث خطأ غير متوقع أثناء إنشاء الحساب';
    return { user: null, session: null, error: translateAuthError(msg) };
  }
}

/**
 * تسجيل الدخول بالبريد الإلكتروني وكلمة المرور
 */
export async function signInWithEmail(email: string, password: string): Promise<{
  user: User | null;
  session: Session | null;
  error: string | null;
}> {
  if (!supabase) {
    return { user: null, session: null, error: 'خدمة Supabase غير مهيأة بعد.' };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, session: null, error: translateAuthError(error.message) };
    }

    return { user: data.user, session: data.session, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء محاولة تسجيل الدخول';
    return { user: null, session: null, error: translateAuthError(msg) };
  }
}

/**
 * تسجيل الخروج
 */
export async function signOutUser(): Promise<{ error: string | null }> {
  if (!supabase) return { error: null };
  try {
    const { error } = await supabase.auth.signOut();
    return { error: error ? error.message : null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'خطأ أثناء تسجيل الخروج';
    return { error: msg };
  }
}

/**
 * الحصول على الجلسة الحالية
 */
export async function getAuthSession(): Promise<Session | null> {
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session;
  } catch {
    return null;
  }
}

/**
 * الحصول على المستخدم الحالي
 */
export async function getAuthUser(): Promise<User | null> {
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getUser();
    return data.user;
  } catch {
    return null;
  }
}

/**
 * الاستماع لتغيرات حالة المصادقة (دخول، خروج، تجديد التوكن)
 */
export function onAuthChange(callback: (session: Session | null, user: User | null) => void) {
  if (!supabase) return { unsubscribe: () => {} };

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session, session?.user || null);
  });

  return {
    unsubscribe: () => subscription.unsubscribe(),
  };
}

/**
 * ترجمة رسائل أخطاء Supabase Auth إلى لغة عربية واضحة ومباشرة
 */
function translateAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى التحقق وإعادة المحاولة.';
  }
  if (lower.includes('user already registered') || lower.includes('already exists')) {
    return 'هذا البريد الإلكتروني مسجل مسبقاً. يمكنك تسجيل الدخول بدلاً من ذلك.';
  }
  if (lower.includes('password should be at least')) {
    return 'كلمة المرور يجب أن لا تقل عن 6 خانات.';
  }
  if (lower.includes('email not confirmed')) {
    return 'يرجى تأكيد بريدك الإلكتروني من خلال الرابط المرسل إلى صندوق الوارد.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'محاولات كثيرة جداً في وقت قصير. يرجى الانتظار لدقيقة واحدة ثم المحاولة مجدداً.';
  }
  if (lower.includes('network') || lower.includes('fetch')) {
    return 'تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.';
  }
  return message;
}

// ============================================================================
// 2. عمليات قاعدة البيانات متعددة المستخدمين (Row-Level Multi-Tenancy)
// ============================================================================

/**
 * جلب جميع العادات الخاصة بالمستخدم الحالي من Supabase
 */
export async function fetchHabitsFromSupabase(userId: string): Promise<Habit[] | null> {
  if (!supabase || !userId) return null;
  try {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching habits from Supabase:', error);
      return null;
    }

    return (data || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      type: (row.type as Habit['type']) || 'build',
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
      archived: row.archived ?? row.is_archived ?? false,
      is_archived: row.is_archived ?? row.archived ?? false,
      archivedAt: row.archived_at || undefined,
      archived_at: row.archived_at || undefined,
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.error('Supabase fetch habits exception:', err);
    return null;
  }
}

/**
 * حفظ أو تحديث عادة مع ربطها بمعرف المستخدم الحالي
 */
export async function upsertHabitToSupabase(habit: Habit, userId: string): Promise<boolean> {
  if (!supabase || !userId) return false;
  try {
    const isArchived = Boolean(habit.is_archived ?? habit.archived);
    const { error } = await supabase.from('habits').upsert({
      id: habit.id,
      user_id: userId,
      type: habit.type || 'build',
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
      archived: isArchived,
      archived_at: isArchived ? (habit.archivedAt || habit.archived_at || new Date().toISOString()) : null,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error upserting habit to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase upsert habit exception:', err);
    return false;
  }
}

/**
 * حذف عادة خاصة بالمستخدم من Supabase
 */
export async function deleteHabitFromSupabase(habitId: string, userId: string): Promise<boolean> {
  if (!supabase || !userId) return false;
  try {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', habitId)
      .eq('user_id', userId);

    return !error;
  } catch {
    return false;
  }
}

/**
 * جلب جميع السجلات الخاصة بالمستخدم من Supabase
 */
export async function fetchLogsFromSupabase(userId: string): Promise<Record<string, HabitLog> | null> {
  if (!supabase || !userId) return null;
  try {
    const { data, error } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching logs from Supabase:', error);
      return null;
    }

    const logsMap: Record<string, HabitLog> = {};
    (data || []).forEach((row) => {
      const canonicalKey = `${row.habit_id}_${row.date}`;
      const logItem: HabitLog = {
        id: row.id || canonicalKey,
        habitId: row.habit_id,
        userId: row.user_id,
        date: row.date,
        status: row.status as HabitLog['status'],
        notes: row.notes,
        updatedAt: row.updated_at || row.logged_at,
      };

      // نضمن إتاحة السجل بالمعرف المعياري (habitId_date) وكذلك بمعرف الصف
      logsMap[canonicalKey] = logItem;
      if (row.id && row.id !== canonicalKey) {
        logsMap[row.id] = logItem;
      }
    });
    return logsMap;
  } catch (err) {
    console.error('Supabase fetch logs exception:', err);
    return null;
  }
}

/**
 * حفظ سجل إنجاز يومي لمستخدم محدد في Supabase مع معالجة ذكية للتعارض والقيود
 */
export async function upsertLogToSupabase(log: HabitLog, userId: string): Promise<boolean> {
  if (!supabase || !userId) return false;
  try {
    const canonicalId = `${log.habitId}_${log.date}`;
    const payload = {
      id: log.id || canonicalId,
      habit_id: log.habitId,
      user_id: userId,
      date: log.date,
      status: log.status,
      notes: log.notes || null,
      logged_at: log.updatedAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 1. محاولة الإدراج / التحديث باستخدام تعارض الحقول المركبة
    let { error } = await supabase
      .from('habit_logs')
      .upsert(payload, { onConflict: 'habit_id,date,user_id' });

    // 2. إذا فشل، نجرب التعارض على المفتاح الأساسي id
    if (error) {
      const fallbackResult = await supabase
        .from('habit_logs')
        .upsert(payload, { onConflict: 'id' });
      error = fallbackResult.error;
    }

    // 3. في حال وجود خطأ مفتاح أجنبي (العادة غير موجودة بعد في جدول العادات السحابي)
    if (error && (error.code === '23503' || error.message?.includes('foreign key'))) {
      const localHabits = loadStoredHabits(userId);
      const targetHabit = localHabits.find((h) => h.id === log.habitId);
      if (targetHabit) {
        await upsertHabitToSupabase(targetHabit, userId);
        const retryResult = await supabase
          .from('habit_logs')
          .upsert(payload, { onConflict: 'habit_id,date,user_id' });
        error = retryResult.error;
      }
    }

    // 4. في حال استمرار الخطأ بسبب قيود تكرار غير متطابقة، نقوم بفحص وتحديث مباشر
    if (error) {
      const { data: existing } = await supabase
        .from('habit_logs')
        .select('id')
        .eq('user_id', userId)
        .eq('habit_id', log.habitId)
        .eq('date', log.date)
        .maybeSingle();

      if (existing) {
        const { error: updateError } = await supabase
          .from('habit_logs')
          .update({
            status: log.status,
            notes: log.notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        if (!updateError) return true;
      } else {
        const { error: insertError } = await supabase
          .from('habit_logs')
          .insert(payload);
        if (!insertError) return true;
      }

      console.error('Error upserting log to Supabase after fallbacks:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Supabase upsert log exception:', err);
    return false;
  }
}

/**
 * تهيئة العادات الأولية النموذجية لمستخدم جديد في حال كان حسابه فارغاً
 */
export async function seedInitialHabitsForUser(userId: string): Promise<Habit[]> {
  if (!supabase || !userId) return INITIAL_HABITS;

  try {
    // التحقق مما إذا كان لدى المستخدم عادات مسبقاً
    const { data: existing } = await supabase
      .from('habits')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (existing && existing.length > 0) {
      // لدى المستخدم عادات بالفعل، نجلبها
      const habits = await fetchHabitsFromSupabase(userId);
      return habits || INITIAL_HABITS;
    }

    // إدراج العادات النموذجية الست للمستخدم الجديد
    const preparedHabits = INITIAL_HABITS.map((h, idx) => ({
      id: `habit-${idx + 1}-${userId.slice(0, 8)}`,
      user_id: userId,
      type: h.type || 'build',
      name: h.name,
      category: h.category,
      identity: h.identity,
      cue: h.cue,
      routine: h.routine,
      two_minute_rule: h.twoMinuteRule,
      reward: h.reward,
      color: h.color,
      icon: h.icon,
      frequency: h.frequency,
      time_of_day: h.timeOfDay,
      target_days_per_week: h.targetDaysPerWeek,
      archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('habits').insert(preparedHabits);
    if (error) {
      console.warn('Could not auto-seed starter habits in Supabase:', error);
      return INITIAL_HABITS;
    }

    return preparedHabits.map((row) => ({
      id: row.id,
      userId: row.user_id,
      type: (row.type as Habit['type']) || 'build',
      name: row.name,
      category: row.category as Habit['category'],
      identity: row.identity,
      cue: row.cue,
      routine: row.routine,
      twoMinuteRule: row.two_minute_rule,
      reward: row.reward,
      color: row.color,
      icon: row.icon,
      frequency: row.frequency,
      timeOfDay: row.time_of_day,
      targetDaysPerWeek: row.target_days_per_week,
      archived: row.archived,
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.error('Exception during starter habits seeding:', err);
    return INITIAL_HABITS;
  }
}
