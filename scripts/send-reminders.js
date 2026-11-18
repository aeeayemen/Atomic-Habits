/**
 * ==============================================================================
 * ATOMIC HABITS - WEB PUSH NOTIFICATION DISPATCHER SCRIPT
 * ==============================================================================
 * يقوم هذا السكربت بالاستعلام عن العادات غير المكتملة لليوم الحالي لكل مستخدم،
 * وإرسال تنبيهات Web Push مباشرة إلى أجهزتهم المسجلة في جدول push_subscriptions.
 *
 * التشغيل:
 * node scripts/send-reminders.js
 * ==============================================================================
 */

import * as webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// تحميل متغيرات البيئة من ملف .env
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const VAPID_PUBLIC_KEY = process.env.VITE_VAPID_PUBLIC_KEY || 'BHPVr2IK1lyPLF_Od6GpYMeVymHcQ1gClHHguZg9BaJsNY4B0A5b_ZtXcgqvRo1fm83CL_8jRrQwDsAfZK-8V2I';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'uHRh8mwHQ3b5ijetA7RXg0WhSZGGgvlqklUieiB5rUo';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@atomichabits.app';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ خطأ: يرجى التأكد من تهيئة VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY في ملف .env');
  process.exit(1);
}

// تهيئة مفاتيح VAPID
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function dispatchReminders() {
  console.log('🚀 بدء فحص وإرسال تذكيرات العادات الذرية عبر Web Push...');
  const today = getTodayString();
  console.log(`📅 تاريخ اليوم: ${today}`);

  try {
    // 1. جلب جميع اشتراكات الإشعارات النشطة
    const { data: subscriptions, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (subsError) {
      console.error('❌ خطأ أثناء جلب الاشتراكات:', subsError.message);
      return;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('ℹ️ لا توجد اشتراكات إشعارات مسجلة حالياً.');
      return;
    }

    console.log(`📡 تم العثور على ${subscriptions.length} اشتراك إشعارات نشط.`);

    // تجميع الاشتراكات حسب المستخدم
    const subsByUser = {};
    for (const sub of subscriptions) {
      if (!subsByUser[sub.user_id]) subsByUser[sub.user_id] = [];
      subsByUser[sub.user_id].push(sub);
    }

    // 2. لكل مستخدم، فحص العادات غير المنجزة اليوم
    for (const [userId, userSubs] of Object.entries(subsByUser)) {
      // جلب عادات المستخدم
      const { data: habits, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', userId)
        .eq('archived', false);

      if (habitsError || !habits || habits.length === 0) continue;

      // جلب سجلات إنجاز اليوم لهذا المستخدم
      const { data: logs } = await supabase
        .from('habit_logs')
        .select('habit_id, status')
        .eq('user_id', userId)
        .eq('date', today);

      const doneHabitIds = new Set(
        (logs || []).filter((l) => l.status === 'done').map((l) => l.habit_id)
      );

      // تحديد العادات المتبقية
      const pendingHabits = habits.filter((h) => !doneHabitIds.has(h.id));

      if (pendingHabits.length === 0) {
        console.log(`✅ المستخدم ${userId.slice(0, 8)} أتم جميع عاداته لليوم! لا حاجة لتذكير.`);
        continue;
      }

      console.log(`⏰ المستخدم ${userId.slice(0, 8)}: متبقي له ${pendingHabits.length} عادة لم تكتمل.`);

      // صياغة نص الإشعار الذكي
      const firstHabitName = pendingHabits[0].name;
      const othersCount = pendingHabits.length - 1;
      const habitsSummary = othersCount > 0
        ? `«${firstHabitName}» و ${othersCount} عادات أخرى`
        : `«${firstHabitName}»`;

      const notificationPayload = JSON.stringify({
        title: 'تذكير العادات الذرية ⚡',
        body: `حافظ على استمرارية سلسلتك! حان وقت إنجاز: ${habitsSummary}. دقيقتان تصنعان الفارق.`,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        url: '/',
        tag: `reminder-${today}`,
      });

      // 3. إرسال الإشعار لجميع متصفحات وأجهزة المستخدم
      for (const sub of userSubs) {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        try {
          await webpush.sendNotification(pushSubscription, notificationPayload);
          console.log(`  ✓ تم إرسال الإشعار بنجاح إلى: ${sub.endpoint.slice(0, 35)}...`);
        } catch (err) {
          console.error(`  ⚠️ فشل إرسال الإشعار:`, err.statusCode || err.message);
          // إذا انتهت صلاحية الاشتراك أو تم إلغاؤه (410 Gone / 404 Not Found)، نحذفه تلقائياً
          if (err.statusCode === 410 || err.statusCode === 404) {
            console.log(`  🧹 حذف الاشتراك المنتهي من قاعدة البيانات...`);
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('id', sub.id);
          }
        }
      }
    }

    console.log('🎉 اكتملت عملية معالجة وإرسال التنبيهات بنجاح!');
  } catch (err) {
    console.error('❌ استثناء عام أثناء إرسال التنبيهات:', err);
  }
}

// تشغيل الدالة
dispatchReminders();
