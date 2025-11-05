import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, setDefaultHandler } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

precacheAndRoute(self.__WB_MANIFEST || []);

const appShellHandler = createHandlerBoundToURL('/index.html');
registerRoute(({ request }) => request.mode === 'navigate', async (args) => {
  try {
    return await new NetworkFirst({ cacheName: 'html-cache', networkTimeoutSeconds: 3 }).handle(args);
  } catch (_) {
    return appShellHandler(args);
  }
});

registerRoute(({ request }) => request.destination === 'script' || request.destination === 'style', new CacheFirst({ cacheName: 'static-assets', plugins: [new CacheableResponsePlugin({ statuses: [0, 200] }), new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 365 })] }));

registerRoute(({ request }) => request.destination === 'font', new CacheFirst({ cacheName: 'font-cache', plugins: [new CacheableResponsePlugin({ statuses: [0, 200] }), new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 365 })] }));

registerRoute(({ request }) => request.destination === 'image', new CacheFirst({ cacheName: 'image-cache', plugins: [new CacheableResponsePlugin({ statuses: [0, 200] }), new ExpirationPlugin({ maxEntries: 150, maxAgeSeconds: 60 * 60 * 24 * 30 })] }));

registerRoute(({ request, url }) => request.destination === '' && (url.pathname.startsWith('/api') || url.hostname.endsWith('supabase.co')), new NetworkFirst({ cacheName: 'api-cache', networkTimeoutSeconds: 3, plugins: [new CacheableResponsePlugin({ statuses: [0, 200] }), new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 })] }));

registerRoute(({ url }) => url.pathname.startsWith('/assets/'), new StaleWhileRevalidate({ cacheName: 'ui-components', plugins: [new CacheableResponsePlugin({ statuses: [0, 200] }), new ExpirationPlugin({ maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 })] }));

setDefaultHandler(new StaleWhileRevalidate({ cacheName: 'default-cache' }));

self.addEventListener('sync', async (event) => {
  if (event.tag === 'sync-messages') {
    event.waitUntil((async () => { const clientsList = await self.clients.matchAll({ includeUncontrolled: true }); clientsList.forEach((client) => client.postMessage({ type: 'SYNC_MESSAGES' })); })());
  }
});
