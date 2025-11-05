import { precacheAndRoute, createHandlerBoundToURL, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, setDefaultHandler, setCatchHandler } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate, NetworkOnly } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

// Clean up old caches
cleanupOutdatedCaches();

// Precache all assets
precacheAndRoute(self.__WB_MANIFEST || []);

// App shell with network fallback
const appShellHandler = createHandlerBoundToURL('/index.html');
registerRoute(
  ({ request }) => request.mode === 'navigate',
  async (args) => {
    try {
      return await new NetworkFirst({
        cacheName: 'html-cache',
        networkTimeoutSeconds: 3,
        plugins: [
          new CacheableResponsePlugin({ statuses: [0, 200] }),
        ],
      }).handle(args);
    } catch (error) {
      return appShellHandler(args);
    }
  }
);

// Static assets - cache first with long expiration
registerRoute(
  ({ request }) =>
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'worker',
  new CacheFirst({
    cacheName: 'static-assets-v1',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// Fonts - cache first
registerRoute(
  ({ request }) => request.destination === 'font',
  new CacheFirst({
    cacheName: 'font-cache-v1',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24 * 365,
      }),
    ],
  })
);

// Images - cache first with expiration
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'image-cache-v1',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 150,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// Background sync for failed API calls
const bgSyncPlugin = new BackgroundSyncPlugin('api-queue', {
  maxRetentionTime: 24 * 60, // Retry for 24 hours
  onSync: async ({ queue }) => {
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        await fetch(entry.request.clone());
        console.log('Background sync successful:', entry.request.url);
      } catch (error) {
        console.error('Background sync failed:', error);
        await queue.unshiftRequest(entry);
        throw error;
      }
    }
  },
});

// API calls - network first with background sync fallback
registerRoute(
  ({ request, url }) =>
    request.destination === '' &&
    (url.pathname.startsWith('/api') ||
      url.pathname.startsWith('/functions/v1/') ||
      url.hostname.endsWith('supabase.co')),
  new NetworkFirst({
    cacheName: 'api-cache-v1',
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24, // 1 day
      }),
      bgSyncPlugin,
    ],
  })
);

// UI components - stale while revalidate
registerRoute(
  ({ url }) => url.pathname.startsWith('/assets/'),
  new StaleWhileRevalidate({
    cacheName: 'ui-components-v1',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 300,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }),
    ],
  })
);

// Default handler for everything else
setDefaultHandler(new StaleWhileRevalidate({
  cacheName: 'default-cache-v1',
}));

// Catch handler for offline fallback
setCatchHandler(async ({ event }) => {
  if (event.request.destination === 'document') {
    return caches.match('/index.html');
  }
  return Response.error();
});

// Listen for messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open('dynamic-cache-v1').then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});

// Background sync for conversations
self.addEventListener('sync', async (event) => {
  if (event.tag === 'sync-conversations') {
    event.waitUntil(
      (async () => {
        const clients = await self.clients.matchAll({
          includeUncontrolled: true,
        });
        
        clients.forEach((client) => {
          client.postMessage({
            type: 'SYNC_CONVERSATIONS',
            timestamp: Date.now(),
          });
        });
      })()
    );
  }
});

// Periodic background sync (experimental)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(
      (async () => {
        const clients = await self.clients.matchAll();
        clients.forEach((client) => {
          client.postMessage({ type: 'PERIODIC_SYNC' });
        });
      })()
    );
  }
});
