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
  fileSize?: number;
  fileFormat?: string;
  isbn?: string;
  language?: string;
  pageCount?: number;
}

export interface UpdateBookData {
  title?: string;
  description?: string;
  price?: number;
  categoryIds?: string[];
  coverUrl?: string;
  fileUrl?: string;
  fileSize?: number;
  fileFormat?: string;
  isbn?: string;
  language?: string;
  pageCount?: number;
}

export async function createBook(data: CreateBookData): Promise<Book> {
  const res = await apiClient.post<ApiResponse<Book>>('/books', data);
  return res.data.data;
}

export async function updateBook(id: string, data: UpdateBookData): Promise<Book> {
  const res = await apiClient.put<ApiResponse<Book>>(`/books/${id}`, data);
  return res.data.data;
}

export async function getBookById(id: string): Promise<Book> {
  // Use getMyBooks and filter - there's no dedicated endpoint for single book fetch by author
  const res = await getMyBooks({ limit: 100 });
  const book = res.data.find((b) => b.id === id);
  if (!book) throw new Error('Book not found');
  return book;
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
