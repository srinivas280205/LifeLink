import { useEffect } from 'react';

import API_BASE from '../config/api.js';
const API = API_BASE;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function usePushSubscription() {
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (Notification.permission === 'denied') return;

    async function subscribe() {
      try {
        const reg = await navigator.serviceWorker.ready;

        // Check if already subscribed
        const existing = await reg.pushManager.getSubscription();
        if (existing) return; // already subscribed, nothing to do

        // Request permission if not yet granted
        if (Notification.permission !== 'granted') {
          const perm = await Notification.requestPermission();
          if (perm !== 'granted') return;
        }

        // Fetch VAPID public key from server
        const keyRes = await fetch(`${API}/api/push/vapid-public-key`);
        if (!keyRes.ok) return;
        const { key } = await keyRes.json();

        // Subscribe
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(key),
        });

        // Send subscription to backend
        await fetch(`${API}/api/push/subscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(sub.toJSON()),
        });
      } catch (err) {
        console.warn('Push subscription failed:', err.message);
      }
    }

    subscribe();
  }, []);
}
