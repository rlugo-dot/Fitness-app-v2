import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export default function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [showBack, setShowBack] = useState(false);

  useEffect(() => {
    function handleOffline() {
      setOffline(true);
      setWasOffline(true);
      setShowBack(false);
    }
    function handleOnline() {
      setOffline(false);
      if (wasOffline) {
        setShowBack(true);
        setTimeout(() => setShowBack(false), 3000);
      }
    }
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [wasOffline]);

  if (!offline && !showBack) return null;

  return (
    <div
      className={`fixed top-0 inset-x-0 z-[200] flex items-center justify-center gap-2 py-2 px-4 text-sm font-semibold transition-colors ${
        offline
          ? 'bg-red-500 text-white'
          : 'bg-green-500 text-white'
      }`}
      style={{ paddingTop: 'max(8px, env(safe-area-inset-top))' }}
    >
      {offline ? (
        <>
          <WifiOff size={14} />
          No internet connection
        </>
      ) : (
        'Back online ✓'
      )}
    </div>
  );
}
