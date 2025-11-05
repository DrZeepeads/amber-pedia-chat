import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { toast } from "@/components/ui/sonner";
import { config } from "@/lib/config";
import { supabase } from "@/integrations/supabase/client";
import { useChatStore } from "@/store/chatStore";
import { preloadCriticalAssets, clearOldCaches } from "@/lib/cacheManager";

if (config.app.env === 'development') {
  console.log('App Configuration:', {
    name: config.app.name,
    version: config.app.version,
    env: config.app.env,
    features: config.features,
  });
}

try {
  config;
} catch (error: any) {
  document.getElementById('root')!.innerHTML = `
    <div style="padding: 2rem; color: red;">
      <h1>Configuration Error</h1>
      <p>${error.message}</p>
      <p>Please check your environment variables.</p>
    </div>
  `;
  throw error;
}

createRoot(document.getElementById("root")!).render(<App />);

// Session management
(function initSessionManagement() {
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      toast('Signed out');
      window.location.href = '/';
    } else if ((event as any) === 'TOKEN_REFRESH_FAILED') {
      toast('Session expired. Please sign in again.');
      window.location.href = '/';
    }
  });

  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible') {
      try { await supabase.auth.getSession(); } catch {}
    }
  });

  window.addEventListener('storage', (e) => {
    if (e.key && e.key.includes('sb-')) {
      window.location.reload();
    }
  });

  const remember = localStorage.getItem('rememberMe');
  if (remember === 'false') {
    window.addEventListener('beforeunload', () => {
      supabase.auth.signOut();
    });
  }
})();

// Online/offline events and initial data load
window.addEventListener('online', () => {
  useChatStore.getState().setOnlineStatus(true);
  useChatStore.getState().flushOfflineQueue();
});
window.addEventListener('offline', () => {
  useChatStore.getState().setOnlineStatus(false);
});

(async () => {
  await useChatStore.getState().loadUser();
  await useChatStore.getState().loadSettings();
  await useChatStore.getState().loadConversations();
})();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    await preloadCriticalAssets();
    await clearOldCaches();
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        if (reg.waiting) {
          toast("New version available. Refresh to update.", {
            action: {
              label: "Refresh",
              onClick: () => reg.waiting?.postMessage({ type: 'SKIP_WAITING' }),
            },
          });
        }
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              toast("New version available. Refresh to update.", {
                action: {
                  label: "Refresh",
                  onClick: () => newWorker.postMessage({ type: 'SKIP_WAITING' }),
                },
              });
            }
          });
        });
      })
      .catch((err) => console.error('SW registration failed', err));

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });

    navigator.serviceWorker.addEventListener('message', (event) => {
      const type = (event.data && event.data.type) || '';
      if (type === 'SYNC_MESSAGES' || type === 'SYNC_CONVERSATIONS') {
        useChatStore.getState().flushOfflineQueue();
      }
    });
  });
}