import type { ApiResponse, LoginRequest, RegisterRequest, LoginResponse } from '@/types/api';
import type { User } from '@/types/models';
import apiClient from './client';

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const res = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', data);
  return res.data.data;
}

export async function register(data: RegisterRequest): Promise<LoginResponse> {
  const res = await apiClient.post<ApiResponse<LoginResponse>>('/auth/register', data);
  return res.data.data;
}

export async function me(): Promise<User> {
  const res = await apiClient.get<ApiResponse<User>>('/auth/me');
  return res.data.data;
}

export async function logout(): Promise<void> {
  const refreshToken = localStorage.getItem('refreshToken');
  await apiClient.post('/auth/logout', { refreshToken });
}

export async function forgotPassword(email: string): Promise<void> {
  await apiClient.post('/auth/forgot-password', { email });
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await apiClient.post('/auth/reset-password', { token, password });
}
