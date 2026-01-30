import type { ApiResponse, ApiPaginatedRaw, PaginatedResponse } from '@/types/api';
import { toPaginated } from '@/types/api';
import type { Book, Category } from '@/types/models';
import apiClient from './client';

export async function getMyBooks(params: Record<string, unknown> = {}): Promise<PaginatedResponse<Book>> {
  const res = await apiClient.get<ApiPaginatedRaw<Book>>('/books/me', { params });
  return toPaginated(res.data);
}

export interface CreateBookData {
  title: string;
  description?: string;
  price: number;
  categoryIds: string[];
  coverUrl?: string;
  fileUrl?: string;
}

export async function createBook(data: CreateBookData): Promise<Book> {
  const res = await apiClient.post<ApiResponse<Book>>('/books', data);
  return res.data.data;
}

export async function updateBook(id: string, data: Record<string, unknown>): Promise<Book> {
  const res = await apiClient.put<ApiResponse<Book>>(`/books/${id}`, data);
  return res.data.data;
}

export async function deleteBook(id: string): Promise<void> {
  await apiClient.delete(`/books/${id}`);
}

export async function submitBook(id: string): Promise<Book> {
  const res = await apiClient.post<ApiResponse<Book>>(`/books/${id}/submit`);
  return res.data.data;
}

export async function getCategories(): Promise<Category[]> {
  const res = await apiClient.get<ApiResponse<Category[]>>('/categories');
  return res.data.data;
}

export async function uploadCover(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await apiClient.post<ApiResponse<{ url: string }>>('/upload/cover', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data.url;
}

export async function uploadBookFile(file: File): Promise<{ url: string; size: number; format: string }> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await apiClient.post<ApiResponse<{ url: string; size: number; format: string }>>('/upload/book', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}
