import { useState, useEffect } from 'react';
import { subscribePush, unsubscribePush, getPushStatus } from '../services/api';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string;

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications() {
  const isSupported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window;

  const [permission, setPermission] = useState<NotificationPermission>(
    isSupported ? Notification.permission : 'denied'
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSupported) return;
    // Check browser-side subscription first (works even if backend is down)
    navigator.serviceWorker.getRegistration('/sw.js').then(async (reg) => {
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) setIsSubscribed(true);
      }
    }).catch(() => {});
    // Also sync with backend
    getPushStatus().then((s) => setIsSubscribed(s.subscribed)).catch(() => {});
  }, [isSupported]);

  async function subscribe() {
    if (!isSupported || !VAPID_PUBLIC_KEY) return;
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return;

      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
      });

      const json = sub.toJSON();
      await subscribePush({
        endpoint: json.endpoint!,
        p256dh: json.keys!['p256dh'],
        auth: json.keys!['auth'],
      });
      setIsSubscribed(true);
    } catch (err) {
      console.error('Push subscribe failed', err);
    } finally {
      setLoading(false);
    }
  }

  async function unsubscribe() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      const sub = await reg?.pushManager.getSubscription();
      await sub?.unsubscribe();
      await unsubscribePush();
      setIsSubscribed(false);
    } catch (err) {
      console.error('Push unsubscribe failed', err);
    } finally {
      setLoading(false);
    }
  }

  return { isSupported, permission, isSubscribed, loading, subscribe, unsubscribe };
}
