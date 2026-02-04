import type { ApiResponse, ApiPaginatedRaw, PaginatedResponse } from '@/types/api';
import { toPaginated } from '@/types/api';
import type { Notification } from '@/types/models';
import apiClient from './client';

export interface NotificationsQueryParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

export async function getNotifications(
  params: NotificationsQueryParams = {},
): Promise<PaginatedResponse<Notification>> {
  const res = await apiClient.get<ApiPaginatedRaw<Notification>>('/notifications', { params });
  return toPaginated(res.data);
}

export async function getUnreadCount(): Promise<number> {
  const res = await apiClient.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
  return res.data.data.count;
}

export async function markAsRead(id: string): Promise<void> {
  await apiClient.patch(`/notifications/${id}/read`);
}

export async function markAllAsRead(): Promise<void> {
  await apiClient.post('/notifications/mark-all-read');
}

export async function deleteNotification(id: string): Promise<void> {
  await apiClient.delete(`/notifications/${id}`);
}

export async function clearReadNotifications(): Promise<void> {
  await apiClient.delete('/notifications/clear-read');
}
