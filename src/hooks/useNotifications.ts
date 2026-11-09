import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { AppNotification } from '@/types';
import { useAuth } from './useAuth';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    if (!user?.id || !isSupabaseConfigured) return;
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (data) {
        setNotifications(data as AppNotification[]);
        setUnreadCount(data.filter((n: AppNotification) => !n.is_read).length);
      }
    } catch (e) {
      console.warn('Failed to load notifications:', e);
    }
  }, [user?.id]);

  useEffect(() => {
    loadNotifications();
    if (!isSupabaseConfigured || !user?.id) return;

    // Real-time subscription: new notifications push instantly
    const channel = supabase
      .channel(`notifications_${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const newNotif = payload.new as AppNotification;
        setNotifications((prev) =>
          prev.some((n) => n.id === newNotif.id) ? prev : [newNotif, ...prev]
        );
        setUnreadCount((prev) => prev + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadNotifications, user?.id]);

  const markAllRead = useCallback(async () => {
    if (!user?.id || !isSupabaseConfigured) return;
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', unreadIds);
  }, [user?.id, notifications]);

  const markRead = useCallback(async (id: string) => {
    if (!isSupabaseConfigured) return;
    setNotifications((prev) =>
      prev.map((n) => n.id === id ? { ...n, is_read: true } : n)
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  }, []);

  /** Create a local in-app notification (for client-side triggered events) */
  const addLocalNotification = useCallback((notif: Omit<AppNotification, 'id' | 'created_at' | 'is_read' | 'user_id'>) => {
    if (!user?.id) return;
    const localNotif: AppNotification = {
      ...notif,
      id: `local_${Date.now()}`,
      user_id: user.id,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setNotifications((prev) => [localNotif, ...prev]);
    setUnreadCount((prev) => prev + 1);
  }, [user?.id]);

  /** Register a web push subscription and store in Supabase */
  const registerWebPush = useCallback(async (vapidPublicKey: string) => {
    if (!user?.id || !('serviceWorker' in navigator) || !('PushManager' in window)) return;

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      const sub = existing || await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const json = sub.toJSON();
      if (!json.endpoint) return;

      await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        platform: 'web',
        endpoint: json.endpoint,
        p256dh: json.keys?.p256dh,
        auth_key: json.keys?.auth,
        device_label: navigator.userAgent.slice(0, 80),
      }, { onConflict: 'user_id,endpoint' });
    } catch (e) {
      console.warn('Web Push registration failed:', e);
    }
  }, [user?.id]);

  return {
    notifications,
    unreadCount,
    markAllRead,
    markRead,
    addLocalNotification,
    registerWebPush,
    refreshNotifications: loadNotifications,
  };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
