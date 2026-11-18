// ==============================================================================
// ATOMIC HABITS - SERVICE WORKER (PWA OFFLINE CACHE & WEB PUSH NOTIFICATIONS)
// ==============================================================================

const CACHE_NAME = 'atomic-habits-pwa-v2';

// الموارد الأساسية للتشغيل الفوري بدون اتصال (App Shell)
const STATIC_PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.svg',
  '/icon-512.svg',
  '/icon-maskable.svg',
];

// 1. مرحلة التثبيت: حفظ موارد التطبيق الأساسية في التخزين المؤقت
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_PRECACHE))
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn('Pre-caching issue (will rely on runtime caching):', err);
        return self.skipWaiting();
      })
  );
});

// 2. مرحلة التفعيل: تنظيف نسخ الكاش القديمة
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              return caches.delete(name);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// 3. اعتراض الطلبات (Fetch Strategy: Stale-While-Revalidate للأصول + Network-First للمسارات)
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // لا نعترض طلبات غير GET أو طلبات ملحقات المتصفح (chrome-extension)
  if (req.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // طلبات Supabase API و Webhooks: تمر مباشرة عبر الشبكة (لا تخزن في CacheStorage)
  if (url.origin.includes('supabase.co') || url.pathname.startsWith('/api/')) {
    return;
  }

  // أ. طلبات صفحات التنقل (HTML Navigation): Network-First مع الرجوع لـ CacheStorage عند انقطاع الإنترنت
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          const fallback = await caches.match('/index.html');
          return fallback || Response.error();
        })
    );
    return;
  }

  // ب. الأصول الثابتة (JS, CSS, الخطوط, الصور): Stale-While-Revalidate لاستجابة 0 ثانية
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      const fetchPromise = fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// 4. استقبال حدث التنبيه القادم من الخادم (Push Event)
self.addEventListener('push', (event) => {
  let data = {
    title: 'منظومة العادات الذرية ⚡',
    body: 'لا تنسَ إنجاز عادتك اليومية للحفاظ على استمرارية سلسلتك!',
    icon: '/icon-192.svg',
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
    icon: data.icon || '/icon-192.svg',
    badge: data.badge || '/favicon.svg',
    dir: 'rtl',
    lang: 'ar',
    tag: data.tag || 'atomic-habit-push',
    renotify: true,
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

// 5. التعامل مع النقر على الإشعار من قِبل المستخدم
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
        for (const client of windowClients) {
          if ('focus' in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
