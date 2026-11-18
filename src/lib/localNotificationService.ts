import type { Habit, HabitLog } from '../types/habit';
import { formatISODate } from './utils';

const STORAGE_KEY_ENABLED = 'atomic_habits_local_notifs_enabled';
const STORAGE_KEY_LAST_SENT = 'atomic_habits_local_notifs_last_sent';
const STORAGE_KEY_INTERVAL = 'atomic_habits_local_notifs_interval_min';

/**
 * التحقق مما إذا كان المتصفح يدعم Web Notifications API
 */
export function isBrowserNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * الحصول على حالة إذن التنبيهات الحالية
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isBrowserNotificationSupported()) return 'denied';
  return Notification.permission;
}

/**
 * طلب إذن التنبيهات من المستخدم
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isBrowserNotificationSupported()) return false;

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setLocalNotificationEnabled(true);
      return true;
    }
    setLocalNotificationEnabled(false);
    return false;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return false;
  }
}

/**
 * فحص ما إذا كانت الإشعارات مفعلة من قِبل المستخدم
 */
export function isLocalNotificationEnabled(): boolean {
  if (!isBrowserNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;
  const stored = localStorage.getItem(STORAGE_KEY_ENABLED);
  return stored === 'true';
}

/**
 * تفعيل أو تعطيل التنبيهات المحلية
 */
export function setLocalNotificationEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_ENABLED, enabled ? 'true' : 'false');
}

/**
 * جلب الفاصل الزمني المفضل بين التنبيهات (بالدقائق - الافتراضي 60 دقيقة)
 */
export function getNotificationInterval(): number {
  if (typeof window === 'undefined') return 60;
  const val = localStorage.getItem(STORAGE_KEY_INTERVAL);
  return val ? parseInt(val, 10) : 60;
}

/**
 * تعيين الفاصل الزمني بين التنبيهات (بالدقائق)
 */
export function setNotificationInterval(minutes: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_INTERVAL, minutes.toString());
}

/**
 * إرسال إشعار متصفح محلي أصلي (Native Web Notification)
 */
export function sendLocalNotification(
  title: string,
  options: {
    body: string;
    icon?: string;
    tag?: string;
    data?: Record<string, unknown>;
  }
): Notification | null {
  if (!isBrowserNotificationSupported() || Notification.permission !== 'granted') {
    return null;
  }

  try {
    const notification = new Notification(title, {
      body: options.body,
      icon: options.icon || '/favicon.svg',
      badge: '/favicon.svg',
      tag: options.tag || 'atomic-habits-reminder',
      dir: 'rtl',
      lang: 'ar',
      data: options.data || { url: window.location.href },
    });

    // عند النقر على الإشعار، نقوم بالتركيز على نافذة التطبيق
    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  } catch (err) {
    console.error('Failed to dispatch browser notification:', err);
    return null;
  }
}

/**
 * إرسال إشعار تجريبي فوري للمستخدم للتأكد من عمل النظام
 */
export function sendTestNotificationNow(): boolean {
  if (!isBrowserNotificationSupported()) return false;

  if (Notification.permission !== 'granted') {
    return false;
  }

  const notif = sendLocalNotification('منظومة العادات الذرية ⚡ | تجربة التنبيهات', {
    body: 'تهانينا! الإشعارات المحلية تعمل بنجاح في متصفحك وستصلك تذكيرات العادات بانتظام.',
    icon: '/favicon.svg',
    tag: 'test-notification',
  });

  return Boolean(notif);
}

/**
 * فحص العادات غير المكتملة لليوم وإرسال تذكير محلي ذكي إذا حان وقته
 */
export function checkAndSendHabitReminder(
  habits: Habit[],
  allLogs: Record<string, HabitLog>,
  force = false
): boolean {
  if (!isLocalNotificationEnabled()) return false;

  const now = Date.now();
  const lastSent = parseInt(localStorage.getItem(STORAGE_KEY_LAST_SENT) || '0', 10);
  const intervalMs = getNotificationInterval() * 60 * 1000;

  // التحقق من انقضاء المهلة الزمنية لمنع إزعاج المستخدم بكثرة الإشعارات
  if (!force && now - lastSent < intervalMs) {
    return false;
  }

  const todayStr = formatISODate(new Date());

  // تحديد العادات النشطة التي لم تُنجز بعد لليوم الحالي
  const pendingHabits = habits.filter((h) => {
    if (h.archived) return false;
    const logId = `${h.id}_${todayStr}`;
    const log = allLogs[logId];
    return !log || log.status !== 'done';
  });

  // إذا كانت جميع العادات منجزة، لا نرسل تذكيراً
  if (pendingHabits.length === 0) {
    return false;
  }

  // صياغة نص الإشعار الذكي
  const firstHabit = pendingHabits[0];
  const othersCount = pendingHabits.length - 1;
  const habitText = othersCount > 0
    ? `«${firstHabit.name}» و ${othersCount} عادات أخرى`
    : `«${firstHabit.name}»`;

  const notif = sendLocalNotification('تذكير العادات الذرية ⚡', {
    body: `حان موعد خطوتك اليومية! متبقي لديك: ${habitText}. استثمر دقيقتين لحماية سلسلتك اليوم.`,
    icon: '/favicon.svg',
    tag: `reminder-${todayStr}`,
  });

  if (notif) {
    localStorage.setItem(STORAGE_KEY_LAST_SENT, now.toString());
    return true;
  }

  return false;
}
