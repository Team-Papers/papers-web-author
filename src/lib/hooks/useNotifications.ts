import { useState, useEffect, useCallback } from 'react';
import type { Notification } from '@/types/models';
import * as notificationsApi from '@/lib/api/notifications';

const POLLING_INTERVAL = 30000; // 30 seconds

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await notificationsApi.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await notificationsApi.getNotifications({ limit: 20 });
      setNotifications(response.data);
      // Update unread count from fetched data
      const unread = response.data.filter((n) => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await notificationsApi.deleteNotification(id);
      setNotifications((prev) => {
        const notification = prev.find((n) => n.id === id);
        if (notification && !notification.read) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n.id !== id);
      });
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, []);

  const clearReadNotifications = useCallback(async () => {
    try {
      await notificationsApi.clearReadNotifications();
      setNotifications((prev) => prev.filter((n) => !n.read));
    } catch (error) {
      console.error('Failed to clear read notifications:', error);
    }
  }, []);

  // Initial fetch and polling
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Fetch full notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    isOpen,
    setIsOpen,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications,
    refresh: fetchNotifications,
  };
}
