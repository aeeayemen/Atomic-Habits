import * as webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const VAPID_PUBLIC_KEY = process.env.VITE_VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BHPVr2IK1lyPLF_Od6GpYMeVymHcQ1gClHHguZg9BaJsNY4B0A5b_ZtXcgqvRo1fm83CL_8jRrQwDsAfZK-8V2I';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'uHRh8mwHQ3b5ijetA7RXg0WhSZGGgvlqklUieiB5rUo';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@atomichabits.app';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

export default async function handler(req, res) {
  // السماح بطلبات POST أو GET المحمية بـ CRON_SECRET إن وجد
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers['authorization'] !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'غير مصرح بالوصول' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const today = new Date().toISOString().slice(0, 10);

  try {
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (error) throw error;
    if (!subscriptions || subscriptions.length === 0) {
      return res.status(200).json({ message: 'لا توجد أجهزة مسجلة حالياً', sent: 0 });
    }

    let sentCount = 0;

    for (const sub of subscriptions) {
      // فحص العادات غير المكتملة
      const { data: habits } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', sub.user_id)
        .eq('archived', false);

      const { data: logs } = await supabase
        .from('habit_logs')
        .select('habit_id, status')
        .eq('user_id', sub.user_id)
        .eq('date', today);

      const doneSet = new Set((logs || []).filter((l) => l.status === 'done').map((l) => l.habit_id));
      const pending = (habits || []).filter((h) => !doneSet.has(h.id));

      if (pending.length > 0) {
        const payload = JSON.stringify({
          title: 'تذكير العادات الذرية ⚡',
          body: `لديك ${pending.length} عادة بحاجة لإنجازك اليوم: «${pending[0].name}». لا تدع السلسلة تنكسر!`,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          url: '/',
        });

        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          );
          sentCount++;
        } catch (pushErr) {
          if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
            await supabase.from('push_subscriptions').delete().eq('id', sub.id);
          }
        }
      }
    }

    return res.status(200).json({ success: true, sentCount });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
