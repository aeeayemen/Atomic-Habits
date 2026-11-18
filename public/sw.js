// ==============================================================================
// ATOMIC HABITS - SERVICE WORKER (WEB PUSH & BACKGROUND NOTIFICATIONS)
// ==============================================================================

self.addEventListener('install', (event) => {
  // التفعيل الفوري لـ Service Worker دون انتظار إغلاق الصفحات السابقة
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// استقبال حدث التنبيه القادم من الخادم (Push Event)
self.addEventListener('push', (event) => {
  let data = {
    title: 'منظومة العادات الذرية ⚡',
    body: 'لا تنسَ إنجاز عادتك اليومية للحفاظ على استمرارية سلسلتك!',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    url: '/',
    tag: 'habit-reminder',
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch {
      data.body = event.data.text() || data.body;
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/favicon.svg',
    badge: data.badge || '/favicon.svg',
    dir: 'rtl',
    lang: 'ar',
    tag: data.tag || 'atomic-habit-push',
    renotify: true,
    vibrate: [150, 50, 150],
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now(),
    },
    actions: [
      {
        action: 'open-app',
        title: 'فتح اللوحة والإنجاز 🚀',
      },
      {
        action: 'dismiss',
        title: 'لاحقاً',
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// التعامل مع النقر على الإشعار من قِبل المستخدم
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // إذا كان التطبيق مفتوحاً بالفعل في تبويب، ننتقل إليه ونركز عليه
        for (const client of windowClients) {
          if ('focus' in client) {
            return client.focus();
          }
        }
        // إذا لم يكن مفتوحاً، نفتح نافذة جديدة بالرابط
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
