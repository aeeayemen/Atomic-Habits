import { supabase, isSupabaseConfigured } from './supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BHPVr2IK1lyPLF_Od6GpYMeVymHcQ1gClHHguZg9BaJsNY4B0A5b_ZtXcgqvRo1fm83CL_8jRrQwDsAfZK-8V2I';

/**
 * تحويل مفتاح VAPID العام من Base64URL إلى Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * التحقق مما إذا كان المتصفح يدعم Service Worker و Push Notifications
 */
export function isPushNotificationSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * جلب حالة إذن التنبيهات الحالية
 */
export function getNotificationPermissionState(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * تسجيل ملف Service Worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushNotificationSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    await navigator.serviceWorker.ready;
    return registration;
  } catch (err) {
    console.error('Failed to register service worker for push notifications:', err);
    return null;
  }
}

export interface PushSubscriptionData {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * الاشتراك في إشعارات الويب وحفظها في Supabase
 */
export async function subscribeToPushNotifications(userId: string): Promise<{
  success: boolean;
  subscription?: PushSubscription;
  error?: string;
}> {
  if (!isPushNotificationSupported()) {
    return { success: false, error: 'المتصفح الحالي لا يدعم إشعارات الويب.' };
  }

  try {
    // 1. طلب الإذن من المستخدم
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return {
        success: false,
        error: permission === 'denied'
          ? 'تم رفض إذن التنبيهات من إعدادات المتصفح. يرجى تفعيله يدوياً.'
          : 'لم يتم منح إذن التنبيهات.',
      };
    }

    // 2. تسجيل وتشغيل Service Worker
    const registration = await registerServiceWorker();
    if (!registration) {
      return { success: false, error: 'فشل تفعيل ملف الخدمة (Service Worker).' };
    }

    // 3. الاشتراك عبر PushManager
    const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      });
    }

    const rawSub = subscription.toJSON();
    const endpoint = rawSub.endpoint || '';
    const p256dh = rawSub.keys?.p256dh || '';
    const auth = rawSub.keys?.auth || '';

    if (!endpoint || !p256dh || !auth) {
      return { success: false, error: 'فشل استخراج مفاتيح الاشتراك المشفرة.' };
    }

    // 4. حفظ أو تحديث الاشتراك في جدول push_subscriptions في Supabase
    if (isSupabaseConfigured && supabase && userId) {
      const subId = `sub_${userId}_${endpoint.slice(-16).replace(/[^a-zA-Z0-9]/g, '')}`;
      const { error: dbError } = await supabase.from('push_subscriptions').upsert(
        {
          id: subId,
          user_id: userId,
          endpoint,
          p256dh,
          auth,
          user_agent: navigator.userAgent,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id, endpoint' }
      );

      if (dbError) {
        console.warn('Could not save push subscription to Supabase:', dbError);
      }
    }

    return { success: true, subscription };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'خطأ غير متوقع أثناء الاشتراك بالإشعارات';
    console.error('Error during push subscription:', err);
    return { success: false, error: msg };
  }
}

/**
 * إلغاء الاشتراك في إشعارات الويب وحذف السجل من Supabase
 */
export async function unsubscribeFromPushNotifications(userId: string): Promise<boolean> {
  if (!isPushNotificationSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();

      if (isSupabaseConfigured && supabase && userId) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', userId)
          .eq('endpoint', endpoint);
      }
    }
    return true;
  } catch (err) {
    console.error('Failed to unsubscribe from push notifications:', err);
    return false;
  }
}

/**
 * التحقق مما إذا كان المستخدم مشتركاً حالياً في الإشعارات
 */
export async function checkIsUserSubscribed(): Promise<boolean> {
  if (!isPushNotificationSupported()) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return Boolean(subscription);
  } catch {
    return false;
  }
}

/**
 * إرسال إشعار تجريبي فوري محلياً عبر Service Worker
 */
export async function triggerLocalTestNotification(): Promise<boolean> {
  if (!isPushNotificationSupported()) return false;

  try {
    const registration = await registerServiceWorker();
    if (!registration) return false;

    if (Notification.permission === 'granted') {
      await registration.showNotification('العادات الذرية ⚡ | تجربة التنبيهات', {
        body: 'تهانينا! خدمة التنبيهات تعمل بكفاءة على جهازك لتذكيرك بعاداتك اليومية.',
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        dir: 'rtl',
        lang: 'ar',
        tag: 'test-reminder',
      });
      return true;
    }
    return false;
  } catch (err) {
    console.error('Test notification failed:', err);
    return false;
  }
}
