import { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useChatStore } from '@/store/chatStore';
import { db } from '@/lib/db';

export const OfflineIndicator = () => {
  const { isOnline, flushOfflineQueue } = useChatStore();
  const [queueCount, setQueueCount] = useState(0);
  
  useEffect(() => {
    const updateQueueCount = async () => {
      const queue = await db.getQueue();
      setQueueCount(queue.length);
    };
    
    updateQueueCount();
    
    // Update every 5 seconds
    const interval = setInterval(updateQueueCount, 5000);
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    if (isOnline && queueCount > 0) {
      flushOfflineQueue();
    }
  }, [isOnline, queueCount]);
  
  if (isOnline && queueCount === 0) return null;
  
  return (
    <Alert className={`fixed top-0 left-0 right-0 z-50 rounded-none ${
      isOnline ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <>
              <Wifi className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Back online {queueCount > 0 && `- Syncing ${queueCount} pending action(s)`}
              </AlertDescription>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                You're offline. {queueCount > 0 && `${queueCount} action(s) queued.`}
              </AlertDescription>
            </>
          )}
        </div>
      </div>
    </Alert>
  );
};