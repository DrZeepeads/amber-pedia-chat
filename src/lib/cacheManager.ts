export const preloadCriticalAssets = async () => {
  if (!('serviceWorker' in navigator)) return;
  
  const criticalAssets = [
    '/',
    '/index.html',
    // Add other critical paths
  ];
  
  try {
    const sw = await navigator.serviceWorker.ready;
    sw.active?.postMessage({
      type: 'CACHE_URLS',
      urls: criticalAssets,
    });
  } catch (error) {
    console.error('Failed to preload assets:', error);
  }
};

export const clearOldCaches = async () => {
  if (!('caches' in window)) return;
  
  const cacheWhitelist = [
    'static-assets-v1',
    'api-cache-v1',
    'image-cache-v1',
    'font-cache-v1',
  ];
  
  const cacheNames = await caches.keys();
  
  await Promise.all(
    cacheNames.map((cacheName) => {
      if (!cacheWhitelist.includes(cacheName)) {
        return caches.delete(cacheName);
      }
    })
  );
};