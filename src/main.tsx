import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { toast } from "@/components/ui/sonner";

createRoot(document.getElementById("root")!).render(<App />);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('SW registered');
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
  });
}
