import type { ApiResponse, AuthorApplyRequest } from '@/types/api';
import type { AuthorProfile, AuthorStats } from '@/types/models';
import apiClient from './client';

export async function applyAsAuthor(data: AuthorApplyRequest): Promise<AuthorProfile> {
  const res = await apiClient.post<ApiResponse<AuthorProfile>>('/authors/apply', data);
  return res.data.data;
}

export async function getMyProfile(): Promise<AuthorProfile> {
  const res = await apiClient.get<ApiResponse<AuthorProfile>>('/authors/me');
  return res.data.data;
}

export async function updateMyProfile(data: Partial<AuthorProfile>): Promise<AuthorProfile> {
  const res = await apiClient.put<ApiResponse<AuthorProfile>>('/authors/me', data);
  return res.data.data;
}

export async function getMyStats(): Promise<AuthorStats> {
  const res = await apiClient.get<ApiResponse<AuthorStats>>('/authors/me/stats');
  return res.data.data;
}

export async function getMyEarnings(): Promise<{ balance: number; transactions: import('@/types/models').Transaction[] }> {
  const res = await apiClient.get<ApiResponse<{ balance: string; transactions: import('@/types/models').Transaction[] }>>('/authors/me/earnings');
  return { balance: Number(res.data.data.balance), transactions: res.data.data.transactions || [] };
}

export async function requestWithdrawal(data: { amount: number; method: string; phoneNumber: string }): Promise<void> {
  await apiClient.post('/authors/me/withdraw', data);
}
